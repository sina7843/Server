import type { SignedUrlOptions, StorageUploadInput, StoredObject } from '@dragon/types';

export const STORAGE_SERVICE = Symbol('STORAGE_SERVICE');

export interface StorageService {
  upload(input: StorageUploadInput): Promise<StoredObject>;
  delete(objectKey: string): Promise<void>;
  getPublicUrl(objectKey: string): string;
  getSignedUrl(objectKey: string, options?: SignedUrlOptions): Promise<string>;
}
