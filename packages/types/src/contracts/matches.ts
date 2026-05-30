// ─── Match enums ─────────────────────────────────────────────────────────────

export type TournamentMatchStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

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

export type TournamentMatchPublicDto = PublicTournamentMatchDto;

export interface AdminTournamentMatchDto extends TournamentMatchDto {
  readonly notes?: string;
}

export interface CreateTournamentMatchDto {
  readonly tournamentId: string;
  readonly round: number;
  readonly matchNumber: number;
  readonly participant1Id?: string;
  readonly participant2Id?: string;
  readonly scheduledAt?: string;
}

export interface UpdateTournamentMatchDto {
  readonly participant1Id?: string;
  readonly participant2Id?: string;
  readonly scheduledAt?: string;
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

export type TournamentMatchResultDto = TournamentResultDto;

export interface CreateMatchResultDto {
  readonly winnerId: string;
  readonly participant1Score?: number;
  readonly participant2Score?: number;
}

export interface UpdateTournamentResultDto {
  readonly winnerId: string;
  readonly participant1Score?: number;
  readonly participant2Score?: number;
  readonly notes?: string;
}

export type UpdateMatchResultDto = UpdateTournamentResultDto;
