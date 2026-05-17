import { SetMetadata } from '@nestjs/common';
import { PERMISSION_METADATA_KEY, type PermissionMetadata } from './permission-metadata';

export function RequirePermissions(
  permissionKeys: readonly string[],
  options: { readonly requireAll?: boolean } = {},
): MethodDecorator & ClassDecorator {
  const metadata: PermissionMetadata = {
    permissionKeys,
    requireAll: options.requireAll ?? true,
  };

  return SetMetadata(PERMISSION_METADATA_KEY, metadata);
}
