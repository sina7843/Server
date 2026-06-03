import { createAdminTournamentResultsClient } from '@dragon/sdk';
import type { ApiClient } from '@dragon/sdk';
import type {
  TournamentMatchResultDto,
  CreateMatchResultDto,
  UpdateMatchResultDto,
} from '@dragon/types';

export type { CreateMatchResultDto, UpdateMatchResultDto };

export async function recordResult(
  client: ApiClient,
  tournamentId: string,
  matchId: string,
  input: CreateMatchResultDto,
): Promise<TournamentMatchResultDto> {
  return createAdminTournamentResultsClient(client).record(tournamentId, matchId, input);
}

export async function updateResult(
  client: ApiClient,
  tournamentId: string,
  matchId: string,
  input: UpdateMatchResultDto,
): Promise<TournamentMatchResultDto> {
  return createAdminTournamentResultsClient(client).update(tournamentId, matchId, input);
}

export async function voidResult(
  client: ApiClient,
  tournamentId: string,
  matchId: string,
): Promise<void> {
  return createAdminTournamentResultsClient(client).void(tournamentId, matchId);
}
