import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NutritionController } from './controllers/nutrition.controller';
import { NutritionService } from './services/nutrition.service';
import { MealEntity } from './entities/meal.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MealEntity])],
  controllers: [NutritionController],
  providers: [NutritionService],
  exports: [TypeOrmModule, NutritionService],
})
export class NutritionModule {}
