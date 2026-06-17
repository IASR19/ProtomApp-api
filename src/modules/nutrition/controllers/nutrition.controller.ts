import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import type { Request } from 'express';
import { NutritionService } from '../services/nutrition.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { IsNotEmpty, IsNumber, IsString, IsOptional } from 'class-validator';

class CreateMealDto {
  @ApiProperty({ example: 'Almoço Estratégico' })
  @IsString()
  @IsNotEmpty()
  meal: string;

  @ApiProperty({ example: 450 })
  @IsNumber()
  @IsNotEmpty()
  totalKcal: number;

  @ApiProperty({ example: 500 })
  @IsNumber()
  @IsNotEmpty()
  goalKcal: number;

  @ApiProperty({ example: 40 })
  @IsNumber()
  @IsNotEmpty()
  proteinGrams: number;

  @ApiProperty({ example: 45 })
  @IsNumber()
  @IsNotEmpty()
  proteinPercent: number;

  @ApiProperty({ example: 30 })
  @IsNumber()
  @IsNotEmpty()
  carbGrams: number;

  @ApiProperty({ example: 35 })
  @IsNumber()
  @IsNotEmpty()
  carbPercent: number;

  @ApiProperty({ example: 15 })
  @IsNumber()
  @IsNotEmpty()
  fatGrams: number;

  @ApiProperty({ example: 20 })
  @IsNumber()
  @IsNotEmpty()
  fatPercent: number;

  @ApiProperty({ required: false, example: '200g de arroz integral, 150g de frango' })
  @IsString()
  @IsOptional()
  description?: string;
}

@ApiTags('nutrition')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('nutrition')
export class NutritionController {
  constructor(private readonly nutritionService: NutritionService) {}

  @ApiOperation({ summary: 'Obtém análise da última refeição registrada' })
  @Get('last-meal')
  async getLastMeal(@Req() req: Request) {
    const user = req.user as any;
    return this.nutritionService.getLastMeal(user.id);
  }

  @ApiOperation({ summary: 'Registrar nova refeição com macronutrientes' })
  @Post('meal')
  async createMeal(@Req() req: Request, @Body() dto: CreateMealDto) {
    const user = req.user as any;
    return this.nutritionService.createMeal(
      user.id,
      dto.meal,
      dto.totalKcal,
      dto.goalKcal,
      dto.proteinGrams,
      dto.proteinPercent,
      dto.carbGrams,
      dto.carbPercent,
      dto.fatGrams,
      dto.fatPercent,
      dto.description,
    );
  }
}
