import { SetMetadata } from '@nestjs/common';
import { PERMISSION_METADATA_KEY, type PermissionMetadata } from './permission-metadata';

export function RequirePermission(permissionKey: string): MethodDecorator & ClassDecorator {
  const metadata: PermissionMetadata = {
    permissionKeys: [permissionKey],
    requireAll: true,
  };

  return SetMetadata(PERMISSION_METADATA_KEY, metadata);
}
