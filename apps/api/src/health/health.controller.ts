import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import type { HealthLiveDto, HealthReadyDto, HealthDependenciesDto } from '@dragon/types';
import { HealthService } from './health.service';

@Controller('health')
export class HealthEndpointsController {
  constructor(private readonly healthService: HealthService) {}

  @Get('live')
  getLive(): HealthLiveDto {
    return {
      status: 'ok',
      service: 'api',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  async getReady(): Promise<HealthReadyDto> {
    const deps = await this.healthService.getReadiness();
    const status = this.healthService.overallStatus(deps);
    const body: HealthReadyDto = {
      status,
      service: 'api',
      timestamp: new Date().toISOString(),
      dependencies: deps,
    };
    if (status !== 'ok') {
      throw new HttpException(body, HttpStatus.SERVICE_UNAVAILABLE);
    }
    return body;
  }

  @Get('dependencies')
  async getDependencies(): Promise<HealthDependenciesDto> {
    const deps = await this.healthService.getDependencies();
    const status = this.healthService.overallStatus(deps);
    return {
      status,
      service: 'api',
      timestamp: new Date().toISOString(),
      dependencies: deps,
    };
  }
}
