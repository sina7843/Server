import type {
  MyTournamentRegistrationDto,
  TournamentRegistrationType,
  TeamRegistrationMemberDto,
} from '@dragon/types';

export type { MyTournamentRegistrationDto, TournamentRegistrationType, TeamRegistrationMemberDto };

export type RegistrationPageState =
  | { readonly status: 'loading' }
  | { readonly status: 'auth_required' }
  | { readonly status: 'closed' }
  | { readonly status: 'capacity_full' }
  | { readonly status: 'already_registered'; readonly registration: MyTournamentRegistrationDto }
  | { readonly status: 'open'; readonly tournamentTitle?: string }
  | { readonly status: 'success'; readonly registration: MyTournamentRegistrationDto }
  | { readonly status: 'error'; readonly message: string };

export type MyRegistrationPageState =
  | { readonly status: 'loading' }
  | { readonly status: 'auth_required' }
  | { readonly status: 'not_found' }
  | { readonly status: 'ready'; readonly registration: MyTournamentRegistrationDto }
  | { readonly status: 'withdrawn' }
  | { readonly status: 'error'; readonly message: string };

export interface RegistrationFormData {
  readonly type: TournamentRegistrationType;
  readonly teamName?: string;
  readonly members?: readonly TeamRegistrationMemberDto[];
}

export interface RegistrationValidationResult {
  readonly valid: boolean;
  readonly errors: Record<string, string>;
}
