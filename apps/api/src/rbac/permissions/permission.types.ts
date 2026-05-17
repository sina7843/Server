import type { Types } from 'mongoose';

export interface SystemPermissionInput {
  readonly key: string;
  readonly module: string;
  readonly resource: string;
  readonly action: string;
  readonly description?: string;
}

export type UpsertSystemPermissionInput = SystemPermissionInput;

export type PermissionId = Types.ObjectId | string;
