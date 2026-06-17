import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/entities/base.entity';
import { UserEntity } from '../../users/entities/user.entity';

@Entity('meals')
export class MealEntity extends BaseEntity {
  @ApiProperty()
  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @ApiProperty()
  @Column({ type: 'varchar', length: 150 })
  meal: string; // e.g. "Almoço Estratégico"

  @ApiProperty()
  @Column({ type: 'int' })
  totalKcal: number;

  @ApiProperty()
  @Column({ type: 'int' })
  goalKcal: number;

  // We can represent macros as embedded or direct columns:
  @ApiProperty()
  @Column({ type: 'int' })
  proteinGrams: number;

  @ApiProperty()
  @Column({ type: 'int' })
  proteinPercent: number;

  @ApiProperty()
  @Column({ type: 'int' })
  carbGrams: number;

  @ApiProperty()
  @Column({ type: 'int' })
  carbPercent: number;

  @ApiProperty()
  @Column({ type: 'int' })
  fatGrams: number;

  @ApiProperty()
  @Column({ type: 'int' })
  fatPercent: number;

  @ApiProperty({ required: false })
  @Column({ type: 'text', nullable: true })
  description?: string;
}
