import type { ApiClient } from './client';
import type { AdminGamesClient, GamesListParams } from './games-types';
import type { GameDto, GameListResponseDto, GameStatus } from '@dragon/types';

export function createAdminGamesClient(client: ApiClient): AdminGamesClient {
  return {
    list(params?: GamesListParams): Promise<GameListResponseDto> {
      const search = new URLSearchParams();
      if (params?.status) search.set('status', params.status);
      if (params?.page !== undefined) search.set('page', String(params.page));
      if (params?.limit !== undefined) search.set('limit', String(params.limit));
      const qs = search.toString();
      return client.request<GameListResponseDto>({
        method: 'GET',
        path: `/admin/v1/games${qs ? `?${qs}` : ''}`,
      });
    },

    get(id: string): Promise<GameDto> {
      return client.request<GameDto>({
        method: 'GET',
        path: `/admin/v1/games/${encodeURIComponent(id)}`,
      });
    },

    create(input: Omit<GameDto, 'id' | 'createdAt' | 'updatedAt'>): Promise<GameDto> {
      return client.request<GameDto>({
        method: 'POST',
        path: '/admin/v1/games',
        body: JSON.stringify(input),
        headers: { 'Content-Type': 'application/json' },
      });
    },

    update(
      id: string,
      input: Partial<Omit<GameDto, 'id' | 'createdAt' | 'updatedAt'>>,
    ): Promise<GameDto> {
      return client.request<GameDto>({
        method: 'PATCH',
        path: `/admin/v1/games/${encodeURIComponent(id)}`,
        body: JSON.stringify(input),
        headers: { 'Content-Type': 'application/json' },
      });
    },

    updateStatus(id: string, status: GameStatus): Promise<GameDto> {
      return client.request<GameDto>({
        method: 'PATCH',
        path: `/admin/v1/games/${encodeURIComponent(id)}/status`,
        body: JSON.stringify({ status }),
        headers: { 'Content-Type': 'application/json' },
      });
    },

    delete(id: string): Promise<void> {
      return client.request<void>({
        method: 'DELETE',
        path: `/admin/v1/games/${encodeURIComponent(id)}`,
      });
    },
  };
}
