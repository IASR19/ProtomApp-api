import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { Request } from 'express';
import { PrescriptionsService } from '../services/prescriptions.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('prescriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('prescriptions')
export class PrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @ApiOperation({ summary: 'Obter receituários e laudos do usuário logado' })
  @Get()
  async listPrescriptions(@Req() req: Request) {
    const user = req.user as any;
    return this.prescriptionsService.listPrescriptions(user.id);
  }
}
