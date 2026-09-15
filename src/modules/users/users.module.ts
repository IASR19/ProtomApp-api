import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { BodyScanSnapshotEntity } from './entities/body-scan-snapshot.entity';
import { MedicalTeamMemberEntity } from './entities/medical-team-member.entity';
import { ProtocolEntity } from '../protocol/entities/protocol.entity';
import { WorkoutEntity } from '../workout/entities/workout.entity';
import { MealEntity } from '../nutrition/entities/meal.entity';
import { UsersService } from './services/users.service';
import { UsersController } from './controllers/users.controller';
import { WellnessModule } from '../wellness/wellness.module';
import { ExamsModule } from '../exams/exams.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      BodyScanSnapshotEntity,
      MedicalTeamMemberEntity,
      ProtocolEntity,
      WorkoutEntity,
      MealEntity,
    ]),
    WellnessModule,
    ExamsModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [TypeOrmModule, UsersService],
})
export class UsersModule {}
