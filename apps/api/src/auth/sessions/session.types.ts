import type { Types } from 'mongoose';

export type SessionRevocationReason =
  | 'logout'
  | 'logout_all'
  | 'password_reset'
  | 'admin_revoked'
  | 'expired'
  | 'security';

export type SessionObjectId = Types.ObjectId | string;

export interface CreateSessionInput {
  readonly userId: SessionObjectId;
  readonly refreshTokenHash: string;
  readonly accessTokenJti?: string;
  readonly deviceId?: string;
  readonly deviceName?: string;
  readonly ip?: string;
  readonly userAgent?: string;
  readonly expiresAt: Date;
}

export interface SessionState {
  readonly expiresAt: Date;
  readonly revokedAt?: Date | null;
}
