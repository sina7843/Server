import type { PermissionKey } from './permission-keys';

export type BaseRoleKey = 'super_admin' | 'admin' | 'content_manager' | 'support' | 'user';

export interface RegisteredPermission {
  readonly key: PermissionKey;
  readonly module: string;
  readonly resource: string;
  readonly action: string;
  readonly description?: string;
}

export interface RegisteredRole {
  readonly key: BaseRoleKey;
  readonly name: string;
  readonly description: string;
  readonly isSystem: boolean;
  readonly isAssignable: boolean;
  readonly isActive: boolean;
}

export type RolePermissionRegistry = Record<BaseRoleKey, readonly PermissionKey[]>;
