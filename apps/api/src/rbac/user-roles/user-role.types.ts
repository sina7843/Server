import type { Types } from 'mongoose';

export interface UserRoleScopeInput {
  readonly scopeType?: string;
  readonly scopeId?: string;
}

export interface AssignRoleInput extends UserRoleScopeInput {
  readonly userId: Types.ObjectId | string;
  readonly roleId: Types.ObjectId | string;
  readonly assignedBy?: Types.ObjectId | string;
  readonly assignedAt?: Date;
  readonly expiresAt?: Date;
}

export interface FindUserRoleInput extends UserRoleScopeInput {
  readonly userId: Types.ObjectId | string;
  readonly roleId: Types.ObjectId | string;
}

export type UserRoleId = Types.ObjectId | string;
