import { Controller, Get } from '@nestjs/common';
import type { EsportsHomeDto } from '@dragon/types';
import { EsportsService } from './esports.service';

@Controller('api/v1/esports')
export class EsportsController {
  constructor(private readonly esportsService: EsportsService) {}

  @Get('home')
  getHome(): Promise<EsportsHomeDto> {
    return this.esportsService.getHome();
  }
}
