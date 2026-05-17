export interface ResolvePermissionsInput {
  readonly userId: string;
  readonly now?: Date;
}

export interface PermissionResolution {
  readonly permissionKeys: readonly string[];
  readonly roleKeys: readonly string[];
  readonly isSuperAdmin: boolean;
}
