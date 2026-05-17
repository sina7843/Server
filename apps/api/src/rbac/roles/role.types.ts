import type { Types } from 'mongoose';

export interface CreateRoleInput {
  readonly key: string;
  readonly name: string;
  readonly description?: string;
  readonly isSystem?: boolean;
  readonly isAssignable?: boolean;
  readonly isActive?: boolean;
}

export interface UpdateRoleInput {
  readonly name?: string;
  readonly description?: string;
  readonly isAssignable?: boolean;
  readonly isActive?: boolean;
}

export type RoleId = Types.ObjectId | string;
