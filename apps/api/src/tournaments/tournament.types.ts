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

export interface UpdateTournamentInput {
  readonly gameId?: string;
  readonly title?: string;
  readonly slug?: string;
  readonly slugNormalized?: string;
  readonly description?: string;
  readonly format?: TournamentFormat;
  readonly status?: TournamentStatus;
  readonly participantType?: TournamentParticipantType;
  readonly capacity?: number;
  readonly registrationOpenAt?: Date;
  readonly registrationCloseAt?: Date;
  readonly startsAt?: Date;
  readonly endsAt?: Date;
  readonly rules?: string;
  readonly publishedAt?: Date;
  readonly cancelledAt?: Date;
}

export interface TournamentListFilter {
  readonly gameId?: string;
  readonly status?: TournamentStatus;
  readonly format?: TournamentFormat;
  readonly registrationOpen?: boolean;
  readonly includeDeleted?: boolean;
}
