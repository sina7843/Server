import { Injectable, Optional } from '@nestjs/common';
import { AuditAction } from '@dragon/types';
import { AuditService } from '../../audit/audit.service';
import { UserRoleRepository } from './user-role.repository';
import type { UserRoleDocument } from './user-role.schema';
import type {
  AssignRoleInput,
  FindUserRoleInput,
  UserRoleId,
  UserRoleScopeInput,
} from './user-role.types';

@Injectable()
export class UserRoleService {
  constructor(
    private readonly userRoleRepository: UserRoleRepository,
    @Optional() private readonly auditService?: AuditService,
  ) {}

  async assignRole(input: AssignRoleInput): Promise<UserRoleDocument> {
    const existing = await this.userRoleRepository.findByUserRoleAndScope({
      userId: input.userId,
      roleId: input.roleId,
      ...(input.scopeType !== undefined ? { scopeType: input.scopeType } : {}),
      ...(input.scopeId !== undefined ? { scopeId: input.scopeId } : {}),
    });

    if (existing) {
      return existing;
    }

    const assigned = await this.userRoleRepository.assignRole(input);

    void this.auditService?.log({
      actorType: 'admin',
      action: AuditAction.RBAC_ROLE_ASSIGNED,
      resourceType: 'user_role',
      resourceId: String(assigned._id),
      after: { userId: input.userId, roleId: input.roleId },
      severity: 'info',
    });

    return assigned;
  }

  async removeUserRole(userRoleId: UserRoleId): Promise<UserRoleDocument | null> {
    const removed = await this.userRoleRepository.removeUserRole(userRoleId);

    if (removed) {
      void this.auditService?.log({
        actorType: 'admin',
        action: AuditAction.RBAC_ROLE_REMOVED,
        resourceType: 'user_role',
        resourceId: String(removed._id),
        before: { userId: String(removed.userId), roleId: String(removed.roleId) },
        severity: 'warning',
      });
    }

    return removed;
  }

  async removeUserRoleForUser(
    userId: string,
    userRoleId: UserRoleId,
  ): Promise<UserRoleDocument | null> {
    const removed = await this.userRoleRepository.removeUserRoleForUser(userId, userRoleId);

    if (removed) {
      void this.auditService?.log({
        actorType: 'admin',
        action: AuditAction.RBAC_ROLE_REMOVED,
        resourceType: 'user_role',
        resourceId: String(removed._id),
        before: { userId, roleId: String(removed.roleId) },
        severity: 'warning',
      });
    }

    return removed;
  }

  findByUserId(userId: string): Promise<UserRoleDocument[]> {
    return this.userRoleRepository.findByUserId(userId);
  }

  findActiveByUserId(userId: string, now = new Date()): Promise<UserRoleDocument[]> {
    return this.userRoleRepository.findActiveByUserId(userId, now);
  }

  findByUserAndScope(userId: string, scope?: UserRoleScopeInput): Promise<UserRoleDocument[]> {
    return this.userRoleRepository.findByUserAndScope(userId, scope);
  }

  findByUserRoleAndScope(input: FindUserRoleInput): Promise<UserRoleDocument | null> {
    return this.userRoleRepository.findByUserRoleAndScope(input);
  }

  assignRoleForSeed(input: AssignRoleInput) {
    return this.userRoleRepository.assignRoleForSeed(input);
  }
}
