import type {
  GameDto,
  GamePublicListResponseDto,
  GameListResponseDto,
  GameListQueryDto,
} from '@dragon/types';

export type GamesListParams = GameListQueryDto;

export interface PublicGamesListParams {
  readonly page?: number;
  readonly limit?: number;
}

export interface GamesClient {
  list(params?: PublicGamesListParams): Promise<GamePublicListResponseDto>;
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
