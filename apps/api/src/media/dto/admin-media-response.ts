import type { MediaAssetDocument } from '../media-asset.schema';
import type {
  AdminMediaAssetDto,
  AdminMediaListResponseDto,
  AdminMediaUploadResponseDto,
  AdminMediaVariantDto,
} from '@dragon/types';

function toVariantDto(variant: MediaAssetDocument['variants'][number]): AdminMediaVariantDto {
  return {
    type: variant.type,
    objectKey: variant.objectKey,
    ...(variant.width !== undefined ? { width: variant.width } : {}),
    ...(variant.height !== undefined ? { height: variant.height } : {}),
    ...(variant.sizeBytes !== undefined ? { sizeBytes: variant.sizeBytes } : {}),
    ...(variant.mimeType !== undefined ? { mimeType: variant.mimeType } : {}),
  };
}

export function toAdminMediaAssetDto(
  asset: MediaAssetDocument,
  url: string,
  variantUrls?: Map<string, string>,
): AdminMediaAssetDto {
  return {
    id: String(asset._id),
    originalName: asset.originalName,
    mimeType: asset.mimeType,
    extension: asset.extension,
    sizeBytes: asset.sizeBytes,
    storageProvider: asset.storageProvider,
    bucket: asset.bucket,
    objectKey: asset.objectKey,
    visibility: asset.visibility,
    url,
    variants: asset.variants.map((v) => ({
      ...toVariantDto(v),
      ...(variantUrls?.has(v.objectKey) ? { url: variantUrls.get(v.objectKey)! } : {}),
    })),
    ...(asset.width !== undefined ? { width: asset.width } : {}),
    ...(asset.height !== undefined ? { height: asset.height } : {}),
    ...(asset.alt ? { alt: asset.alt } : {}),
    ...(asset.caption ? { caption: asset.caption } : {}),
    uploadedBy: String(asset.uploadedBy),
    status: asset.status,
    ...(asset.checksum ? { checksum: asset.checksum } : {}),
    createdAt: asset.createdAt.toISOString(),
    updatedAt: asset.updatedAt.toISOString(),
    ...(asset.deletedAt ? { deletedAt: asset.deletedAt.toISOString() } : {}),
  };
}

export function toAdminMediaListResponse(
  items: AdminMediaAssetDto[],
  total: number,
  page: number,
  limit: number,
): AdminMediaListResponseDto {
  return { items, total, page, limit };
}

export function toAdminMediaUploadResponse(asset: AdminMediaAssetDto): AdminMediaUploadResponseDto {
  return { asset };
}
