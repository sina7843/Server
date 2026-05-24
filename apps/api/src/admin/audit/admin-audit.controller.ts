import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import type { AuditLogDetailDto, AuditLogListResponseDto } from '@dragon/types';
import { AccessTokenGuard } from '../../auth/guards/access-token.guard';
import { RequirePermission } from '../../rbac/decorators/require-permission.decorator';
import { PermissionGuard } from '../../rbac/guards/permission.guard';
import { Permissions } from '../../rbac/registry/permission-keys';
import { AdminAuditService } from './admin-audit.service';
import { parseAdminAuditQuery } from './dto/admin-audit-query';

@Controller('admin/v1/audit-logs')
@UseGuards(AccessTokenGuard, PermissionGuard)
export class AdminAuditController {
  constructor(private readonly service: AdminAuditService) {}

  @Get()
  @RequirePermission(Permissions.AUDIT_LOG_READ)
  listAuditLogs(@Query() query: unknown): Promise<AuditLogListResponseDto> {
    return this.service.listAuditLogs(parseAdminAuditQuery(query));
  }

  @Get(':id')
  @RequirePermission(Permissions.AUDIT_LOG_READ)
  getAuditLog(@Param('id') id: string): Promise<AuditLogDetailDto> {
    return this.service.getAuditLog(id);
  }
}
