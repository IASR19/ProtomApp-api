import { Module } from '@nestjs/common';
import { ExamsController } from './controllers/exams.controller';

@Module({ controllers: [ExamsController] })
export class ExamsModule {}
