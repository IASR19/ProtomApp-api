import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiProperty, ApiConsumes } from '@nestjs/swagger';
import type { Request } from 'express';
import { NutritionService } from '../services/nutrition.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { IsNotEmpty, IsNumber, IsString, IsOptional } from 'class-validator';

const MAX_MEAL_PHOTO_BYTES = 10 * 1024 * 1024;
const ALLOWED_MEAL_PHOTO_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

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
    const meal = await this.nutritionService.getLastMeal(user.id);
    return { hasData: !!meal, meal: meal ?? null };
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

  @ApiOperation({ summary: 'Analisar foto de refeição via IA e registrar automaticamente' })
  @ApiConsumes('multipart/form-data')
  @Post('analyze-photo')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_MEAL_PHOTO_BYTES },
      fileFilter: (_req, file, callback) => {
        callback(null, ALLOWED_MEAL_PHOTO_MIME_TYPES.includes(file.mimetype));
      },
    }),
  )
  async analyzeMealPhoto(@Req() req: Request, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Nenhuma imagem válida enviada. Envie uma foto em JPEG, PNG ou WEBP.');
    }
    const user = req.user as any;
    return this.nutritionService.analyzeMealPhoto(user.id, file);
  }
}
