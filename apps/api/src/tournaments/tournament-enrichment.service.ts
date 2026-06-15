import { Inject, Injectable, Optional } from '@nestjs/common';
import { Types } from 'mongoose';
import { MediaAssetRepository } from '../media/media-asset.repository';
import { STORAGE_SERVICE, type StorageService } from '../storage/storage.service';
import { GameRepository } from '../games/game.repository';
import type { TournamentDocument } from './tournament.schema';
import type { TournamentEnrichment } from './tournament-projection';

function toObjectId(id: string): Types.ObjectId | null {
  try {
    return new Types.ObjectId(id);
  } catch {
    return null;
  }
}

@Injectable()
export class TournamentEnrichmentService {
  constructor(
    private readonly gameRepository: GameRepository,
    @Optional() private readonly mediaAssetRepository?: MediaAssetRepository,
    @Optional() @Inject(STORAGE_SERVICE) private readonly storageService?: StorageService,
  ) {}

  async enrichMany(docs: TournamentDocument[]): Promise<Map<string, TournamentEnrichment>> {
    const result = new Map<string, TournamentEnrichment>();
    if (!docs.length || !this.mediaAssetRepository || !this.storageService) return result;

    // Collect unique tournament cover media IDs
    const tournamentCoverIds = docs
      .filter((d) => d.coverMediaId)
      .map((d) => d.coverMediaId as string);

    // Collect unique game IDs for game-cover fallback
    const gameIds = [...new Set(docs.map((d) => d.gameId))];

    // Batch-fetch tournament cover media and game docs in parallel
    const [tournamentMediaAssets, games] = await Promise.all([
      tournamentCoverIds.length
        ? this.mediaAssetRepository
            .findManyByIds(
              tournamentCoverIds.map(toObjectId).filter((id): id is Types.ObjectId => id !== null),
            )
            .catch(() => [])
        : Promise.resolve([]),
      gameIds.length
        ? this.gameRepository.findManyByIds(gameIds).catch(() => [])
        : Promise.resolve([]),
    ]);

    // Build tournament cover URL map: mediaId → objectKey
    const mediaCoverMap = new Map(
      tournamentMediaAssets.map((m) => [String(m._id), m.objectKey]),
    );

    // Build game cover URL map: gameId → coverImageUrl
    const gameCoverMap = new Map<string, string>();
    if (games.length) {
      const gameCoverMediaIds = games
        .filter((g) => g.coverMediaId)
        .map((g) => g.coverMediaId as string);

      if (gameCoverMediaIds.length) {
        const gameMediaAssets = await this.mediaAssetRepository
          .findManyByIds(
            gameCoverMediaIds.map(toObjectId).filter((id): id is Types.ObjectId => id !== null),
          )
          .catch(() => []);

        const gameMediaMap = new Map(gameMediaAssets.map((m) => [String(m._id), m.objectKey]));

        for (const game of games) {
          if (game.coverMediaId) {
            const objectKey = gameMediaMap.get(String(game.coverMediaId));
            if (objectKey) {
              gameCoverMap.set(String(game._id), this.storageService.getPublicUrl(objectKey));
            }
          }
        }
      }
    }

    for (const doc of docs) {
      let coverImageUrl: string | undefined;
      let gameCoverImageUrl: string | undefined;

      if (doc.coverMediaId) {
        const objectKey = mediaCoverMap.get(String(doc.coverMediaId));
        if (objectKey) {
          coverImageUrl = this.storageService.getPublicUrl(objectKey);
        }
      }

      const gameCoverUrl = gameCoverMap.get(doc.gameId);
      if (gameCoverUrl) {
        gameCoverImageUrl = gameCoverUrl;
      }

      if (coverImageUrl !== undefined || gameCoverImageUrl !== undefined) {
        result.set(String(doc._id), {
          ...(coverImageUrl !== undefined ? { coverImageUrl } : {}),
          ...(gameCoverImageUrl !== undefined ? { gameCoverImageUrl } : {}),
        });
      }
    }

    return result;
  }

  async enrichOne(doc: TournamentDocument): Promise<TournamentEnrichment> {
    const map = await this.enrichMany([doc]);
    return map.get(String(doc._id)) ?? {};
  }
}
