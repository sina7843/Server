import { createHash } from 'node:crypto';
import { Inject, Injectable, Logger } from '@nestjs/common';
import type { MediaVisibility } from '@dragon/types';
import { STORAGE_CONFIG, type StorageConfig } from '../config/storage.config';
import { STORAGE_SERVICE, type StorageService } from '../storage/storage.service';
import { generateObjectKey } from '../storage/storage-object-key';
import { validateImageContent, validateUploadedFile } from './media-upload.config';
import { ImageProcessorService } from './image-processor.service';
import { MediaAssetService } from './media-asset.service';
import type { MediaAssetDocument } from './media-asset.schema';
import type { MediaAssetVariantInput } from './media-asset.types';

export interface MediaUploadPipelineInput {
  readonly file: {
    readonly buffer: Buffer;
    readonly mimetype: string;
    readonly originalname: string;
    readonly size: number;
  };
  readonly uploadedBy: string;
  readonly visibility: MediaVisibility;
  readonly namespace?: string;
  readonly alt?: string;
  readonly caption?: string;
}

@Injectable()
export class MediaUploadPipeline {
  private readonly logger = new Logger(MediaUploadPipeline.name);

  constructor(
    private readonly mediaAssetService: MediaAssetService,
    private readonly imageProcessor: ImageProcessorService,
    @Inject(STORAGE_SERVICE) private readonly storageService: StorageService,
    @Inject(STORAGE_CONFIG) private readonly storageConfig: StorageConfig,
  ) {}

  async upload(input: MediaUploadPipelineInput): Promise<MediaAssetDocument> {
    const { extension, safeOriginalName } = validateUploadedFile({
      originalname: input.file.originalname,
      mimetype: input.file.mimetype,
      size: input.file.size,
    });

    await validateImageContent(input.file.buffer, input.file.mimetype);

    const namespace = input.namespace ?? 'media/original';
    const objectKey = generateObjectKey({ namespace, mimeType: input.file.mimetype });
    const checksum = createHash('sha256').update(input.file.buffer).digest('hex');

    await this.storageService.upload({
      objectKey,
      body: input.file.buffer,
      mimeType: input.file.mimetype,
      sizeBytes: input.file.size,
      visibility: input.visibility,
      metadata: { uploadedBy: input.uploadedBy, originalName: safeOriginalName },
    });

    const isGif = input.file.mimetype === 'image/gif';
    const originalVariant: MediaAssetVariantInput = {
      type: 'original',
      objectKey,
      sizeBytes: input.file.size,
      mimeType: input.file.mimetype,
    };

    let asset = await this.mediaAssetService.create({
      originalName: safeOriginalName,
      fileName: objectKey.split('/').pop() ?? objectKey,
      mimeType: input.file.mimetype,
      extension,
      sizeBytes: input.file.size,
      storageProvider: this.storageConfig.provider,
      bucket: this.storageConfig.bucket,
      objectKey,
      visibility: input.visibility,
      uploadedBy: input.uploadedBy,
      status: isGif ? 'ready' : 'processing',
      checksum,
      variants: [originalVariant],
      ...(input.alt !== undefined ? { alt: input.alt } : {}),
      ...(input.caption !== undefined ? { caption: input.caption } : {}),
    });

    if (!isGif) {
      asset = await this.reprocessVariants(
        asset,
        input.file.buffer,
        input.file.mimetype,
        objectKey,
      );
    }

    return asset;
  }

  async reprocessVariants(
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
}
