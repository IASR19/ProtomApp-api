import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MealEntity } from '../entities/meal.entity';
import { OpenAiVisionService } from '../../../common/openai/openai-vision.service';

const MEAL_ANALYSIS_PROMPT = `Você é um nutricionista analisando a foto de uma refeição.
Estime o nome da refeição e os valores nutricionais aproximados. Responda ESTRITAMENTE com um objeto JSON válido (sem markdown, sem \`\`\`), no formato:
{
  "meal": "Nome da refeição (ex: Almoço, Lanche da tarde)",
  "description": "Alimentos identificados na foto (ex: arroz, feijão, frango grelhado, salada)",
  "totalKcal": 500,
  "goalKcal": 500,
  "proteinGrams": 35,
  "proteinPercent": 30,
  "carbGrams": 50,
  "carbPercent": 40,
  "fatGrams": 15,
  "fatPercent": 30
}
Se não conseguir identificar uma refeição de verdade na imagem, responda exatamente: {"error": "not_recognized"}`;

@Injectable()
export class NutritionService {
  private readonly logger = new Logger(NutritionService.name);

  constructor(
    @InjectRepository(MealEntity)
    private readonly mealRepository: Repository<MealEntity>,
    private readonly openAiVisionService: OpenAiVisionService,
  ) {}

  async getLastMeal(userId: string): Promise<MealEntity | null> {
    return this.mealRepository.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
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

  async analyzeMealPhoto(
    userId: string,
    file: Express.Multer.File,
  ): Promise<{ analyzed: boolean; meal?: MealEntity; error?: string }> {
    if (!this.openAiVisionService.isEnabled()) {
      return { analyzed: false, error: 'Análise por IA não está disponível no momento.' };
    }

    const result = await this.openAiVisionService.analyzeImage(
      MEAL_ANALYSIS_PROMPT,
      file.buffer.toString('base64'),
      file.mimetype,
    );

    if (!result || result.error || !result.meal) {
      this.logger.warn(`Não foi possível analisar a foto de refeição enviada por userId=${userId}`);
      return {
        analyzed: false,
        error: 'Não foi possível analisar a imagem. Tente novamente ou registre manualmente.',
      };
    }

    const meal = await this.createMeal(
      userId,
      String(result.meal).slice(0, 150),
      Number(result.totalKcal) || 0,
      Number(result.goalKcal) || 0,
      Number(result.proteinGrams) || 0,
      Number(result.proteinPercent) || 0,
      Number(result.carbGrams) || 0,
      Number(result.carbPercent) || 0,
      Number(result.fatGrams) || 0,
      Number(result.fatPercent) || 0,
      result.description ? String(result.description) : undefined,
    );

    return { analyzed: true, meal };
  }
}
