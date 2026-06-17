import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MealEntity } from '../entities/meal.entity';

@Injectable()
export class NutritionService {
  constructor(
    @InjectRepository(MealEntity)
    private readonly mealRepository: Repository<MealEntity>,
  ) {}

  async getLastMeal(userId: string): Promise<MealEntity> {
    const meal = await this.mealRepository.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    if (!meal) {
      // Default fallback mock meal data
      const defaultMeal = new MealEntity();
      defaultMeal.meal = 'Almoço Estratégico';
      defaultMeal.totalKcal = 450;
      defaultMeal.goalKcal = 500;
      defaultMeal.proteinGrams = 40;
      defaultMeal.proteinPercent = 45;
      defaultMeal.carbGrams = 30;
      defaultMeal.carbPercent = 35;
      defaultMeal.fatGrams = 15;
      defaultMeal.fatPercent = 20;
      return defaultMeal;
    }

    return meal;
  }

  async createMeal(
    userId: string,
    meal: string,
    totalKcal: number,
    goalKcal: number,
    proteinGrams: number,
    proteinPercent: number,
    carbGrams: number,
    carbPercent: number,
    fatGrams: number,
    fatPercent: number,
    description?: string,
  ): Promise<MealEntity> {
    const newMeal = this.mealRepository.create({
      userId,
      meal,
      totalKcal,
      goalKcal,
      proteinGrams,
      proteinPercent,
      carbGrams,
      carbPercent,
      fatGrams,
      fatPercent,
      description,
    });
    return this.mealRepository.save(newMeal);
  }
}
