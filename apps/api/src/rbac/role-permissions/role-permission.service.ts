import { Injectable, Optional } from '@nestjs/common';
import { AuditAction } from '@dragon/types';
import { AuditService } from '../../audit/audit.service';
import { RolePermissionRepository } from './role-permission.repository';
import type { RolePermissionDocument } from './role-permission.schema';
import type { AttachPermissionInput } from './role-permission.types';

@Injectable()
export class RolePermissionService {
  constructor(
    private readonly rolePermissionRepository: RolePermissionRepository,
    @Optional() private readonly auditService?: AuditService,
  ) {}

  async attachPermission(input: AttachPermissionInput): Promise<RolePermissionDocument> {
    const existing = await this.rolePermissionRepository.findByRolePermission(input);

    if (existing) {
      return existing;
    }

    const attached = await this.rolePermissionRepository.attachPermission(input);

    void this.auditService?.log({
      actorType: 'admin',
      action: AuditAction.RBAC_PERMISSION_ATTACHED,
      resourceType: 'role_permission',
      resourceId: String(attached._id),
      after: { roleId: input.roleId, permissionId: input.permissionId },
      severity: 'info',
    });

    return attached;
  }

  async detachPermission(input: AttachPermissionInput): Promise<RolePermissionDocument | null> {
    const detached = await this.rolePermissionRepository.detachPermission(input);

    if (detached) {
      void this.auditService?.log({
        actorType: 'admin',
        action: AuditAction.RBAC_PERMISSION_DETACHED,
        resourceType: 'role_permission',
        resourceId: String(detached._id),
        before: { roleId: input.roleId, permissionId: input.permissionId },
        severity: 'warning',
      });
    }

    return detached;
  }

  findByRoleId(roleId: string): Promise<RolePermissionDocument[]> {
    return this.rolePermissionRepository.findByRoleId(roleId);
  }

  findPermissionIdsByRoleIds(roleIds: readonly string[]): Promise<string[]> {
    return this.rolePermissionRepository.findPermissionIdsByRoleIds(roleIds);
  }

  attachPermissionForSeed(input: AttachPermissionInput) {
    return this.rolePermissionRepository.attachPermissionForSeed(input);
  }
}
