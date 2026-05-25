import { Module } from '@nestjs/common';
import { JobsModule } from '../jobs/jobs.module';
import { HealthService } from './health.service';
import { HealthEndpointsController } from './health.controller';

@Module({
  imports: [JobsModule],
  controllers: [HealthEndpointsController],
  providers: [HealthService],
  exports: [HealthService],
})
export class HealthModule {}
