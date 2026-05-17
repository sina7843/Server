import type { Types } from "mongoose";
import type { OtpPurpose } from "./otp-purpose";

export interface CreateOtpChallengeInput {
  phoneNormalized: string;
  purpose: OtpPurpose;
  codeHash: string;
  expiresAt: Date;
  maxAttempts: number;
  nextResendAt?: Date;
  ip?: string;
  userAgent?: string;
  requestId?: string;
}

export interface OtpChallengeState {
  expiresAt: Date;
  verifiedAt?: Date;
  consumedAt?: Date;
  attempts: number;
  maxAttempts: number;
  nextResendAt?: Date;
}

export type OtpChallengeId = Types.ObjectId | string;
