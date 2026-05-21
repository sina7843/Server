import { Controller, Delete, Get, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { AccessTokenGuard } from '../../auth/guards/access-token.guard';
import { RequirePermission } from '../../rbac/decorators/require-permission.decorator';
import { PermissionGuard } from '../../rbac/guards/permission.guard';
import { Permissions } from '../../rbac/registry/permission-keys';
import { parseAdminUsersQuery } from './dto/admin-user-query';
import { parseAdminUserStatusUpdate } from './dto/admin-user-status';
import { AdminUsersService } from './admin-users.service';
import type {
  AdminUsersListResponseDto,
  AdminUserDetailResponseDto,
  AdminUserSessionsResponseDto,
  AdminGenericResponseDto,
} from './dto/admin-user-response';

@Controller('admin/v1/users')
@UseGuards(AccessTokenGuard, PermissionGuard)
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  @RequirePermission(Permissions.USER_READ)
  listUsers(@Query() query: unknown): Promise<AdminUsersListResponseDto> {
    return this.adminUsersService.listUsers(parseAdminUsersQuery(query));
  }

  @Get(':id')
  @RequirePermission(Permissions.USER_READ)
  getUser(@Param('id') id: string): Promise<AdminUserDetailResponseDto> {
    return this.adminUsersService.getUser(id);
  }

  @Patch(':id/status')
  @RequirePermission(Permissions.USER_STATUS_UPDATE)
  updateUserStatus(
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<AdminUserDetailResponseDto> {
    return this.adminUsersService.updateUserStatus(id, parseAdminUserStatusUpdate(body));
  }

  @Get(':id/sessions')
  @RequirePermission(Permissions.USER_READ)
  listUserSessions(@Param('id') id: string): Promise<AdminUserSessionsResponseDto> {
    return this.adminUsersService.listUserSessions(id);
  }

  @Delete(':id/sessions/:sessionId')
  @RequirePermission(Permissions.USER_SESSION_REVOKE)
  revokeUserSession(
    @Param('id') id: string,
    @Param('sessionId') sessionId: string,
  ): Promise<AdminGenericResponseDto> {
    return this.adminUsersService.revokeUserSession(id, sessionId);
  }
}
