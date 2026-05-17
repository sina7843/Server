export interface RoleContract {
  readonly key: string;
  readonly name: string;
  readonly description?: string;
  readonly isSystem: boolean;
  readonly isAssignable: boolean;
  readonly isActive: boolean;
}

export interface PermissionContract {
  readonly key: string;
  readonly module: string;
  readonly resource: string;
  readonly action: string;
  readonly description?: string;
}

export interface UserRoleScopeContract {
  readonly scopeType?: string;
  readonly scopeId?: string;
}

export interface CreateRoleRequest {
  readonly key: string;
  readonly name: string;
  readonly description?: string;
  readonly isAssignable?: boolean;
}

export interface UpdateRoleRequest {
  readonly name?: string;
  readonly description?: string;
  readonly isAssignable?: boolean;
  readonly isActive?: boolean;
}

export interface RoleResponse extends RoleContract {
  readonly id: string;
  readonly createdAt?: string;
  readonly updatedAt?: string;
}

export interface PermissionResponse extends PermissionContract {
  readonly id: string;
  readonly isSystem: boolean;
  readonly createdAt?: string;
  readonly updatedAt?: string;
}

export interface AttachPermissionRequest {
  readonly permissionId: string;
}

export interface AssignUserRoleRequest extends UserRoleScopeContract {
  readonly roleId: string;
  readonly expiresAt?: string;
}

export interface UserRoleResponse extends UserRoleScopeContract {
  readonly id: string;
  readonly userId: string;
  readonly roleId: string;
  readonly assignedBy?: string;
  readonly assignedAt: string;
  readonly expiresAt?: string;
}

export interface RbacGenericResponse {
  readonly success: true;
  readonly message: string;
}
