import { Controller, Get, UseGuards } from '@nestjs/common';
import { AccessTokenGuard } from '../../auth/guards/access-token.guard';
import { RequirePermission } from '../../rbac/decorators/require-permission.decorator';
import { PermissionGuard } from '../../rbac/guards/permission.guard';
import { Permissions } from '../../rbac/registry/permission-keys';

interface SystemHealthDto {
  status: 'ok' | 'degraded' | 'unavailable';
  service: 'api';
  version?: string;
  checkedAt: string;
}

@Controller('admin/v1/system')
@UseGuards(AccessTokenGuard, PermissionGuard)
export class AdminSystemController {
  @Get('health')
  @RequirePermission(Permissions.SYSTEM_HEALTH_READ)
  getHealth(): SystemHealthDto {
    return {
      status: 'ok',
      service: 'api',
      checkedAt: new Date().toISOString(),
    };
  }
}
