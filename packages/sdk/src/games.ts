import type { ApiClient } from './client';
import type { GamesClient, GamesListParams } from './games-types';
import type { PublicGameDto, GameListResponseDto } from '@dragon/types';

export function createGamesClient(client: ApiClient): GamesClient {
  return {
    list(params?: GamesListParams): Promise<GameListResponseDto> {
      const search = new URLSearchParams();
      if (params?.status) search.set('status', params.status);
      if (params?.page !== undefined) search.set('page', String(params.page));
      if (params?.limit !== undefined) search.set('limit', String(params.limit));
      const qs = search.toString();
      return client.request<GameListResponseDto>({
        method: 'GET',
        path: `/api/v1/games${qs ? `?${qs}` : ''}`,
      });
    },

    getBySlug(slug: string): Promise<PublicGameDto> {
      return client.request<PublicGameDto>({
        method: 'GET',
        path: `/api/v1/games/${encodeURIComponent(slug)}`,
      });
    },
  };
}
