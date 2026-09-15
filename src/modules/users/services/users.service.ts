import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../entities/user.entity';
import { UpdateUserDto } from '../dto/update-user.dto';
import { ProtocolEntity } from '../../protocol/entities/protocol.entity';
import { WorkoutEntity } from '../../workout/entities/workout.entity';
import { MealEntity } from '../../nutrition/entities/meal.entity';
import { WellnessService } from '../../wellness/services/wellness.service';
import { ExamsService } from '../../exams/services/exams.service';
import { BodyScanSnapshotEntity } from '../entities/body-scan-snapshot.entity';
import { MedicalTeamMemberEntity } from '../entities/medical-team-member.entity';
import { UpdateNotificationPreferencesDto } from '../dto/update-notification-preferences.dto';

// ExamEntity.date é armazenado como varchar "dd/mm/yyyy" (sem validação a nível de banco).
function parseBrDate(dateStr: string): Date | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(dateStr?.trim() ?? '');
  if (!match) return null;
  const [, day, month, year] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return Number.isNaN(date.getTime()) ? null : date;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(ProtocolEntity)
    private readonly protocolsRepository: Repository<ProtocolEntity>,
    @InjectRepository(WorkoutEntity)
    private readonly workoutRepository: Repository<WorkoutEntity>,
    @InjectRepository(MealEntity)
    private readonly mealsRepository: Repository<MealEntity>,
    @InjectRepository(BodyScanSnapshotEntity)
    private readonly bodyScanRepository: Repository<BodyScanSnapshotEntity>,
    @InjectRepository(MedicalTeamMemberEntity)
    private readonly medicalTeamRepository: Repository<MedicalTeamMemberEntity>,
    private readonly wellnessService: WellnessService,
    private readonly examsService: ExamsService,
  ) {}

  async getMedicalTeam(userId: string): Promise<MedicalTeamMemberEntity[]> {
    return this.medicalTeamRepository.find({ where: { userId }, order: { name: 'ASC' } });
  }

  async updateNotificationPreferences(userId: string, dto: UpdateNotificationPreferencesDto) {
    const user = await this.findOne(userId);
    Object.assign(user, dto);
    const saved = await this.usersRepository.save(user);
    return {
      notifyPush: saved.notifyPush,
      notifyEmail: saved.notifyEmail,
      notifyProtocolReminders: saved.notifyProtocolReminders,
      notifyExamAlerts: saved.notifyExamAlerts,
    };
  }

  async getPlan(userId: string) {
    const user = await this.findOne(userId);
    return {
      plan: user.plan,
      planRenewalDate: user.planRenewalDate,
      planCancelled: user.planCancelled,
    };
  }

  async cancelPlan(userId: string) {
    const user = await this.findOne(userId);
    user.planCancelled = true;
    const saved = await this.usersRepository.save(user);
    return {
      plan: saved.plan,
      planRenewalDate: saved.planRenewalDate,
      planCancelled: saved.planCancelled,
    };
  }

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

  // Heuristic calculations based on user metrics (não há bioimpedância/scanner real integrado ainda).
  private computeCurrentBodyMetrics(user: UserEntity) {
    const weight = Number(user.weight) || 80;
    const height = Number(user.height) || 1.75;

    let bodyFat = 20;
    if (user.sex?.toLowerCase() === 'feminino') {
      bodyFat = Math.round((weight / (height * height)) * 1.1 + 5);
    } else {
      bodyFat = Math.round((weight / (height * height)) * 1.1 - 4);
    }
    bodyFat = Math.max(5, Math.min(bodyFat, 50));

    const visceralFat = Math.round(bodyFat * 0.6);
    const waist = Math.round(weight * 0.9);
    const leanMass = Math.round(weight * (1 - bodyFat / 100));

    return { bodyFat, visceralFat, weight, waist, leanMass };
  }

  private buildBodyScanResponse(
    current: ReturnType<UsersService['computeCurrentBodyMetrics']>,
    previousSnapshot: BodyScanSnapshotEntity | undefined,
    capturedAt: Date,
  ) {
    if (!previousSnapshot) {
      return { ...current, capturedAt, hasHistory: false };
    }

    const round1 = (n: number) => Math.round(n * 10) / 10;

    return {
      ...current,
      bodyFatDelta: round1(current.bodyFat - Number(previousSnapshot.bodyFat)),
      visceralFatDelta: round1(current.visceralFat - Number(previousSnapshot.visceralFat)),
      weightDelta: round1(current.weight - Number(previousSnapshot.weight)),
      waistDelta: round1(current.waist - Number(previousSnapshot.waist)),
      leanMassDelta: round1(current.leanMass - Number(previousSnapshot.leanMass)),
      capturedAt,
      hasHistory: true,
      previousCapturedAt: previousSnapshot.capturedAt,
    };
  }

  /** Leitura pura — não grava nada, só compara a métrica atual com o snapshot mais recente já existente. */
  async getBodyScan(userId: string) {
    const user = await this.findOne(userId);
    const current = this.computeCurrentBodyMetrics(user);

    const latestSnapshot = await this.bodyScanRepository.findOne({
      where: { userId },
      order: { capturedAt: 'DESC' },
    });

    return this.buildBodyScanResponse(current, latestSnapshot ?? undefined, new Date());
  }

  /** Registra (ou atualiza, se já houver um hoje) o snapshot do dia — ação explícita, não efeito colateral de GET. */
  async recordBodyScan(userId: string) {
    const user = await this.findOne(userId);
    const current = this.computeCurrentBodyMetrics(user);

    const recentSnapshots = await this.bodyScanRepository.find({
      where: { userId },
      order: { capturedAt: 'DESC' },
      take: 2,
    });

    const now = new Date();
    const isSameDay = (a: Date, b: Date) =>
      a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

    const todaysSnapshot = recentSnapshots.find((s) => isSameDay(new Date(s.capturedAt), now));
    const previousSnapshot = recentSnapshots.find((s) => s !== todaysSnapshot);

    if (todaysSnapshot) {
      Object.assign(todaysSnapshot, current, { capturedAt: now });
      await this.bodyScanRepository.save(todaysSnapshot);
    } else {
      await this.bodyScanRepository.save(
        this.bodyScanRepository.create({ userId, ...current, capturedAt: now }),
      );
    }

    return this.buildBodyScanResponse(current, previousSnapshot, now);
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

    if (protocol) {
      if (protocol.tasks && protocol.tasks.length > 0) {
        const doneTasks = protocol.tasks.filter((t) => t.done).length;
        protocolProgress = Math.round(
          (doneTasks / protocol.tasks.length) * 100,
        );
        adherence = protocolProgress;
      }
    }

    // Sono e recuperação vêm do check-in diário autorreportado pelo usuário
    // (não há integração com wearable ainda — ver docs/wearable-data-strategy.md).
    const checkin = await this.wellnessService.getTodayCheckin(userId);
    const hasCheckin = !!checkin;
    const sleepHrs = checkin ? Number(checkin.sleepHours) : 0;
    const sleepScoreFromCheckin = checkin ? checkin.sleepScore : 0;
    const recovery = checkin ? checkin.recoveryScore : 0;

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

    // 3b. Próximo exame agendado e status geral dos exames, a partir de dados reais.
    const exams = await this.examsService.listExams(userId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcomingDaysList = exams
      .map((exam) => parseBrDate(exam.date))
      .filter((date): date is Date => {
        if (!date) {
          this.logger.warn(`Data de exame em formato inválido para userId=${userId}`);
          return false;
        }
        return date.getTime() >= today.getTime();
      })
      .map((date) => Math.ceil((date.getTime() - today.getTime()) / 86400000));
    const nextExamDays = upcomingDaysList.length ? Math.min(...upcomingDaysList) : null;

    const evolutions = await this.examsService.getEvolution(userId);
    const examsStatus = evolutions.length
      ? Math.round(
          evolutions.reduce((sum, e) => {
            const score = e.status === 'normal' ? 100 : e.status === 'alerta' ? 60 : 20;
            return sum + score;
          }, 0) / evolutions.length,
        )
      : null;

    // 4. Calculate weight delta (current - initial) and % of the real goal reached
    const currentWeight = Number(user.weight) || 80;
    const initialWeight = Number(user.initialWeight) || currentWeight;
    const goalWeight = Number(user.goalWeight) || initialWeight;
    const weightProgress = Number((currentWeight - initialWeight).toFixed(1));
    const weightGoalRange = initialWeight - goalWeight;
    const weightProgressPercent =
      weightGoalRange !== 0
        ? Math.min(
            100,
            Math.max(
              0,
              Math.round(
                ((initialWeight - currentWeight) / weightGoalRange) * 100,
              ),
            ),
          )
        : 0;

    // 5. Calculate Metabolic Score dynamically.
    // Sem check-in de hoje, não inventamos sono/recuperação: redistribuímos o
    // peso desses dois componentes (50%) para aderência e exames, em vez de
    // usar um valor padrão fixo como se fosse medição real.
    const metabolicScore = hasCheckin
      ? Math.round(
          adherence * 0.4 +
            recovery * 0.3 +
            sleepScoreFromCheckin * 0.2 +
            90 * 0.1,
        )
      : Math.round(adherence * 0.8 + 90 * 0.2);

    const alerts: any[] = [
      {
        id: '1',
        level: adherence < 80 ? 'warning' : 'success',
        category: 'adherence',
        title:
          adherence < 80
            ? 'Aderência ao Protocolo Baixa'
            : 'Aderência Saudável',
        description:
          adherence < 80
            ? `Sua aderência está em ${adherence}%, abaixo do ideal de 80%.`
            : `Sua aderência está excelente em ${adherence}%. Parabéns!`,
        metric: 'Aderência',
        value: `${adherence}%`,
        expectedRange: '≥ 80%',
        recommendation:
          adherence < 80
            ? 'Tente marcar todas as tarefas do protocolo diário. Use lembretes para os horários importantes.'
            : 'Continue com a consistência de tarefas para sustentar seus resultados!',
      },
    ];

    if (hasCheckin) {
      alerts.push({
        id: '2',
        level: sleepHrs < 7 ? 'warning' : 'success',
        category: 'wellness',
        title: sleepHrs < 7 ? 'Duração do Sono Insuficiente' : 'Sono Reparador',
        description: `Segundo seu check-in de hoje, você dormiu ${sleepHrs}h.`,
        metric: 'Sono',
        value: `${sleepHrs}h`,
        expectedRange: '7-9 horas',
        recommendation:
          sleepHrs < 7
            ? 'Mantenha uma rotina consistente de sono. Evite telas 1 hora antes de dormir.'
            : 'Sua janela de sono está adequada para regeneração metabólica.',
      });
    } else {
      alerts.push({
        id: '2',
        level: 'info',
        category: 'wellness',
        title: 'Faça seu check-in de hoje',
        description:
          'Sono e recuperação ainda não foram registrados hoje — isso deixa seu Score Metabólico incompleto.',
        metric: 'Check-in',
        value: 'Pendente',
        expectedRange: '1x por dia',
        recommendation:
          'Leva menos de 1 minuto: informe horas de sono e como você está se sentindo hoje.',
      });
    }

    return {
      metabolicScore,
      protocolProgress,
      trainingStatus,
      nutritionKcal,
      nutritionGoal,
      nextExamDays,
      weightProgress,
      criticalAlerts: adherence < 60 ? 1 : 0,
      metabolicScoreDetails: {
        protocolAdherence: adherence,
        wellness: hasCheckin
          ? {
              hasCheckin: true,
              sleepHours: sleepHrs,
              sleepScore: sleepScoreFromCheckin,
              recoveryScore: recovery,
            }
          : {
              hasCheckin: false,
              sleepHours: 0,
              sleepScore: 0,
              recoveryScore: 0,
            },
        weightProgress: weightProgressPercent,
        examsStatus,
      },
      alerts,
    };
  }
}
