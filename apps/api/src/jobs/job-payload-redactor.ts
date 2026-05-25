import { Injectable } from '@nestjs/common';

const REDACTED_KEYS: ReadonlySet<string> = new Set([
  'password',
  'passwordhash',
  'rawotp',
  'otp',
  'code',
  'codehash',
  'refreshtoken',
  'refreshtokenhash',
  'accesstoken',
  'accesstokenjti',
  'resettoken',
  'secret',
  'secrets',
  'clientsecret',
  'providersecret',
  'providercredentials',
  'authorization',
  'cookie',
  'cookies',
  'smsbody',
  'recipientphonenormalized',
]);

const REDACTED_SENTINEL = '[REDACTED]';

function redactValue(value: unknown): unknown {
  if (value === null || typeof value !== 'object') return value;

  if (Array.isArray(value)) {
    return value.map(redactValue);
  }

  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    result[key] = REDACTED_KEYS.has(key.toLowerCase()) ? REDACTED_SENTINEL : redactValue(val);
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
