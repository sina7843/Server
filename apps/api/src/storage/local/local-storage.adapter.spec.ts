import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import { LocalStorageAdapter } from './local-storage.adapter';
import type { LocalStorageConfig } from '../../config/storage.config';

function makeConfig(overrides: Partial<LocalStorageConfig> = {}): LocalStorageConfig {
  return {
    provider: 'local',
    bucket: 'test-bucket',
    publicBaseUrl: 'http://localhost:3000/storage',
    signedUrlTtlSeconds: 3600,
    localRoot: path.join(os.tmpdir(), 'dragon-storage-test-' + Date.now()),
    localPublicBaseUrl: 'http://localhost:3000/storage',
    ...overrides,
  };
}

describe('LocalStorageAdapter', () => {
  let tmpRoot: string;
  let adapter: LocalStorageAdapter;

  beforeEach(() => {
    tmpRoot = path.join(os.tmpdir(), 'dragon-storage-test-' + Date.now());
    adapter = new LocalStorageAdapter(makeConfig({ localRoot: tmpRoot }));
  });

  afterEach(async () => {
    await fs.rm(tmpRoot, { recursive: true, force: true });
  });

  describe('upload', () => {
    it('writes the file to a path inside localRoot', async () => {
      const objectKey = 'media/original/2026/05/abc123.jpg';
      const body = Buffer.from('fake-image-data');

      const result = await adapter.upload({ objectKey, body, mimeType: 'image/jpeg' });

      const expectedPath = path.join(tmpRoot, objectKey);
      const written = await fs.readFile(expectedPath);
      expect(written.toString()).toBe('fake-image-data');
      expect(result.objectKey).toBe(objectKey);
      expect(result.provider).toBe('local');
    });

    it('returns a deterministic publicUrl without exposing the local filesystem path', async () => {
      const objectKey = 'media/original/2026/05/file.png';
      const result = await adapter.upload({
        objectKey,
        body: Buffer.from('x'),
        mimeType: 'image/png',
      });

      expect(result.publicUrl).toBe(`http://localhost:3000/storage/${objectKey}`);
      expect(result.publicUrl).not.toContain(tmpRoot);
      expect(result.publicUrl).not.toContain(os.tmpdir());
    });

    it('rejects object keys with path traversal', async () => {
      await expect(
        adapter.upload({
          objectKey: '../../etc/passwd',
          body: Buffer.from('x'),
          mimeType: 'text/plain',
        }),
      ).rejects.toThrow();
    });

    it('rejects absolute object keys', async () => {
      await expect(
        adapter.upload({
          objectKey: '/absolute/path.jpg',
          body: Buffer.from('x'),
          mimeType: 'image/jpeg',
        }),
      ).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('removes an existing file', async () => {
      const objectKey = 'media/original/2026/05/todelete.jpg';
      await adapter.upload({ objectKey, body: Buffer.from('data'), mimeType: 'image/jpeg' });

      await expect(adapter.delete(objectKey)).resolves.not.toThrow();

      const expectedPath = path.join(tmpRoot, objectKey);
      await expect(fs.access(expectedPath)).rejects.toThrow();
    });

    it('does not throw when deleting a non-existent file (force mode)', async () => {
      await expect(adapter.delete('media/original/2026/05/nonexistent.jpg')).resolves.not.toThrow();
    });

    it('rejects path traversal in delete', async () => {
      await expect(adapter.delete('../../etc/passwd')).rejects.toThrow();
    });
  });

  describe('getPublicUrl', () => {
    it('returns a URL that does not expose the local filesystem path', () => {
      const url = adapter.getPublicUrl('media/original/2026/05/test.jpg');
      expect(url).toBe('http://localhost:3000/storage/media/original/2026/05/test.jpg');
      expect(url).not.toContain(tmpRoot);
      expect(url).not.toContain(os.tmpdir());
    });

    it('is deterministic for the same objectKey', () => {
      const key = 'media/original/2026/05/stable.jpg';
      expect(adapter.getPublicUrl(key)).toBe(adapter.getPublicUrl(key));
    });

    it('rejects path traversal', () => {
      expect(() => adapter.getPublicUrl('../../etc/passwd')).toThrow();
    });
  });

  describe('getSignedUrl', () => {
    it('returns a URL containing the objectKey and an expires parameter', async () => {
      const key = 'media/original/2026/05/signed.jpg';
      const url = await adapter.getSignedUrl(key);
      expect(url).toContain(key);
      expect(url).toContain('expires=');
    });

    it('respects custom TTL', async () => {
      const key = 'media/original/2026/05/signed.jpg';
      const before = Date.now();
      const url = await adapter.getSignedUrl(key, { expiresInSeconds: 7200 });
      const match = url.match(/expires=(\d+)/);
      const expiresAt = Number(match?.[1]);
      expect(expiresAt).toBeGreaterThanOrEqual(before + 7200 * 1000 - 100);
    });

    it('rejects path traversal', async () => {
      await expect(adapter.getSignedUrl('../../etc/passwd')).rejects.toThrow();
    });
  });
});
