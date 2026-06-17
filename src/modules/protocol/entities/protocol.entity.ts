import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/entities/base.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { ProtocolTaskEntity } from './protocol-task.entity';
import { MedicationEntity } from './medication.entity';
import { SupplementEntity } from './supplement.entity';

@Entity('protocols')
export class ProtocolEntity extends BaseEntity {
  @ApiProperty()
  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @ApiProperty()
  @Column({ type: 'int', default: 100 })
  adherence: number;

  @ApiProperty()
  @Column({ type: 'int', default: 80 })
  recovery: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 20, default: '7h' })
  sleep: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 20, default: '2L' })
  hydration: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 20, default: '12h' })
  fastingHours: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 20, default: '1.0' })
  version: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 100, default: 'Dr. James' })
  doctor: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 50, default: 'CRM-SP 123456' })
  crm: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 200, default: 'Geral' })
  objective: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 50, default: '15/07/2026' })
  nextReview: string;

  @ApiProperty({ type: () => [ProtocolTaskEntity] })
  @OneToMany(() => ProtocolTaskEntity, (task) => task.protocol, { cascade: true })
  tasks: ProtocolTaskEntity[];

  @ApiProperty({ type: () => [MedicationEntity] })
  @OneToMany(() => MedicationEntity, (med) => med.protocol, { cascade: true })
  medications: MedicationEntity[];

  @ApiProperty({ type: () => [SupplementEntity] })
  @OneToMany(() => SupplementEntity, (supp) => supp.protocol, { cascade: true })
  supplements: SupplementEntity[];

  @ApiProperty()
  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}
