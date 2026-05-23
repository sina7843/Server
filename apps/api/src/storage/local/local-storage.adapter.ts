import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { SignedUrlOptions, StorageUploadInput, StoredObject } from '@dragon/types';
import type { LocalStorageConfig } from '../../config/storage.config';
import type { StorageService } from '../storage.service';
import { assertSafeObjectKey } from '../storage-object-key';

export class LocalStorageAdapter implements StorageService {
  constructor(private readonly config: LocalStorageConfig) {}

  async upload(input: StorageUploadInput): Promise<StoredObject> {
    assertSafeObjectKey(input.objectKey);

    const destPath = this.resolveLocalPath(input.objectKey);
    await fs.mkdir(path.dirname(destPath), { recursive: true });

    const data =
      input.body instanceof Buffer || input.body instanceof Uint8Array
        ? input.body
        : await streamToBuffer(input.body as NodeJS.ReadableStream);

    await fs.writeFile(destPath, data);

    return {
      provider: 'local',
      bucket: this.config.bucket,
      objectKey: input.objectKey,
      mimeType: input.mimeType,
      sizeBytes: data.byteLength,
      publicUrl: this.getPublicUrl(input.objectKey),
    };
  }

  async download(objectKey: string): Promise<Buffer> {
    assertSafeObjectKey(objectKey);
    const destPath = this.resolveLocalPath(objectKey);
    return fs.readFile(destPath);
  }

  async delete(objectKey: string): Promise<void> {
    assertSafeObjectKey(objectKey);
    const destPath = this.resolveLocalPath(objectKey);
    await fs.rm(destPath, { force: true });
  }

  getPublicUrl(objectKey: string): string {
    assertSafeObjectKey(objectKey);
    const base = this.config.localPublicBaseUrl.replace(/\/$/, '');
    return `${base}/${objectKey}`;
  }

  async getSignedUrl(objectKey: string, options?: SignedUrlOptions): Promise<string> {
    assertSafeObjectKey(objectKey);
    const ttl = options?.expiresInSeconds ?? this.config.signedUrlTtlSeconds;
    const expiresAt = Date.now() + ttl * 1000;
    const base = this.config.localPublicBaseUrl.replace(/\/$/, '');
    return `${base}/${objectKey}?expires=${expiresAt}`;
  }

  private resolveLocalPath(objectKey: string): string {
    const root = path.resolve(this.config.localRoot);
    const resolved = path.resolve(root, objectKey);
    if (!resolved.startsWith(root + path.sep) && resolved !== root) {
      throw new Error('Path traversal attempt detected.');
    }
    return resolved;
  }
}

async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as unknown as Uint8Array));
  }
  return Buffer.concat(chunks);
}
