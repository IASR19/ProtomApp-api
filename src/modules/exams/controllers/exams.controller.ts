import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiProperty, ApiConsumes } from '@nestjs/swagger';
import type { Request } from 'express';
import { ExamsService } from '../services/exams.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

class CreateExamDto {
  @ApiProperty({ example: 'Hemograma Completo' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '15/05/2026' })
  @IsString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({ example: 'pdf' })
  @IsString()
  @IsNotEmpty()
  type: string;
}

class UpdateExamDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  date?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  type?: string;
}

const MAX_EXAM_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_EXAM_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

@ApiTags('exams')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('exams')
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @ApiOperation({ summary: 'Lista exames do usuário logado' })
  @Get()
  async listExams(@Req() req: Request) {
    const user = req.user as any;
    return this.examsService.listExams(user.id);
  }

  @ApiOperation({ summary: 'Evolução dos marcadores do usuário logado' })
  @Get('evolution')
  async getEvolution(@Req() req: Request) {
    const user = req.user as any;
    return this.examsService.getEvolution(user.id);
  }

  @ApiOperation({ summary: 'Enviar novo registro de exame' })
  @Post()
  async createExam(@Req() req: Request, @Body() dto: CreateExamDto) {
    const user = req.user as any;
    return this.examsService.createExam(user.id, dto.name, dto.date, dto.type);
  }

  @ApiOperation({ summary: 'Enviar foto/PDF de exame para extração automática (IA)' })
  @ApiConsumes('multipart/form-data')
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_EXAM_UPLOAD_BYTES },
      fileFilter: (_req, file, callback) => {
        callback(null, ALLOWED_EXAM_MIME_TYPES.includes(file.mimetype));
      },
    }),
  )
  async uploadExam(@Req() req: Request, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException(
        'Nenhum arquivo válido enviado. Envie uma imagem (JPEG/PNG/WEBP) ou um PDF.',
      );
    }
    const user = req.user as any;
    return this.examsService.createExamFromUpload(user.id, file);
  }

  @ApiOperation({ summary: 'Corrigir manualmente um exame (ex: após falha na análise automática)' })
  @Patch(':id')
  async updateExam(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateExamDto,
  ) {
    const user = req.user as any;
    return this.examsService.updateExam(user.id, id, dto);
  }
}
