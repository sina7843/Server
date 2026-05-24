import { Injectable } from '@nestjs/common';

const REDACTED_KEYS = new Set([
  'password',
  'passwordHash',
  'rawOtp',
  'otp',
  'code',
  'codeHash',
  'refreshToken',
  'refreshTokenHash',
  'accessToken',
  'accessTokenJti',
  'resetToken',
  'secret',
  'secrets',
  'clientSecret',
  'providerSecret',
  'providerCredentials',
  'authorization',
  'cookie',
  'cookies',
]);

const REDACTED_SENTINEL = '[REDACTED]';

function redactValue(value: unknown): unknown {
  if (value === null || typeof value !== 'object') return value;

  if (Array.isArray(value)) {
    return value.map(redactValue);
  }

  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    result[key] = REDACTED_KEYS.has(key) ? REDACTED_SENTINEL : redactValue(val);
  }
  return result;
}

@Injectable()
export class JobPayloadRedactor {
  redact(payload: unknown): Record<string, unknown> {
    const result = redactValue(payload);
    if (result === null || typeof result !== 'object' || Array.isArray(result)) {
      return { _value: result };
    }
    return result as Record<string, unknown>;
  }
}
