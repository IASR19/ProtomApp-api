import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/entities/base.entity';
import { UserEntity } from '../../users/entities/user.entity';

@Entity('daily_checkins')
@Unique(['userId', 'date'])
export class DailyCheckinEntity extends BaseEntity {
  @ApiProperty()
  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @ApiProperty({ description: 'Data do check-in (YYYY-MM-DD)' })
  @Column({ type: 'date' })
  date: string;

  @ApiProperty({ description: 'Horas dormidas, autorreportado' })
  @Column({ type: 'decimal', precision: 3, scale: 1 })
  sleepHours: number;

  @ApiProperty({ description: 'Qualidade do sono, 1 (péssima) a 5 (ótima)' })
  @Column({ type: 'int' })
  sleepQuality: number;

  @ApiProperty({ description: 'Fadiga percebida, 1 (nenhuma) a 5 (extrema)' })
  @Column({ type: 'int' })
  fatigue: number;

  @ApiProperty({ description: 'Dor muscular, 1 (nenhuma) a 5 (extrema)' })
  @Column({ type: 'int' })
  soreness: number;

  @ApiProperty({ description: 'Estresse percebido, 1 (nenhum) a 5 (extremo)' })
  @Column({ type: 'int' })
  stress: number;

  @ApiProperty({ description: 'Humor/disposição, 1 (péssimo) a 5 (ótimo)' })
  @Column({ type: 'int' })
  mood: number;

  @ApiProperty({ description: 'Score de sono calculado (0-100)' })
  @Column({ type: 'int' })
  sleepScore: number;

  @ApiProperty({
    description:
      'Score de recuperação calculado (0-100), estilo Hooper-Mackinnon',
  })
  @Column({ type: 'int' })
  recoveryScore: number;
}
