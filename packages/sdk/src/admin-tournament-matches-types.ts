import type {
  AdminTournamentMatchDto,
  TournamentMatchStatus,
  CreateTournamentMatchDto,
  UpdateTournamentMatchDto,
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
  create(tournamentId: string, input: CreateTournamentMatchDto): Promise<AdminTournamentMatchDto>;
  generate(tournamentId: string): Promise<AdminTournamentMatchListResponseDto>;
  update(
    tournamentId: string,
    matchId: string,
    input: UpdateTournamentMatchDto,
  ): Promise<AdminTournamentMatchDto>;
  cancel(tournamentId: string, matchId: string): Promise<AdminTournamentMatchDto>;
}
