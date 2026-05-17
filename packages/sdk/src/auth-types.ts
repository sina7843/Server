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
