import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProtocolController } from './controllers/protocol.controller';
import { ProtocolService } from './services/protocol.service';
import { ProtocolEntity } from './entities/protocol.entity';
import { ProtocolTaskEntity } from './entities/protocol-task.entity';
import { MedicationEntity } from './entities/medication.entity';
import { SupplementEntity } from './entities/supplement.entity';
import { UsersModule } from '../users/users.module';
import { WorkoutEntity } from '../workout/entities/workout.entity';
import { WorkoutExerciseEntity } from '../workout/entities/workout-exercise.entity';
import { MealEntity } from '../nutrition/entities/meal.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProtocolEntity,
      ProtocolTaskEntity,
      MedicationEntity,
      SupplementEntity,
      WorkoutEntity,
      WorkoutExerciseEntity,
      MealEntity,
    ]),
    forwardRef(() => UsersModule),
  ],
  controllers: [ProtocolController],
  providers: [ProtocolService],
  exports: [TypeOrmModule, ProtocolService],
})
export class ProtocolModule {}
