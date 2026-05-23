export const STORAGE_PROVIDERS = ['local', 'minio', 'arvan'] as const;
export type StorageProvider = (typeof STORAGE_PROVIDERS)[number];

export const STORAGE_VISIBILITY = ['public', 'private'] as const;
export type StorageVisibility = (typeof STORAGE_VISIBILITY)[number];

export const MEDIA_ASSET_STATUSES = ['uploaded', 'processing', 'ready', 'failed'] as const;
export type MediaAssetStatus = (typeof MEDIA_ASSET_STATUSES)[number];

export const MEDIA_VARIANT_TYPES = ['original', 'thumbnail', 'medium'] as const;
export type MediaVariantType = (typeof MEDIA_VARIANT_TYPES)[number];

export const MEDIA_VISIBILITIES = ['public', 'private'] as const;
export type MediaVisibility = (typeof MEDIA_VISIBILITIES)[number];

export const MEDIA_STORAGE_PROVIDERS = ['arvan', 'minio', 'local'] as const;
export type MediaStorageProvider = (typeof MEDIA_STORAGE_PROVIDERS)[number];

export const ALLOWED_MEDIA_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;
export type AllowedMediaMimeType = (typeof ALLOWED_MEDIA_MIME_TYPES)[number];

export const ALLOWED_MEDIA_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif'] as const;
export type AllowedMediaExtension = (typeof ALLOWED_MEDIA_EXTENSIONS)[number];

export const MIME_TO_EXTENSION_MAP: Readonly<Record<string, string>> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};
