import { createAdminTournamentMatchesClient } from '@dragon/sdk';
import type { ApiClient } from '@dragon/sdk';
import type {
  AdminTournamentMatchDto,
  CreateTournamentMatchDto,
  UpdateTournamentMatchDto,
} from '@dragon/types';
import type {
  AdminTournamentMatchListParams,
  AdminTournamentMatchListResponseDto,
} from '@dragon/sdk';

export type { CreateTournamentMatchDto, UpdateTournamentMatchDto };

export async function listMatches(
  client: ApiClient,
  tournamentId: string,
  params?: AdminTournamentMatchListParams,
): Promise<AdminTournamentMatchListResponseDto> {
  return createAdminTournamentMatchesClient(client).list(tournamentId, params);
}

export async function createMatch(
  client: ApiClient,
  tournamentId: string,
  input: CreateTournamentMatchDto,
): Promise<AdminTournamentMatchDto> {
  return createAdminTournamentMatchesClient(client).create(tournamentId, input);
}

export async function generateMatches(
  client: ApiClient,
  tournamentId: string,
): Promise<AdminTournamentMatchListResponseDto> {
  return createAdminTournamentMatchesClient(client).generate(tournamentId);
}

export async function updateMatch(
  client: ApiClient,
  tournamentId: string,
  matchId: string,
  input: UpdateTournamentMatchDto,
): Promise<AdminTournamentMatchDto> {
  return createAdminTournamentMatchesClient(client).update(tournamentId, matchId, input);
}

export async function cancelMatch(
  client: ApiClient,
  tournamentId: string,
  matchId: string,
): Promise<AdminTournamentMatchDto> {
  return createAdminTournamentMatchesClient(client).cancel(tournamentId, matchId);
}
