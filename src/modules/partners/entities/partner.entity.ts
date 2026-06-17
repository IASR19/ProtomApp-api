import { Entity, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('partners')
export class PartnerEntity extends BaseEntity {
  @ApiProperty()
  @Column({ type: 'varchar', length: 150 })
  name: string; // Whey Protein Isolado, etc.

  @ApiProperty()
  @Column({ type: 'varchar', length: 100 })
  brand: string; // Growth Supplements, etc.

  @ApiProperty()
  @Column({ type: 'varchar', length: 20 })
  discount: string; // - 15%, etc.

  @ApiProperty()
  @Column({ type: 'varchar', length: 50 })
  category: string; // supplements, pharmacies, exams

  @ApiProperty()
  @Column({ type: 'varchar', length: 50, default: 'nutrition' })
  icon: string; // nutrition, fitness, flash, medkit, pulse, etc.
}
