import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../entities/user.entity';
import { UpdateUserDto } from '../dto/update-user.dto';
import { ProtocolEntity } from '../../protocol/entities/protocol.entity';
import { WorkoutEntity } from '../../workout/entities/workout.entity';
import { MealEntity } from '../../nutrition/entities/meal.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(ProtocolEntity)
    private readonly protocolsRepository: Repository<ProtocolEntity>,
    @InjectRepository(WorkoutEntity)
    private readonly workoutRepository: Repository<WorkoutEntity>,
    @InjectRepository(MealEntity)
    private readonly mealsRepository: Repository<MealEntity>,
  ) {}

  async findOne(id: string): Promise<UserEntity> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }
    return user;
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserEntity> {
    const user = await this.findOne(id);
    Object.assign(user, dto);
    return this.usersRepository.save(user);
  }

  async getBodyScan(userId: string) {
    const user = await this.findOne(userId);
    
    // Heuristic calculations based on user metrics for the static 3D scan
    const weight = Number(user.weight) || 80;
    const height = Number(user.height) || 1.75;
    
    // Body fat percentage estimate (heuristic formula for demonstration)
    let bodyFat = 20;
    if (user.sex?.toLowerCase() === 'feminino') {
      bodyFat = Math.round((weight / (height * height)) * 1.1 + 5);
    } else {
      bodyFat = Math.round((weight / (height * height)) * 1.1 - 4);
    }
    
    const leanMass = Math.round(weight * (1 - bodyFat / 100));

    return {
      bodyFat: Math.max(5, Math.min(bodyFat, 50)),
      bodyFatDelta: -2.1,
      visceralFat: 12,
      visceralFatDelta: -1,
      weight: weight,
      weightDelta: -5.0,
      waist: Math.round(weight * 0.9), // rough estimate
      waistDelta: -4,
      leanMass: leanMass,
      leanMassDelta: 0,
      comparisonLabel: 'Comparativo: Mês 1 vs Mês 2',
    };
  }

  async getDashboard(userId: string) {
    const user = await this.findOne(userId);
    
    // 1. Fetch active protocol and adherence
    const protocol = await this.protocolsRepository.findOne({
      where: { userId, isActive: true },
      relations: { tasks: true },
    });

    let protocolProgress = 0;
    let adherence = 0;
    let recovery = 85;
    let sleepValue = '7.5h';
    let sleepHrs = 7.5;
    
    if (protocol) {
      recovery = protocol.recovery ?? 85;
      sleepValue = protocol.sleep || '7.5h';
      sleepHrs = parseFloat(sleepValue.replace('h', '.')) || 7.5;
      
      if (protocol.tasks && protocol.tasks.length > 0) {
        const doneTasks = protocol.tasks.filter(t => t.done).length;
        protocolProgress = Math.round((doneTasks / protocol.tasks.length) * 100);
        adherence = protocolProgress;
      }
    }

    // 2. Fetch meals to sum total and goal kcal
    const meals = await this.mealsRepository.find({ where: { userId } });
    let nutritionKcal = 0;
    let nutritionGoal = 2200;
    if (meals && meals.length > 0) {
      nutritionKcal = meals.reduce((sum, m) => sum + (m.totalKcal || 0), 0);
      nutritionGoal = meals.reduce((sum, m) => sum + (m.goalKcal || 0), 0);
    }

    // 3. Fetch workout to determine training status
    const workout = await this.workoutRepository.findOne({ where: { userId } });
    const trainingStatus = workout ? workout.title : 'Sem Treino';

    // 4. Calculate weight delta (current - initial)
    const currentWeight = Number(user.weight) || 80;
    const initialWeight = Number(user.initialWeight) || currentWeight;
    const weightProgress = Number((currentWeight - initialWeight).toFixed(1));

    // 5. Calculate Metabolic Score dynamically
    const sleepScore = Math.round(Math.min(100, (sleepHrs / 8) * 100));
    const metabolicScore = Math.round(
      adherence * 0.4 + 
      recovery * 0.3 + 
      sleepScore * 0.2 + 
      90 * 0.1
    );

    return {
      metabolicScore,
      protocolProgress,
      trainingStatus,
      nutritionKcal,
      nutritionGoal,
      nextExamDays: 12,
      weightProgress,
      criticalAlerts: adherence < 60 ? 1 : 0,
      metabolicScoreDetails: {
        protocolAdherence: adherence,
        wearableData: {
          sleep: sleepHrs,
          recovery,
          avgHeartRate: 68,
        },
        weightProgress: Math.min(100, Math.round((weightProgress / -10) * 100)) || 50, // mock percentage of target weight loss
        examsStatus: 90,
      },
      alerts: [
        {
          id: '1',
          level: adherence < 80 ? 'warning' : 'success',
          category: 'adherence',
          title: adherence < 80 ? 'Aderência ao Protocolo Baixa' : 'Aderência Saudável',
          description: adherence < 80
            ? `Sua aderência está em ${adherence}%, abaixo do ideal de 80%.`
            : `Sua aderência está excelente em ${adherence}%. Parabéns!`,
          metric: 'Aderência',
          value: `${adherence}%`,
          expectedRange: '≥ 80%',
          recommendation: adherence < 80
            ? 'Tente marcar todas as tarefas do protocolo diário. Use lembretes para os horários importantes.'
            : 'Continue com a consistência de tarefas para sustentar seus resultados!',
        },
        {
          id: '2',
          level: sleepHrs < 7 ? 'warning' : 'success',
          category: 'wearable',
          title: sleepHrs < 7 ? 'Duração do Sono Insuficiente' : 'Sono Reparador',
          description: `Você registrou ${sleepHrs} horas de sono na noite passada.`,
          metric: 'Sono',
          value: `${sleepHrs}h`,
          expectedRange: '7-9 horas',
          recommendation: sleepHrs < 7
            ? 'Mantenha uma rotina consistente de sono. Evite telas 1 hora antes de dormir.'
            : 'Sua janela de sono está adequada para regeneração metabólica.',
        },
      ],
    };
  }
}
