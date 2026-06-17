import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import type { Request } from 'express';
import { ChatbotService } from '../services/chatbot.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { IsNotEmpty, IsString } from 'class-validator';

class ChatMessageDto {
  @ApiProperty({ example: 'Qual o meu treino de hoje?' })
  @IsString()
  @IsNotEmpty()
  message: string;
}

@ApiTags('chatbot')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @ApiOperation({ summary: 'Conversar com o assistente inteligente offline' })
  @Post('chat')
  async chat(@Req() req: Request, @Body() dto: ChatMessageDto) {
    const user = req.user as any;
    const responseText = await this.chatbotService.chat(user.id, dto.message);
    return {
      response: responseText,
    };
  }
}
