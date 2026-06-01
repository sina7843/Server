import type { TournamentRegistrationStatus, TournamentRegistrationType } from '@dragon/types';
import type { Types } from 'mongoose';

export type RegistrationId = Types.ObjectId | string;
export type RegistrationTournamentId = Types.ObjectId | string;

export interface RegistrationMemberInput {
  readonly userId: string;
  readonly displayName: string;
  readonly role?: string;
}

export interface CreateRegistrationInput {
  readonly tournamentId: RegistrationTournamentId;
  readonly userId: string;
  readonly type: TournamentRegistrationType;
  readonly teamName?: string;
  readonly members?: readonly RegistrationMemberInput[];
}

// Public update — team data only; status changes are explicit service methods.
export interface UpdateRegistrationInput {
  readonly teamName?: string;
  readonly members?: readonly RegistrationMemberInput[];
}

// Internal repository patch — extends update input with lifecycle-managed fields
// that only the service layer may set.
export interface RegistrationRepositoryPatch extends UpdateRegistrationInput {
  readonly status?: TournamentRegistrationStatus;
  readonly approvedAt?: Date;
  readonly rejectedAt?: Date;
  readonly withdrawnAt?: Date;
  readonly cancelledAt?: Date;
  readonly rejectedReason?: string;
  // Participant-specific fields — set by TournamentParticipantService only.
  readonly participantDisplayName?: string;
  readonly seed?: number;
  readonly participantRemovedAt?: Date;
  readonly participantDisqualifiedAt?: Date;
}

export interface RegistrationListFilter {
  readonly tournamentId: RegistrationTournamentId;
  readonly userId?: string;
  readonly status?: TournamentRegistrationStatus;
  readonly type?: TournamentRegistrationType;
}
