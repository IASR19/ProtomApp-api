import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateInitialTables1781652526112 } from './migrations/1781652526112-CreateInitialTables';
import { AddEmailVerificationAndSocialFields1781652888767 } from './migrations/1781652888767-AddEmailVerificationAndSocialFields';
import { AlterUserHeightPrecision1781656516762 } from './migrations/1781656516762-AlterUserHeightPrecision';
import { EnsureUserAuthColumns1788373230170 } from './migrations/1788373230170-EnsureUserAuthColumns';
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
      useFactory: (config: ConfigService) => {
        const isProd = config.get('NODE_ENV') === 'production';
        const dbSsl = config.get('DB_SSL') === 'true';
        return {
          type: 'postgres' as const,
          host: config.get<string>('DB_HOST', 'localhost'),
          port: parseInt(String(config.get('DB_PORT', 5432)), 10),
          username: config.get<string>('DB_USER', 'postgres'),
          password: config.get<string>('DB_PASS', 'postgres'),
          database: config.get<string>('DB_NAME', 'protomapp'),
          schema: config.get<string>('DB_SCHEMA', 'app'),
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          migrations: [
            CreateInitialTables1781652526112,
            AddEmailVerificationAndSocialFields1781652888767,
            AlterUserHeightPrecision1781656516762,
            EnsureUserAuthColumns1788373230170,
          ],
          synchronize: !isProd,
          migrationsRun: isProd,
          logging: config.get('NODE_ENV') === 'development',
          ssl: dbSsl ? { rejectUnauthorized: false } : false,
        };
      },
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
