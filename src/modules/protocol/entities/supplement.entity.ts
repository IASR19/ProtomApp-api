import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ProtocolEntity } from './protocol.entity';

@Entity('supplements')
export class SupplementEntity extends BaseEntity {
  @ApiProperty()
  @Column({ type: 'uuid' })
  protocolId: string;

  @ManyToOne(() => ProtocolEntity, (protocol) => protocol.supplements, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'protocolId' })
  protocol: ProtocolEntity;

  @ApiProperty()
  @Column({ type: 'varchar', length: 150 })
  name: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 50 })
  dose: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 10 })
  time: string;

  @ApiProperty()
  @Column({ type: 'text', nullable: true })
  purpose: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 50, default: 'leaf-outline' })
  icon: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 50 })
  phase: string; // MANHÃ, TARDE, NOITE
}
