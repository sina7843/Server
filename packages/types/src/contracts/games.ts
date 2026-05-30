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
  readonly createdAt: string;
  readonly updatedAt: string;
}

export type AdminGameDto = GameDto;

export type GamePublicDto = PublicGameDto;

export interface CreateGameDto {
  readonly slug: string;
  readonly name: string;
  readonly description?: string;
  readonly coverMediaId?: string;
  readonly iconMediaId?: string;
}

export interface UpdateGameDto {
  readonly name?: string;
  readonly description?: string;
  readonly coverMediaId?: string;
  readonly iconMediaId?: string;
  readonly status?: GameStatus;
}

// ─── Query / response envelopes ──────────────────────────────────────────────

export interface GameListQueryDto {
  readonly status?: GameStatus;
  readonly page?: number;
  readonly limit?: number;
}

export interface GameListResponseDto {
  readonly items: readonly GameDto[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
}
