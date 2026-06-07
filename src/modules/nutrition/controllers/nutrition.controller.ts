import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('nutrition')
@Controller('nutrition')
export class NutritionController {
  @ApiOperation({ summary: 'Análise da última refeição (mock)' })
  @Get('last-meal')
  getLastMeal() {
    return {
      meal: 'Almoço Estratégico',
      totalKcal: 450,
      goalKcal: 500,
      protein: { grams: 40, percent: 45 },
      carb: { grams: 30, percent: 35 },
      fat: { grams: 15, percent: 20 },
    };
  }
}
