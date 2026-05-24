import { BadRequestException, Inject, Injectable, Logger, Optional } from '@nestjs/common';
import type {
  AdminMediaAssetDto,
  AdminMediaListResponseDto,
  AdminMediaUploadResponseDto,
} from '@dragon/types';
import { AuditAction } from '@dragon/types';
import { AuditService } from '../audit/audit.service';
import { STORAGE_SERVICE, type StorageService } from '../storage/storage.service';
import { MediaAssetService } from './media-asset.service';
import { MediaUploadPipeline } from './media-upload-pipeline.service';
import { parseUpdateMediaBody, parseUploadMetadata } from './dto/admin-media-body';
import { parseAdminMediaListQuery } from './dto/admin-media-query';
import {
  toAdminMediaAssetDto,
  toAdminMediaListResponse,
  toAdminMediaUploadResponse,
} from './dto/admin-media-response';

@Injectable()
export class AdminMediaService {
  private readonly logger = new Logger(AdminMediaService.name);

  constructor(
    private readonly mediaAssetService: MediaAssetService,
    private readonly pipeline: MediaUploadPipeline,
    @Inject(STORAGE_SERVICE) private readonly storageService: StorageService,
    @Optional() private readonly auditService?: AuditService,
  ) {}

  async uploadMedia(
    file: Express.Multer.File,
    body: unknown,
    uploadedBy: string,
  ): Promise<AdminMediaUploadResponseDto> {
    if (!file) {
      throw new BadRequestException('No file was uploaded.');
    }

    const metadata = parseUploadMetadata(body);

    const asset = await this.pipeline.upload({
      file: {
        buffer: file.buffer,
        mimetype: file.mimetype,
        originalname: file.originalname,
        size: file.size,
      },
      uploadedBy,
      visibility: metadata.visibility,
      ...(metadata.alt !== undefined ? { alt: metadata.alt } : {}),
      ...(metadata.caption !== undefined ? { caption: metadata.caption } : {}),
    });

    const url = await this.resolveUrl(asset.objectKey, asset.visibility);

    void this.auditService?.log({
      actorId: uploadedBy,
      actorType: 'admin',
      action: AuditAction.MEDIA_ASSET_UPLOADED,
      resourceType: 'media_asset',
      resourceId: String(asset._id),
      after: { mimeType: asset.mimeType, visibility: asset.visibility, sizeBytes: asset.sizeBytes },
      severity: 'info',
    });

    const dto = toAdminMediaAssetDto(asset, url);
    return toAdminMediaUploadResponse(dto);
  }

  async regenerateVariants(rawId: string): Promise<AdminMediaAssetDto> {
    const asset = await this.mediaAssetService.findById(rawId);

    if (asset.mimeType === 'image/gif') {
      const url = await this.resolveUrl(asset.objectKey, asset.visibility);
      return toAdminMediaAssetDto(asset, url);
    }

    await this.mediaAssetService.updateVariants(String(asset._id), {
      status: 'processing',
      variants: asset.variants.filter((v) => v.type === 'original'),
    });

    let buffer: Buffer;
    try {
      buffer = await this.storageService.download(asset.objectKey);
    } catch (err) {
      this.logger.error(
        `Failed to download original for regeneration ${asset.objectKey}: ${String(err)}`,
      );
      await this.mediaAssetService.updateVariants(String(asset._id), {
        status: 'failed',
        variants: asset.variants.filter((v) => v.type === 'original'),
      });
      throw new BadRequestException(
        'Could not download the original file for variant regeneration.',
      );
    }

    const updatedAsset = await this.pipeline.reprocessVariants(
      asset,
      buffer,
      asset.mimeType,
      asset.objectKey,
    );

    void this.auditService?.log({
      actorType: 'admin',
      action: AuditAction.MEDIA_VARIANT_REGENERATED,
      resourceType: 'media_asset',
      resourceId: rawId,
      after: { variantCount: updatedAsset.variants.length },
      severity: 'info',
    });

    const url = await this.resolveUrl(updatedAsset.objectKey, updatedAsset.visibility);
    return toAdminMediaAssetDto(updatedAsset, url);
  }

  async listMedia(query: unknown): Promise<AdminMediaListResponseDto> {
    const q = parseAdminMediaListQuery(query);
    const { items, total } = await this.mediaAssetService.list(
      {
        ...(q.visibility !== undefined ? { visibility: q.visibility } : {}),
        ...(q.status !== undefined ? { status: q.status } : {}),
        ...(q.mimeType !== undefined ? { mimeType: q.mimeType } : {}),
      },
      q.page,
      q.limit,
    );
    const dtos = await Promise.all(
      items.map(async (a) => {
        const url = await this.resolveUrl(a.objectKey, a.visibility);
        return toAdminMediaAssetDto(a, url);
      }),
    );
    return toAdminMediaListResponse(dtos, total, q.page, q.limit);
  }

  async getMedia(rawId: string): Promise<AdminMediaAssetDto> {
    const asset = await this.mediaAssetService.findById(rawId);
    const url = await this.resolveUrl(asset.objectKey, asset.visibility);
    const variantUrls = new Map<string, string>();
    for (const v of asset.variants) {
      if (v.objectKey !== asset.objectKey) {
        variantUrls.set(v.objectKey, await this.resolveUrl(v.objectKey, asset.visibility));
      } else {
        variantUrls.set(v.objectKey, url);
      }
    }
    return toAdminMediaAssetDto(asset, url, variantUrls);
  }

  async updateMedia(rawId: string, body: unknown): Promise<AdminMediaAssetDto> {
    const input = parseUpdateMediaBody(body);
    const asset = await this.mediaAssetService.updateMetadata(rawId, input);
    const url = await this.resolveUrl(asset.objectKey, asset.visibility);
    return toAdminMediaAssetDto(asset, url);
  }

  async deleteMedia(rawId: string): Promise<void> {
    await this.mediaAssetService.softDelete(rawId);

    void this.auditService?.log({
      actorType: 'admin',
      action: AuditAction.MEDIA_ASSET_DELETED,
      resourceType: 'media_asset',
      resourceId: rawId,
      after: { deletedAt: new Date().toISOString() },
      severity: 'warning',
    });
  }

  private async resolveUrl(objectKey: string, visibility: string): Promise<string> {
    if (visibility === 'public') {
      return this.storageService.getPublicUrl(objectKey);
    }
    try {
      return await this.storageService.getSignedUrl(objectKey);
    } catch (err) {
      this.logger.warn(`Failed to generate signed URL for ${objectKey}: ${String(err)}`);
      return '';
    }
  }
}
