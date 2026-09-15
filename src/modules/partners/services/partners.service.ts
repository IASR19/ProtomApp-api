import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PartnerEntity } from '../entities/partner.entity';

@Injectable()
export class PartnersService {
  constructor(
    @InjectRepository(PartnerEntity)
    private readonly partnerRepository: Repository<PartnerEntity>,
  ) {}

  async listPartners() {
    const partners = await this.partnerRepository.find();

    const supplements = partners.filter(p => p.category === 'supplements');
    const pharmacies = partners.filter(p => p.category === 'pharmacies');
    const exams = partners.filter(p => p.category === 'exams');

    return {
      hasData: partners.length > 0,
      supplements,
      pharmacies,
      exams,
    };
  }
}
