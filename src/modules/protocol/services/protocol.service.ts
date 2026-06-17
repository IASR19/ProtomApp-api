import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GoogleGenAI } from '@google/genai';
import { IsString, IsNumber, IsBoolean, IsArray, IsOptional, IsIn, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProtocolEntity } from '../entities/protocol.entity';
import { ProtocolTaskEntity } from '../entities/protocol-task.entity';
import { MedicationEntity } from '../entities/medication.entity';
import { SupplementEntity } from '../entities/supplement.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { WorkoutEntity } from '../../workout/entities/workout.entity';
import { WorkoutExerciseEntity } from '../../workout/entities/workout-exercise.entity';
import { MealEntity } from '../../nutrition/entities/meal.entity';

export class GenerateProtocolDto {
  @ApiProperty({ example: 'emagrecimento' })
  @IsString()
  @IsNotEmpty()
  @IsIn(['emagrecimento', 'hipertrofia', 'performance'])
  objective: 'emagrecimento' | 'hipertrofia' | 'performance';

  @ApiProperty({ example: 26 })
  @IsNumber()
  age: number;

  @ApiProperty({ example: 'masculino' })
  @IsString()
  @IsNotEmpty()
  @IsIn(['masculino', 'feminino'])
  sex: 'masculino' | 'feminino';

  @ApiProperty({ example: 180 })
  @IsNumber()
  height: number;

  @ApiProperty({ example: 90 })
  @IsNumber()
  weight: number;

  @ApiProperty({ example: 3 })
  @IsNumber()
  trainingFrequency: number;

  @ApiProperty({ example: 4 })
  @IsNumber()
  mealsCount: number;

  @ApiProperty({ example: ['08:00', '12:00', '16:00', '20:00'] })
  @IsArray()
  @IsString({ each: true })
  mealsSchedule: string[];

  @ApiProperty({ required: false, example: false })
  @IsBoolean()
  @IsOptional()
  usesSupplements?: boolean;
}

@Injectable()
export class ProtocolService {
  constructor(
    @InjectRepository(ProtocolEntity)
    private readonly protocolsRepository: Repository<ProtocolEntity>,
    @InjectRepository(ProtocolTaskEntity)
    private readonly tasksRepository: Repository<ProtocolTaskEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(WorkoutEntity)
    private readonly workoutRepository: Repository<WorkoutEntity>,
    @InjectRepository(MealEntity)
    private readonly mealsRepository: Repository<MealEntity>,
  ) {}

  async getActiveProtocol(userId: string): Promise<ProtocolEntity> {
    const protocol = await this.protocolsRepository.findOne({
      where: { userId, isActive: true },
      relations: { tasks: true, medications: true, supplements: true },
    });

    if (!protocol) {
      throw new NotFoundException('Nenhum protocolo ativo encontrado.');
    }

    // Sort tasks by time for structured daily visualization
    protocol.tasks.sort((a, b) => a.time.localeCompare(b.time));

    // Fetch and attach meals to the protocol response
    const meals = await this.mealsRepository.find({
      where: { userId },
      order: { id: 'ASC' },
    });
    (protocol as any).meals = meals;

    return protocol;
  }

  async toggleTask(userId: string, taskId: string): Promise<ProtocolTaskEntity> {
    const task = await this.tasksRepository.findOne({
      where: { id: taskId },
      relations: { protocol: true },
    });

    if (!task) {
      throw new NotFoundException('Tarefa não encontrada.');
    }

    if (task.protocol.userId !== userId) {
      throw new ForbiddenException('Acesso negado.');
    }

    task.done = !task.done;
    const savedTask = await this.tasksRepository.save(task);

    // Recalculate protocol adherence percentage
    const protocol = await this.protocolsRepository.findOne({
      where: { id: task.protocolId },
      relations: { tasks: true },
    });

    if (protocol && protocol.tasks.length > 0) {
      const doneCount = protocol.tasks.filter(t => t.done).length;
      protocol.adherence = Math.round((doneCount / protocol.tasks.length) * 100);
      await this.protocolsRepository.save(protocol);
    }

    return savedTask;
  }

  async generateProtocol(userId: string, dto: GenerateProtocolDto): Promise<ProtocolEntity> {
    // 1. Deactivate current active protocols
    await this.protocolsRepository.update({ userId, isActive: true }, { isActive: false });

    // 2. Fetch user to check and set initialWeight
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    const initialWeight = user?.initialWeight || dto.weight;

    // Synchronize user biometrics/onboarding info
    await this.usersRepository.update(userId, {
      age: dto.age,
      sex: dto.sex === 'masculino' ? 'Masculino' : 'Feminino',
      height: dto.height,
      weight: dto.weight,
      initialWeight: initialWeight,
      objective: dto.objective === 'emagrecimento' ? 'Emagrecimento' : (dto.objective === 'hipertrofia' ? 'Hipertrofia' : 'Performance'),
      trainingFrequency: `${dto.trainingFrequency}x por semana`,
      disclaimerAccepted: true,
    });

    let aiData: any = null;
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        Logger.log('Iniciando geração de protocolo via Gemini 2.5 API...', 'ProtocolService');
        const ai = new GoogleGenAI({ apiKey });
        
        const prompt = `Você é um médico endocrinologista, especialista em medicina preventiva e nutricionista esportivo agindo como coach de saúde e longevidade do paciente.
Gere um protocolo clínico, dieta personalizada e rotina de treinos de alta precisão para o seguinte paciente:
- Idade: ${dto.age} anos
- Sexo biológico: ${dto.sex}
- Altura: ${dto.height} cm
- Peso Atual: ${dto.weight} kg
- Objetivo principal: ${dto.objective === 'emagrecimento' ? 'Emagrecimento + Recomposição' : (dto.objective === 'hipertrofia' ? 'Hipertrofia + Ganho de Massa' : 'Melhoria de Performance e Foco')}
- Frequência de treino: ${dto.trainingFrequency}x por semana
- Quantidade de refeições por dia: ${dto.mealsCount}
- Horários recomendados para as refeições: ${dto.mealsSchedule.join(', ')}
- Utiliza suplementos: ${dto.usesSupplements ? 'Sim' : 'Não'}

Para as refeições ("meals"), gere exatamente ${dto.mealsCount} refeições correspondendo aos horários selecionados: ${dto.mealsSchedule.join(', ')}.
Garantia de consistência: Nomeie e ordene as refeições adequadamente ao horário (ex: "Café da Manhã" se for pela manhã, "Almoço" ao meio-dia, "Lanche" à tarde, "Jantar" à noite).
Cada refeição DEVE conter obrigatoriamente o campo "description" com a lista detalhada e amigável de alimentos (ex: "3 ovos mexidos, 1 fatia de mamão com aveia, café sem açúcar").

Responda ESTRITAMENTE com um objeto JSON válido (sem qualquer formatação markdown ou blocos de código tipo \`\`\`json, retorne apenas o texto do JSON puro):
{
  "workout": {
    "title": "Título do Treino do Dia (ex: Treino A: Peito e Tríceps)",
    "description": "Foco do treino (ex: Foco em ganho de força e hipertrofia miofibrilar)",
    "duration": 50, // número de minutos de duração
    "calories": 400, // número de calorias estimadas
    "cardio": "Instruções do Cardio (ex: 20 min HIIT ao final do treino)",
    "exercises": [
      // array com exatamente 4 exercícios recomendados. 
      // IMPORTANTE: No campo "name", forneça o nome em português seguido pelo nome exato em inglês do ExerciseDB entre parênteses, por exemplo: "Supino Reto (barbell bench press)", "Agachamento Livre (barbell squat)", "Remada Curvada com Halteres (dumbbell bent over row)", "Flexão de Braço (push-up)". Escolha apenas exercícios tradicionais que possuam correspondente direto em inglês no ExerciseDB.
      { "name": "Nome do Exercício (nome em inglês no exerciseDB)", "sets": 4, "reps": 12, "weight": 20 }
    ]
  },
  "meals": [
    // Array com exatamente ${dto.mealsCount} refeições de acordo com as preferências do usuário.
    // Distribua as calorias e macronutrientes correspondendo a um total diário ideal (ex: total 1800kcal para emagrecimento ou 2800kcal para hipertrofia)
    {
      "meal": "Nome da Refeição de acordo com o horário (ex: Café da Manhã, Almoço, Lanche, Jantar)",
      "description": "Alimentos específicos sugeridos (ex: 3 ovos mexidos, aveia, banana, café sem açúcar)",
      "totalKcal": 500,
      "goalKcal": 500,
      "proteinGrams": 35,
      "proteinPercent": 30,
      "carbGrams": 50,
      "carbPercent": 40,
      "fatGrams": 15,
      "fatPercent": 30
    }
  ],
  "protocol": {
    "version": "3.0",
    "doctor": "Dr. James (IA Gemini)",
    "crm": "CRM-SP 123456",
    "objective": "Objetivo do Protocolo (ex: Emagrecimento Otimizado + Queima Metabólica)",
    "sleep": "7h30", // apenas valor curto, ex: 7h30 ou 8h (slicing limit de 20 caracteres)
    "hydration": "3.5L", // apenas valor curto, ex: 3.5L (slicing limit de 20 caracteres)
    "fastingHours": "${dto.objective === 'emagrecimento' ? '16h' : '12h'}", // apenas valor curto, ex: 16h (slicing limit de 20 caracteres)
    "tasks": [
      // Array de tarefas diárias cobrindo NUTRIÇÃO (crie uma tarefa para cada uma das refeições geradas em "meals" nos horários corretos correspondentes), MEDICAÇÃO (se houver), PERFORMANCE (como o treino do dia) e BIOHACKING (como higiene do sono/relaxamento)
      { "time": "08:00", "title": "Café da Manhã", "description": "Alimentos da refeição", "tag": "NUTRIÇÃO" }
    ],
    "medications": [
      // Medicamentos recomendados pelo endocrinologista (se emagrecimento, inclua suporte metabólico seguro; se hipertrofia, coadjuvantes de performance)
      {
        "name": "Nome do Medicamento/Fórmula",
        "dose": "Dosagem (ex: 2.5mg)",
        "route": "Via (ex: Subcutânea ou Oral)",
        "time": "08:00",
        "frequency": "Frequência (ex: Diário ou Semanal)",
        "instructions": ["Instrução 1", "Instrução 2"],
        "combinations": ["Evitar tomar junto a café", "Ingerir com bastante água"]
      }
    ],
    "supplements": [
      // Suplementos recomendados (Creatina, Whey, Multivitamínico, ZMA, etc.) com fase (MANHÃ, TARDE, NOITE)
      {
        "name": "Nome do Suplemento (ex: Creatina Creapure)",
        "dose": "Dosagem (ex: 5g)",
        "time": "10:00",
        "purpose": "Finalidade (ex: Aumento de força e ressíntese de ATP)",
        "icon": "fitness-outline", // ícone Ionicons (ex: leaf-outline, fitness-outline, moon-outline, flash-outline)
        "phase": "MANHÃ" // MANHÃ, TARDE ou NOITE
      }
    ]
  }
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });

        let text = response.text?.trim() || '';
        if (!text) {
          throw new Error('Resposta do Gemini está vazia.');
        }
        if (text.startsWith('```')) {
          text = text.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/```$/, '').trim();
        }

        aiData = JSON.parse(text);
        Logger.log('Protocolo gerado com sucesso via Gemini 2.5.', 'ProtocolService');
      } catch (err) {
        Logger.error(`Erro ao gerar protocolo via Gemini API, usando fallback estruturado: ${err.message}`, err.stack, 'ProtocolService');
        aiData = null;
      }
    }

    // Se o Gemini gerou os dados com sucesso, persistimos os dados gerados pela IA
    if (aiData && aiData.workout && aiData.meals && aiData.protocol) {
      // 3. Persist Workout
      await this.workoutRepository.delete({ userId });
      
      const workout = new WorkoutEntity();
      workout.userId = userId;
      workout.title = aiData.workout.title || 'Treino Personalizado';
      workout.description = aiData.workout.description || 'Planejamento de treino para performance e longevidade';
      workout.duration = Number(aiData.workout.duration) || 50;
      workout.calories = Number(aiData.workout.calories) || 350;
      workout.cardio = aiData.workout.cardio || 'Cardio moderado de 20 min';
      workout.exercises = (aiData.workout.exercises || []).map(ex => {
        const exercise = new WorkoutExerciseEntity();
        exercise.name = ex.name || 'Exercício';
        exercise.sets = Number(ex.sets) || 4;
        exercise.reps = Number(ex.reps) || 12;
        exercise.weight = Number(ex.weight) || 0;
        return exercise;
      });
      await this.workoutRepository.save(workout);

      // 4. Persist Meals
      await this.mealsRepository.delete({ userId });
      for (const m of aiData.meals) {
        const meal = new MealEntity();
        meal.userId = userId;
        meal.meal = m.meal || 'Refeição';
        meal.totalKcal = Number(m.totalKcal) || 400;
        meal.goalKcal = Number(m.goalKcal) || 400;
        meal.proteinGrams = Number(m.proteinGrams) || 30;
        meal.proteinPercent = Number(m.proteinPercent) || 30;
        meal.carbGrams = Number(m.carbGrams) || 40;
        meal.carbPercent = Number(m.carbPercent) || 40;
        meal.fatGrams = Number(m.fatGrams) || 12;
        meal.fatPercent = Number(m.fatPercent) || 30;
        meal.description = m.description || '';
        await this.mealsRepository.save(meal);
      }

      // 5. Persist Protocol
      const protocol = new ProtocolEntity();
      protocol.userId = userId;
      protocol.isActive = true;
      protocol.version = String(aiData.protocol.version || '3.0').substring(0, 20);
      protocol.doctor = String(aiData.protocol.doctor || 'Dr. James (IA)').substring(0, 100);
      protocol.crm = String(aiData.protocol.crm || 'CRM-SP 123456').substring(0, 50);
      protocol.adherence = 0;
      protocol.recovery = 85;
      protocol.sleep = String(aiData.protocol.sleep || '7h30').substring(0, 20);
      protocol.hydration = String(aiData.protocol.hydration || '3.5L').substring(0, 20);
      protocol.fastingHours = String(aiData.protocol.fastingHours || '14h').substring(0, 20);
      protocol.objective = String(aiData.protocol.objective || dto.objective).substring(0, 200);

      const reviewDate = new Date();
      reviewDate.setMonth(reviewDate.getMonth() + 1);
      protocol.nextReview = `${reviewDate.getDate().toString().padStart(2, '0')}/${(reviewDate.getMonth() + 1).toString().padStart(2, '0')}/${reviewDate.getFullYear()}`;

      protocol.tasks = (aiData.protocol.tasks || []).map(t => 
        this.createTask(t.time || '08:00', t.title || 'Tarefa', t.description || '', t.tag || 'NUTRIÇÃO')
      );

      protocol.medications = (aiData.protocol.medications || []).map(m => {
        const med = new MedicationEntity();
        med.name = String(m.name || 'Fórmula Manipulada').substring(0, 150);
        med.dose = String(m.dose || '1 caps').substring(0, 50);
        med.route = String(m.route || 'Oral').substring(0, 50);
        med.time = String(m.time || '08:00').substring(0, 10);
        med.frequency = String(m.frequency || 'Diário').substring(0, 100);
        med.instructions = m.instructions || [];
        med.combinations = m.combinations || [];
        return med;
      });

      protocol.supplements = (aiData.protocol.supplements || []).map(s => 
        this.createSupplement(
          String(s.name || 'Suplemento').substring(0, 150),
          String(s.dose || '5g').substring(0, 50),
          String(s.time || '10:00').substring(0, 10),
          s.purpose || '',
          String(s.icon || 'leaf-outline').substring(0, 50),
          String(s.phase || 'MANHÃ').substring(0, 50)
        )
      );

      return this.protocolsRepository.save(protocol);
    }

    // FALLBACK: Se o Gemini falhou ou não há chave API, usa a lógica determinística especialista local
    // 3. Generate Workout Routine
    await this.workoutRepository.delete({ userId });
    
    const workout = new WorkoutEntity();
    workout.userId = userId;
    
    if (dto.objective === 'emagrecimento') {
      workout.title = 'Treino Funcional + Cardio';
      workout.description = 'Foco em queima de gordura e condicionamento metabólico';
      workout.duration = 45;
      workout.calories = 380;
      workout.cardio = 'Cardio: 30 min Corrida em Ritmo Moderado (Zona 2)';
      
      const ex1 = new WorkoutExerciseEntity();
      ex1.name = 'Agachamento Livre (barbell squat)';
      ex1.sets = 4;
      ex1.reps = 15;
      ex1.weight = 0;

      const ex2 = new WorkoutExerciseEntity();
      ex2.name = 'Flexão de Braço (push up)';
      ex2.sets = 3;
      ex2.reps = 12;
      ex2.weight = 0;

      const ex3 = new WorkoutExerciseEntity();
      ex3.name = 'Remada Curvada Halteres (dumbbell bent over row)';
      ex3.sets = 4;
      ex3.reps = 12;
      ex3.weight = 10;

      const ex4 = new WorkoutExerciseEntity();
      ex4.name = 'Prancha Abdominal (plank)';
      ex4.sets = 3;
      ex4.reps = 60;
      ex4.weight = 0;

      workout.exercises = [ex1, ex2, ex3, ex4];
    } else if (dto.objective === 'hipertrofia') {
      workout.title = 'Treino A: Peitoral e Ombros';
      workout.description = 'Foco em ganho de massa magra e força progressiva';
      workout.duration = 60;
      workout.calories = 420;
      workout.cardio = 'Cardio: 15 min Caminhada em Inclinação';

      const ex1 = new WorkoutExerciseEntity();
      ex1.name = 'Supino Reto (barbell bench press)';
      ex1.sets = 4;
      ex1.reps = 10;
      ex1.weight = 50;

      const ex2 = new WorkoutExerciseEntity();
      ex2.name = 'Crucifixo com Halteres (dumbbell fly)';
      ex2.sets = 3;
      ex2.reps = 12;
      ex2.weight = 12;

      const ex3 = new WorkoutExerciseEntity();
      ex3.name = 'Desenvolvimento Militar (barbell military press)';
      ex3.sets = 4;
      ex3.reps = 10;
      ex3.weight = 24;

      const ex4 = new WorkoutExerciseEntity();
      ex4.name = 'Elevação Lateral (dumbbell lateral raise)';
      ex4.sets = 3;
      ex4.reps = 15;
      ex4.weight = 8;

      workout.exercises = [ex1, ex2, ex3, ex4];
    } else {
      workout.title = 'Treino de Performance e Core';
      workout.description = 'Foco em potência muscular e força funcional';
      workout.duration = 50;
      workout.calories = 400;
      workout.cardio = 'Cardio: 20 min HIIT Bike';

      const ex1 = new WorkoutExerciseEntity();
      ex1.name = 'Levantamento Terra (barbell deadlift)';
      ex1.sets = 4;
      ex1.reps = 6;
      ex1.weight = 80;

      const ex2 = new WorkoutExerciseEntity();
      ex2.name = 'Barra Fixa (pull up)';
      ex2.sets = 3;
      ex2.reps = 8;
      ex2.weight = 0;

      const ex3 = new WorkoutExerciseEntity();
      ex3.name = 'Kettlebell Swing (kettlebell swing)';
      ex3.sets = 4;
      ex3.reps = 15;
      ex3.weight = 16;

      const ex4 = new WorkoutExerciseEntity();
      ex4.name = 'Prancha Lateral (side plank)';
      ex4.sets = 3;
      ex4.reps = 45;
      ex4.weight = 0;

      workout.exercises = [ex1, ex2, ex3, ex4];
    }
    
    await this.workoutRepository.save(workout);

    // 4. Generate Meal Plan (MealEntity)
    await this.mealsRepository.delete({ userId });

    const totalGoalKcal = dto.objective === 'emagrecimento' ? 1800 : (dto.objective === 'hipertrofia' ? 2800 : 2300);
    const proteinPercent = dto.objective === 'emagrecimento' ? 45 : (dto.objective === 'hipertrofia' ? 35 : 30);
    const carbPercent = dto.objective === 'emagrecimento' ? 25 : (dto.objective === 'hipertrofia' ? 45 : 45);
    const fatPercent = dto.objective === 'emagrecimento' ? 30 : (dto.objective === 'hipertrofia' ? 20 : 25);

    const mealCount = dto.mealsCount || 4;
    const goalKcalPerMeal = Math.round(totalGoalKcal / mealCount);

    const mealNames = dto.objective === 'emagrecimento'
      ? [
          'Café da Manhã Low-Carb',
          'Almoço Funcional',
          'Lanche da Tarde Proteico',
          'Jantar Cetogênico',
          'Ceia Otimizadora',
          'Snack Extra'
        ]
      : [
          'Café da Manhã Anabólico',
          'Almoço de Performance',
          'Shake de Proteína Pré-Treino',
          'Jantar Hipertrófico',
          'Ceia Reconstrutora',
          'Lanche Extra'
        ];

    const fallbackDescriptions = dto.objective === 'emagrecimento'
      ? [
          '3 ovos mexidos, 1 fatia de mamão com aveia, café preto sem açúcar',
          '150g de peito de frango grelhado, 100g de arroz integral, salada de folhas à vontade com limão',
          '1 iogurte natural desnatado, 30g de whey protein, 15g de castanhas',
          '150g de filé de tilápia grelhado, 150g de brócolis cozido no vapor, 1 colher de sopa de azeite',
          'Chá de camomila e 5 amêndoas',
          '50g de queijo cottage com pepino fatiado'
        ]
      : [
          '4 ovos mexidos, 2 fatias de pão integral tostado, 1 banana com canela',
          '200g de patinho moído grelhado, 200g de arroz branco, 100g de feijão, legumes cozidos',
          '30g de whey protein, 45g de aveia em flocos, 1 banana picada, 1 colher de pasta de amendoim',
          '200g de peito de frango, 250g de batata doce assada, salada verde à vontade',
          '30g de albumina ou caseína misturada com água, 20g de chocolate 70%',
          'Sanduíche de patê de atum caseiro com pão de forma integral'
        ];
    
    const savedMeals: MealEntity[] = [];
    for (let i = 0; i < mealCount; i++) {
      const meal = new MealEntity();
      meal.userId = userId;
      meal.meal = mealNames[i] || `Refeição ${i + 1}`;
      meal.totalKcal = Math.round(goalKcalPerMeal * 0.95);
      meal.goalKcal = goalKcalPerMeal;
      
      meal.proteinGrams = Math.round((meal.totalKcal * (proteinPercent / 100)) / 4);
      meal.proteinPercent = proteinPercent;
      meal.carbGrams = Math.round((meal.totalKcal * (carbPercent / 100)) / 4);
      meal.carbPercent = carbPercent;
      meal.fatGrams = Math.round((meal.totalKcal * (fatPercent / 100)) / 9);
      meal.fatPercent = fatPercent;
      meal.description = fallbackDescriptions[i] || 'Alimentos em definição';

      const saved = await this.mealsRepository.save(meal);
      savedMeals.push(saved);
    }

    // 5. Generate Protocol
    const isEmagrecimento = dto.objective === 'emagrecimento';
    const isHipertrofia = dto.objective === 'hipertrofia';

    const protocol = new ProtocolEntity();
    protocol.userId = userId;
    protocol.isActive = true;
    protocol.version = '3.0';
    protocol.doctor = 'Dr. James (Regras Locais)';
    protocol.crm = 'CRM-SP 123456';
    protocol.adherence = 0; // Starts fresh
    protocol.recovery = 85; // Default wearable telemetry
    protocol.sleep = isEmagrecimento ? '6h45' : '7h30';
    protocol.hydration = isEmagrecimento ? '3.5L' : '4.2L';
    protocol.fastingHours = isEmagrecimento ? '16h' : '12h';
    protocol.objective = isEmagrecimento ? 'Emagrecimento + Recomposição' : 'Hipertrofia + Ganho de Massa';
    
    const reviewDate = new Date();
    reviewDate.setMonth(reviewDate.getMonth() + 1);
    protocol.nextReview = `${reviewDate.getDate().toString().padStart(2, '0')}/${(reviewDate.getMonth() + 1).toString().padStart(2, '0')}/${reviewDate.getFullYear()}`;

    const tasks: ProtocolTaskEntity[] = [];
    if (isEmagrecimento) {
      tasks.push(
        this.createTask('06:00', 'Desjejum Metabólico', 'Água com limão + Shot Termogênico (Gengibre/Pimenta)', 'NUTRIÇÃO')
      );

      if (dto.weight > 100) {
        tasks.push(
          this.createTask('08:00', 'Tirzepatida (Monjaro)', 'Aplicação de 2.5mg (Subcutânea)', 'MEDICAÇÃO')
        );
      }

      // Add meals dynamically aligned with schedule
      savedMeals.forEach((m, idx) => {
        const time = dto.mealsSchedule[idx] || (idx === 0 ? '08:00' : idx === 1 ? '12:00' : idx === 2 ? '16:00' : '20:00');
        tasks.push(
          this.createTask(time, m.meal, m.description || '', 'NUTRIÇÃO')
        );
      });

      tasks.push(
        this.createTask('18:00', 'Treino Aeróbico/Força', 'Cardio Zona 2 (30 min) + Treino de Hipertrofia Inferiores', 'PERFORMANCE'),
        this.createTask('21:30', 'Higiene do Sono', 'Magnésio Inositol + Bloqueio de Luz Azul', 'BIOHACKING')
      );
    } else {
      // Add meals dynamically aligned with schedule
      savedMeals.forEach((m, idx) => {
        const time = dto.mealsSchedule[idx] || (idx === 0 ? '08:00' : idx === 1 ? '12:00' : idx === 2 ? '16:00' : '20:00');
        tasks.push(
          this.createTask(time, m.meal, m.description || '', 'NUTRIÇÃO')
        );
      });

      tasks.push(
        this.createTask('10:00', 'Suplementação Básica', 'Creatina (5g) + Beta Alanina (3g)', 'BIOHACKING'),
        this.createTask('18:30', 'Treino de Força', 'Treino A: Superiores com foco em cargas progressivas', 'PERFORMANCE'),
        this.createTask('22:00', 'Ceia + Relaxamento', 'ZMA + Caseína + Desligamento de Telas', 'BIOHACKING')
      );
    }
    protocol.tasks = tasks;

    const medications: MedicationEntity[] = [];
    if (isEmagrecimento && dto.weight > 100) {
      const med = new MedicationEntity();
      med.name = 'Tirzepatida (Monjaro)';
      med.dose = '2.5mg';
      med.route = 'Subcutânea';
      med.time = '08:00';
      med.frequency = 'Semanal (sábados)';
      med.instructions = [
        'Aplicar em rotação: abdômen, coxa ou braço',
        'Guardar refrigerado entre 2°C e 8°C',
        'Retirar da geladeira 30min antes de aplicar',
      ];
      med.combinations = ['500ml de água antes', 'Caminhada leve 15min após'];
      medications.push(med);
    }
    protocol.medications = medications;

    const supplements: SupplementEntity[] = [];
    if (isEmagrecimento) {
      supplements.push(
        this.createSupplement('Magnésio Bisglicinato', '400mg', '21:00', 'Relaxamento muscular e qualidade do sono', 'moon-outline', 'NOITE'),
        this.createSupplement('Inositol', '2g', '21:00', 'Sensibilidade à insulina e equilíbrio do humor', 'leaf-outline', 'NOITE'),
        this.createSupplement('Termogênico (Cafeína/L-Carnitina)', '200mg', '08:00', 'Aceleração metabólica e energia', 'flash-outline', 'MANHÃ'),
      );
    } else {
      supplements.push(
        this.createSupplement('Creatina Creapure', '5g', '10:00', 'Aumento de força e hidratação celular', 'fitness-outline', 'MANHÃ'),
        this.createSupplement('ZMA', '1 caps', '22:00', 'Recuperação hormonal e sono profundo', 'moon-outline', 'NOITE'),
        this.createSupplement('Beta Alanina', '3g', '10:00', 'Resistência à fadiga muscular nos treinos', 'flash-outline', 'MANHÃ'),
        this.createSupplement('Whey Protein Isolado', '30g', '16:00', 'Sintese proteica e aporte de aminoácidos', 'nutrition-outline', 'TARDE'),
      );
    }
    protocol.supplements = supplements;

    return this.protocolsRepository.save(protocol);
  }

  private createTask(time: string, title: string, description: string, tag: string): ProtocolTaskEntity {
    const task = new ProtocolTaskEntity();
    task.time = String(time || '').substring(0, 10);
    task.title = String(title || '').substring(0, 150);
    task.description = description;
    task.tag = String(tag || '').substring(0, 50);
    task.done = false;
    return task;
  }

  private createSupplement(name: string, dose: string, time: string, purpose: string, icon: string, phase: string): SupplementEntity {
    const supp = new SupplementEntity();
    supp.name = name;
    supp.dose = dose;
    supp.time = time;
    supp.purpose = purpose;
    supp.icon = icon;
    supp.phase = phase;
    return supp;
  }
}

