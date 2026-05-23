import { Injectable, NotFoundException } from '@nestjs/common';
import { MediaAssetRepository } from './media-asset.repository';
import type { MediaAssetDocument } from './media-asset.schema';
import type {
  CreateMediaAssetInput,
  MediaAssetListFilter,
  UpdateMediaAssetMetadataInput,
} from './media-asset.types';
import { validateObjectId } from '../rbac/dto/rbac-validation';

@Injectable()
export class MediaAssetService {
  constructor(private readonly repository: MediaAssetRepository) {}

  async create(input: CreateMediaAssetInput): Promise<MediaAssetDocument> {
    return this.repository.create(input);
  }

  async findById(rawId: string): Promise<MediaAssetDocument> {
    const id = validateObjectId(rawId, 'id');
    const asset = await this.repository.findById(id);
    if (!asset || asset.deletedAt) throw new NotFoundException('Media asset not found.');
    return asset;
  }

  async updateMetadata(
    rawId: string,
    input: UpdateMediaAssetMetadataInput,
  ): Promise<MediaAssetDocument> {
    const id = validateObjectId(rawId, 'id');
    const asset = await this.repository.updateMetadata(id, input);
    if (!asset) throw new NotFoundException('Media asset not found.');
    return asset;
  }

  async softDelete(rawId: string): Promise<MediaAssetDocument> {
    const id = validateObjectId(rawId, 'id');
    const asset = await this.repository.softDelete(id);
    if (!asset) throw new NotFoundException('Media asset not found or already deleted.');
    return asset;
  }

  list(
    filter: MediaAssetListFilter,
    page: number,
    limit: number,
  ): Promise<{ items: MediaAssetDocument[]; total: number }> {
    return this.repository.list(filter, page, limit);
  }
}
