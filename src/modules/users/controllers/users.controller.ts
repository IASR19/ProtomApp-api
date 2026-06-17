import { Controller, Get, Put, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { Request } from 'express';
import { UsersService } from '../services/users.service';
import { UpdateUserDto } from '../dto/update-user.dto';
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

  @ApiOperation({ summary: 'Obter dados estáticos do 3D Body Scan' })
  @Get('body-scan')
  async getBodyScan(@Req() req: Request) {
    const user = req.user as any;
    return this.usersService.getBodyScan(user.id);
  }

  @ApiOperation({ summary: 'Obter indicadores integrados do Dashboard' })
  @Get('dashboard')
  async getDashboard(@Req() req: Request) {
    const user = req.user as any;
    return this.usersService.getDashboard(user.id);
  }
}
