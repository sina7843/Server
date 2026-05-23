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
import { ImageProcessorService } from './image-processor.service';
import { validateUploadedFile } from './media-upload.config';
import { parseUpdateMediaBody, parseUploadMetadata } from './dto/admin-media-body';
import { parseAdminMediaListQuery } from './dto/admin-media-query';
import {
  toAdminMediaAssetDto,
  toAdminMediaListResponse,
  toAdminMediaUploadResponse,
} from './dto/admin-media-response';
import type { MediaAssetVariantInput } from './media-asset.types';
import type { MediaAssetDocument } from './media-asset.schema';

@Injectable()
export class AdminMediaService {
  private readonly logger = new Logger(AdminMediaService.name);

  constructor(
    private readonly mediaAssetService: MediaAssetService,
    private readonly imageProcessor: ImageProcessorService,
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

    const isGif = file.mimetype === 'image/gif';

    const originalVariant: MediaAssetVariantInput = {
      type: 'original',
      objectKey,
      sizeBytes: file.size,
      mimeType: file.mimetype,
    };

    let asset = await this.mediaAssetService.create({
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
      status: isGif ? 'ready' : 'processing',
      checksum,
      variants: [originalVariant],
      ...(metadata.alt !== undefined ? { alt: metadata.alt } : {}),
      ...(metadata.caption !== undefined ? { caption: metadata.caption } : {}),
    });

    if (!isGif) {
      asset = await this.processAndAttachVariants(asset, file.buffer, file.mimetype, objectKey);
    }

    const url = await this.resolveUrl(objectKey, metadata.visibility);
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

    const updatedAsset = await this.processAndAttachVariants(
      asset,
      buffer,
      asset.mimeType,
      asset.objectKey,
    );

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
  }

  private async processAndAttachVariants(
    asset: MediaAssetDocument,
    buffer: Buffer,
    mimeType: string,
    originalObjectKey: string,
  ): Promise<MediaAssetDocument> {
    const originalVariant: MediaAssetVariantInput = {
      type: 'original',
      objectKey: originalObjectKey,
      sizeBytes: asset.sizeBytes,
      mimeType,
    };

    try {
      const result = await this.imageProcessor.process(buffer, mimeType);
      const uploadedVariants: MediaAssetVariantInput[] = [originalVariant];

      for (const v of result.variants) {
        const variantKey = generateObjectKey({
          namespace: `media/variants/${v.type}`,
          mimeType: v.mimeType,
        });
        await this.storageService.upload({
          objectKey: variantKey,
          body: v.buffer,
          mimeType: v.mimeType,
          sizeBytes: v.sizeBytes,
          visibility: asset.visibility,
        });
        uploadedVariants.push({
          type: v.type,
          objectKey: variantKey,
          width: v.width,
          height: v.height,
          sizeBytes: v.sizeBytes,
          mimeType: v.mimeType,
        });
      }

      return this.mediaAssetService.updateVariants(String(asset._id), {
        status: 'ready',
        variants: uploadedVariants,
        ...(result.originalWidth !== undefined ? { width: result.originalWidth } : {}),
        ...(result.originalHeight !== undefined ? { height: result.originalHeight } : {}),
      });
    } catch (err) {
      this.logger.error(`Image processing failed for asset ${String(asset._id)}: ${String(err)}`);
      await this.mediaAssetService.updateVariants(String(asset._id), {
        status: 'failed',
        variants: [originalVariant],
      });
      return this.mediaAssetService.findById(String(asset._id));
    }
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
