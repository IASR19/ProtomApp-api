import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';

// Modelo de texto do Groq (free tier), confirmado disponível via GET /models para a
// chave em uso. Usado para geração de protocolo e chatbot de onboarding. Análise de
// imagem (OCR de exame, foto de refeição) usa OpenAiVisionService — a conta Groq em
// uso não tem nenhum modelo de visão disponível.
export const GROQ_TEXT_MODEL = 'openai/gpt-oss-120b';

@Injectable()
export class GroqService {
  private readonly logger = new Logger(GroqService.name);
  private client: Groq | null = null;

  constructor(private readonly configService: ConfigService) {}

  isEnabled(): boolean {
    return !!this.configService.get<string>('GROQ_API_KEY');
  }

  private getClient(): Groq {
    if (!this.client) {
      const apiKey = this.configService.get<string>('GROQ_API_KEY');
      if (!apiKey) {
        throw new Error('GROQ_API_KEY não configurada.');
      }
      this.client = new Groq({ apiKey });
    }
    return this.client;
  }

  /**
   * Pede ao modelo de texto uma resposta em JSON puro (sem markdown fences).
   * Retorna null em caso de falha de chamada ou parse — quem chama decide o fallback.
   */
  async generateJson(prompt: string, model: string = GROQ_TEXT_MODEL): Promise<any | null> {
    if (!this.isEnabled()) return null;
    try {
      const completion = await this.getClient().chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        // 'hidden': modelos de raciocínio (ex: gpt-oss) não devem vazar o texto de
        // "pensamento" para dentro de `content` — só o resultado final, senão o JSON
        // vem misturado com texto e o parseJson abaixo falha.
        reasoning_format: 'hidden',
      });
      const text = completion.choices[0]?.message?.content ?? '';
      return this.parseJson(text);
    } catch (error) {
      this.logger.warn(`Falha na chamada Groq (texto): ${(error as Error).message}`);
      return null;
    }
  }

  private parseJson(text: string): any | null {
    const cleaned = text
      .trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();
    try {
      return JSON.parse(cleaned);
    } catch (error) {
      this.logger.warn(`Resposta do Groq não é JSON válido: ${(error as Error).message}`);
      return null;
    }
  }
}
