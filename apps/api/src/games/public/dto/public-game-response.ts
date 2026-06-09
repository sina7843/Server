import type { GameDocument } from '../../game.schema';
import type { GameEnrichment } from '../../game-enrichment.service';
import type { GamePublicDto, GamePublicListResponseDto } from '@dragon/types';

export function toPublicGameDto(game: GameDocument, enrichment: GameEnrichment = {}): GamePublicDto {
  return {
    id: String(game._id),
    slug: game.slug,
    name: game.name,
    ...(game.description ? { description: game.description } : {}),
    ...(game.coverMediaId ? { coverMediaId: game.coverMediaId } : {}),
    ...(game.iconMediaId ? { iconMediaId: game.iconMediaId } : {}),
    ...(enrichment.coverImageUrl ? { coverImageUrl: enrichment.coverImageUrl } : {}),
    ...(enrichment.iconImageUrl ? { iconImageUrl: enrichment.iconImageUrl } : {}),
  };
}

export function toPublicGameListResponse(
  items: GameDocument[],
  total: number,
  page: number,
  limit: number,
  enrichmentMap: Map<string, GameEnrichment> = new Map(),
): GamePublicListResponseDto {
  return {
    items: items.map((g) => toPublicGameDto(g, enrichmentMap.get(String(g._id)))),
    total,
    page,
    limit,
  };
}
