import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('prescriptions')
@Controller('prescriptions')
export class PrescriptionsController {
  @ApiOperation({ summary: 'Cofre médico — receituários (mock)' })
  @Get()
  listPrescriptions() {
    return [
      {
        id: '1',
        title: 'Receita: Tirzepatida',
        sentBy: 'Dr. James',
        date: '15/05/2026',
        status: 'Assinado digitalmente (ICP-Brasil)',
      },
      {
        id: '2',
        title: 'Pedido de Exames de Sangue',
        sentBy: 'Dr. James',
        date: '14/05/2026',
        status: 'Assinado digitalmente (ICP-Brasil)',
      },
      {
        id: '3',
        title: 'Laudo de Bioimpedância',
        sentBy: 'Clínica',
        date: '10/05/2026',
        status: 'Documento Verificado',
      },
    ];
  }
}
