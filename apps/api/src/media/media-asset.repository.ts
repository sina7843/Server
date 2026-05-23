import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MediaAsset, type MediaAssetDocument } from './media-asset.schema';
import type {
  CreateMediaAssetInput,
  MediaAssetId,
  MediaAssetListFilter,
  UpdateMediaAssetMetadataInput,
  UpdateMediaAssetVariantsInput,
} from './media-asset.types';

@Injectable()
export class MediaAssetRepository {
  constructor(@InjectModel(MediaAsset.name) private readonly model: Model<MediaAssetDocument>) {}

  findById(id: MediaAssetId): Promise<MediaAssetDocument | null> {
    return this.model.findById(id).exec();
  }

  async create(input: CreateMediaAssetInput): Promise<MediaAssetDocument> {
    const doc = new this.model({
      originalName: input.originalName,
      fileName: input.fileName,
      mimeType: input.mimeType,
      extension: input.extension,
      sizeBytes: input.sizeBytes,
      storageProvider: input.storageProvider,
      bucket: input.bucket,
      objectKey: input.objectKey,
      visibility: input.visibility,
      uploadedBy: new Types.ObjectId(input.uploadedBy),
      status: input.status,
      ...(input.checksum !== undefined ? { checksum: input.checksum } : {}),
      ...(input.alt !== undefined ? { alt: input.alt } : {}),
      ...(input.caption !== undefined ? { caption: input.caption } : {}),
      variants: input.variants ?? [],
    });
    return doc.save();
  }

  async updateVariants(
    id: MediaAssetId,
    input: UpdateMediaAssetVariantsInput,
  ): Promise<MediaAssetDocument | null> {
    const update: Record<string, unknown> = { status: input.status, variants: input.variants };
    if (input.width !== undefined) update.width = input.width;
    if (input.height !== undefined) update.height = input.height;
    return this.model.findOneAndUpdate({ _id: id }, { $set: update }, { new: true }).exec();
  }

  async updateMetadata(
    id: MediaAssetId,
    input: UpdateMediaAssetMetadataInput,
  ): Promise<MediaAssetDocument | null> {
    const update: Record<string, unknown> = {};
    if (input.visibility !== undefined) update.visibility = input.visibility;
    if (input.alt !== undefined) update.alt = input.alt;
    if (input.caption !== undefined) update.caption = input.caption;
    return this.model
      .findOneAndUpdate({ _id: id, deletedAt: { $exists: false } }, { $set: update }, { new: true })
      .exec();
  }

  async softDelete(id: MediaAssetId): Promise<MediaAssetDocument | null> {
    return this.model
      .findOneAndUpdate(
        { _id: id, deletedAt: { $exists: false } },
        { $set: { deletedAt: new Date() } },
        { new: true },
      )
      .exec();
  }

  async list(
    filter: MediaAssetListFilter,
    page: number,
    limit: number,
  ): Promise<{ items: MediaAssetDocument[]; total: number }> {
    const query: Record<string, unknown> = {};
    if (!filter.includeDeleted) query.deletedAt = { $exists: false };
    if (filter.visibility !== undefined) query.visibility = filter.visibility;
    if (filter.status !== undefined) query.status = filter.status;
    if (filter.mimeType !== undefined) query.mimeType = filter.mimeType;

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.model.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      this.model.countDocuments(query).exec(),
    ]);
    return { items, total };
  }
}
