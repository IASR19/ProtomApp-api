import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

// Modelo multimodal (texto + imagem) usado só para OCR de exame e análise de foto de
// refeição — a conta Groq em uso não tem nenhum modelo de visão disponível hoje.
export const OPENAI_VISION_MODEL = 'gpt-4o-mini';

@Injectable()
export class OpenAiVisionService {
  private readonly logger = new Logger(OpenAiVisionService.name);
  private client: OpenAI | null = null;

  constructor(private readonly configService: ConfigService) {}

  isEnabled(): boolean {
    return !!this.configService.get<string>('OPENAI_API_KEY');
  }

  private getClient(): OpenAI {
    if (!this.client) {
      const apiKey = this.configService.get<string>('OPENAI_API_KEY');
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY não configurada.');
      }
      this.client = new OpenAI({ apiKey });
    }
    return this.client;
  }

  /**
   * Envia uma imagem ou PDF (base64) + instrução ao modelo, esperando JSON puro de volta.
   * PDF passa pela Responses API (input_file, lê o documento de verdade); imagem usa a
   * Chat Completions API (image_url). Retorna null em caso de falha de chamada ou parse —
   * quem chama decide o fallback.
   */
  async analyzeImage(
    prompt: string,
    fileBase64: string,
    mimeType: string,
    model: string = OPENAI_VISION_MODEL,
  ): Promise<any | null> {
    if (!this.isEnabled()) return null;
    return mimeType === 'application/pdf'
      ? this.analyzePdf(prompt, fileBase64, model)
      : this.analyzeImageFile(prompt, fileBase64, mimeType, model);
  }

  private async analyzeImageFile(
    prompt: string,
    imageBase64: string,
    mimeType: string,
    model: string,
  ): Promise<any | null> {
    try {
      const completion = await this.getClient().chat.completions.create({
        model,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: { url: `data:${mimeType};base64,${imageBase64}` },
              },
            ] as any,
          },
        ],
      });
      const text = completion.choices[0]?.message?.content ?? '';
      return this.parseJson(text);
    } catch (error) {
      this.logger.warn(`Falha na chamada OpenAI (imagem): ${(error as Error).message}`);
      return null;
    }
  }

  private async analyzePdf(prompt: string, pdfBase64: string, model: string): Promise<any | null> {
    try {
      const response = await this.getClient().responses.create({
        model,
        input: [
          {
            role: 'user',
            content: [
              { type: 'input_text', text: prompt },
              {
                type: 'input_file',
                filename: 'documento.pdf',
                file_data: `data:application/pdf;base64,${pdfBase64}`,
              },
            ] as any,
          },
        ],
      });
      return this.parseJson(response.output_text ?? '');
    } catch (error) {
      this.logger.warn(`Falha na chamada OpenAI (PDF): ${(error as Error).message}`);
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
      this.logger.warn(`Resposta da OpenAI não é JSON válido: ${(error as Error).message}`);
      return null;
    }
  }
}
