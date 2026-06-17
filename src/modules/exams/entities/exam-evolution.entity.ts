import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/entities/base.entity';
import { UserEntity } from '../../users/entities/user.entity';

@Entity('exam_evolutions')
export class ExamEvolutionEntity extends BaseEntity {
  @ApiProperty()
  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @ApiProperty()
  @Column({ type: 'varchar', length: 100 })
  name: string; // Glicemia de Jejum, Colesterol Total, Triglicerídeos

  @ApiProperty()
  @Column({ type: 'varchar', length: 20 })
  unit: string; // mg/dL, %

  @ApiProperty()
  @Column({ type: 'decimal', precision: 6, scale: 2 })
  current: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 6, scale: 2 })
  previous: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 50 })
  monthCurrent: string; // Maio

  @ApiProperty()
  @Column({ type: 'varchar', length: 50 })
  monthPrevious: string; // Abril

  @ApiProperty()
  @Column({ type: 'varchar', length: 50, default: 'normal' })
  status: string; // normal, alerta, critico
}
