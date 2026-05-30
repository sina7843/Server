import type {
  MediaAssetStatus,
  MediaStorageProvider,
  MediaVariantType,
  MediaVisibility,
  StorageProvider,
  StorageVisibility,
} from '../constants/media';

// ─── Storage layer contracts (Task 0.7.1) ───────────────────────────────────

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
  readonly body: Uint8Array;
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

// ─── Media asset DTOs (Task 0.7.2) ──────────────────────────────────────────

export interface AdminMediaVariantDto {
  readonly type: MediaVariantType;
  readonly objectKey: string;
  readonly url?: string;
  readonly width?: number;
  readonly height?: number;
  readonly sizeBytes?: number;
  readonly mimeType?: string;
}

export interface AdminMediaAssetDto {
  readonly id: string;
  readonly originalName: string;
  readonly mimeType: string;
  readonly extension: string;
  readonly sizeBytes: number;
  readonly storageProvider: MediaStorageProvider;
  readonly bucket: string;
  readonly objectKey: string;
  readonly visibility: MediaVisibility;
  readonly url: string;
  readonly variants: AdminMediaVariantDto[];
  readonly width?: number;
  readonly height?: number;
  readonly alt?: string;
  readonly caption?: string;
  readonly uploadedBy: string;
  readonly status: MediaAssetStatus;
  readonly checksum?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly deletedAt?: string;
}

export interface AdminMediaListResponseDto {
  readonly items: AdminMediaAssetDto[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
}

export interface AdminMediaUploadResponseDto {
  readonly asset: AdminMediaAssetDto;
}

export interface UpdateMediaAssetDto {
  readonly visibility?: MediaVisibility;
  readonly alt?: string;
  readonly caption?: string;
}

export interface AdminMediaListParams {
  readonly visibility?: MediaVisibility;
  readonly status?: MediaAssetStatus;
  readonly mimeType?: string;
  readonly page?: number;
  readonly limit?: number;
}

export interface AdminMediaUploadInput {
  readonly file: {
    readonly buffer: Uint8Array;
    readonly originalname: string;
    readonly mimetype: string;
    readonly size: number;
  };
  readonly visibility?: MediaVisibility;
  readonly alt?: string;
  readonly caption?: string;
}
