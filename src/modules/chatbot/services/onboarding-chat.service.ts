import { Injectable, Logger } from '@nestjs/common';
import { GroqService } from '../../../common/groq/groq.service';

interface OnboardingChatHistoryEntry {
  role: 'user' | 'bot';
  text: string;
}

export interface OnboardingChatRequest {
  message: string;
  collectedFields: Record<string, unknown>;
  history: OnboardingChatHistoryEntry[];
}

export interface OnboardingChatResponse {
  reply: string;
  updatedFields: Record<string, unknown>;
  isComplete: boolean;
  usedFallback: boolean;
}

const REQUIRED_FIELDS_PROMPT = `Você é o ProtomBot, um assistente simpático e objetivo em PT-BR que conduz uma conversa curta de onboarding para coletar os seguintes dados do usuário, um de cada vez, sem repetir perguntas já respondidas:
- objective: "emagrecimento" ou "hipertrofia"
- age: número entre 13 e 120
- sex: "masculino" ou "feminino"
- height: número em centímetros entre 100 e 250
- weight: número em quilos entre 30 e 300
- goalWeight: meta de peso em quilos entre 30 e 300
- trainingFrequency: número entre 0 e 7 (vezes por semana)
- mealsCount: número entre 1 e 8
- mealsSchedule: lista de horários (ex: ["08:00","12:00","19:00"])
- usesSupplements: boolean (só pergunte se objective for "hipertrofia")

Campos já coletados até agora (JSON): {{collectedFields}}

Histórico da conversa até agora:
{{history}}

Mensagem mais recente do usuário: "{{message}}"

Responda ESTRITAMENTE com um objeto JSON válido (sem markdown, sem \`\`\`), no formato:
{
  "reply": "sua próxima mensagem para o usuário, curta e amigável",
  "updatedFields": { /* apenas os campos novos ou corrigidos por esta mensagem */ },
  "isComplete": false /* true somente quando TODOS os campos obrigatórios (incluindo usesSupplements quando aplicável) já foram coletados */
}`;

@Injectable()
export class OnboardingChatService {
  private readonly logger = new Logger(OnboardingChatService.name);

  constructor(private readonly groqService: GroqService) {}

  async handleMessage(dto: OnboardingChatRequest): Promise<OnboardingChatResponse> {
    if (!this.groqService.isEnabled()) {
      return this.fallback();
    }

    const prompt = REQUIRED_FIELDS_PROMPT.replace(
      '{{collectedFields}}',
      JSON.stringify(dto.collectedFields || {}),
    )
      .replace(
        '{{history}}',
        (dto.history || []).map((h) => `${h.role === 'user' ? 'Usuário' : 'Bot'}: ${h.text}`).join('\n'),
      )
      .replace('{{message}}', dto.message || '');

    const result = await this.groqService.generateJson(prompt);

    if (!result || typeof result.reply !== 'string' || typeof result.isComplete !== 'boolean') {
      this.logger.warn('Resposta do Groq inválida para onboarding-chat, usando fallback.');
      return this.fallback();
    }

    return {
      reply: result.reply,
      updatedFields: result.updatedFields || {},
      isComplete: result.isComplete,
      usedFallback: false,
    };
  }

  private fallback(): OnboardingChatResponse {
    return {
      reply: 'Vamos continuar com algumas perguntas rápidas.',
      updatedFields: {},
      isComplete: false,
      usedFallback: true,
    };
  }
}
