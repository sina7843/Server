import { Injectable } from '@nestjs/common';
import { normalizePhoneNumber } from '../../auth/security/phone-normalizer';
import { UserRepository } from '../../auth/users/user.repository';
import { PermissionRepository } from '../permissions/permission.repository';
import { RolePermissionRepository } from '../role-permissions/role-permission.repository';
import { RoleRepository } from '../roles/role.repository';
import { UserRoleRepository } from '../user-roles/user-role.repository';
import { PermissionRegistry } from '../registry/permission-registry';
import { RolePermissionRegistryMap } from '../registry/role-permission-registry';
import { RoleRegistry } from '../registry/role-registry';
import type { BaseRoleKey } from '../registry/registry.types';
import type { RbacSeedOptions, RbacSeedResult } from './rbac-seed.types';

const SUPER_ADMIN_ROLE_KEY: BaseRoleKey = 'super_admin';

@Injectable()
export class RbacSeedService {
  constructor(
    private readonly permissionRepository: PermissionRepository,
    private readonly roleRepository: RoleRepository,
    private readonly rolePermissionRepository: RolePermissionRepository,
    private readonly userRoleRepository: UserRoleRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async runRbacSeed(options: RbacSeedOptions = {}): Promise<RbacSeedResult> {
    const skipped: string[] = [];
    let permissionsCreated = 0;
    let permissionsUpdated = 0;
    let rolesCreated = 0;
    let rolesUpdated = 0;
    let rolePermissionsAttached = 0;
    let superAdminAssignmentCreated = 0;

    const permissionIdsByKey = new Map<string, string>();
    const roleIdsByKey = new Map<BaseRoleKey, string>();

    for (const permission of PermissionRegistry) {
      const result =
        await this.permissionRepository.upsertSystemPermissionForSeed(
          permission,
        );

      if (result.created) {
        permissionsCreated += 1;
      } else if (result.updated) {
        permissionsUpdated += 1;
      }

      permissionIdsByKey.set(permission.key, String(result.document._id));
    }

    for (const role of RoleRegistry) {
      const result = await this.roleRepository.upsertRoleForSeed(role);

      if (result.created) {
        rolesCreated += 1;
      } else if (result.updated) {
        rolesUpdated += 1;
      }

      roleIdsByKey.set(role.key, String(result.document._id));
    }

    for (const [roleKey, permissionKeys] of Object.entries(
      RolePermissionRegistryMap,
    ) as [BaseRoleKey, readonly string[]][]) {
      const roleId = roleIdsByKey.get(roleKey);

      if (!roleId) {
        skipped.push(`missing-role:${roleKey}`);
        continue;
      }

      for (const permissionKey of permissionKeys) {
        const permissionId = permissionIdsByKey.get(permissionKey);

        if (!permissionId) {
          skipped.push(`missing-permission:${permissionKey}`);
          continue;
        }

        const result =
          await this.rolePermissionRepository.attachPermissionForSeed({
            roleId,
            permissionId,
          });

        if (result.created) {
          rolePermissionsAttached += 1;
        }
      }
    }

    const bootstrapPhone =
      options.bootstrapSuperAdminPhone ??
      process.env.RBAC_BOOTSTRAP_SUPER_ADMIN_PHONE;

    if (bootstrapPhone?.trim()) {
      const assignmentCreated = await this.assignBootstrapSuperAdmin({
        phone: bootstrapPhone,
        roleIdsByKey,
        skipped,
        ...(options.assignedAt !== undefined
          ? { assignedAt: options.assignedAt }
          : {}),
      });

      if (assignmentCreated) {
        superAdminAssignmentCreated = 1;
      }
    } else {
      skipped.push('super-admin-bootstrap:not-configured');
    }

    return {
      permissionsCreated,
      permissionsUpdated,
      rolesCreated,
      rolesUpdated,
      rolePermissionsAttached,
      superAdminAssignmentCreated,
      skipped,
    };
  }

  private async assignBootstrapSuperAdmin(input: {
    readonly phone: string;
    readonly roleIdsByKey: ReadonlyMap<BaseRoleKey, string>;
    readonly assignedAt?: Date;
    readonly skipped: string[];
  }): Promise<boolean> {
    const normalizedPhone = normalizePhoneNumber(input.phone);
    const user =
      await this.userRepository.findActiveByPhoneNormalized(normalizedPhone);

    if (!user) {
      input.skipped.push('super-admin-bootstrap:user-not-found-or-not-active');
      return false;
    }

    const roleId = input.roleIdsByKey.get(SUPER_ADMIN_ROLE_KEY);

    if (!roleId) {
      input.skipped.push('super-admin-bootstrap:role-missing');
      return false;
    }

    const result = await this.userRoleRepository.assignRoleForSeed({
      userId: String(user._id),
      roleId,
      ...(input.assignedAt !== undefined
        ? { assignedAt: input.assignedAt }
        : {}),
    });

    return result.created;
  }
}
