// ─── Participant enums ───────────────────────────────────────────────────────

export type ParticipantStatus = 'active' | 'withdrawn' | 'disqualified' | 'removed';

// ─── Response DTOs ───────────────────────────────────────────────────────────

export interface ParticipantDto {
  readonly id: string;
  readonly tournamentId: string;
  readonly userId: string;
  readonly displayName: string;
  readonly seed?: number;
  readonly status: ParticipantStatus;
  readonly teamName?: string;
}

export interface TournamentParticipantDto {
  readonly id: string;
  readonly userId: string;
  readonly displayName: string;
  readonly seed?: number;
  readonly status: ParticipantStatus;
  readonly teamName?: string;
}

export interface TournamentParticipantPublicDto {
  readonly id: string;
  readonly displayName: string;
  readonly seed?: number;
  readonly status: ParticipantStatus;
  readonly teamName?: string;
}

export interface TournamentParticipantListResponseDto {
  readonly items: readonly TournamentParticipantPublicDto[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
}
