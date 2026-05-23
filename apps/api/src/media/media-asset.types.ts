import type { Types } from 'mongoose';
import type {
  MediaAssetStatus,
  MediaStorageProvider,
  MediaVariantType,
  MediaVisibility,
} from '@dragon/types';

export type MediaAssetId = Types.ObjectId | string;

export interface CreateMediaAssetInput {
  readonly originalName: string;
  readonly fileName: string;
  readonly mimeType: string;
  readonly extension: string;
  readonly sizeBytes: number;
  readonly storageProvider: MediaStorageProvider;
  readonly bucket: string;
  readonly objectKey: string;
  readonly visibility: MediaVisibility;
  readonly uploadedBy: string;
  readonly status: MediaAssetStatus;
  readonly checksum?: string;
  readonly variants?: ReadonlyArray<{
    readonly type: MediaVariantType;
    readonly objectKey: string;
    readonly sizeBytes?: number;
    readonly mimeType?: string;
  }>;
}

export interface UpdateMediaAssetMetadataInput {
  readonly visibility?: MediaVisibility;
  readonly alt?: string;
  readonly caption?: string;
}

export interface MediaAssetListFilter {
  readonly visibility?: MediaVisibility;
  readonly status?: MediaAssetStatus;
  readonly mimeType?: string;
  readonly includeDeleted?: boolean;
}
