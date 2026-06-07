import { Module } from '@nestjs/common';
import { PrescriptionsController } from './controllers/prescriptions.controller';

@Module({ controllers: [PrescriptionsController] })
export class PrescriptionsModule {}
