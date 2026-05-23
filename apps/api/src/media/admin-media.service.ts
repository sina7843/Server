import { createHash } from 'node:crypto';
import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import type {
  AdminMediaAssetDto,
  AdminMediaListResponseDto,
  AdminMediaUploadResponseDto,
} from '@dragon/types';
import { STORAGE_CONFIG, type StorageConfig } from '../config/storage.config';
import { STORAGE_SERVICE, type StorageService } from '../storage/storage.service';
import { generateObjectKey } from '../storage/storage-object-key';
import { MediaAssetService } from './media-asset.service';
import { validateUploadedFile } from './media-upload.config';
import { parseUpdateMediaBody, parseUploadMetadata } from './dto/admin-media-body';
import { parseAdminMediaListQuery } from './dto/admin-media-query';
import {
  toAdminMediaAssetDto,
  toAdminMediaListResponse,
  toAdminMediaUploadResponse,
} from './dto/admin-media-response';
import type { UpdateMediaAssetMetadataInput } from './media-asset.types';

@Injectable()
export class AdminMediaService {
  private readonly logger = new Logger(AdminMediaService.name);

  constructor(
    private readonly mediaAssetService: MediaAssetService,
    @Inject(STORAGE_SERVICE) private readonly storageService: StorageService,
    @Inject(STORAGE_CONFIG) private readonly storageConfig: StorageConfig,
  ) {}

  async uploadMedia(
    file: Express.Multer.File,
    body: unknown,
    uploadedBy: string,
  ): Promise<AdminMediaUploadResponseDto> {
    if (!file) {
      throw new BadRequestException('No file was uploaded.');
    }

    const { extension, safeOriginalName } = validateUploadedFile({
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    });

    const metadata = parseUploadMetadata(body);

    const objectKey = generateObjectKey({
      namespace: 'media/original',
      mimeType: file.mimetype,
    });

    const checksum = createHash('sha256').update(file.buffer).digest('hex');

    await this.storageService.upload({
      objectKey,
      body: file.buffer,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      visibility: metadata.visibility,
      metadata: { uploadedBy, originalName: safeOriginalName },
    });

    const asset = await this.mediaAssetService.create({
      originalName: safeOriginalName,
      fileName: objectKey.split('/').pop() ?? objectKey,
      mimeType: file.mimetype,
      extension,
      sizeBytes: file.size,
      storageProvider: this.storageConfig.provider,
      bucket: this.storageConfig.bucket,
      objectKey,
      visibility: metadata.visibility,
      uploadedBy,
      status: 'ready',
      checksum,
      variants: [
        {
          type: 'original',
          objectKey,
          sizeBytes: file.size,
          mimeType: file.mimetype,
        },
      ],
      ...(metadata.alt !== undefined ? {} : {}),
    });

    if (metadata.alt !== undefined || metadata.caption !== undefined) {
      const update: UpdateMediaAssetMetadataInput = {};
      if (metadata.alt !== undefined) (update as Record<string, unknown>)['alt'] = metadata.alt;
      if (metadata.caption !== undefined)
        (update as Record<string, unknown>)['caption'] = metadata.caption;
      await this.mediaAssetService.updateMetadata(String(asset._id), update);
    }

    const url = await this.resolveUrl(objectKey, metadata.visibility);
    const dto = toAdminMediaAssetDto(asset, url);
    return toAdminMediaUploadResponse(dto);
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
      items.map(async (asset) => {
        const url = await this.resolveUrl(asset.objectKey, asset.visibility);
        return toAdminMediaAssetDto(asset, url);
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
  }

  private async resolveUrl(objectKey: string, visibility: string): Promise<string> {
    if (visibility === 'public') {
      return this.storageService.getPublicUrl(objectKey);
    }
    try {
      return await this.storageService.getSignedUrl(objectKey);
    } catch (err) {
      this.logger.warn(`Failed to generate signed URL for ${objectKey}: ${String(err)}`);
      return this.storageService.getPublicUrl(objectKey);
    }
  }
}
