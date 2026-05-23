import type { StorageProvider, StorageVisibility } from '../constants/media';

export interface StoredObject {
  readonly provider: StorageProvider;
  readonly bucket: string;
  readonly objectKey: string;
  readonly mimeType?: string;
  readonly sizeBytes?: number;
  readonly etag?: string;
  readonly checksum?: string;
  readonly publicUrl?: string;
}

export interface StorageUploadInput {
  readonly objectKey: string;
  readonly body: Buffer | Uint8Array | NodeJS.ReadableStream;
  readonly mimeType: string;
  readonly sizeBytes?: number;
  readonly metadata?: Record<string, string>;
  readonly visibility?: StorageVisibility;
}

export interface SignedUrlOptions {
  readonly expiresInSeconds?: number;
  readonly responseContentDisposition?: string;
  readonly responseContentType?: string;
}
