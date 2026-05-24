import type { AuthConfigEnv } from './config-validation';

export interface RedisConfig {
  readonly host: string;
  readonly port: number;
  readonly password: string | undefined;
  readonly db: number;
}

export interface BullMQConfig {
  readonly redis: RedisConfig;
  readonly defaultAttempts: number;
  readonly defaultBackoffMs: number;
  readonly prefix: string;
}

export const BULLMQ_CONFIG = Symbol('BULLMQ_CONFIG');

function readOptionalPositiveInt(env: AuthConfigEnv, key: string, fallback: number): number {
  const raw = env[key]?.trim();
  if (!raw) return fallback;
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) {
    throw new Error(`${key} must be a positive integer, got: ${raw}`);
  }
  return n;
}

function readOptionalNonNegativeInt(env: AuthConfigEnv, key: string, fallback: number): number {
  const raw = env[key]?.trim();
  if (!raw) return fallback;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 0) {
    throw new Error(`${key} must be a non-negative integer, got: ${raw}`);
  }
  return n;
}

export function getBullMQConfig(env: AuthConfigEnv = process.env): BullMQConfig {
  const host = env['REDIS_HOST']?.trim() || 'localhost';
  const port = readOptionalPositiveInt(env, 'REDIS_PORT', 6379);
  const password = env['REDIS_PASSWORD']?.trim() || undefined;
  const db = readOptionalNonNegativeInt(env, 'REDIS_DB', 0);
  const defaultAttempts = readOptionalPositiveInt(env, 'BULLMQ_DEFAULT_ATTEMPTS', 3);
  const defaultBackoffMs = readOptionalPositiveInt(env, 'BULLMQ_DEFAULT_BACKOFF_MS', 2000);
  const prefix = env['BULLMQ_PREFIX']?.trim() || 'dragon';

  return {
    redis: { host, port, password, db },
    defaultAttempts,
    defaultBackoffMs,
    prefix,
  };
}
