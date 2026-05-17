import type { AuthConfig } from '../../src/config/auth.config';
import {
  createGenericAuthResponse,
  LOGOUT_ALL_GENERIC_MESSAGE,
  LOGOUT_GENERIC_MESSAGE,
  REVOKE_SESSION_GENERIC_MESSAGE,
  FORGOT_PASSWORD_GENERIC_MESSAGE,
  RESET_PASSWORD_GENERIC_MESSAGE,
  VERIFY_PHONE_GENERIC_MESSAGE,
} from '../../src/auth/dto/auth-response.dto';

export function createAuthTestConfig(overrides: Partial<AuthConfig> = {}): AuthConfig {
  return {
    accessTokenTtlSeconds: 900,
    refreshTokenTtlDays: 30,
    passwordMinLength: 8,
    passwordResetTokenTtlSeconds: 600,
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

export function createForgotPasswordSuccessResponse() {
  return createGenericAuthResponse(FORGOT_PASSWORD_GENERIC_MESSAGE);
}

export function createResetPasswordSuccessResponse() {
  return createGenericAuthResponse(RESET_PASSWORD_GENERIC_MESSAGE);
}

export function createMeResponse() {
  return {
    user: {
      id: 'user-1',
      phoneVerified: true,
      status: 'active' as const,
      phoneMasked: '***00',
    },
  };
}

export function createSessionsResponse() {
  return {
    sessions: [
      {
        id: 'session-1',
        deviceName: 'Laptop',
        expiresAt: '2026-02-01T00:00:00.000Z',
        createdAt: '2026-01-01T00:00:00.000Z',
        isCurrent: true,
      },
    ],
  };
}

export function createRevokeSessionSuccessResponse() {
  return createGenericAuthResponse(REVOKE_SESSION_GENERIC_MESSAGE);
}
