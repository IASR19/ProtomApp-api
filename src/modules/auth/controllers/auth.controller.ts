import { Body, Controller, Get, Post, Query, Req, Res, UseGuards, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { LoginDto, RegisterDto, AuthResponseDto, SetPasswordDto } from '../dto/auth.dto';
import { GoogleLoginDto, AppleLoginDto, VerifyEmailQueryDto } from '../dto/social-auth.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private setCookie(res: Response, refreshToken: string) {
    res.cookie('ps_refresh_token', refreshToken, {
      httpOnly: true,
      secure: false, // should be true in prod if using https
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    });
  }

  @ApiOperation({ summary: 'Registrar novo usuário' })
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.register(dto);
    this.setCookie(res, result.refreshToken);
    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  @ApiOperation({ summary: 'Confirmar e-mail' })
  @Get('verify-email')
  async verifyEmail(@Query() query: VerifyEmailQueryDto) {
    return this.authService.verifyEmail(query.token);
  }

  @ApiOperation({ summary: 'Login' })
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.login(dto);
    this.setCookie(res, result.refreshToken);
    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  @ApiOperation({ summary: 'Login com Google' })
  @Post('google')
  async loginWithGoogle(
    @Body() dto: GoogleLoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.loginWithGoogle(dto.idToken);
    this.setCookie(res, result.refreshToken);
    return {
      accessToken: result.accessToken,
      user: result.user,
      needsProfileSetup: result.needsProfileSetup,
    };
  }

  @ApiOperation({ summary: 'Login com Apple' })
  @Post('apple')
  async loginWithApple(
    @Body() dto: AppleLoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.loginWithApple(dto.idToken);
    this.setCookie(res, result.refreshToken);
    return {
      accessToken: result.accessToken,
      user: result.user,
      needsProfileSetup: result.needsProfileSetup,
    };
  }

  @ApiOperation({ summary: 'Atualizar token de acesso' })
  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.['ps_refresh_token'];
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token não encontrado.');
    }

    // Decode to find sub (userId)
    let userId: string;
    try {
      const payload = this.authService['jwtService'].verify(refreshToken);
      userId = payload.sub;
    } catch (e) {
      throw new UnauthorizedException('Refresh token inválido ou expirado.');
    }

    const result = await this.authService.refreshTokens(userId, refreshToken);
    this.setCookie(res, result.refreshToken);
    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  @ApiOperation({ summary: 'Definir senha após cadastro via rede social' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('set-password')
  async setPassword(@Req() req: Request, @Body() dto: SetPasswordDto) {
    const user = req.user as any;
    return this.authService.setPassword(user.id, dto.password, dto.name);
  }

  @ApiOperation({ summary: 'Logout' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = req.user as any;
    await this.authService.logout(user.id);
    res.clearCookie('ps_refresh_token');
    return { success: true };
  }
}
