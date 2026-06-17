import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/entities/base.entity';
import { UserEntity } from '../../users/entities/user.entity';

@Entity('prescriptions')
export class PrescriptionEntity extends BaseEntity {
  @ApiProperty()
  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @ApiProperty()
  @Column({ type: 'varchar', length: 200 })
  title: string; // Receita: Tirzepatida, Pedido de Exames, etc.

  @ApiProperty()
  @Column({ type: 'varchar', length: 150 })
  sentBy: string; // Médico Responsável, etc.

  @ApiProperty()
  @Column({ type: 'varchar', length: 50 })
  date: string; // 15/05/2026, etc.

  @ApiProperty()
  @Column({ type: 'varchar', length: 150 })
  status: string; // Assinado digitalmente (ICP-Brasil), etc.

  @ApiProperty()
  @Column({ type: 'varchar', length: 50, default: 'signed' })
  statusType: string; // signed, verified

  @ApiProperty()
  @Column({ type: 'varchar', length: 50, default: 'document-text' })
  icon: string; // document-text, flask, reader
}
