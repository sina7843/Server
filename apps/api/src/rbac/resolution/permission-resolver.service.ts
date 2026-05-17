import { Injectable } from '@nestjs/common';
import { PermissionService } from '../permissions/permission.service';
import { PermissionKeys } from '../registry/permission-keys';
import { RolePermissionService } from '../role-permissions/role-permission.service';
import { RoleService } from '../roles/role.service';
import { UserRoleService } from '../user-roles/user-role.service';
import type {
  PermissionResolution,
  ResolvePermissionsInput,
} from './permission-resolution.types';

@Injectable()
export class PermissionResolverService {
  constructor(
    private readonly userRoleService: UserRoleService,
    private readonly roleService: RoleService,
    private readonly rolePermissionService: RolePermissionService,
    private readonly permissionService: PermissionService,
  ) {}

  async resolveUserPermissions(
    input: ResolvePermissionsInput,
  ): Promise<PermissionResolution> {
    const userRoles = await this.userRoleService.findActiveByUserId(
      input.userId,
      input.now ?? new Date(),
    );

    if (userRoles.length === 0) {
      return {
        permissionKeys: [],
        roleKeys: [],
        isSuperAdmin: false,
      };
    }

    const roles = await Promise.all(
      userRoles.map((userRole) =>
        this.roleService.findById(String(userRole.roleId)),
      ),
    );
    const activeRoles = roles.filter(
      (role): role is NonNullable<typeof role> => Boolean(role?.isActive),
    );
    const roleKeys = [...new Set(activeRoles.map((role) => role.key))];
    const isSuperAdmin = roleKeys.includes('super_admin');

    if (isSuperAdmin) {
      return {
        permissionKeys: PermissionKeys,
        roleKeys,
        isSuperAdmin: true,
      };
    }

    const activeRoleIds = activeRoles.map((role) => String(role._id));
    const permissionIds =
      await this.rolePermissionService.findPermissionIdsByRoleIds(activeRoleIds);
    const permissions = await Promise.all(
      [...new Set(permissionIds)].map((permissionId) =>
        this.permissionService.findById(permissionId),
      ),
    );
    const permissionKeys = [
      ...new Set(
        permissions
          .filter((permission): permission is NonNullable<typeof permission> =>
            Boolean(permission),
          )
          .map((permission) => permission.key),
      ),
    ];

    return {
      permissionKeys,
      roleKeys,
      isSuperAdmin: false,
    };
  }
}
