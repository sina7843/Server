export const USER_STATUSES = [
  'pending_verification',
  'active',
  'suspended',
  'banned',
  'deleted',
] as const;

export type UserStatus = (typeof USER_STATUSES)[number];

export interface UserMetadata {
  readonly registrationSource?: string;
  readonly locale?: string;
}

export interface CreatePendingUserInput {
  readonly phone: string;
  readonly phoneNormalized: string;
  readonly passwordHash: string;
  readonly email?: string;
  readonly emailNormalized?: string;
  readonly metadata?: UserMetadata;
}

export interface UserStatusState {
  readonly status: UserStatus;
  readonly lockedUntil?: Date;
  readonly phoneVerifiedAt?: Date;
}
