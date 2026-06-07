import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('workout')
@Controller('workout')
export class WorkoutController {
  @ApiOperation({ summary: 'Treino do dia (mock)' })
  @Get('today')
  getTodayWorkout() {
    return {
      title: 'Treino A - Superior',
      description: 'Foco em hipertrofia e gasto calórico',
      duration: 55,
      calories: 450,
      exercises: [
        { id: '1', name: 'Supino Reto', sets: 4, reps: 12, weight: 60 },
        { id: '2', name: 'Desenvolvimento', sets: 3, reps: 12, weight: 30 },
        { id: '3', name: 'Puxada Frontal', sets: 4, reps: 10, weight: 50 },
      ],
      cardio: 'Cardio: 30min Esteira (Zona 2)',
    };
  }
}
