import type { TournamentStandingsDto, RecalculateStandingsResultDto } from '@dragon/types';

export interface AdminTournamentStandingsClient {
  get(tournamentId: string): Promise<TournamentStandingsDto>;
  recalculate(tournamentId: string): Promise<RecalculateStandingsResultDto>;
}
