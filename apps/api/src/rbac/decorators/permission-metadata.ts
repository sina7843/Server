export const PERMISSION_METADATA_KEY = 'dragon:rbac:permissions';

export interface PermissionMetadata {
  readonly permissionKeys: readonly string[];
  readonly requireAll: boolean;
}
