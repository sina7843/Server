import { createAdminTournamentStandingsClient } from '@dragon/sdk';
import type { ApiClient } from '@dragon/sdk';
import type { TournamentStandingsDto, RecalculateStandingsResultDto } from '@dragon/types';

export async function getStandings(
  client: ApiClient,
  tournamentId: string,
): Promise<TournamentStandingsDto> {
  return createAdminTournamentStandingsClient(client).get(tournamentId);
}

export async function recalculateStandings(
  client: ApiClient,
  tournamentId: string,
): Promise<RecalculateStandingsResultDto> {
  return createAdminTournamentStandingsClient(client).recalculate(tournamentId);
}
