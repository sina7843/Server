import type { GameDocument } from '../../game.schema';
import type { GamePublicDto, GamePublicListResponseDto } from '@dragon/types';

export function toPublicGameDto(game: GameDocument): GamePublicDto {
  return {
    id: String(game._id),
    slug: game.slug,
    name: game.name,
    ...(game.description ? { description: game.description } : {}),
    ...(game.coverMediaId ? { coverMediaId: game.coverMediaId } : {}),
    ...(game.iconMediaId ? { iconMediaId: game.iconMediaId } : {}),
  };
}

export function toPublicGameListResponse(
  items: GameDocument[],
  total: number,
  page: number,
  limit: number,
): GamePublicListResponseDto {
  return { items: items.map(toPublicGameDto), total, page, limit };
}
