import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DailyCheckinEntity } from '../entities/daily-checkin.entity';

export interface SubmitCheckinInput {
  sleepHours: number;
  sleepQuality: number;
  fatigue: number;
  soreness: number;
  stress: number;
  mood: number;
}

const RATING_MIN = 1;
const RATING_MAX = 5;

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function validateRating(field: string, value: number) {
  if (
    typeof value !== 'number' ||
    Number.isNaN(value) ||
    value < RATING_MIN ||
    value > RATING_MAX
  ) {
    throw new BadRequestException(`${field} deve ser um número entre 1 e 5.`);
  }
}

export function calculateSleepScore(sleepHours: number): number {
  return Math.round(Math.min(100, Math.max(0, (sleepHours / 8) * 100)));
}

// Estilo Hooper-Mackinnon: fadiga/dor/estresse são "ruim quando alto" (invertidos),
// humor é "bom quando alto". Média das 4 dimensões normalizada para 0-100.
export function calculateRecoveryScore(input: {
  fatigue: number;
  soreness: number;
  stress: number;
  mood: number;
}): number {
  const invertedFatigue = RATING_MAX + RATING_MIN - input.fatigue;
  const invertedSoreness = RATING_MAX + RATING_MIN - input.soreness;
  const invertedStress = RATING_MAX + RATING_MIN - input.stress;
  const average =
    (invertedFatigue + invertedSoreness + invertedStress + input.mood) / 4;
  const score = ((average - RATING_MIN) / (RATING_MAX - RATING_MIN)) * 100;
  return Math.round(Math.min(100, Math.max(0, score)));
}

@Injectable()
export class WellnessService {
  constructor(
    @InjectRepository(DailyCheckinEntity)
    private readonly checkinRepository: Repository<DailyCheckinEntity>,
  ) {}

  async submitTodayCheckin(userId: string, input: SubmitCheckinInput) {
    if (
      typeof input.sleepHours !== 'number' ||
      Number.isNaN(input.sleepHours) ||
      input.sleepHours < 0 ||
      input.sleepHours > 24
    ) {
      throw new BadRequestException(
        'sleepHours deve ser um número entre 0 e 24.',
      );
    }
    validateRating('sleepQuality', input.sleepQuality);
    validateRating('fatigue', input.fatigue);
    validateRating('soreness', input.soreness);
    validateRating('stress', input.stress);
    validateRating('mood', input.mood);

    const date = todayDateString();
    let checkin = await this.checkinRepository.findOne({
      where: { userId, date },
    });

    const sleepScore = calculateSleepScore(input.sleepHours);
    const recoveryScore = calculateRecoveryScore(input);

    if (!checkin) {
      checkin = this.checkinRepository.create({ userId, date });
    }

    Object.assign(checkin, input, { sleepScore, recoveryScore });

    return this.checkinRepository.save(checkin);
  }

  async getTodayCheckin(userId: string): Promise<DailyCheckinEntity | null> {
    return this.checkinRepository.findOne({
      where: { userId, date: todayDateString() },
    });
  }

  async getHistory(userId: string, limit = 30): Promise<DailyCheckinEntity[]> {
    return this.checkinRepository.find({
      where: { userId },
      order: { date: 'DESC' },
      take: limit,
    });
  }
}
