import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('partners')
@Controller('partners')
export class PartnersController {
  @ApiOperation({ summary: 'Lista parceiros e cupons (mock)' })
  @Get()
  listPartners() {
    return {
      savings: 345.0,
      supplements: [
        { id: '1', name: 'Whey Protein Isolado', brand: 'Growth Supplements', discount: '- 15%' },
        { id: '2', name: 'Creatina Creapure', brand: 'Max Titanium', discount: '- 20%' },
        { id: '3', name: 'Pré-Treino Évora', brand: 'Integralmédica', discount: '- 10%' },
      ],
      pharmacies: [
        { id: '1', name: 'Tirzepatida Manipulada', brand: 'Farmácia Dose Certa', discount: '- 12%' },
        { id: '2', name: 'Magnésio Bisglicinato', brand: 'Ultrafarma', discount: '- 8%' },
      ],
      exams: [
        { id: '1', name: 'Hemograma + Bioquímica', brand: 'Hermes Pardini', discount: '- 25%' },
        { id: '2', name: 'Perfil Hormonal Completo', brand: 'Fleury', discount: '- 18%' },
      ],
    };
  }
}
