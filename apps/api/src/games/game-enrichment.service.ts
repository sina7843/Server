import { Inject, Injectable, Optional } from '@nestjs/common';
import { Types } from 'mongoose';
import type { MediaAssetRepository } from '../media/media-asset.repository';
import { STORAGE_SERVICE, type StorageService } from '../storage/storage.service';
import type { GameDocument } from './game.schema';

export interface GameEnrichment {
  readonly coverImageUrl?: string;
  readonly iconImageUrl?: string;
}

function toObjectId(id: string): Types.ObjectId | null {
  try {
    return new Types.ObjectId(id);
  } catch {
    return null;
  }
}

@Injectable()
export class GameEnrichmentService {
  constructor(
    @Optional() private readonly mediaAssetRepository?: MediaAssetRepository,
    @Optional() @Inject(STORAGE_SERVICE) private readonly storageService?: StorageService,
  ) {}

  async enrichMany(docs: GameDocument[]): Promise<Map<string, GameEnrichment>> {
    const result = new Map<string, GameEnrichment>();
    if (!docs.length || !this.mediaAssetRepository || !this.storageService) return result;

    const coverIds = docs.filter((d) => d.coverMediaId).map((d) => d.coverMediaId as string);
    const iconIds = docs.filter((d) => d.iconMediaId).map((d) => d.iconMediaId as string);

    const allIds = [...new Set([...coverIds, ...iconIds])]
      .map(toObjectId)
      .filter((id): id is Types.ObjectId => id !== null);

    if (!allIds.length) return result;

    const assets = await this.mediaAssetRepository.findManyByIds(allIds).catch(() => []);
    const assetMap = new Map(assets.map((a) => [String(a._id), a.objectKey]));

    for (const doc of docs) {
      let coverImageUrl: string | undefined;
      let iconImageUrl: string | undefined;

      if (doc.coverMediaId) {
        const key = assetMap.get(doc.coverMediaId);
        if (key) coverImageUrl = this.storageService.getPublicUrl(key);
      }

      if (doc.iconMediaId) {
        const key = assetMap.get(doc.iconMediaId);
        if (key) iconImageUrl = this.storageService.getPublicUrl(key);
      }

      if (coverImageUrl !== undefined || iconImageUrl !== undefined) {
        result.set(String(doc._id), {
          ...(coverImageUrl !== undefined ? { coverImageUrl } : {}),
          ...(iconImageUrl !== undefined ? { iconImageUrl } : {}),
        });
      }
    }

    return result;
  }

  async enrichOne(doc: GameDocument): Promise<GameEnrichment> {
    const map = await this.enrichMany([doc]);
    return map.get(String(doc._id)) ?? {};
  }
}
