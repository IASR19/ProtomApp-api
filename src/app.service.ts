import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserEntity } from './modules/users/entities/user.entity';
import { PartnerEntity } from './modules/partners/entities/partner.entity';
import { ExamEntity } from './modules/exams/entities/exam.entity';
import { ExamEvolutionEntity } from './modules/exams/entities/exam-evolution.entity';
import { PrescriptionEntity } from './modules/prescriptions/entities/prescription.entity';
import { WorkoutEntity } from './modules/workout/entities/workout.entity';
import { WorkoutExerciseEntity } from './modules/workout/entities/workout-exercise.entity';
import { MealEntity } from './modules/nutrition/entities/meal.entity';

@Injectable()
export class AppService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AppService.name);

  getHello(): string {
    return 'Hello World!';
  }

  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(PartnerEntity)
    private readonly partnerRepository: Repository<PartnerEntity>,
    @InjectRepository(ExamEntity)
    private readonly examsRepository: Repository<ExamEntity>,
    @InjectRepository(ExamEvolutionEntity)
    private readonly evolutionRepository: Repository<ExamEvolutionEntity>,
    @InjectRepository(PrescriptionEntity)
    private readonly prescriptionRepository: Repository<PrescriptionEntity>,
    @InjectRepository(WorkoutEntity)
    private readonly workoutRepository: Repository<WorkoutEntity>,
    @InjectRepository(MealEntity)
    private readonly mealRepository: Repository<MealEntity>,
  ) {}

  async onApplicationBootstrap() {
    try {
      this.logger.log('Iniciando processo de seeding do banco de dados...');
      await this.seedUsers();
      await this.seedPartners();
      this.logger.log('Processo de seeding concluído com sucesso.');
    } catch (error) {
      this.logger.error('Erro durante o seeding do banco de dados:', error);
    }
  }

  private async seedUsers() {
    const email = 'itamar.ribeiro@email.com';
    const existingUser = await this.usersRepository.findOne({ where: { email } });

    if (!existingUser) {
      this.logger.log(`Criando usuário padrão: ${email}`);
      const passwordHash = await bcrypt.hash('123456', 10);
      
      const user = this.usersRepository.create({
        name: 'Itamar Ribeiro',
        email,
        passwordHash,
        age: 26,
        sex: 'Masculino',
        height: 1.90,
        weight: 133,
        initialWeight: 133,
        goalWeight: 110,
        objective: 'Emagrecimento',
        trainingFrequency: '3x por semana',
        plan: 'Premium',
        disclaimerAccepted: true,
        isEmailVerified: true,
      });

      const savedUser = await this.usersRepository.save(user);

      // Seed related telemetry data
      await this.seedExams(savedUser.id);
      await this.seedPrescriptions(savedUser.id);
      await this.seedWorkout(savedUser.id);
      await this.seedMeals(savedUser.id);
    }
  }

  private async seedPartners() {
    const count = await this.partnerRepository.count();
    if (count === 0) {
      this.logger.log('Inserindo parceiros de descontos...');
      const partnersList = [
        // Supplements
        { name: 'Whey Protein Isolado', brand: 'Growth Supplements', discount: '- 15%', category: 'supplements', icon: 'nutrition' },
        { name: 'Creatina Creapure', brand: 'Max Titanium', discount: '- 20%', category: 'supplements', icon: 'fitness' },
        { name: 'Pré-Treino Évora', brand: 'Integralmédica', discount: '- 10%', category: 'supplements', icon: 'flash' },
        // Pharmacies
        { name: 'Tirzepatida Manipulada', brand: 'Farmácia Dose Certa', discount: '- 12%', category: 'pharmacies', icon: 'medkit' },
        { name: 'Magnésio Bisglicinato', brand: 'Ultrafarma', discount: '- 8%', category: 'pharmacies', icon: 'medkit' },
        // Exams
        { name: 'Hemograma + Bioquímica', brand: 'Hermes Pardini', discount: '- 25%', category: 'exams', icon: 'pulse' },
        { name: 'Perfil Hormonal Completo', brand: 'Fleury', discount: '- 18%', category: 'exams', icon: 'pulse' },
      ];

      const partners = this.partnerRepository.create(partnersList);
      await this.partnerRepository.save(partners);
    }
  }

  private async seedExams(userId: string) {
    this.logger.log(`Inserindo exames para o usuário: ${userId}`);
    const examsList = [
      { name: 'Hemograma Completo', date: '15/05/2026', type: 'pdf', status: 'Analisado', userId },
      { name: 'Perfil Lipídico', date: '15/05/2026', type: 'pdf', status: 'Analisado', userId },
      { name: 'Glicemia Jejum', date: '15/05/2026', type: 'img', status: 'Analisado', userId },
    ];
    const exams = this.examsRepository.create(examsList);
    await this.examsRepository.save(exams);

    const evolutionList = [
      { name: 'Glicemia de Jejum', unit: 'mg/dL', current: 88, previous: 92, monthCurrent: 'Maio', monthPrevious: 'Abril', status: 'normal', userId },
      { name: 'Colesterol Total', unit: 'mg/dL', current: 178, previous: 185, monthCurrent: 'Maio', monthPrevious: 'Abril', status: 'normal', userId },
      { name: 'Triglicerídeos', unit: 'mg/dL', current: 132, previous: 145, monthCurrent: 'Maio', monthPrevious: 'Abril', status: 'normal', userId },
    ];
    const evolutions = this.evolutionRepository.create(evolutionList);
    await this.evolutionRepository.save(evolutions);
  }

  private async seedPrescriptions(userId: string) {
    this.logger.log(`Inserindo receitas no cofre do usuário: ${userId}`);
    const prescriptionsList = [
      { title: 'Receita: Tirzepatida', sentBy: 'Médico Responsável', date: '15/05/2026', status: 'Assinado digitalmente (ICP-Brasil)', statusType: 'signed', icon: 'document-text', userId },
      { title: 'Pedido de Exames de Sangue', sentBy: 'Médico Responsável', date: '14/05/2026', status: 'Assinado digitalmente (ICP-Brasil)', statusType: 'signed', icon: 'flask', userId },
      { title: 'Laudo de Bioimpedância', sentBy: 'Clínica', date: '10/05/2026', status: 'Documento Verificado', statusType: 'verified', icon: 'reader', userId },
    ];
    const prescriptions = this.prescriptionRepository.create(prescriptionsList);
    await this.prescriptionRepository.save(prescriptions);
  }

  private async seedWorkout(userId: string) {
    this.logger.log(`Inserindo treino padrão para o usuário: ${userId}`);
    const workout = new WorkoutEntity();
    workout.userId = userId;
    workout.title = 'Treino A - Superior';
    workout.description = 'Foco em hipertrofia e gasto calórico';
    workout.duration = 55;
    workout.calories = 450;
    workout.cardio = 'Cardio: 30min Esteira (Zona 2)';

    const ex1 = new WorkoutExerciseEntity();
    ex1.name = 'Supino Reto';
    ex1.sets = 4;
    ex1.reps = 12;
    ex1.weight = 60;

    const ex2 = new WorkoutExerciseEntity();
    ex2.name = 'Desenvolvimento';
    ex2.sets = 3;
    ex2.reps = 12;
    ex2.weight = 30;

    const ex3 = new WorkoutExerciseEntity();
    ex3.name = 'Puxada Frontal';
    ex3.sets = 4;
    ex3.reps = 10;
    ex3.weight = 50;

    workout.exercises = [ex1, ex2, ex3];
    await this.workoutRepository.save(workout);
  }

  private async seedMeals(userId: string) {
    this.logger.log(`Inserindo refeições iniciais para o usuário: ${userId}`);
    const meal = this.mealRepository.create({
      userId,
      meal: 'Almoço Estratégico',
      totalKcal: 450,
      goalKcal: 500,
      proteinGrams: 40,
      proteinPercent: 45,
      carbGrams: 30,
      carbPercent: 35,
      fatGrams: 15,
      fatPercent: 20,
    });
    await this.mealRepository.save(meal);
  }
}
