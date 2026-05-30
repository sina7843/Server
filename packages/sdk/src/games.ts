import type { ApiClient } from './client';
import type { GamesClient, GamesListParams } from './games-types';
import type { GamePublicListResponseDto } from '@dragon/types';

export function createGamesClient(client: ApiClient): GamesClient {
  return {
    list(params?: GamesListParams): Promise<GamePublicListResponseDto> {
      const search = new URLSearchParams();
      if (params?.status) search.set('status', params.status);
      if (params?.page !== undefined) search.set('page', String(params.page));
      if (params?.limit !== undefined) search.set('limit', String(params.limit));
      const qs = search.toString();
      return client.request<GamePublicListResponseDto>({
        method: 'GET',
        path: `/api/v1/games${qs ? `?${qs}` : ''}`,
      });
    },
  };
}
