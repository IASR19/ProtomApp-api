import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('protocol')
@Controller('protocol')
export class ProtocolController {
  @ApiOperation({ summary: 'Retorna protocolo ativo do usuário (mock)' })
  @Get()
  getProtocol() {
    return {
      adherence: 72,
      recovery: 85,
      sleep: '6h12',
      hydration: '1.2L',
      fastingHours: '14h',
      tasks: [
        { id: '1', time: '06:00', title: 'Desjejum Metabólico', tag: 'NUTRIÇÃO', done: true },
        { id: '2', time: '08:00', title: 'Tirzepatida (Monjaro)', tag: 'MEDICAÇÃO', done: true },
        { id: '3', time: '12:30', title: 'Quebra de Jejum', tag: 'NUTRIÇÃO', done: false },
        { id: '4', time: '18:00', title: 'Treino de Força', tag: 'PERFORMANCE', done: false },
        { id: '5', time: '21:30', title: 'Higiene do Sono', tag: 'BIOHACKING', done: false },
      ],
    };
  }
}
