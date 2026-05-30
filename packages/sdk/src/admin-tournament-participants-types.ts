import type { TournamentParticipantDto, ParticipantStatus } from '@dragon/types';

export interface AdminTournamentParticipantListParams {
  readonly status?: ParticipantStatus;
  readonly page?: number;
  readonly limit?: number;
}

export interface AdminTournamentParticipantListResponseDto {
  readonly items: readonly TournamentParticipantDto[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
}

export interface AdminTournamentParticipantsClient {
  list(
    tournamentId: string,
    params?: AdminTournamentParticipantListParams,
  ): Promise<AdminTournamentParticipantListResponseDto>;
}
