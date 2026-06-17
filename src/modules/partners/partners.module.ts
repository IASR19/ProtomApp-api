import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PartnersController } from './controllers/partners.controller';
import { PartnersService } from './services/partners.service';
import { PartnerEntity } from './entities/partner.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PartnerEntity])],
  controllers: [PartnersController],
  providers: [PartnersService],
  exports: [TypeOrmModule, PartnersService],
})
export class PartnersModule {}
