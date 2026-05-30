// ─── Registration enums ──────────────────────────────────────────────────────

export type TournamentRegistrationType = 'individual' | 'team';

export type RegistrationStatus =
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'waitlisted'
  | 'withdrawn'
  | 'cancelled';

export type TournamentRegistrationStatus = RegistrationStatus;

// ─── Sub-DTOs ────────────────────────────────────────────────────────────────

export interface IndividualRegistrationPayload {
  readonly type: 'individual';
}

export interface TeamRegistrationMemberDto {
  readonly userId: string;
  readonly displayName: string;
  readonly role?: string;
}

export interface TeamRegistrationPayload {
  readonly type: 'team';
  readonly teamName: string;
  readonly members: readonly TeamRegistrationMemberDto[];
}

// ─── Input DTOs ──────────────────────────────────────────────────────────────

export interface TournamentRegistrationInputDto {
  readonly type: TournamentRegistrationType;
  readonly teamName?: string;
  readonly members?: readonly TeamRegistrationMemberDto[];
}

export type CreateTournamentRegistrationDto = TournamentRegistrationInputDto;

export interface UpdateTournamentRegistrationDto {
  readonly teamName?: string;
  readonly members?: readonly TeamRegistrationMemberDto[];
}

// ─── Response DTOs ───────────────────────────────────────────────────────────

export interface TournamentRegistrationDto {
  readonly id: string;
  readonly tournamentId: string;
  readonly userId: string;
  readonly type: TournamentRegistrationType;
  readonly status: TournamentRegistrationStatus;
  readonly teamName?: string;
  readonly members?: readonly TeamRegistrationMemberDto[];
  readonly registeredAt: string;
  readonly updatedAt: string;
}

export interface MyTournamentRegistrationDto {
  readonly id: string;
  readonly tournamentId: string;
  readonly type: TournamentRegistrationType;
  readonly status: TournamentRegistrationStatus;
  readonly teamName?: string;
  readonly members?: readonly TeamRegistrationMemberDto[];
  readonly registeredAt: string;
}

export interface AdminTournamentRegistrationDto {
  readonly id: string;
  readonly tournamentId: string;
  readonly userId: string;
  readonly type: TournamentRegistrationType;
  readonly status: TournamentRegistrationStatus;
  readonly teamName?: string;
  readonly members?: readonly TeamRegistrationMemberDto[];
  readonly registeredAt: string;
  readonly updatedAt: string;
}
