import { STORAGE_PROVIDERS } from '@dragon/types';
import {
  type AuthConfigEnv,
  readEnumEnv,
  readPositiveIntegerEnv,
  readRequiredEnv,
} from './config-validation';

export interface LocalStorageConfig {
  readonly provider: 'local';
  readonly bucket: string;
  readonly publicBaseUrl: string;
  readonly signedUrlTtlSeconds: number;
  readonly localRoot: string;
  readonly localPublicBaseUrl: string;
}

export interface S3CompatibleStorageConfig {
  readonly provider: 'minio' | 'arvan';
  readonly bucket: string;
  readonly publicBaseUrl: string;
  readonly signedUrlTtlSeconds: number;
  readonly s3Endpoint: string;
  readonly s3Region: string;
  readonly s3AccessKeyId: string;
  readonly s3SecretAccessKey: string;
  readonly s3ForcePathStyle: boolean;
}

export type StorageConfig = LocalStorageConfig | S3CompatibleStorageConfig;

const DEFAULT_SIGNED_URL_TTL = 3600;
const DEFAULT_LOCAL_ROOT = '/tmp/dragon-storage';
const DEFAULT_LOCAL_PUBLIC_BASE_URL = 'http://localhost:3000/storage';

export function getStorageConfig(env: AuthConfigEnv = process.env): StorageConfig {
  const provider = readEnumEnv(env, 'STORAGE_PROVIDER', STORAGE_PROVIDERS);
  const bucket = readRequiredEnv(env, 'STORAGE_BUCKET');
  const publicBaseUrl = readRequiredEnv(env, 'STORAGE_PUBLIC_BASE_URL');

  const rawTtl = env['STORAGE_SIGNED_URL_TTL_SECONDS']?.trim();
  const signedUrlTtlSeconds = rawTtl
    ? readPositiveIntegerEnv(env, 'STORAGE_SIGNED_URL_TTL_SECONDS', { min: 60, max: 604800 })
    : DEFAULT_SIGNED_URL_TTL;

  if (provider === 'local') {
    return {
      provider,
      bucket,
      publicBaseUrl,
      signedUrlTtlSeconds,
      localRoot: env['STORAGE_LOCAL_ROOT']?.trim() || DEFAULT_LOCAL_ROOT,
      localPublicBaseUrl:
        env['STORAGE_LOCAL_PUBLIC_BASE_URL']?.trim() || DEFAULT_LOCAL_PUBLIC_BASE_URL,
    };
  }

  return {
    provider: provider as 'minio' | 'arvan',
    bucket,
    publicBaseUrl,
    signedUrlTtlSeconds,
    s3Endpoint: readRequiredEnv(env, 'STORAGE_S3_ENDPOINT'),
    s3Region: readRequiredEnv(env, 'STORAGE_S3_REGION'),
    s3AccessKeyId: readRequiredEnv(env, 'STORAGE_S3_ACCESS_KEY_ID'),
    s3SecretAccessKey: readRequiredEnv(env, 'STORAGE_S3_SECRET_ACCESS_KEY'),
    s3ForcePathStyle: (env['STORAGE_S3_FORCE_PATH_STYLE'] ?? 'false').trim() !== 'false',
  };
}

export function isS3Config(config: StorageConfig): config is S3CompatibleStorageConfig {
  return config.provider === 'minio' || config.provider === 'arvan';
}

export const STORAGE_CONFIG = Symbol('STORAGE_CONFIG');
