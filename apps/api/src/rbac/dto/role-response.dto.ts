import type { RoleDocument } from '../roles/role.schema';

export interface RoleResponse {
  readonly id: string;
  readonly key: string;
  readonly name: string;
  readonly description?: string;
  readonly isSystem: boolean;
  readonly isAssignable: boolean;
  readonly isActive: boolean;
  readonly createdAt?: string;
  readonly updatedAt?: string;
}

export interface RolesResponse {
  readonly roles: readonly RoleResponse[];
}

export function toRoleResponse(role: RoleDocument): RoleResponse {
  return {
    id: String(role._id),
    key: role.key,
    name: role.name,
    ...(role.description ? { description: role.description } : {}),
    isSystem: role.isSystem,
    isAssignable: role.isAssignable,
    isActive: role.isActive,
    ...(role.createdAt ? { createdAt: role.createdAt.toISOString() } : {}),
    ...(role.updatedAt ? { updatedAt: role.updatedAt.toISOString() } : {}),
  };
}
