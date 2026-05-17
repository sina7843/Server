import type { UserRoleDocument } from '../user-roles/user-role.schema';

export interface UserRoleResponse {
  readonly id: string;
  readonly userId: string;
  readonly roleId: string;
  readonly scopeType?: string;
  readonly scopeId?: string;
  readonly assignedBy?: string;
  readonly assignedAt: string;
  readonly expiresAt?: string;
  readonly createdAt?: string;
  readonly updatedAt?: string;
}

export function toUserRoleResponse(userRole: UserRoleDocument): UserRoleResponse {
  return {
    id: String(userRole._id),
    userId: String(userRole.userId),
    roleId: String(userRole.roleId),
    ...(userRole.scopeType ? { scopeType: userRole.scopeType } : {}),
    ...(userRole.scopeId ? { scopeId: userRole.scopeId } : {}),
    ...(userRole.assignedBy ? { assignedBy: String(userRole.assignedBy) } : {}),
    assignedAt: userRole.assignedAt.toISOString(),
    ...(userRole.expiresAt ? { expiresAt: userRole.expiresAt.toISOString() } : {}),
    ...(userRole.createdAt ? { createdAt: userRole.createdAt.toISOString() } : {}),
    ...(userRole.updatedAt ? { updatedAt: userRole.updatedAt.toISOString() } : {}),
  };
}
