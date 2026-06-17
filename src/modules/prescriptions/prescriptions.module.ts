import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrescriptionsController } from './controllers/prescriptions.controller';
import { PrescriptionsService } from './services/prescriptions.service';
import { PrescriptionEntity } from './entities/prescription.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PrescriptionEntity])],
  controllers: [PrescriptionsController],
  providers: [PrescriptionsService],
  exports: [TypeOrmModule, PrescriptionsService],
})
export class PrescriptionsModule {}
