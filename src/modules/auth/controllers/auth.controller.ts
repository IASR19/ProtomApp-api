import { Body, Controller, Get, Logger, Post, Query, Req, Res, UseGuards, UnauthorizedException, HttpException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { LoginDto, RegisterDto, AuthResponseDto, SetPasswordDto } from '../dto/auth.dto';
import { GoogleLoginDto, AppleLoginDto, VerifyEmailQueryDto } from '../dto/social-auth.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  private setCookie(res: Response, refreshToken: string) {
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('ps_refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  private sendAuth(
    res: Response,
    result: {
      refreshToken: string;
      accessToken: string;
      user: AuthResponseDto['user'];
      needsProfileSetup?: boolean;
    },
  ) {
    this.setCookie(res, result.refreshToken);
    return res.status(200).json({
      accessToken: result.accessToken,
      user: result.user,
      needsProfileSetup: result.needsProfileSetup,
    });
  }

  private sendError(res: Response, error: unknown) {
    if (error instanceof HttpException) {
      const status = error.getStatus();
      const payload = error.getResponse();
      return res.status(status).json(
        typeof payload === 'string' ? { statusCode: status, message: payload } : payload,
      );
    }

    const err = error instanceof Error ? error : new Error(String(error));
    this.logger.error(err.stack || err.message);
    return res.status(500).json({
      statusCode: 500,
      message: err.message || 'Internal server error',
    });
  }

  @ApiOperation({ summary: 'Registrar novo usuário' })
  @Post('register')
  async register(@Body() dto: RegisterDto, @Res() res: Response) {
    try {
      const result = await this.authService.register(dto);
      return this.sendAuth(res, result);
    } catch (error) {
      return this.sendError(res, error);
    }
  }

  @ApiOperation({ summary: 'Confirmar e-mail' })
  @Get('verify-email')
  async verifyEmail(@Query() query: VerifyEmailQueryDto) {
    return this.authService.verifyEmail(query.token);
  }

  @ApiOperation({ summary: 'Login' })
  @Post('login')
  async login(@Body() dto: LoginDto, @Res() res: Response) {
    try {
      const result = await this.authService.login(dto);
      return this.sendAuth(res, result);
    } catch (error) {
      return this.sendError(res, error);
    }
  }

  @ApiOperation({ summary: 'Login com Google' })
  @Post('google')
  async loginWithGoogle(@Body() dto: GoogleLoginDto, @Res() res: Response) {
    try {
      const result = await this.authService.loginWithGoogle(dto.idToken);
      return this.sendAuth(res, result);
    } catch (error) {
      return this.sendError(res, error);
    }
  }

  @ApiOperation({ summary: 'Login com Apple' })
  @Post('apple')
  async loginWithApple(@Body() dto: AppleLoginDto, @Res() res: Response) {
    try {
      const result = await this.authService.loginWithApple(dto.idToken);
      return this.sendAuth(res, result);
    } catch (error) {
      return this.sendError(res, error);
    }
  }

  @ApiOperation({ summary: 'Atualizar token de acesso' })
  @Post('refresh')
  async refresh(@Req() req: Request, @Res() res: Response) {
    try {
      const refreshToken = req.cookies?.['ps_refresh_token'];
      if (!refreshToken) {
        throw new UnauthorizedException('Refresh token não encontrado.');
      }

      let userId: string;
      try {
        const payload = this.authService['jwtService'].verify(refreshToken);
        userId = payload.sub;
      } catch {
        throw new UnauthorizedException('Refresh token inválido ou expirado.');
      }

      const result = await this.authService.refreshTokens(userId, refreshToken);
      return this.sendAuth(res, result);
    } catch (error) {
      return this.sendError(res, error);
    }
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
  async logout(@Req() req: Request, @Res() res: Response) {
    try {
      const user = req.user as any;
      await this.authService.logout(user.id);
      res.clearCookie('ps_refresh_token');
      return res.status(200).json({ success: true });
    } catch (error) {
      return this.sendError(res, error);
    }
  }
}

