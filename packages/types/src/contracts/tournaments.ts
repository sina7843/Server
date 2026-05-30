// ─── Tournament enums ────────────────────────────────────────────────────────

export type TournamentStatus =
  | 'draft'
  | 'published'
  | 'registration_open'
  | 'registration_closed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'archived';

export type TournamentFormat = 'single_elimination' | 'round_robin' | 'manual';

export type TournamentParticipantType = 'individual' | 'team';

// ─── Public response DTOs ────────────────────────────────────────────────────

export interface PublicTournamentDto {
  readonly id: string;
  readonly gameId: string;
  readonly title: string;
  readonly slug: string;
  readonly description?: string;
  readonly format: TournamentFormat;
  readonly status: TournamentStatus;
  readonly capacity: number;
  readonly registrationOpenAt?: string;
  readonly registrationCloseAt?: string;
  readonly startsAt?: string;
  readonly endsAt?: string;
  readonly rules?: string;
  readonly publishedAt?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface TournamentListItemDto {
  readonly id: string;
  readonly gameId: string;
  readonly title: string;
  readonly slug: string;
  readonly format: TournamentFormat;
  readonly status: TournamentStatus;
  readonly capacity: number;
  readonly startsAt?: string;
  readonly publishedAt?: string;
}

export type TournamentSummaryDto = TournamentListItemDto;

// ─── Admin response DTOs ─────────────────────────────────────────────────────

export interface TournamentDto {
  readonly id: string;
  readonly gameId: string;
  readonly title: string;
  readonly slug: string;
  readonly description?: string;
  readonly format: TournamentFormat;
  readonly status: TournamentStatus;
  readonly capacity: number;
  readonly registrationOpenAt?: string;
  readonly registrationCloseAt?: string;
  readonly startsAt?: string;
  readonly endsAt?: string;
  readonly rules?: string;
  readonly publishedAt?: string;
  readonly cancelledAt?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export type TournamentDetailDto = TournamentDto;

export type AdminTournamentDto = TournamentDto;

// ─── Input DTOs ──────────────────────────────────────────────────────────────

export interface CreateTournamentDto {
  readonly gameId: string;
  readonly title: string;
  readonly slug: string;
  readonly description?: string;
  readonly format: TournamentFormat;
  readonly capacity: number;
  readonly registrationOpenAt?: string;
  readonly registrationCloseAt?: string;
  readonly startsAt?: string;
  readonly endsAt?: string;
  readonly rules?: string;
}

export interface UpdateTournamentDto {
  readonly title?: string;
  readonly description?: string;
  readonly capacity?: number;
  readonly registrationOpenAt?: string;
  readonly registrationCloseAt?: string;
  readonly startsAt?: string;
  readonly endsAt?: string;
  readonly rules?: string;
}

// ─── Query / response envelopes ──────────────────────────────────────────────

export interface TournamentListQueryDto {
  readonly gameId?: string;
  readonly status?: TournamentStatus;
  readonly format?: TournamentFormat;
  readonly page?: number;
  readonly limit?: number;
}

export interface TournamentListResponseDto {
  readonly items: readonly TournamentListItemDto[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
}

// ─── Lifecycle ───────────────────────────────────────────────────────────────

export interface TournamentLifecycleActionDto {
  readonly reason?: string;
}
