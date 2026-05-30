// ─── Standing DTOs ───────────────────────────────────────────────────────────

import type { TournamentFormat } from './tournaments';

export interface TournamentStandingDto {
  readonly rank: number;
  readonly participantId: string;
  readonly displayName: string;
  readonly wins: number;
  readonly losses: number;
  readonly points: number;
}

export interface TournamentStandingsDto {
  readonly tournamentId: string;
  readonly format: TournamentFormat;
  readonly standings: readonly TournamentStandingDto[];
  readonly updatedAt: string;
}

export interface RecalculateStandingsResultDto {
  readonly success: boolean;
  readonly tournamentId: string;
  readonly recalculatedAt: string;
}
