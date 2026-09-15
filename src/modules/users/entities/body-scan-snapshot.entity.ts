import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/entities/base.entity';
import { UserEntity } from './user.entity';

@Entity('body_scan_snapshots')
export class BodyScanSnapshotEntity extends BaseEntity {
  @ApiProperty()
  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 5, scale: 2 })
  bodyFat: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 5, scale: 2 })
  visceralFat: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 6, scale: 2 })
  weight: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 6, scale: 2 })
  waist: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 6, scale: 2 })
  leanMass: number;

  @ApiProperty()
  @Column({ type: 'timestamp' })
  capturedAt: Date;
}
