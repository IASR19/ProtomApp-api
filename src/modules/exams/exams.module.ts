import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExamsController } from './controllers/exams.controller';
import { ExamsService } from './services/exams.service';
import { ExamEntity } from './entities/exam.entity';
import { ExamEvolutionEntity } from './entities/exam-evolution.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ExamEntity, ExamEvolutionEntity])],
  controllers: [ExamsController],
  providers: [ExamsService],
  exports: [TypeOrmModule, ExamsService],
})
export class ExamsModule {}
