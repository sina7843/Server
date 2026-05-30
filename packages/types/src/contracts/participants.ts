// ─── Participant enums ───────────────────────────────────────────────────────

export type ParticipantStatus = 'active' | 'eliminated' | 'disqualified' | 'withdrawn';

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
