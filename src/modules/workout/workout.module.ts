import { Module } from '@nestjs/common';
import { WorkoutController } from './controllers/workout.controller';

@Module({ controllers: [WorkoutController] })
export class WorkoutModule {}
