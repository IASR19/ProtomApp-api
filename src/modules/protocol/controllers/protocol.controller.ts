import { Controller, Get, Post, Patch, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { Request } from 'express';
import { ProtocolService, GenerateProtocolDto } from '../services/protocol.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('protocol')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('protocol')
export class ProtocolController {
  constructor(private readonly protocolService: ProtocolService) {}

  @ApiOperation({ summary: 'Retorna protocolo ativo do usuário logado' })
  @Get()
  async getProtocol(@Req() req: Request) {
    const user = req.user as any;
    return this.protocolService.getActiveProtocol(user.id);
  }

  @ApiOperation({ summary: 'Alternar status Concluído de uma tarefa do protocolo' })
  @Patch('tasks/:id')
  async toggleTask(@Req() req: Request, @Param('id') taskId: string) {
    const user = req.user as any;
    return this.protocolService.toggleTask(user.id, taskId);
  }

  @ApiOperation({ summary: 'Gerar um novo protocolo personalizado via sistema especialista' })
  @Post('generate')
  async generateProtocol(@Req() req: Request, @Body() dto: GenerateProtocolDto) {
    const user = req.user as any;
    return this.protocolService.generateProtocol(user.id, dto);
  }
}
