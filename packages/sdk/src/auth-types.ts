import type { AuthGenericResponse, RegisterRequest } from '@dragon/types';

export type { AuthGenericResponse, RegisterRequest };

export interface VerifyPhoneRequest {
  readonly phone: string;
  readonly code: string;
}

export interface LoginRequest {
  readonly phone: string;
  readonly password: string;
  readonly deviceId?: string;
  readonly deviceName?: string;
}

export interface RefreshRequest {
  readonly refreshToken: string;
}

export type LogoutResponse = AuthGenericResponse;

export interface TokenResponse {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly tokenType: 'Bearer';
  readonly expiresIn: number;
}

export interface ForgotPasswordRequest {
  readonly phone: string;
}

export interface VerifyResetOtpRequest {
  readonly phone: string;
  readonly code: string;
}

export interface VerifyResetOtpResponse {
  readonly resetToken: string;
}

export interface ResetPasswordRequest {
  readonly resetToken: string;
  readonly newPassword: string;
}

export interface AuthIdentity {
  readonly id: string;
  readonly phoneVerified: boolean;
  readonly status: 'active';
  readonly phoneMasked?: string;
}

export interface MeResponse {
  readonly user: AuthIdentity;
}

export interface AuthSessionSummary {
  readonly id: string;
  readonly deviceId?: string;
  readonly deviceName?: string;
  readonly ip?: string;
  readonly userAgent?: string;
  readonly expiresAt: string;
  readonly revokedAt?: string;
  readonly revokedReason?: string;
  readonly lastUsedAt?: string;
  readonly createdAt: string;
  readonly isCurrent?: boolean;
}

export interface AuthSessionsResponse {
  readonly sessions: readonly AuthSessionSummary[];
}

export type RevokeSessionResponse = AuthGenericResponse;
