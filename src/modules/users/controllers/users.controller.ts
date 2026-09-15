import { Controller, Get, Put, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { Request } from 'express';
import { UsersService } from '../services/users.service';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UpdateNotificationPreferencesDto } from '../dto/update-notification-preferences.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Obter perfil do usuário logado' })
  @Get('profile')
  async getProfile(@Req() req: Request) {
    const user = req.user as any;
    return this.usersService.findOne(user.id);
  }

  @ApiOperation({ summary: 'Atualizar biometria do usuário logado' })
  @Put('profile')
  async updateProfile(@Req() req: Request, @Body() dto: UpdateUserDto) {
    const user = req.user as any;
    return this.usersService.update(user.id, dto);
  }

  @ApiOperation({ summary: 'Obter o 3D Body Scan mais recente (leitura, não grava nada)' })
  @Get('body-scan')
  async getBodyScan(@Req() req: Request) {
    const user = req.user as any;
    return this.usersService.getBodyScan(user.id);
  }

  @ApiOperation({ summary: 'Registrar o 3D Body Scan de hoje (cria ou atualiza o snapshot do dia)' })
  @Post('body-scan')
  async recordBodyScan(@Req() req: Request) {
    const user = req.user as any;
    return this.usersService.recordBodyScan(user.id);
  }

  @ApiOperation({ summary: 'Obter indicadores integrados do Dashboard' })
  @Get('dashboard')
  async getDashboard(@Req() req: Request) {
    const user = req.user as any;
    return this.usersService.getDashboard(user.id);
  }

  @ApiOperation({ summary: 'Listar profissionais da equipe médica vinculados ao usuário' })
  @Get('medical-team')
  async getMedicalTeam(@Req() req: Request) {
    const user = req.user as any;
    return this.usersService.getMedicalTeam(user.id);
  }

  @ApiOperation({ summary: 'Atualizar preferências de notificação do usuário' })
  @Put('notification-preferences')
  async updateNotificationPreferences(
    @Req() req: Request,
    @Body() dto: UpdateNotificationPreferencesDto,
  ) {
    const user = req.user as any;
    return this.usersService.updateNotificationPreferences(user.id, dto);
  }

  @ApiOperation({ summary: 'Obter status do plano/assinatura do usuário' })
  @Get('plan')
  async getPlan(@Req() req: Request) {
    const user = req.user as any;
    return this.usersService.getPlan(user.id);
  }

  @ApiOperation({ summary: 'Cancelar a renovação automática do plano' })
  @Post('plan/cancel')
  async cancelPlan(@Req() req: Request) {
    const user = req.user as any;
    return this.usersService.cancelPlan(user.id);
  }
}
