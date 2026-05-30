import type { PublicGameDto, GameDto, GameListQueryDto, GameListResponseDto } from '@dragon/types';

export type GamesListParams = GameListQueryDto;

export interface GamesClient {
  list(params?: GamesListParams): Promise<GameListResponseDto>;
  getBySlug(slug: string): Promise<PublicGameDto>;
}

export interface AdminGamesClient {
  list(params?: GamesListParams): Promise<GameListResponseDto>;
  getById(id: string): Promise<GameDto>;
  create(input: Omit<GameDto, 'id' | 'createdAt' | 'updatedAt'>): Promise<GameDto>;
  update(
    id: string,
    input: Partial<Omit<GameDto, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<GameDto>;
  updateStatus(id: string, status: GameDto['status']): Promise<GameDto>;
}
