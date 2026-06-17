import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExamEntity } from '../entities/exam.entity';
import { ExamEvolutionEntity } from '../entities/exam-evolution.entity';

@Injectable()
export class ExamsService {
  constructor(
    @InjectRepository(ExamEntity)
    private readonly examsRepository: Repository<ExamEntity>,
    @InjectRepository(ExamEvolutionEntity)
    private readonly evolutionRepository: Repository<ExamEvolutionEntity>,
  ) {}

  async listExams(userId: string): Promise<ExamEntity[]> {
    return this.examsRepository.find({
      where: { userId },
      order: { date: 'DESC' },
    });
  }

  async createExam(userId: string, name: string, date: string, type: string): Promise<ExamEntity> {
    const exam = this.examsRepository.create({
      userId,
      name,
      date,
      type,
      status: 'Analisado',
    });
    return this.examsRepository.save(exam);
  }

  async getEvolution(userId: string): Promise<ExamEvolutionEntity[]> {
    return this.evolutionRepository.find({
      where: { userId },
      order: { name: 'ASC' },
    });
  }
}
