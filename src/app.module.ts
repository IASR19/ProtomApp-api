import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProtocolModule } from './modules/protocol/protocol.module';
import { ExamsModule } from './modules/exams/exams.module';
import { WorkoutModule } from './modules/workout/workout.module';
import { NutritionModule } from './modules/nutrition/nutrition.module';
import { PrescriptionsModule } from './modules/prescriptions/prescriptions.module';
import { PartnersModule } from './modules/partners/partners.module';
import { ChatbotModule } from './modules/chatbot/chatbot.module';

// Import all entities for app-level seeding in AppService
import { UserEntity } from './modules/users/entities/user.entity';
import { PartnerEntity } from './modules/partners/entities/partner.entity';
import { ExamEntity } from './modules/exams/entities/exam.entity';
import { ExamEvolutionEntity } from './modules/exams/entities/exam-evolution.entity';
import { PrescriptionEntity } from './modules/prescriptions/entities/prescription.entity';
import { WorkoutEntity } from './modules/workout/entities/workout.entity';
import { WorkoutExerciseEntity } from './modules/workout/entities/workout-exercise.entity';
import { MealEntity } from './modules/nutrition/entities/meal.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get('DB_USER', 'postgres'),
        password: config.get('DB_PASS', 'postgres'),
        database: config.get('DB_NAME', 'protomapp'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: config.get('NODE_ENV') !== 'production',
        logging: config.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([
      UserEntity,
      PartnerEntity,
      ExamEntity,
      ExamEvolutionEntity,
      PrescriptionEntity,
      WorkoutEntity,
      WorkoutExerciseEntity,
      MealEntity,
    ]),
    UsersModule,
    AuthModule,
    ProtocolModule,
    ExamsModule,
    WorkoutModule,
    NutritionModule,
    PrescriptionsModule,
    PartnersModule,
    ChatbotModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
