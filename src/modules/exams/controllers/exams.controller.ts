import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import type { Request } from 'express';
import { ExamsService } from '../services/exams.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { IsNotEmpty, IsString } from 'class-validator';

class CreateExamDto {
  @ApiProperty({ example: 'Hemograma Completo' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '15/05/2026' })
  @IsString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({ example: 'pdf' })
  @IsString()
  @IsNotEmpty()
  type: string;
}

@ApiTags('exams')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('exams')
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @ApiOperation({ summary: 'Lista exames do usuário logado' })
  @Get()
  async listExams(@Req() req: Request) {
    const user = req.user as any;
    return this.examsService.listExams(user.id);
  }

  @ApiOperation({ summary: 'Evolução dos marcadores do usuário logado' })
  @Get('evolution')
  async getEvolution(@Req() req: Request) {
    const user = req.user as any;
    return this.examsService.getEvolution(user.id);
  }

  @ApiOperation({ summary: 'Enviar novo registro de exame' })
  @Post()
  async createExam(@Req() req: Request, @Body() dto: CreateExamDto) {
    const user = req.user as any;
    return this.examsService.createExam(user.id, dto.name, dto.date, dto.type);
  }
}
