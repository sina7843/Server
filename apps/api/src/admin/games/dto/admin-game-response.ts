import type { GameDocument } from '../../../games/game.schema';
import type { GameEnrichment } from '../../../games/game-enrichment.service';
import type { GameDto, GameListResponseDto } from '@dragon/types';

export function toAdminGameDto(game: GameDocument, enrichment: GameEnrichment = {}): GameDto {
  return {
    id: String(game._id),
    slug: game.slug,
    name: game.name,
    status: game.status,
    ...(game.description ? { description: game.description } : {}),
    ...(game.coverMediaId ? { coverMediaId: game.coverMediaId } : {}),
    ...(game.iconMediaId ? { iconMediaId: game.iconMediaId } : {}),
    ...(enrichment.coverImageUrl ? { coverImageUrl: enrichment.coverImageUrl } : {}),
    ...(enrichment.iconImageUrl ? { iconImageUrl: enrichment.iconImageUrl } : {}),
    createdAt: game.createdAt.toISOString(),
    updatedAt: game.updatedAt.toISOString(),
  };
}

export function toAdminGameListResponse(
  items: GameDocument[],
  total: number,
  page: number,
  limit: number,
  enrichmentMap: Map<string, GameEnrichment> = new Map(),
): GameListResponseDto {
  return {
    items: items.map((g) => toAdminGameDto(g, enrichmentMap.get(String(g._id)))),
    total,
    page,
    limit,
  };
}

export function toAdminGameResponse(game: GameDocument, enrichment: GameEnrichment = {}): GameDto {
  return toAdminGameDto(game, enrichment);
}
