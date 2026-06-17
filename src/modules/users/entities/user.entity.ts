import { Entity, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/entities/base.entity';

export type UserObjective = 'Emagrecimento' | 'Hipertrofia' | 'Performance';

@Entity('users')
export class UserEntity extends BaseEntity {
  @ApiProperty()
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 200, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255, select: false })
  passwordHash: string;

  @ApiProperty()
  @Column({ type: 'int', nullable: true })
  age: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 20, nullable: true })
  sex: string;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  height: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
  weight: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
  initialWeight: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
  goalWeight: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 30, nullable: true })
  objective: UserObjective;

  @ApiProperty()
  @Column({ type: 'varchar', length: 30, nullable: true })
  trainingFrequency: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 20, default: 'Premium' })
  plan: string;

  @ApiProperty()
  @Column({ type: 'boolean', default: false })
  disclaimerAccepted: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true, select: false })
  refreshTokenHash: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true, unique: true })
  googleId: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true, unique: true })
  appleId: string | null;

  @ApiProperty()
  @Column({ type: 'boolean', default: false })
  isEmailVerified: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  emailVerificationToken: string | null;
}
