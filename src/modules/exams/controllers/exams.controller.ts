import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('exams')
@Controller('exams')
export class ExamsController {
  @ApiOperation({ summary: 'Lista exames recentes (mock)' })
  @Get()
  listExams() {
    return [
      { id: '1', name: 'Hemograma Completo', date: '15/05/2026', status: 'Analisado' },
      { id: '2', name: 'Perfil Lipídico', date: '15/05/2026', status: 'Analisado' },
      { id: '3', name: 'Glicemia Jejum', date: '15/05/2026', status: 'Analisado' },
    ];
  }

  @ApiOperation({ summary: 'Evolução dos marcadores (mock)' })
  @Get('evolution')
  getEvolution() {
    return [
      { id: '1', name: 'Glicemia de Jejum', unit: 'mg/dL', current: 88, previous: 92 },
      { id: '2', name: 'Colesterol Total', unit: 'mg/dL', current: 178, previous: 185 },
      { id: '3', name: 'Triglicerídeos', unit: 'mg/dL', current: 132, previous: 145 },
    ];
  }
}
