import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PartnersService } from '../services/partners.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('partners')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('partners')
export class PartnersController {
  constructor(private readonly partnersService: PartnersService) {}

  @ApiOperation({ summary: 'Lista parceiros e descontos divididos por abas' })
  @Get()
  async listPartners() {
    return this.partnersService.listPartners();
  }
}
