import type { GameDocument } from '../../../games/game.schema';
import type { GameDto, GameListResponseDto } from '@dragon/types';

export function toAdminGameDto(game: GameDocument): GameDto {
  return {
    id: String(game._id),
    slug: game.slug,
    name: game.name,
    status: game.status,
    ...(game.description ? { description: game.description } : {}),
    ...(game.coverMediaId ? { coverMediaId: game.coverMediaId } : {}),
    ...(game.iconMediaId ? { iconMediaId: game.iconMediaId } : {}),
    createdAt: game.createdAt.toISOString(),
    updatedAt: game.updatedAt.toISOString(),
  };
}

export function toAdminGameListResponse(
  items: GameDocument[],
  total: number,
  page: number,
  limit: number,
): GameListResponseDto {
  return { items: items.map(toAdminGameDto), total, page, limit };
}

export function toAdminGameResponse(game: GameDocument): GameDto {
  return toAdminGameDto(game);
}
