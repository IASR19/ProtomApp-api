import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiProperty,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { Max, Min, IsNumber } from 'class-validator';
import { WellnessService } from '../services/wellness.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

class SubmitCheckinDto {
  @ApiProperty({ example: 7.5, description: 'Horas dormidas' })
  @IsNumber()
  @Min(0)
  @Max(24)
  sleepHours: number;

  @ApiProperty({ example: 4, minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  sleepQuality: number;

  @ApiProperty({ example: 2, minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  fatigue: number;

  @ApiProperty({ example: 2, minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  soreness: number;

  @ApiProperty({ example: 2, minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  stress: number;

  @ApiProperty({ example: 4, minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  mood: number;
}

@ApiTags('wellness')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wellness')
export class WellnessController {
  constructor(private readonly wellnessService: WellnessService) {}

  @ApiOperation({
    summary: 'Enviar (ou atualizar) o check-in de bem-estar de hoje',
  })
  @Post('checkin')
  async submitCheckin(@Req() req: Request, @Body() dto: SubmitCheckinDto) {
    const user = req.user as any;
    return this.wellnessService.submitTodayCheckin(user.id, dto);
  }

  @ApiOperation({
    summary: 'Buscar o check-in de hoje do usuário logado, se existir',
  })
  @Get('checkin/today')
  async getToday(@Req() req: Request) {
    const user = req.user as any;
    const checkin = await this.wellnessService.getTodayCheckin(user.id);
    return checkin ?? null;
  }

  @ApiOperation({ summary: 'Histórico recente de check-ins do usuário logado' })
  @Get('checkin/history')
  async getHistory(@Req() req: Request) {
    const user = req.user as any;
    return this.wellnessService.getHistory(user.id);
  }
}
