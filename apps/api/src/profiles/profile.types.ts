import type { Types } from 'mongoose';

export const PROFILE_VISIBILITIES = ['public', 'private'] as const;

export type ProfileVisibility = (typeof PROFILE_VISIBILITIES)[number];

export type ProfileEligibleUserStatus =
  | 'pending_verification'
  | 'active'
  | 'suspended'
  | 'banned'
  | 'deleted';

export interface UserProfileLike {
  readonly _id?: Types.ObjectId | string;
  readonly userId: Types.ObjectId | string;
  readonly username: string;
  readonly usernameNormalized: string;
  readonly displayName: string;
  readonly avatarMediaId?: Types.ObjectId | string;
  readonly bio?: string;
  readonly visibility: ProfileVisibility;
  readonly publicUrl: string;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}

export interface ProfileUserLike {
  readonly _id?: Types.ObjectId | string;
  readonly id?: string;
  readonly status: ProfileEligibleUserStatus;
  readonly phoneVerifiedAt?: Date | null;
}

export interface CreateUserProfileInput {
  readonly userId: Types.ObjectId | string;
  readonly username: string;
  readonly displayName: string;
  readonly avatarMediaId?: Types.ObjectId | string;
  readonly bio?: string;
  readonly visibility?: ProfileVisibility;
}

export interface CreateUserProfileRepositoryInput {
  readonly userId: Types.ObjectId | string;
  readonly username: string;
  readonly usernameNormalized: string;
  readonly displayName: string;
  readonly publicUrl: string;
  readonly avatarMediaId?: Types.ObjectId | string;
  readonly bio?: string;
  readonly visibility: ProfileVisibility;
}

export interface UpdateUserProfileInput {
  readonly username?: string;
  readonly displayName?: string;
  readonly avatarMediaId?: Types.ObjectId | string | null;
  readonly bio?: string | null;
  readonly visibility?: ProfileVisibility;
}

export interface UpdateUserProfileRepositoryInput {
  readonly username?: string;
  readonly usernameNormalized?: string;
  readonly displayName?: string;
  readonly avatarMediaId?: Types.ObjectId | string | null;
  readonly bio?: string | null;
  readonly visibility?: ProfileVisibility;
  readonly publicUrl?: string;
}

export interface EnsureProfileForActiveUserInput {
  readonly userId: string;
  readonly phoneNormalized?: string;
  readonly preferredUsername?: string;
  readonly displayName?: string;
}

export type PublicProfileAccess =
  | { readonly state: 'visible' }
  | { readonly state: 'private' }
  | { readonly state: 'not_found' };
