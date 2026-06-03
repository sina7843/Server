import { createAdminTournamentRegistrationsClient } from '@dragon/sdk';
import type { ApiClient } from '@dragon/sdk';
import type { AdminTournamentRegistrationDto } from '@dragon/types';
import type {
  AdminTournamentRegistrationListParams,
  AdminTournamentRegistrationListResponseDto,
} from '@dragon/sdk';

export async function listRegistrations(
  client: ApiClient,
  tournamentId: string,
  params?: AdminTournamentRegistrationListParams,
): Promise<AdminTournamentRegistrationListResponseDto> {
  return createAdminTournamentRegistrationsClient(client).list(tournamentId, params);
}

export async function getRegistration(
  client: ApiClient,
  tournamentId: string,
  registrationId: string,
): Promise<AdminTournamentRegistrationDto> {
  return createAdminTournamentRegistrationsClient(client).get(tournamentId, registrationId);
}

export async function approveRegistration(
  client: ApiClient,
  tournamentId: string,
  registrationId: string,
): Promise<AdminTournamentRegistrationDto> {
  return createAdminTournamentRegistrationsClient(client).approve(tournamentId, registrationId);
}

export async function rejectRegistration(
  client: ApiClient,
  tournamentId: string,
  registrationId: string,
  input?: { reason?: string },
): Promise<AdminTournamentRegistrationDto> {
  return createAdminTournamentRegistrationsClient(client).reject(
    tournamentId,
    registrationId,
    input,
  );
}

export async function cancelRegistration(
  client: ApiClient,
  tournamentId: string,
  registrationId: string,
): Promise<AdminTournamentRegistrationDto> {
  return createAdminTournamentRegistrationsClient(client).cancel(tournamentId, registrationId);
}
