import type {
  GameDto,
  GamePublicListResponseDto,
  GameListResponseDto,
  GameListQueryDto,
} from '@dragon/types';

export type GamesListParams = GameListQueryDto;

export interface GamesClient {
  list(params?: GamesListParams): Promise<GamePublicListResponseDto>;
}

export interface AdminGamesClient {
  list(params?: GamesListParams): Promise<GameListResponseDto>;
  get(id: string): Promise<GameDto>;
  create(input: Omit<GameDto, 'id' | 'createdAt' | 'updatedAt'>): Promise<GameDto>;
  update(
    id: string,
    input: Partial<Omit<GameDto, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<GameDto>;
  delete(id: string): Promise<void>;
}
