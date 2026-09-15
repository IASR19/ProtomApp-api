import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkoutEntity } from '../entities/workout.entity';
import { WorkoutExerciseEntity } from '../entities/workout-exercise.entity';

@Injectable()
export class WorkoutService {
  constructor(
    @InjectRepository(WorkoutEntity)
    private readonly workoutRepository: Repository<WorkoutEntity>,
  ) {}

  async getTodayWorkout(userId: string): Promise<WorkoutEntity | null> {
    return this.workoutRepository.findOne({
      where: { userId },
      relations: { exercises: true },
    });
  }

  async createWorkout(userId: string, title: string, description: string, duration: number, calories: number, cardio: string, exercisesDto: any[]): Promise<WorkoutEntity> {
    // Delete existing workouts for simplicity in this project phase
    await this.workoutRepository.delete({ userId });

    const workout = new WorkoutEntity();
    workout.userId = userId;
    workout.title = title;
    workout.description = description;
    workout.duration = duration;
    workout.calories = calories;
    workout.cardio = cardio;
    
    workout.exercises = exercisesDto.map(ex => {
      const exercise = new WorkoutExerciseEntity();
      exercise.name = ex.name;
      exercise.sets = ex.sets;
      exercise.reps = ex.reps;
      exercise.weight = ex.weight;
      return exercise;
    });

    return this.workoutRepository.save(workout);
  }
}
