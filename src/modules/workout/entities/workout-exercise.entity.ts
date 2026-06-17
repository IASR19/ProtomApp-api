import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/entities/base.entity';
import { WorkoutEntity } from './workout.entity';

@Entity('workout_exercises')
export class WorkoutExerciseEntity extends BaseEntity {
  @ApiProperty()
  @Column({ type: 'uuid' })
  workoutId: string;

  @ManyToOne(() => WorkoutEntity, (workout) => workout.exercises, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workoutId' })
  workout: WorkoutEntity;

  @ApiProperty()
  @Column({ type: 'varchar', length: 150 })
  name: string; // Supino Reto, etc.

  @ApiProperty()
  @Column({ type: 'int' })
  sets: number;

  @ApiProperty()
  @Column({ type: 'int' })
  reps: number;

  @ApiProperty()
  @Column({ type: 'int' })
  weight: number; // in kg
}
