import type {
  TournamentMatchResultDto,
  CreateMatchResultDto,
  UpdateMatchResultDto,
} from '@dragon/types';

export interface AdminTournamentResultsClient {
  record(
    tournamentId: string,
    matchId: string,
    input: CreateMatchResultDto,
  ): Promise<TournamentMatchResultDto>;
  update(
    tournamentId: string,
    matchId: string,
    input: UpdateMatchResultDto,
  ): Promise<TournamentMatchResultDto>;
  void(tournamentId: string, matchId: string): Promise<void>;
}
