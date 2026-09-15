import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import { IsArray, IsIn, IsObject, IsOptional, IsString } from 'class-validator';
import { OnboardingChatService } from '../services/onboarding-chat.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

class OnboardingHistoryEntryDto {
  @ApiProperty({ enum: ['user', 'bot'] })
  @IsIn(['user', 'bot'])
  role: 'user' | 'bot';

  @ApiProperty()
  @IsString()
  text: string;
}

class OnboardingChatMessageDto {
  @ApiProperty()
  @IsString()
  message: string;

  @ApiProperty()
  @IsObject()
  collectedFields: Record<string, unknown>;

  @ApiProperty({ type: [OnboardingHistoryEntryDto] })
  @IsArray()
  @IsOptional()
  history?: OnboardingHistoryEntryDto[];
}

@ApiTags('chatbot')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chatbot')
export class OnboardingChatController {
  constructor(private readonly onboardingChatService: OnboardingChatService) {}

  @ApiOperation({ summary: 'Conversa de onboarding conduzida por IA (com fallback para árvore fixa)' })
  @Post('onboarding-message')
  async onboardingMessage(@Body() dto: OnboardingChatMessageDto) {
    return this.onboardingChatService.handleMessage({
      message: dto.message,
      collectedFields: dto.collectedFields || {},
      history: dto.history || [],
    });
  }
}
