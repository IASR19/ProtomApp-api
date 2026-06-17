import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsEnum, IsBoolean, Min, Max } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Itamar Ribeiro' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 26 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(120)
  age?: number;

  @ApiPropertyOptional({ example: 'Masculino' })
  @IsString()
  @IsOptional()
  sex?: string;

  @ApiPropertyOptional({ example: 1.90 })
  @IsNumber()
  @IsOptional()
  @Min(0.5)
  @Max(3.0)
  height?: number;

  @ApiPropertyOptional({ example: 133 })
  @IsNumber()
  @IsOptional()
  @Min(20)
  @Max(500)
  weight?: number;

  @ApiPropertyOptional({ example: 110 })
  @IsNumber()
  @IsOptional()
  @Min(20)
  @Max(500)
  goalWeight?: number;

  @ApiPropertyOptional({ example: 'Emagrecimento', enum: ['Emagrecimento', 'Hipertrofia', 'Performance'] })
  @IsEnum(['Emagrecimento', 'Hipertrofia', 'Performance'])
  @IsOptional()
  objective?: 'Emagrecimento' | 'Hipertrofia' | 'Performance';

  @ApiPropertyOptional({ example: '3x por semana' })
  @IsString()
  @IsOptional()
  trainingFrequency?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  disclaimerAccepted?: boolean;
}
