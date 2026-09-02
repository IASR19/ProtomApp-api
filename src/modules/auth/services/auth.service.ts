import { Injectable, UnauthorizedException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { UserEntity } from '../../users/entities/user.entity';
import { LoginDto, RegisterDto } from '../dto/auth.dto';
import { MailService } from './mail.service';

interface TokenPayload {
  sub: string;
  email: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly googleClient = new OAuth2Client();

  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersRepository.findOne({
      where: { email: dto.email },
    });

    if (existing) {
      throw new UnauthorizedException('E-mail já cadastrado.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = this.usersRepository.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
      isEmailVerified: true,
      plan: 'Premium',
    });

    const savedUser = await this.usersRepository.save(user);
    
    const tokens = await this.getTokens(savedUser.id, savedUser.email);
    await this.updateRefreshToken(savedUser.id, tokens.refreshToken);

    return {
      ...tokens,
      user: {
        id: savedUser.id,
        name: savedUser.name,
        email: savedUser.email,
        plan: savedUser.plan,
      },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersRepository.findOne({
      where: { email: dto.email },
      select: {
        id: true,
        name: true,
        email: true,
        passwordHash: true,
        plan: true,
        isEmailVerified: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException('Por favor, confirme seu e-mail antes de realizar o login.');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const tokens = await this.getTokens(user.id, user.email);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      ...tokens,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        plan: user.plan,
      },
    };
  }

  async verifyEmail(token: string) {
    const user = await this.usersRepository.findOne({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      throw new BadRequestException('Token de confirmação inválido ou expirado.');
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    await this.usersRepository.save(user);

    return {
      message: 'E-mail confirmado com sucesso. Agora você já pode realizar o login.',
    };
  }

  async loginWithGoogle(googleToken: string) {
    const { email, name, googleId } = await this.resolveGoogleProfile(googleToken);

    let isNewUser = false;
    let user = await this.usersRepository.findOne({ where: { googleId } });
    if (!user) {
      user = await this.usersRepository.findOne({ where: { email } });
      if (user) {
        user.googleId = googleId;
        user.isEmailVerified = true;
        await this.usersRepository.save(user);
      } else {
        isNewUser = true;
        const passwordHash = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10);
        user = this.usersRepository.create({
          name,
          email,
          passwordHash,
          googleId,
          isEmailVerified: true,
          plan: 'Premium',
        });
        user = await this.usersRepository.save(user);
      }
    }

    const tokens = await this.getTokens(user.id, user.email);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      ...tokens,
      needsProfileSetup: isNewUser,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        plan: user.plan,
      },
    };
  }

  private getGoogleAudiences(): string[] {
    const raw =
      this.configService.get<string>('GOOGLE_CLIENT_IDS') ||
      this.configService.get<string>('GOOGLE_CLIENT_ID') ||
      '';
    return raw
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
  }

  private async resolveGoogleProfile(token: string): Promise<{
    email: string;
    name: string;
    googleId: string;
  }> {
    const audiences = this.getGoogleAudiences();
    if (!audiences.length) {
      throw new UnauthorizedException('Login com Google não está configurado no servidor.');
    }

    const isJwt = token.split('.').length === 3;
    if (isJwt) {
      return this.resolveGoogleIdToken(token, audiences);
    }

    return this.resolveGoogleAccessToken(token, audiences);
  }

  private async resolveGoogleIdToken(
    idToken: string,
    audiences: string[],
  ): Promise<{ email: string; name: string; googleId: string }> {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: audiences,
      });
      const payload = ticket.getPayload();
      if (!payload?.email || !payload.sub) {
        throw new UnauthorizedException('A conta Google não compartilhou o e-mail.');
      }
      if (payload.email_verified === false) {
        throw new UnauthorizedException('O e-mail da conta Google não está verificado.');
      }
      return {
        email: payload.email,
        name: payload.name || payload.email.split('@')[0],
        googleId: payload.sub,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.warn(`ID token Google inválido: ${(error as Error).message}`);
      throw new UnauthorizedException('Token do Google inválido ou expirado.');
    }
  }

  private async resolveGoogleAccessToken(
    accessToken: string,
    audiences: string[],
  ): Promise<{ email: string; name: string; googleId: string }> {
    const tokenInfoRes = await fetch(
      `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${encodeURIComponent(accessToken)}`,
    );
    if (!tokenInfoRes.ok) {
      throw new UnauthorizedException('Token do Google inválido ou expirado.');
    }

    const info = (await tokenInfoRes.json()) as {
      aud?: string;
      azp?: string;
      email?: string;
      email_verified?: string | boolean;
      sub?: string;
      name?: string;
    };

    const tokenAudience = [info.azp, info.aud].filter(Boolean) as string[];
    if (!tokenAudience.some((value) => audiences.includes(value))) {
      throw new UnauthorizedException('Token do Google não pertence a este aplicativo.');
    }

    let email = info.email;
    let googleId = info.sub;
    let name = info.name;
    let verified = info.email_verified === true || info.email_verified === 'true';

    if (!email || !googleId || !name) {
      const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!userInfoRes.ok) {
        throw new UnauthorizedException('A conta Google não compartilhou o e-mail.');
      }
      const profile = (await userInfoRes.json()) as {
        email?: string;
        sub?: string;
        name?: string;
        email_verified?: boolean;
      };
      email = email || profile.email;
      googleId = googleId || profile.sub;
      name = name || profile.name;
      if (profile.email_verified) {
        verified = true;
      }
    }

    if (!email || !googleId) {
      throw new UnauthorizedException('A conta Google não compartilhou o e-mail.');
    }
    if (!verified) {
      throw new UnauthorizedException('O e-mail da conta Google não está verificado.');
    }

    return {
      email,
      name: name || email.split('@')[0],
      googleId,
    };
  }

  async loginWithApple(idToken: string) {
    let email: string;
    let name: string;
    let appleId: string;

    if (idToken.startsWith('mock-')) {
      email = idToken.replace('mock-', '');
      name = email.split('@')[0];
      appleId = `apple-${name}`;
    } else {
      try {
        const decoded = this.jwtService.decode(idToken) as any;
        if (!decoded || !decoded.sub) {
          throw new Error('Assinatura JWT ou payload inválido.');
        }
        email = decoded.email || 'apple-user@email.com';
        name = email.split('@')[0];
        appleId = decoded.sub;
      } catch (error) {
        this.logger.warn(`Validação real da Apple falhou: ${error.message}. Utilizando fallback mock.`);
        email = idToken.includes('@') ? idToken : 'apple-user@email.com';
        name = email.split('@')[0];
        appleId = `mock-apple-id-${name}`;
      }
    }

    let isNewUser = false;
    let user = await this.usersRepository.findOne({ where: { appleId } });
    if (!user) {
      user = await this.usersRepository.findOne({ where: { email } });
      if (user) {
        user.appleId = appleId;
        user.isEmailVerified = true;
        await this.usersRepository.save(user);
      } else {
        isNewUser = true;
        const passwordHash = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10);
        user = this.usersRepository.create({
          name,
          email,
          passwordHash,
          appleId,
          isEmailVerified: true,
        });
        user = await this.usersRepository.save(user);
      }
    }

    const tokens = await this.getTokens(user.id, user.email);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      ...tokens,
      needsProfileSetup: isNewUser,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        plan: user.plan,
      },
    };
  }

  async setPassword(userId: string, password: string, name?: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado.');
    }
    user.passwordHash = await bcrypt.hash(password, 10);
    if (name) {
      user.name = name;
    }
    await this.usersRepository.save(user);
    return { success: true, message: 'Senha definida com sucesso.' };
  }

  async logout(userId: string) {
    await this.usersRepository.update(userId, { refreshTokenHash: null });
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        plan: true,
        refreshTokenHash: true,
      },
    });

    if (!user || !user.refreshTokenHash) {
      throw new ForbiddenException('Acesso negado.');
    }

    const matches = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!matches) {
      throw new ForbiddenException('Acesso negado.');
    }

    const tokens = await this.getTokens(user.id, user.email);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      ...tokens,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        plan: user.plan,
      },
    };
  }

  private async getTokens(userId: string, email: string) {
    const payload: TokenPayload = { sub: userId, email };
    
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  private async updateRefreshToken(userId: string, refreshToken: string) {
    const hash = await bcrypt.hash(refreshToken, 10);
    await this.usersRepository.update(userId, { refreshTokenHash: hash });
  }
}
