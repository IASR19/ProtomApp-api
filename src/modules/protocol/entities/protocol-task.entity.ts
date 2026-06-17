import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ProtocolEntity } from './protocol.entity';

@Entity('protocol_tasks')
export class ProtocolTaskEntity extends BaseEntity {
  @ApiProperty()
  @Column({ type: 'uuid' })
  protocolId: string;

  @ManyToOne(() => ProtocolEntity, (protocol) => protocol.tasks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'protocolId' })
  protocol: ProtocolEntity;

  @ApiProperty()
  @Column({ type: 'varchar', length: 10 })
  time: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 150 })
  title: string;

  @ApiProperty()
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 50 })
  tag: string; // NUTRIÇÃO, MEDICAÇÃO, PERFORMANCE, BIOHACKING

  @ApiProperty()
  @Column({ type: 'boolean', default: false })
  done: boolean;
}
