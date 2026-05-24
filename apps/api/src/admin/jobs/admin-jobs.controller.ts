import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import type { JobLogDto, JobLogListResponseDto, RetryJobResponseDto } from '@dragon/types';
import { AccessTokenGuard } from '../../auth/guards/access-token.guard';
import { RequirePermission } from '../../rbac/decorators/require-permission.decorator';
import { PermissionGuard } from '../../rbac/guards/permission.guard';
import { Permissions } from '../../rbac/registry/permission-keys';
import { AdminJobsService } from './admin-jobs.service';
import { parseAdminJobsQuery } from './dto/admin-jobs-query';

@Controller('admin/v1/system/jobs')
@UseGuards(AccessTokenGuard, PermissionGuard)
export class AdminJobsController {
  constructor(private readonly service: AdminJobsService) {}

  @Get()
  @RequirePermission(Permissions.SYSTEM_JOB_READ)
  listJobs(@Query() query: unknown): Promise<JobLogListResponseDto> {
    return this.service.listJobs(parseAdminJobsQuery(query));
  }

  @Get(':id')
  @RequirePermission(Permissions.SYSTEM_JOB_READ)
  getJob(@Param('id') id: string): Promise<JobLogDto> {
    return this.service.getJob(id);
  }

  @Post(':id/retry')
  @RequirePermission(Permissions.SYSTEM_JOB_RETRY)
  retryJob(@Param('id') id: string): Promise<RetryJobResponseDto> {
    return this.service.retryJob(id);
  }
}
