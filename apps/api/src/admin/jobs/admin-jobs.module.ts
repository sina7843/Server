import { Module } from '@nestjs/common';
import { JobsModule } from '../../jobs/jobs.module';
import { RbacModule } from '../../rbac/rbac.module';
import { AdminJobsController } from './admin-jobs.controller';
import { AdminJobsService } from './admin-jobs.service';

@Module({
  imports: [JobsModule, RbacModule],
  controllers: [AdminJobsController],
  providers: [AdminJobsService],
})
export class AdminJobsModule {}
