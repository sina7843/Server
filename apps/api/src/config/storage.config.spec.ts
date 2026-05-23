import { getStorageConfig } from './storage.config';

const VALID_LOCAL_ENV = {
  STORAGE_PROVIDER: 'local',
  STORAGE_BUCKET: 'dragon-local',
  STORAGE_PUBLIC_BASE_URL: 'http://localhost:3000/storage',
};

const VALID_MINIO_ENV = {
  STORAGE_PROVIDER: 'minio',
  STORAGE_BUCKET: 'dragon-minio',
  STORAGE_PUBLIC_BASE_URL: 'http://localhost:9000/dragon-minio',
  STORAGE_S3_ENDPOINT: 'http://localhost:9000',
  STORAGE_S3_REGION: 'us-east-1',
  STORAGE_S3_ACCESS_KEY_ID: 'minioadmin',
  STORAGE_S3_SECRET_ACCESS_KEY: 'minioadmin',
};

const VALID_ARVAN_ENV = {
  STORAGE_PROVIDER: 'arvan',
  STORAGE_BUCKET: 'arvan-bucket',
  STORAGE_PUBLIC_BASE_URL: 'https://arvan-cdn.example.com/arvan-bucket',
  STORAGE_S3_ENDPOINT: 'https://s3.ir-thr-at1.arvanstorage.ir',
  STORAGE_S3_REGION: 'ir-thr-at1',
  STORAGE_S3_ACCESS_KEY_ID: 'placeholder-key',
  STORAGE_S3_SECRET_ACCESS_KEY: 'placeholder-secret',
};

describe('getStorageConfig — local provider', () => {
  it('accepts valid local config', () => {
    const config = getStorageConfig(VALID_LOCAL_ENV);
    expect(config.provider).toBe('local');
    expect(config.bucket).toBe('dragon-local');
  });

  it('uses default localRoot when not set', () => {
    const config = getStorageConfig(VALID_LOCAL_ENV) as { localRoot: string };
    expect(config.localRoot).toBeTruthy();
  });

  it('uses default signedUrlTtlSeconds when not set', () => {
    const config = getStorageConfig(VALID_LOCAL_ENV);
    expect(config.signedUrlTtlSeconds).toBe(3600);
  });

  it('accepts custom signedUrlTtlSeconds', () => {
    const config = getStorageConfig({ ...VALID_LOCAL_ENV, STORAGE_SIGNED_URL_TTL_SECONDS: '7200' });
    expect(config.signedUrlTtlSeconds).toBe(7200);
  });

  it('rejects missing STORAGE_BUCKET', () => {
    const env = { ...VALID_LOCAL_ENV };
    delete (env as Record<string, string>).STORAGE_BUCKET;
    expect(() => getStorageConfig(env)).toThrow('STORAGE_BUCKET');
  });

  it('rejects missing STORAGE_PUBLIC_BASE_URL', () => {
    const env = { ...VALID_LOCAL_ENV };
    delete (env as Record<string, string>).STORAGE_PUBLIC_BASE_URL;
    expect(() => getStorageConfig(env)).toThrow('STORAGE_PUBLIC_BASE_URL');
  });
});

describe('getStorageConfig — minio provider', () => {
  it('accepts valid minio config', () => {
    const config = getStorageConfig(VALID_MINIO_ENV);
    expect(config.provider).toBe('minio');
  });

  it('rejects missing STORAGE_S3_ENDPOINT for minio', () => {
    const env = { ...VALID_MINIO_ENV };
    delete (env as Record<string, string>).STORAGE_S3_ENDPOINT;
    expect(() => getStorageConfig(env)).toThrow('STORAGE_S3_ENDPOINT');
  });

  it('rejects missing STORAGE_S3_ACCESS_KEY_ID for minio', () => {
    const env = { ...VALID_MINIO_ENV };
    delete (env as Record<string, string>).STORAGE_S3_ACCESS_KEY_ID;
    expect(() => getStorageConfig(env)).toThrow('STORAGE_S3_ACCESS_KEY_ID');
  });

  it('rejects missing STORAGE_S3_SECRET_ACCESS_KEY for minio', () => {
    const env = { ...VALID_MINIO_ENV };
    delete (env as Record<string, string>).STORAGE_S3_SECRET_ACCESS_KEY;
    expect(() => getStorageConfig(env)).toThrow('STORAGE_S3_SECRET_ACCESS_KEY');
  });

  it('sets s3ForcePathStyle to true by default when not set', () => {
    const config = getStorageConfig(VALID_MINIO_ENV) as { s3ForcePathStyle: boolean };
    expect(config.s3ForcePathStyle).toBe(false);
  });
});

describe('getStorageConfig — arvan provider', () => {
  it('accepts valid arvan config', () => {
    const config = getStorageConfig(VALID_ARVAN_ENV);
    expect(config.provider).toBe('arvan');
  });

  it('rejects missing STORAGE_S3_ENDPOINT for arvan', () => {
    const env = { ...VALID_ARVAN_ENV };
    delete (env as Record<string, string>).STORAGE_S3_ENDPOINT;
    expect(() => getStorageConfig(env)).toThrow('STORAGE_S3_ENDPOINT');
  });

  it('rejects missing STORAGE_S3_SECRET_ACCESS_KEY for arvan', () => {
    const env = { ...VALID_ARVAN_ENV };
    delete (env as Record<string, string>).STORAGE_S3_SECRET_ACCESS_KEY;
    expect(() => getStorageConfig(env)).toThrow('STORAGE_S3_SECRET_ACCESS_KEY');
  });

  it('rejects missing STORAGE_S3_ACCESS_KEY_ID for arvan', () => {
    const env = { ...VALID_ARVAN_ENV };
    delete (env as Record<string, string>).STORAGE_S3_ACCESS_KEY_ID;
    expect(() => getStorageConfig(env)).toThrow('STORAGE_S3_ACCESS_KEY_ID');
  });
});

describe('getStorageConfig — provider validation', () => {
  it('rejects an unsupported STORAGE_PROVIDER', () => {
    expect(() => getStorageConfig({ ...VALID_LOCAL_ENV, STORAGE_PROVIDER: 'ftp' })).toThrow(
      'STORAGE_PROVIDER',
    );
  });

  it('rejects a missing STORAGE_PROVIDER', () => {
    expect(() => getStorageConfig({})).toThrow('STORAGE_PROVIDER');
  });
});
