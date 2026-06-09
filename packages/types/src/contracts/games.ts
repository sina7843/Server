// ─── Game enums ──────────────────────────────────────────────────────────────

export type GameStatus = 'active' | 'inactive' | 'archived';

// ─── Public response DTOs ────────────────────────────────────────────────────

export interface PublicGameDto {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description?: string;
  readonly coverMediaId?: string;
  readonly iconMediaId?: string;
  readonly coverImageUrl?: string;
  readonly iconImageUrl?: string;
}

// ─── Admin / internal response DTOs ─────────────────────────────────────────

export interface GameDto {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description?: string;
  readonly status: GameStatus;
  readonly coverMediaId?: string;
  readonly iconMediaId?: string;
  readonly coverImageUrl?: string;
  readonly iconImageUrl?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export type AdminGameDto = GameDto;
export type GamePublicDto = PublicGameDto;
export type CreateGameDto = Omit<GameDto, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateGameDto = Partial<Omit<GameDto, 'id' | 'createdAt' | 'updatedAt'>>;

// ─── Query / response envelopes ──────────────────────────────────────────────

export interface GameListQueryDto {
  readonly status?: GameStatus;
  readonly page?: number;
  readonly limit?: number;
}

export interface GamePublicListResponseDto {
  readonly items: readonly PublicGameDto[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
}

export interface GameListResponseDto {
  readonly items: readonly GameDto[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
}

export type AdminGameListResponseDto = GameListResponseDto;
