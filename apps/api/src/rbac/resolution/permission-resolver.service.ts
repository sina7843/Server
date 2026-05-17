import { Injectable } from '@nestjs/common';
import { RolePermissionService } from '../role-permissions/role-permission.service';
import { RoleService } from '../roles/role.service';
import { UserRoleService } from '../user-roles/user-role.service';
import type { PermissionResolution, ResolvePermissionsInput } from './permission-resolution.types';

@Injectable()
export class PermissionResolverService {
  constructor(
    private readonly userRoleService: UserRoleService,
    private readonly roleService: RoleService,
    private readonly rolePermissionService: RolePermissionService,
  ) {}

  async resolveUserPermissions(input: ResolvePermissionsInput): Promise<PermissionResolution> {
    const userRoles = await this.userRoleService.findActiveByUserId(
      input.userId,
      input.now ?? new Date(),
    );

    const roleIds = userRoles.map((userRole) => String(userRole.roleId));
    const roles = await Promise.all(roleIds.map((roleId) => this.roleService.findById(roleId)));

    const activeRoles = roles.filter((role): role is NonNullable<typeof role> =>
      Boolean(role?.isActive),
    );
    const activeRoleIds = activeRoles.map((role) => String(role._id));
    const permissionIds =
      await this.rolePermissionService.findPermissionIdsByRoleIds(activeRoleIds);

    return {
      permissionKeys: permissionIds,
      roleKeys: activeRoles.map((role) => role.key),
    };
  }
}
