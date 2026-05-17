export type UserStatus = 'pending_verification' | 'active' | 'suspended' | 'banned' | 'deleted';

export type SessionRevocationReason =
  | 'logout'
  | 'logout_all'
  | 'password_reset'
  | 'admin_revoked'
  | 'expired'
  | 'security';

export type OtpPurpose =
  | 'phone_verification'
  | 'password_reset'
  | 'sensitive_action'
  | 'admin_step_up';

export interface RegisterRequest {
  readonly phone: string;
  readonly password: string;
}

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

export interface TokenResponse {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly tokenType: 'Bearer';
  readonly expiresIn: number;
}

export interface AuthGenericResponse {
  readonly success: true;
  readonly message: string;
}

export type LogoutResponse = AuthGenericResponse;
