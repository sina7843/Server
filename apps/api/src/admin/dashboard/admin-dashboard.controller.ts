import { Controller, Get, UseGuards } from '@nestjs/common';
import { AccessTokenGuard } from '../../auth/guards/access-token.guard';
import { RequirePermission } from '../../rbac/decorators/require-permission.decorator';
import { PermissionGuard } from '../../rbac/guards/permission.guard';
import { Permissions } from '../../rbac/registry/permission-keys';
import { AdminDashboardService, type DashboardSummaryDto } from './admin-dashboard.service';

@Controller('admin/v1/dashboard')
@UseGuards(AccessTokenGuard, PermissionGuard)
export class AdminDashboardController {
  constructor(private readonly dashboardService: AdminDashboardService) {}

  @Get('summary')
  @RequirePermission(Permissions.ADMIN_DASHBOARD_VIEW)
  getSummary(): Promise<DashboardSummaryDto> {
    return this.dashboardService.getSummary();
  }
}
