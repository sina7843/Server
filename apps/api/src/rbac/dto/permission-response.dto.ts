import type { PermissionDocument } from '../permissions/permission.schema';

export interface PermissionResponse {
  readonly id: string;
  readonly key: string;
  readonly module: string;
  readonly resource: string;
  readonly action: string;
  readonly description?: string;
  readonly isSystem: boolean;
  readonly createdAt?: string;
  readonly updatedAt?: string;
}

export interface PermissionsResponse {
  readonly permissions: readonly PermissionResponse[];
}

export function toPermissionResponse(permission: PermissionDocument): PermissionResponse {
  return {
    id: String(permission._id),
    key: permission.key,
    module: permission.module,
    resource: permission.resource,
    action: permission.action,
    ...(permission.description ? { description: permission.description } : {}),
    isSystem: permission.isSystem,
    ...(permission.createdAt ? { createdAt: permission.createdAt.toISOString() } : {}),
    ...(permission.updatedAt ? { updatedAt: permission.updatedAt.toISOString() } : {}),
  };
}
