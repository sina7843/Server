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

export interface UpdateTournamentParticipantDto {
  readonly seed?: number;
  readonly displayName?: string;
}

export interface AdminTournamentParticipantsClient {
  list(
    tournamentId: string,
    params?: AdminTournamentParticipantListParams,
  ): Promise<AdminTournamentParticipantListResponseDto>;
  update(
    tournamentId: string,
    participantId: string,
    input: UpdateTournamentParticipantDto,
  ): Promise<TournamentParticipantDto>;
  remove(tournamentId: string, participantId: string): Promise<void>;
  disqualify(tournamentId: string, participantId: string): Promise<TournamentParticipantDto>;
}
