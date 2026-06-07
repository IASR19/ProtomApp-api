import { Module } from '@nestjs/common';
import { NutritionController } from './controllers/nutrition.controller';

@Module({ controllers: [NutritionController] })
export class NutritionModule {}
