import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import type { AuthContext } from '../auth/guards/authenticated-request';
import { CurrentAuthContext } from '../auth/guards/current-auth-context.decorator';
import { RequirePermission } from '../rbac/decorators/require-permission.decorator';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { PermissionResolverService } from '../rbac/resolution/permission-resolver.service';
import { Permissions } from '../rbac/registry/permission-keys';
import { createAdminMeResponse, type AdminMeResponseDto } from './admin-auth.dto';

@Controller('admin/v1/auth')
@UseGuards(AccessTokenGuard, PermissionGuard)
export class AdminAuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly permissionResolverService: PermissionResolverService,
  ) {}

  @Get('me')
  @RequirePermission(Permissions.ADMIN_DASHBOARD_VIEW)
  async me(@CurrentAuthContext() authContext: AuthContext): Promise<AdminMeResponseDto> {
    const [meResponse, resolution] = await Promise.all([
      this.authService.getCurrentAuthIdentity(authContext),
      this.permissionResolverService.resolveUserPermissions({ userId: authContext.userId }),
    ]);

    return createAdminMeResponse({
      user: meResponse.user,
      permissions: resolution.permissionKeys,
      isSuperAdmin: resolution.isSuperAdmin,
    });
  }
}
