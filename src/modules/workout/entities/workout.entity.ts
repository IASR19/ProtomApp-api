import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/entities/base.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { WorkoutExerciseEntity } from './workout-exercise.entity';

@Entity('workouts')
export class WorkoutEntity extends BaseEntity {
  @ApiProperty()
  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @ApiProperty()
  @Column({ type: 'varchar', length: 150 })
  title: string;

  @ApiProperty()
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty()
  @Column({ type: 'int', default: 0 })
  duration: number; // in minutes

  @ApiProperty()
  @Column({ type: 'int', default: 0 })
  calories: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 200, nullable: true })
  cardio: string; // e.g. "Cardio: 30min Esteira"

  @ApiProperty({ type: () => [WorkoutExerciseEntity] })
  @OneToMany(() => WorkoutExerciseEntity, (exercise) => exercise.workout, { cascade: true })
  exercises: WorkoutExerciseEntity[];
}
