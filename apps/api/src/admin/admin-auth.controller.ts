import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import type { AuthContext } from '../auth/guards/authenticated-request';
import { CurrentAuthContext } from '../auth/guards/current-auth-context.decorator';
import { RequirePermission } from '../rbac/decorators/require-permission.decorator';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { Permissions } from '../rbac/registry/permission-keys';
import type { AdminMeResponseDto } from './admin-auth.dto';

@Controller('admin/v1/auth')
@UseGuards(AccessTokenGuard, PermissionGuard)
export class AdminAuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  @RequirePermission(Permissions.ADMIN_DASHBOARD_VIEW)
  me(@CurrentAuthContext() authContext: AuthContext): Promise<AdminMeResponseDto> {
    return this.authService.getCurrentAuthIdentity(authContext);
  }
}
