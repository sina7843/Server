import type { GameStatus } from '@dragon/types';
import type { Types } from 'mongoose';

export type GameId = Types.ObjectId | string;

export interface CreateGameInput {
  readonly name: string;
  readonly slug: string;
  readonly slugNormalized?: string;
  readonly description?: string;
  readonly status?: GameStatus;
  readonly coverMediaId?: string;
  readonly iconMediaId?: string;
}

export interface UpdateGameInput {
  readonly name?: string;
  readonly slug?: string;
  readonly slugNormalized?: string;
  readonly description?: string;
  readonly status?: GameStatus;
  readonly coverMediaId?: string;
  readonly iconMediaId?: string;
}

export interface GameListFilter {
  readonly status?: GameStatus;
  readonly includeDeleted?: boolean;
}
