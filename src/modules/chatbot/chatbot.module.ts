import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatbotController } from './controllers/chatbot.controller';
import { ChatbotService } from './services/chatbot.service';
import { UserEntity } from '../users/entities/user.entity';
import { ProtocolEntity } from '../protocol/entities/protocol.entity';
import { WorkoutEntity } from '../workout/entities/workout.entity';
import { MealEntity } from '../nutrition/entities/meal.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      ProtocolEntity,
      WorkoutEntity,
      MealEntity,
    ]),
  ],
  controllers: [ChatbotController],
  providers: [ChatbotService],
  exports: [ChatbotService],
})
export class ChatbotModule {}
