import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WellnessController } from './controllers/wellness.controller';
import { WellnessService } from './services/wellness.service';
import { DailyCheckinEntity } from './entities/daily-checkin.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DailyCheckinEntity])],
  controllers: [WellnessController],
  providers: [WellnessService],
  exports: [TypeOrmModule, WellnessService],
})
export class WellnessModule {}
