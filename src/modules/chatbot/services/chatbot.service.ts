import { Injectable, OnModuleInit } from '@nestjs/common';
import * as natural from 'natural';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';
import { ProtocolEntity } from '../../protocol/entities/protocol.entity';
import { WorkoutEntity } from '../../workout/entities/workout.entity';
import { MealEntity } from '../../nutrition/entities/meal.entity';

@Injectable()
export class ChatbotService implements OnModuleInit {
  private classifier = new natural.BayesClassifier();

  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(ProtocolEntity)
    private readonly protocolsRepository: Repository<ProtocolEntity>,
    @InjectRepository(WorkoutEntity)
    private readonly workoutsRepository: Repository<WorkoutEntity>,
    @InjectRepository(MealEntity)
    private readonly mealsRepository: Repository<MealEntity>,
  ) {}

  onModuleInit() {
    // 1. Train classifier with training documents for intents
    
    // Workout intents
    this.classifier.addDocument('meu treino de hoje', 'workout');
    this.classifier.addDocument('qual exercicio devo fazer', 'workout');
    this.classifier.addDocument('passa minha rotina de academia', 'workout');
    this.classifier.addDocument('treino de perna peito superiores academia', 'workout');
    this.classifier.addDocument('gasto calorico atividade fisica cardio esteira', 'workout');
    
    // Nutrition intents
    this.classifier.addDocument('qual minha dieta cardapio alimentacao comer', 'nutrition');
    this.classifier.addDocument('quantas calorias kcal carboidratos proteinas gorduras', 'nutrition');
    this.classifier.addDocument('refeicao almoco janta cafe da manha de hoje', 'nutrition');
    this.classifier.addDocument('tempo de jejum quebra de jejum intermitente', 'nutrition');
    
    // Medication and Supplement intents
    this.classifier.addDocument('monjaro tirzepatida aplicacao dose agulha', 'medication');
    this.classifier.addDocument('quais remedios medicamentos tomar horario', 'medication');
    this.classifier.addDocument('suplementos creatina magnesio inositol melatonina capsula', 'medication');
    this.classifier.addDocument('para que serve o suplemento ou remedio', 'medication');
    
    // Protocol / Compliance intents
    this.classifier.addDocument('tarefas diarias checklist marcar feito concluir', 'protocol');
    this.classifier.addDocument('aderencia score pontuacao evolucao do protocolo', 'protocol');
    this.classifier.addDocument('higiene do sono rotina noturna biohacking', 'protocol');
    this.classifier.addDocument('o que falta fazer hoje', 'protocol');
    
    // Greetings / General chatbot info
    this.classifier.addDocument('ola oi bom dia boa tarde boa noite bot chat protom', 'greetings');
    this.classifier.addDocument('ajuda o que voce faz quem e voce assistente', 'greetings');

    this.classifier.train();
  }

  async chat(userId: string, message: string): Promise<string> {
    const intent = this.classifier.classify(message.toLowerCase());

    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      return 'Usuário não encontrado.';
    }

    const protocol = await this.protocolsRepository.findOne({
      where: { userId, isActive: true },
      relations: { tasks: true, medications: true, supplements: true },
    });

    const workout = await this.workoutsRepository.findOne({
      where: { userId },
      relations: { exercises: true },
    });

    const meal = await this.mealsRepository.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    switch (intent) {
      case 'workout':
        if (!workout) {
          return `Para o seu objetivo de ${user.objective || 'Saúde'}, o seu plano de treino padrão inclui musculação e cardio moderado. Vá em 'Treino' no menu inferior para ver o detalhamento completo.`;
        }
        const exercisesList = workout.exercises.map(e => `${e.name} (${e.sets}x${e.reps})`).join(', ');
        return `Seu treino ativo é: **${workout.title}** (${workout.duration} min, aprox. ${workout.calories} kcal). Exercícios de hoje: ${exercisesList}. ${workout.cardio || ''}`;

      case 'nutrition':
        let nutText = `Seu objetivo nutricional é focado em **${user.objective || 'Recomposição'}**. `;
        if (meal) {
          nutText += `Sua última refeição registrada foi o **${meal.meal}** (${meal.totalKcal} kcal, meta de ${meal.goalKcal} kcal). Macros: Proteínas ${meal.proteinGrams}g, Carboidratos ${meal.carbGrams}g, Gorduras ${meal.fatGrams}g.`;
        } else {
          nutText += `A meta calórica diária é de 2200 kcal. Mantenha um bom consumo de proteínas e beba bastante água (${protocol?.hydration || '3.5L'} recomendado).`;
        }
        return nutText;

      case 'medication':
        if (!protocol) {
          return 'Não encontrei nenhum protocolo médico ativo para listar medicamentos ou suplementos.';
        }
        const meds = protocol.medications.map(m => `**${m.name}** (${m.dose} - às ${m.time})`).join(', ');
        const supps = protocol.supplements.map(s => `${s.name} (${s.dose})`).join(', ');
        
        let medResponse = '';
        if (meds.length > 0) {
          medResponse += `Medicações ativas: ${meds}. `;
        }
        if (supps.length > 0) {
          medResponse += `Suplementação ativa: ${supps}.`;
        }
        if (medResponse === '') {
          medResponse = 'Seu protocolo ativo não possui medicações ou suplementos prescritos no momento.';
        }
        return medResponse;

      case 'protocol':
        if (!protocol) {
          return 'Você ainda não possui um protocolo ativo configurado. Conclua o Onboarding para gerar o seu!';
        }
        const pending = protocol.tasks.filter(t => !t.done);
        if (pending.length === 0) {
          return `Parabéns! Você concluiu 100% das tarefas do seu protocolo hoje. Sua aderência acumulada está em **${protocol.adherence}%**!`;
        }
        const listPending = pending.map(t => `- [${t.time}] ${t.title}`).join('\n');
        return `Sua aderência atual é de **${protocol.adherence}%**. Aqui estão as tarefas pendentes para hoje:\n${listPending}\n\nConclua-as para melhorar seus resultados!`;

      case 'greetings':
      default:
        return `Olá, **${user.name}**! Sou o **ProtomBot**, seu assistente de saúde integrado. \n\nPosso te ajudar informando os detalhes do seu **treino**, **plano nutricional**, **medicamentos/suplementos** ou listar as tarefas pendentes do seu **protocolo** de hoje. O que você gostaria de ver?`;
    }
  }
}
