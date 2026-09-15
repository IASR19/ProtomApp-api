import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/entities/base.entity';
import { UserEntity } from './user.entity';

@Entity('medical_team_members')
export class MedicalTeamMemberEntity extends BaseEntity {
  @ApiProperty()
  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @ApiProperty()
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 100 })
  role: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 150, nullable: true })
  contact: string | null;

  @ApiProperty()
  @Column({ type: 'varchar', length: 500, nullable: true })
  photoUrl: string | null;
}
