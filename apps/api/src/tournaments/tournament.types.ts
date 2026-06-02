import type { TournamentStatus, TournamentFormat, TournamentParticipantType } from '@dragon/types';
import type { Types } from 'mongoose';

export type TournamentId = Types.ObjectId | string;

export interface CreateTournamentInput {
  readonly gameId: string;
  readonly title: string;
  readonly slug: string;
  readonly slugNormalized?: string;
  readonly description?: string;
  readonly format: TournamentFormat;
  readonly status?: TournamentStatus;
  readonly participantType?: TournamentParticipantType;
  readonly capacity: number;
  readonly registrationOpenAt?: Date;
  readonly registrationCloseAt?: Date;
  readonly startsAt?: Date;
  readonly endsAt?: Date;
  readonly rules?: string;
}

// Public service interface — no lifecycle-managed fields.
// Status must be changed via TournamentService.transition(), never via update().
export interface UpdateTournamentInput {
  readonly gameId?: string;
  readonly title?: string;
  readonly slug?: string;
  readonly description?: string;
  readonly format?: TournamentFormat;
  readonly participantType?: TournamentParticipantType;
  readonly capacity?: number;
  readonly registrationOpenAt?: Date;
  readonly registrationCloseAt?: Date;
  readonly startsAt?: Date;
  readonly endsAt?: Date;
  readonly rules?: string;
}

// Internal repository patch — extends the public input with fields that only
// the service layer may set (slug normalisation, lifecycle status, timestamps).
// External callers must use TournamentService.update() which accepts the narrower
// UpdateTournamentInput and blocks direct status writes.
export interface TournamentRepositoryPatch extends UpdateTournamentInput {
  readonly slugNormalized?: string;
  readonly status?: TournamentStatus;
  readonly publishedAt?: Date;
  readonly cancelledAt?: Date;
  readonly archivedAt?: Date;
}

export interface TournamentListFilter {
  readonly gameId?: string;
  readonly status?: TournamentStatus;
  // Multi-value status filter (e.g. public endpoints restricting to safe statuses).
  // Ignored when registrationOpen=true or status is set.
  readonly statuses?: readonly TournamentStatus[];
  readonly format?: TournamentFormat;
  readonly registrationOpen?: boolean;
  readonly includeDeleted?: boolean;
}
