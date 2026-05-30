import type { AdminTournamentRegistrationDto, TournamentRegistrationStatus } from '@dragon/types';

export interface AdminTournamentRegistrationListParams {
  readonly status?: TournamentRegistrationStatus;
  readonly type?: 'individual' | 'team';
  readonly page?: number;
  readonly limit?: number;
}

export interface AdminTournamentRegistrationListResponseDto {
  readonly items: readonly AdminTournamentRegistrationDto[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
}

export interface AdminTournamentRegistrationsClient {
  list(
    tournamentId: string,
    params?: AdminTournamentRegistrationListParams,
  ): Promise<AdminTournamentRegistrationListResponseDto>;
  getById(tournamentId: string, registrationId: string): Promise<AdminTournamentRegistrationDto>;
  approve(tournamentId: string, registrationId: string): Promise<AdminTournamentRegistrationDto>;
  reject(
    tournamentId: string,
    registrationId: string,
    input?: { reason?: string },
  ): Promise<AdminTournamentRegistrationDto>;
}
