import type { Types } from 'mongoose';

export interface AttachPermissionInput {
  readonly roleId: Types.ObjectId | string;
  readonly permissionId: Types.ObjectId | string;
}

export type RolePermissionId = Types.ObjectId | string;
