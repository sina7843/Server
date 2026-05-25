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
  'authorization',
  'cookie',
  'cookies',
  'secret',
  'secrets',
  'clientsecret',
  'providersecret',
  'providercredentials',
  'phone',
  'phonenormalized',
  'email',
  'recipient',
  'recipientphone',
  'recipientemail',
  'recipientphonenormalized',
]);

const REDACTED = '[REDACTED]';

@Injectable()
export class AnalyticsRedactor {
  redact<T>(value: T): T {
    return redactValue(value) as T;
  }
}

function redactValue(value: unknown): unknown {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(redactValue);
  }

  const obj = value as Record<string, unknown>;
  const result: Record<string, unknown> = {};

  for (const key of Object.keys(obj)) {
    if (REDACTED_KEYS.has(key.toLowerCase())) {
      result[key] = REDACTED;
    } else if (key === 'headers' && typeof obj[key] === 'object' && obj[key] !== null) {
      result[key] = redactHeaders(obj[key] as Record<string, unknown>);
    } else {
      result[key] = redactValue(obj[key]);
    }
  }

  return result;
}

function redactHeaders(headers: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(headers)) {
    if (key.toLowerCase() === 'authorization' || key.toLowerCase() === 'cookie') {
      result[key] = REDACTED;
    } else {
      result[key] = redactValue(headers[key]);
    }
  }
  return result;
}
