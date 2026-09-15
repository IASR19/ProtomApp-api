import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExamEntity } from '../entities/exam.entity';
import { ExamEvolutionEntity } from '../entities/exam-evolution.entity';
import { OpenAiVisionService } from '../../../common/openai/openai-vision.service';

const EXAM_EXTRACTION_PROMPT = `Você é um assistente de análise de documentos médicos. A imagem enviada é a foto ou o print de um exame laboratorial ou receituário.
Extraia as informações do documento e responda ESTRITAMENTE com um objeto JSON válido (sem markdown, sem \`\`\`), no formato:
{
  "name": "Nome do exame (ex: Hemograma Completo, Perfil Lipídico)",
  "date": "Data do exame no formato dd/mm/yyyy (se não encontrar, use a data de hoje)",
  "type": "pdf ou img, conforme o documento pareça ser um PDF impresso ou uma foto"
}
Se não conseguir identificar um exame de verdade na imagem, responda exatamente: {"error": "not_recognized"}`;

@Injectable()
export class ExamsService {
  private readonly logger = new Logger(ExamsService.name);

  constructor(
    @InjectRepository(ExamEntity)
    private readonly examsRepository: Repository<ExamEntity>,
    @InjectRepository(ExamEvolutionEntity)
    private readonly evolutionRepository: Repository<ExamEvolutionEntity>,
    private readonly openAiVisionService: OpenAiVisionService,
  ) {}

  async listExams(userId: string): Promise<ExamEntity[]> {
    return this.examsRepository.find({
      where: { userId },
      order: { date: 'DESC' },
    });
  }

  async createExam(userId: string, name: string, date: string, type: string): Promise<ExamEntity> {
    const exam = this.examsRepository.create({
      userId,
      name,
      date,
      type,
      status: 'Analisado',
    });
    return this.examsRepository.save(exam);
  }

  async createExamFromUpload(
    userId: string,
    file: Express.Multer.File,
  ): Promise<ExamEntity> {
    const today = new Date();
    const todayBr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

    let exam = this.examsRepository.create({
      userId,
      name: 'Exame em análise',
      date: todayBr,
      type: file.mimetype === 'application/pdf' ? 'pdf' : 'img',
      status: 'Processando',
    });
    exam = await this.examsRepository.save(exam);

    if (!this.openAiVisionService.isEnabled()) {
      exam.status = 'Falha na Análise';
      return this.examsRepository.save(exam);
    }

    const result = await this.openAiVisionService.analyzeImage(
      EXAM_EXTRACTION_PROMPT,
      file.buffer.toString('base64'),
      file.mimetype,
    );

    if (!result || result.error || !result.name || !result.date) {
      this.logger.warn(`Não foi possível extrair dados do exame enviado por userId=${userId}`);
      exam.status = 'Falha na Análise';
      return this.examsRepository.save(exam);
    }

    exam.name = String(result.name).slice(0, 150);
    exam.date = String(result.date).slice(0, 50);
    exam.type = result.type === 'pdf' ? 'pdf' : 'img';
    exam.status = 'Analisado';
    return this.examsRepository.save(exam);
  }

  async updateExam(
    userId: string,
    examId: string,
    updates: { name?: string; date?: string; type?: string },
  ): Promise<ExamEntity> {
    const exam = await this.examsRepository.findOne({ where: { id: examId, userId } });
    if (!exam) {
      throw new NotFoundException('Exame não encontrado.');
    }
    if (updates.name !== undefined) exam.name = updates.name;
    if (updates.date !== undefined) exam.date = updates.date;
    if (updates.type !== undefined) exam.type = updates.type;
    exam.status = 'Analisado';
    return this.examsRepository.save(exam);
  }

  async getEvolution(userId: string): Promise<ExamEvolutionEntity[]> {
    return this.evolutionRepository.find({
      where: { userId },
      order: { name: 'ASC' },
    });
  }
}
