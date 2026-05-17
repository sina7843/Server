import type { AuthConfig } from '../../src/config/auth.config';
import {
  createGenericAuthResponse,
  LOGOUT_ALL_GENERIC_MESSAGE,
  LOGOUT_GENERIC_MESSAGE,
  VERIFY_PHONE_GENERIC_MESSAGE,
} from '../../src/auth/dto/auth-response.dto';

export function createAuthTestConfig(overrides: Partial<AuthConfig> = {}): AuthConfig {
  return {
    accessTokenTtlSeconds: 900,
    refreshTokenTtlDays: 30,
    passwordMinLength: 8,
    otpTtlSeconds: 300,
    otpMaxAttempts: 5,
    otpResendCooldownSeconds: 90,
    otpDailyPhoneLimit: 10,
    otpIpLimit: 30,
    jwtSecret: 'local_dev_change_me_min_32_chars',
    smsProvider: 'mock',
    ...overrides,
  };
}

export function createRegisterSuccessResponse() {
  return createGenericAuthResponse();
}

export function createVerifyPhoneSuccessResponse() {
  return createGenericAuthResponse(VERIFY_PHONE_GENERIC_MESSAGE);
}

export function createLoginTokenResponse() {
  return {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    tokenType: 'Bearer' as const,
    expiresIn: 900,
  };
}

export function createRefreshTokenResponse() {
  return {
    accessToken: 'new-access-token',
    refreshToken: 'new-refresh-token',
    tokenType: 'Bearer' as const,
    expiresIn: 900,
  };
}

export function createLogoutSuccessResponse() {
  return createGenericAuthResponse(LOGOUT_GENERIC_MESSAGE);
}

export function createLogoutAllSuccessResponse() {
  return createGenericAuthResponse(LOGOUT_ALL_GENERIC_MESSAGE);
}
