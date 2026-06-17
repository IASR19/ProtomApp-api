import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ProtocolEntity } from './protocol.entity';

@Entity('medications')
export class MedicationEntity extends BaseEntity {
  @ApiProperty()
  @Column({ type: 'uuid' })
  protocolId: string;

  @ManyToOne(() => ProtocolEntity, (protocol) => protocol.medications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'protocolId' })
  protocol: ProtocolEntity;

  @ApiProperty()
  @Column({ type: 'varchar', length: 150 })
  name: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 50 })
  dose: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 50 })
  route: string; // e.g. Subcutânea, Oral

  @ApiProperty()
  @Column({ type: 'varchar', length: 10 })
  time: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 100 })
  frequency: string;

  @ApiProperty({ type: [String] })
  @Column({ type: 'simple-array', nullable: true })
  instructions: string[];

  @ApiProperty({ type: [String] })
  @Column({ type: 'simple-array', nullable: true })
  combinations: string[];
}
