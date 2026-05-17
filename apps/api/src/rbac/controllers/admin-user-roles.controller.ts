import {
  Body,
  Controller,
  Delete,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AccessTokenGuard } from '../../auth/guards/access-token.guard';
import type { AuthContext } from '../../auth/guards/authenticated-request';
import { CurrentAuthContext } from '../../auth/guards/current-auth-context.decorator';
import { UserRepository } from '../../auth/users/user.repository';
import { RequirePermission } from '../decorators/require-permission.decorator';
import { AssignUserRoleDto } from '../dto/assign-user-role.dto';
import { RbacGenericResponse, createRbacGenericResponse } from '../dto/rbac-response.dto';
import { toUserRoleResponse, UserRoleResponse } from '../dto/user-role-response.dto';
import { PermissionGuard } from '../guards/permission.guard';
import { Permissions } from '../registry/permission-keys';
import { RoleService } from '../roles/role.service';
import { UserRoleService } from '../user-roles/user-role.service';

@Controller('admin/v1/users/:id/roles')
@UseGuards(AccessTokenGuard, PermissionGuard)
export class AdminUserRolesController {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly roleService: RoleService,
    private readonly userRoleService: UserRoleService,
  ) {}

  @Post()
  @RequirePermission(Permissions.RBAC_ROLE_ASSIGN)
  async assignUserRole(
    @Param('id') userId: string,
    @Body() body: AssignUserRoleDto,
    @CurrentAuthContext() authContext: AuthContext,
  ): Promise<UserRoleResponse> {
    const user = await this.userRepository.findById(userId);
    const role = await this.roleService.findById(body.roleId);

    if (!user || user.status === 'deleted' || !role || !role.isActive || !role.isAssignable) {
      throw new NotFoundException('User or role not found.');
    }

    const userRole = await this.userRoleService.assignRole({
      userId,
      roleId: body.roleId,
      ...(body.scopeType !== undefined ? { scopeType: body.scopeType } : {}),
      ...(body.scopeId !== undefined ? { scopeId: body.scopeId } : {}),
      ...(authContext.userId ? { assignedBy: authContext.userId } : {}),
      assignedAt: new Date(),
      ...(body.expiresAt ? { expiresAt: new Date(body.expiresAt) } : {}),
    });

    return toUserRoleResponse(userRole);
  }

  @Delete(':userRoleId')
  @RequirePermission(Permissions.RBAC_ROLE_ASSIGN)
  async removeUserRole(
    @Param('id') userId: string,
    @Param('userRoleId') userRoleId: string,
  ): Promise<RbacGenericResponse> {
    await this.userRoleService.removeUserRoleForUser(userId, userRoleId);

    return createRbacGenericResponse('User role removed.');
  }
}
