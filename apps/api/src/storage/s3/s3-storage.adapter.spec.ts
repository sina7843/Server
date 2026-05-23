import { S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { MinioStorageAdapter } from './minio-storage.adapter';
import { ArvanS3StorageAdapter } from './arvan-s3-storage.adapter';
import type { S3CompatibleStorageConfig } from '../../config/storage.config';

jest.mock('@aws-sdk/client-s3', () => {
  const mockSend = jest.fn().mockResolvedValue({ ETag: '"mock-etag"' });
  const mockClient = jest.fn().mockImplementation(() => ({ send: mockSend }));
  return {
    S3Client: mockClient,
    PutObjectCommand: jest.fn().mockImplementation((input) => ({ _type: 'PutObject', input })),
    DeleteObjectCommand: jest.fn().mockImplementation((input) => ({ _type: 'Delete', input })),
    GetObjectCommand: jest.fn().mockImplementation((input) => ({ _type: 'GetObject', input })),
  };
});

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest
    .fn()
    .mockResolvedValue('https://s3.example.com/bucket/key?X-Amz-Signature=mock'),
}));

function makeMinioConfig(
  overrides: Partial<S3CompatibleStorageConfig> = {},
): S3CompatibleStorageConfig {
  return {
    provider: 'minio',
    bucket: 'test-bucket',
    publicBaseUrl: 'http://localhost:9000/test-bucket',
    signedUrlTtlSeconds: 3600,
    s3Endpoint: 'http://localhost:9000',
    s3Region: 'us-east-1',
    s3AccessKeyId: 'test-access-key',
    s3SecretAccessKey: 'test-secret-key',
    s3ForcePathStyle: true,
    ...overrides,
  };
}

function makeArvanConfig(
  overrides: Partial<S3CompatibleStorageConfig> = {},
): S3CompatibleStorageConfig {
  return {
    provider: 'arvan',
    bucket: 'arvan-bucket',
    publicBaseUrl: 'https://arvan-cdn.example.com/arvan-bucket',
    signedUrlTtlSeconds: 3600,
    s3Endpoint: 'https://s3.ir-thr-at1.arvanstorage.ir',
    s3Region: 'ir-thr-at1',
    s3AccessKeyId: 'arvan-access-key-placeholder',
    s3SecretAccessKey: 'arvan-secret-key-placeholder',
    s3ForcePathStyle: false,
    ...overrides,
  };
}

describe('MinioStorageAdapter', () => {
  let adapter: MinioStorageAdapter;

  beforeEach(() => {
    jest.clearAllMocks();
    adapter = new MinioStorageAdapter(makeMinioConfig());
  });

  it('uses S3-compatible config shape (endpoint, region, credentials)', () => {
    expect(S3Client).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: 'http://localhost:9000',
        region: 'us-east-1',
        credentials: expect.objectContaining({
          accessKeyId: 'test-access-key',
          secretAccessKey: 'test-secret-key',
        }),
        forcePathStyle: true,
      }),
    );
  });

  it('rejects construction with wrong provider', () => {
    expect(() => new MinioStorageAdapter(makeMinioConfig({ provider: 'arvan' }))).toThrow(
      'provider=minio',
    );
  });

  it('uploads and returns a StoredObject', async () => {
    const result = await adapter.upload({
      objectKey: 'media/original/2026/05/abc.jpg',
      body: Buffer.from('data'),
      mimeType: 'image/jpeg',
    });
    expect(result.provider).toBe('minio');
    expect(result.bucket).toBe('test-bucket');
    expect(result.objectKey).toBe('media/original/2026/05/abc.jpg');
    expect(result.etag).toBe('mock-etag');
  });

  it('calls S3 delete with the correct key', async () => {
    await adapter.delete('media/original/2026/05/abc.jpg');
    const { DeleteObjectCommand } = jest.requireMock('@aws-sdk/client-s3') as {
      DeleteObjectCommand: jest.Mock;
    };
    expect(DeleteObjectCommand).toHaveBeenCalledWith(
      expect.objectContaining({ Key: 'media/original/2026/05/abc.jpg' }),
    );
  });

  it('returns a public URL based on configured publicBaseUrl', () => {
    const url = adapter.getPublicUrl('media/original/2026/05/file.png');
    expect(url).toBe('http://localhost:9000/test-bucket/media/original/2026/05/file.png');
  });

  it('calls getSignedUrl with the configured TTL', async () => {
    await adapter.getSignedUrl('media/original/2026/05/file.jpg', { expiresInSeconds: 1800 });
    expect(getSignedUrl).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({ expiresIn: 1800 }),
    );
  });

  it('rejects path traversal in upload', async () => {
    await expect(
      adapter.upload({
        objectKey: '../../etc/passwd',
        body: Buffer.from('x'),
        mimeType: 'text/plain',
      }),
    ).rejects.toThrow();
  });
});

describe('ArvanS3StorageAdapter', () => {
  let adapter: ArvanS3StorageAdapter;

  beforeEach(() => {
    jest.clearAllMocks();
    adapter = new ArvanS3StorageAdapter(makeArvanConfig());
  });

  it('uses S3-compatible config shape (no hardcoded Arvan endpoint)', () => {
    expect(S3Client).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: 'https://s3.ir-thr-at1.arvanstorage.ir',
        region: 'ir-thr-at1',
      }),
    );
  });

  it('rejects construction with wrong provider', () => {
    expect(() => new ArvanS3StorageAdapter(makeArvanConfig({ provider: 'minio' }))).toThrow(
      'provider=arvan',
    );
  });

  it('does not hardcode credentials (uses config values)', () => {
    expect(S3Client).toHaveBeenCalledWith(
      expect.objectContaining({
        credentials: expect.objectContaining({
          accessKeyId: 'arvan-access-key-placeholder',
          secretAccessKey: 'arvan-secret-key-placeholder',
        }),
      }),
    );
  });

  it('returns a StoredObject with arvan provider', async () => {
    const result = await adapter.upload({
      objectKey: 'media/original/2026/05/arvan-file.jpg',
      body: Buffer.from('data'),
      mimeType: 'image/jpeg',
    });
    expect(result.provider).toBe('arvan');
  });

  it('getSignedUrl exists and respects TTL input', async () => {
    const url = await adapter.getSignedUrl('media/original/2026/05/f.jpg', {
      expiresInSeconds: 900,
    });
    expect(typeof url).toBe('string');
    expect(getSignedUrl).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({ expiresIn: 900 }),
    );
  });
});
