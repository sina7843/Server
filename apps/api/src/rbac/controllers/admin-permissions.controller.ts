import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AccessTokenGuard } from '../../auth/guards/access-token.guard';
import { RequirePermission } from '../decorators/require-permission.decorator';
import { PermissionsResponse, toPermissionResponse } from '../dto/permission-response.dto';
import { PermissionGuard } from '../guards/permission.guard';
import { PermissionService } from '../permissions/permission.service';
import { Permissions } from '../registry/permission-keys';

@Controller('admin/v1/permissions')
@UseGuards(AccessTokenGuard, PermissionGuard)
export class AdminPermissionsController {
  constructor(private readonly permissionService: PermissionService) {}

  @Get()
  @RequirePermission(Permissions.RBAC_PERMISSION_READ)
  async listPermissions(
    @Query('module') module?: string,
    @Query('resource') resource?: string,
  ): Promise<PermissionsResponse> {
    const permissions = await this.permissionService.listFiltered({
      ...(module ? { module } : {}),
      ...(resource ? { resource } : {}),
    });

    return { permissions: permissions.map(toPermissionResponse) };
  }
}
