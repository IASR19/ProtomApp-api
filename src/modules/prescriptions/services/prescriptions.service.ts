import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PrescriptionEntity } from '../entities/prescription.entity';

@Injectable()
export class PrescriptionsService {
  constructor(
    @InjectRepository(PrescriptionEntity)
    private readonly prescriptionRepository: Repository<PrescriptionEntity>,
  ) {}

  async listPrescriptions(userId: string): Promise<PrescriptionEntity[]> {
    return this.prescriptionRepository.find({
      where: { userId },
      order: { date: 'DESC' },
    });
  }
}
