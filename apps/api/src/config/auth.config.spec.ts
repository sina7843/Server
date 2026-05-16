import { getAuthConfig } from './auth.config';

const validAuthEnv = {
  AUTH_ACCESS_TOKEN_TTL_SECONDS: '900',
  AUTH_REFRESH_TOKEN_TTL_DAYS: '30',
  AUTH_PASSWORD_MIN_LENGTH: '8',
  AUTH_OTP_TTL_SECONDS: '300',
  AUTH_OTP_MAX_ATTEMPTS: '5',
  AUTH_OTP_RESEND_COOLDOWN_SECONDS: '90',
  AUTH_OTP_DAILY_PHONE_LIMIT: '10',
  AUTH_OTP_IP_LIMIT: '30',
  AUTH_JWT_SECRET: 'local_dev_change_me_min_32_chars',
  SMS_PROVIDER: 'mock',
};

describe('getAuthConfig', () => {
  it('returns a parsed config for valid values', () => {
    const config = getAuthConfig(validAuthEnv);

    expect(config).toMatchObject({
      accessTokenTtlSeconds: 900,
      refreshTokenTtlDays: 30,
      passwordMinLength: 8,
      otpTtlSeconds: 300,
      otpMaxAttempts: 5,
      otpResendCooldownSeconds: 90,
      otpDailyPhoneLimit: 10,
      otpIpLimit: 30,
      smsProvider: 'mock',
    });
    expect(typeof config.accessTokenTtlSeconds).toBe('number');
    expect(typeof config.refreshTokenTtlDays).toBe('number');
  });

  it('fails when required values are missing', () => {
    const missingSecretEnv: Record<string, string> = { ...validAuthEnv };
    delete missingSecretEnv.AUTH_JWT_SECRET;

    expect(() => getAuthConfig(missingSecretEnv)).toThrow(
      'AUTH_JWT_SECRET is required.',
    );
  });

  it('fails for invalid numeric values', () => {
    expect(() =>
      getAuthConfig({
        ...validAuthEnv,
        AUTH_OTP_TTL_SECONDS: 'not-a-number',
      }),
    ).toThrow('AUTH_OTP_TTL_SECONDS must be a positive integer.');
  });

  it('fails for unsafe short JWT secrets without exposing the secret value', () => {
    const unsafeSecret = 'short-secret';

    try {
      getAuthConfig({ ...validAuthEnv, AUTH_JWT_SECRET: unsafeSecret });
      throw new Error('Expected getAuthConfig to fail.');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain('AUTH_JWT_SECRET');
      expect((error as Error).message).not.toContain(unsafeSecret);
    }
  });

  it('fails for unknown SMS provider values', () => {
    expect(() =>
      getAuthConfig({ ...validAuthEnv, SMS_PROVIDER: 'real-provider' }),
    ).toThrow('SMS_PROVIDER has an unsupported value.');
  });

  it('validates OTP safety ranges', () => {
    expect(() =>
      getAuthConfig({ ...validAuthEnv, AUTH_OTP_TTL_SECONDS: '600' }),
    ).toThrow('AUTH_OTP_TTL_SECONDS must be less than or equal to 300.');

    expect(() =>
      getAuthConfig({ ...validAuthEnv, AUTH_OTP_RESEND_COOLDOWN_SECONDS: '30' }),
    ).toThrow(
      'AUTH_OTP_RESEND_COOLDOWN_SECONDS must be greater than or equal to 60.',
    );
  });
});
