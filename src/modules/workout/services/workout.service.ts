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

  async getTodayWorkout(userId: string): Promise<WorkoutEntity> {
    const workout = await this.workoutRepository.findOne({
      where: { userId },
      relations: { exercises: true },
    });

    if (!workout) {
      // Return a default mock workout object if none is set in DB to ensure graceful degradation
      const defaultWorkout = new WorkoutEntity();
      defaultWorkout.title = 'Treino A - Superior';
      defaultWorkout.description = 'Foco em hipertrofia e gasto calórico';
      defaultWorkout.duration = 55;
      defaultWorkout.calories = 450;
      defaultWorkout.cardio = 'Cardio: 30min Esteira (Zona 2)';
      
      const ex1 = new WorkoutExerciseEntity();
      ex1.name = 'Supino Reto';
      ex1.sets = 4;
      ex1.reps = 12;
      ex1.weight = 60;
      
      const ex2 = new WorkoutExerciseEntity();
      ex2.name = 'Desenvolvimento';
      ex2.sets = 3;
      ex2.reps = 12;
      ex2.weight = 30;

      const ex3 = new WorkoutExerciseEntity();
      ex3.name = 'Puxada Frontal';
      ex3.sets = 4;
      ex3.reps = 10;
      ex3.weight = 50;

      defaultWorkout.exercises = [ex1, ex2, ex3];
      return defaultWorkout;
    }

    return workout;
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
