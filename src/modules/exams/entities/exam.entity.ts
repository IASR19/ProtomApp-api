import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/entities/base.entity';
import { UserEntity } from '../../users/entities/user.entity';

@Entity('exams')
export class ExamEntity extends BaseEntity {
  @ApiProperty()
  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @ApiProperty()
  @Column({ type: 'varchar', length: 150 })
  name: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 50 })
  date: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 50, default: 'Analisado' })
  status: string; // Analisado, Pendente

  @ApiProperty()
  @Column({ type: 'varchar', length: 20, default: 'pdf' })
  type: string; // pdf, img
}
