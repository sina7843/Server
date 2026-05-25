import { Controller, Get, UseGuards } from '@nestjs/common';
import { AccessTokenGuard } from '../../auth/guards/access-token.guard';
import { RequirePermission } from '../../rbac/decorators/require-permission.decorator';
import { PermissionGuard } from '../../rbac/guards/permission.guard';
import { Permissions } from '../../rbac/registry/permission-keys';
import { HealthService } from '../../health/health.service';
import type { AdminSystemHealthResponse } from '@dragon/types';

@Controller('admin/v1/system')
@UseGuards(AccessTokenGuard, PermissionGuard)
export class AdminSystemController {
  constructor(private readonly healthService: HealthService) {}

  @Get('health')
  @RequirePermission(Permissions.SYSTEM_HEALTH_READ)
  async getHealth(): Promise<AdminSystemHealthResponse> {
    const deps = await this.healthService.getDependencies();
    const overall = this.healthService.overallStatus(deps);
    const status: AdminSystemHealthResponse['status'] =
      overall === 'down' ? 'unavailable' : overall === 'degraded' ? 'degraded' : 'ok';
    return {
      status,
      service: 'api',
      checkedAt: new Date().toISOString(),
    };
  }
}
