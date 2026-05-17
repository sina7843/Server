import {
  AuthConfigEnv,
  readEnumEnv,
  readPositiveIntegerEnv,
  readStringWithMinLengthEnv,
} from './config-validation';

export const AUTH_JWT_SECRET_MIN_LENGTH = 32;
export const SMS_PROVIDERS = ['mock'] as const;

export type SmsProvider = (typeof SMS_PROVIDERS)[number];

export interface AuthConfig {
  readonly accessTokenTtlSeconds: number;
  readonly refreshTokenTtlDays: number;
  readonly passwordMinLength: number;
  readonly passwordResetTokenTtlSeconds: number;
  readonly otpTtlSeconds: number;
  readonly otpMaxAttempts: number;
  readonly otpResendCooldownSeconds: number;
  readonly otpDailyPhoneLimit: number;
  readonly otpIpLimit: number;
  readonly jwtSecret: string;
  readonly smsProvider: SmsProvider;
}

export function getAuthConfig(env: AuthConfigEnv = process.env): AuthConfig {
  return {
    accessTokenTtlSeconds: readPositiveIntegerEnv(env, 'AUTH_ACCESS_TOKEN_TTL_SECONDS', {
      min: 60,
      max: 3600,
    }),
    refreshTokenTtlDays: readPositiveIntegerEnv(env, 'AUTH_REFRESH_TOKEN_TTL_DAYS', {
      min: 1,
      max: 90,
    }),
    passwordMinLength: readPositiveIntegerEnv(env, 'AUTH_PASSWORD_MIN_LENGTH', {
      min: 8,
      max: 128,
    }),
    passwordResetTokenTtlSeconds: readPositiveIntegerEnv(
      env,
      'AUTH_PASSWORD_RESET_TOKEN_TTL_SECONDS',
      { min: 300, max: 1800 },
    ),
    otpTtlSeconds: readPositiveIntegerEnv(env, 'AUTH_OTP_TTL_SECONDS', {
      min: 180,
      max: 300,
    }),
    otpMaxAttempts: readPositiveIntegerEnv(env, 'AUTH_OTP_MAX_ATTEMPTS', {
      min: 1,
      max: 5,
    }),
    otpResendCooldownSeconds: readPositiveIntegerEnv(env, 'AUTH_OTP_RESEND_COOLDOWN_SECONDS', {
      min: 60,
      max: 120,
    }),
    otpDailyPhoneLimit: readPositiveIntegerEnv(env, 'AUTH_OTP_DAILY_PHONE_LIMIT', {
      min: 1,
      max: 20,
    }),
    otpIpLimit: readPositiveIntegerEnv(env, 'AUTH_OTP_IP_LIMIT', {
      min: 1,
      max: 100,
    }),
    jwtSecret: readStringWithMinLengthEnv(env, 'AUTH_JWT_SECRET', AUTH_JWT_SECRET_MIN_LENGTH),
    smsProvider: readEnumEnv(env, 'SMS_PROVIDER', SMS_PROVIDERS),
  };
}
