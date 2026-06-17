import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkoutController } from './controllers/workout.controller';
import { WorkoutService } from './services/workout.service';
import { WorkoutEntity } from './entities/workout.entity';
import { WorkoutExerciseEntity } from './entities/workout-exercise.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WorkoutEntity, WorkoutExerciseEntity])],
  controllers: [WorkoutController],
  providers: [WorkoutService],
  exports: [TypeOrmModule, WorkoutService],
})
export class WorkoutModule {}
