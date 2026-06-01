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
export type TournamentParticipantType = 'individual' | 'team' | 'both';

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

// ─── Admin response DTOs ─────────────────────────────────────────────────────

export interface TournamentDto {
  readonly id: string;
  readonly gameId: string;
  readonly title: string;
  readonly slug: string;
  readonly description?: string;
  readonly format: TournamentFormat;
  readonly participantType?: TournamentParticipantType;
  readonly status: TournamentStatus;
  readonly capacity: number;
  readonly registrationOpenAt?: string;
  readonly registrationCloseAt?: string;
  readonly startsAt?: string;
  readonly endsAt?: string;
  readonly rules?: string;
  readonly publishedAt?: string;
  readonly cancelledAt?: string;
  readonly archivedAt?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export type AdminTournamentDto = TournamentDto;
export type TournamentSummaryDto = TournamentListItemDto;
export type TournamentDetailDto = PublicTournamentDto;
export type CreateTournamentDto = Omit<
  TournamentDto,
  'id' | 'createdAt' | 'updatedAt' | 'publishedAt' | 'cancelledAt'
>;
export type UpdateTournamentDto = Partial<Omit<TournamentDto, 'id' | 'createdAt' | 'updatedAt'>>;

// ─── Query / response envelopes ──────────────────────────────────────────────

export interface TournamentListQueryDto {
  readonly gameId?: string;
  readonly status?: TournamentStatus;
  readonly format?: TournamentFormat;
  readonly registrationOpen?: boolean;
  readonly page?: number;
  readonly limit?: number;
}

export interface TournamentSearchQueryDto extends TournamentListQueryDto {
  readonly q?: string;
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

// ─── Admin input types ────────────────────────────────────────────────────────
// These types deliberately omit status, publishedAt, cancelledAt, archivedAt,
// deletedAt, id, createdAt, and updatedAt — lifecycle fields are managed
// exclusively through the dedicated lifecycle endpoints.

export type AdminTournamentCreateInput = {
  readonly gameId: string;
  readonly title: string;
  readonly slug: string;
  readonly description?: string;
  readonly format: TournamentFormat;
  readonly participantType?: TournamentParticipantType;
  readonly capacity: number;
  readonly registrationOpenAt?: string;
  readonly registrationCloseAt?: string;
  readonly startsAt?: string;
  readonly endsAt?: string;
  readonly rules?: string;
};

export type AdminTournamentUpdateInput = {
  readonly gameId?: string;
  readonly title?: string;
  readonly slug?: string;
  readonly description?: string;
  readonly format?: TournamentFormat;
  readonly participantType?: TournamentParticipantType;
  readonly capacity?: number;
  readonly registrationOpenAt?: string;
  readonly registrationCloseAt?: string;
  readonly startsAt?: string;
  readonly endsAt?: string;
  readonly rules?: string;
};
