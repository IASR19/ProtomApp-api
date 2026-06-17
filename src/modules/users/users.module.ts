import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { ProtocolEntity } from '../protocol/entities/protocol.entity';
import { WorkoutEntity } from '../workout/entities/workout.entity';
import { MealEntity } from '../nutrition/entities/meal.entity';
import { UsersService } from './services/users.service';
import { UsersController } from './controllers/users.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, ProtocolEntity, WorkoutEntity, MealEntity])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [TypeOrmModule, UsersService],
})
export class UsersModule {}
