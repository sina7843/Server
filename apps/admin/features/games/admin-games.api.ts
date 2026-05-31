import { createAdminGamesClient } from '@dragon/sdk';
import type { ApiClient, GamesListParams } from '@dragon/sdk';
import type { GameDto, GameListResponseDto } from '@dragon/types';

export type CreateGameInput = Omit<GameDto, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateGameInput = Partial<Omit<GameDto, 'id' | 'createdAt' | 'updatedAt'>>;

export async function listGames(
  client: ApiClient,
  params?: GamesListParams,
): Promise<GameListResponseDto> {
  return createAdminGamesClient(client).list(params);
}

export async function getGame(client: ApiClient, id: string): Promise<GameDto> {
  return createAdminGamesClient(client).get(id);
}

export async function createGame(client: ApiClient, input: CreateGameInput): Promise<GameDto> {
  return createAdminGamesClient(client).create(input);
}

export async function updateGame(
  client: ApiClient,
  id: string,
  input: UpdateGameInput,
): Promise<GameDto> {
  return createAdminGamesClient(client).update(id, input);
}

export async function deleteGame(client: ApiClient, id: string): Promise<void> {
  return createAdminGamesClient(client).delete(id);
}
