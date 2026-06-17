import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import type { Request } from 'express';
import { WorkoutService } from '../services/workout.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ExerciseDto {
  @ApiProperty({ example: 'Supino Reto' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 4 })
  @IsNumber()
  @IsNotEmpty()
  sets: number;

  @ApiProperty({ example: 12 })
  @IsNumber()
  @IsNotEmpty()
  reps: number;

  @ApiProperty({ example: 60 })
  @IsNumber()
  @IsNotEmpty()
  weight: number;
}

class CreateWorkoutDto {
  @ApiProperty({ example: 'Treino A - Superior' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Foco em hipertrofia e gasto calórico' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 55 })
  @IsNumber()
  @IsNotEmpty()
  duration: number;

  @ApiProperty({ example: 450 })
  @IsNumber()
  @IsNotEmpty()
  calories: number;

  @ApiProperty({ example: 'Cardio: 30min Esteira (Zona 2)' })
  @IsString()
  @IsOptional()
  cardio?: string;

  @ApiProperty({ type: [ExerciseDto] })
  @ValidateNested({ each: true })
  @Type(() => ExerciseDto)
  exercises: ExerciseDto[];
}

@ApiTags('workout')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('workout')
export class WorkoutController {
  constructor(private readonly workoutService: WorkoutService) {}

  @ApiOperation({ summary: 'Treino do dia do usuário logado' })
  @Get('today')
  async getTodayWorkout(@Req() req: Request) {
    const user = req.user as any;
    return this.workoutService.getTodayWorkout(user.id);
  }

  @ApiOperation({ summary: 'Registrar ou atualizar treino do dia' })
  @Post()
  async createWorkout(@Req() req: Request, @Body() dto: CreateWorkoutDto) {
    const user = req.user as any;
    return this.workoutService.createWorkout(
      user.id,
      dto.title,
      dto.description || '',
      dto.duration,
      dto.calories,
      dto.cardio || '',
      dto.exercises,
    );
  }
}
