import type {
  AdminTournamentMatchDto,
  TournamentMatchStatus,
  TournamentResultDto,
  UpdateTournamentResultDto,
} from '@dragon/types';

export interface AdminTournamentMatchListParams {
  readonly round?: number;
  readonly status?: TournamentMatchStatus;
  readonly page?: number;
  readonly limit?: number;
}

export interface AdminTournamentMatchListResponseDto {
  readonly items: readonly AdminTournamentMatchDto[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
}

export interface AdminTournamentMatchesClient {
  list(
    tournamentId: string,
    params?: AdminTournamentMatchListParams,
  ): Promise<AdminTournamentMatchListResponseDto>;
  getById(tournamentId: string, matchId: string): Promise<AdminTournamentMatchDto>;
  updateResult(
    tournamentId: string,
    matchId: string,
    input: UpdateTournamentResultDto,
  ): Promise<TournamentResultDto>;
}
