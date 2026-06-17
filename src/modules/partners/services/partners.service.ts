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

    if (partners.length === 0) {
      // Fallback mock data if seed has not run yet
      return {
        savings: 345.0,
        supplements: [
          { id: '1', name: 'Whey Protein Isolado', brand: 'Growth Supplements', discount: '- 15%', icon: 'nutrition' },
          { id: '2', name: 'Creatina Creapure', brand: 'Max Titanium', discount: '- 20%', icon: 'fitness' },
          { id: '3', name: 'Pré-Treino Évora', brand: 'Integralmédica', discount: '- 10%', icon: 'flash' },
        ],
        pharmacies: [
          { id: '1', name: 'Tirzepatida Manipulada', brand: 'Farmácia Dose Certa', discount: '- 12%', icon: 'medkit' },
          { id: '2', name: 'Magnésio Bisglicinato', brand: 'Ultrafarma', discount: '- 8%', icon: 'medkit' },
        ],
        exams: [
          { id: '1', name: 'Hemograma + Bioquímica', brand: 'Hermes Pardini', discount: '- 25%', icon: 'pulse' },
          { id: '2', name: 'Perfil Hormonal Completo', brand: 'Fleury', discount: '- 18%', icon: 'pulse' },
        ],
      };
    }

    const supplements = partners.filter(p => p.category === 'supplements');
    const pharmacies = partners.filter(p => p.category === 'pharmacies');
    const exams = partners.filter(p => p.category === 'exams');

    return {
      savings: 345.0, // static total savings estimate
      supplements,
      pharmacies,
      exams,
    };
  }
}
