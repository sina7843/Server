// ─── Match enums ─────────────────────────────────────────────────────────────

export type TournamentMatchStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'bye';

// ─── Match DTOs ──────────────────────────────────────────────────────────────

export interface TournamentMatchDto {
  readonly id: string;
  readonly tournamentId: string;
  readonly round: number;
  readonly matchNumber: number;
  readonly status: TournamentMatchStatus;
  readonly participant1Id?: string;
  readonly participant2Id?: string;
  readonly winnerId?: string;
  readonly scheduledAt?: string;
  readonly completedAt?: string;
}

export interface PublicTournamentMatchDto {
  readonly id: string;
  readonly round: number;
  readonly matchNumber: number;
  readonly status: TournamentMatchStatus;
  readonly participant1Id?: string;
  readonly participant2Id?: string;
  readonly winnerId?: string;
  readonly scheduledAt?: string;
}

export interface AdminTournamentMatchDto extends TournamentMatchDto {
  readonly notes?: string;
}

// ─── Result DTOs ─────────────────────────────────────────────────────────────

export interface TournamentResultDto {
  readonly matchId: string;
  readonly tournamentId: string;
  readonly winnerId: string;
  readonly participant1Score?: number;
  readonly participant2Score?: number;
  readonly recordedAt: string;
}

export interface UpdateTournamentResultDto {
  readonly winnerId: string;
  readonly participant1Score?: number;
  readonly participant2Score?: number;
  readonly notes?: string;
}
