export const STORAGE_PROVIDERS = ['local', 'minio', 'arvan'] as const;
export type StorageProvider = (typeof STORAGE_PROVIDERS)[number];

export const STORAGE_VISIBILITY = ['public', 'private'] as const;
export type StorageVisibility = (typeof STORAGE_VISIBILITY)[number];
