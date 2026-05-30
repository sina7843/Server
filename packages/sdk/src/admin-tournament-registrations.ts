import type { ApiClient } from './client';
import type {
  AdminTournamentRegistrationsClient,
  AdminTournamentRegistrationListParams,
  AdminTournamentRegistrationListResponseDto,
} from './admin-tournament-registrations-types';
import type { AdminTournamentRegistrationDto } from '@dragon/types';

export function createAdminTournamentRegistrationsClient(
  client: ApiClient,
): AdminTournamentRegistrationsClient {
  return {
    list(
      tournamentId: string,
      params?: AdminTournamentRegistrationListParams,
    ): Promise<AdminTournamentRegistrationListResponseDto> {
      const search = new URLSearchParams();
      if (params?.status) search.set('status', params.status);
      if (params?.type) search.set('type', params.type);
      if (params?.page !== undefined) search.set('page', String(params.page));
      if (params?.limit !== undefined) search.set('limit', String(params.limit));
      const qs = search.toString();
      return client.request<AdminTournamentRegistrationListResponseDto>({
        method: 'GET',
        path: `/admin/v1/tournaments/${encodeURIComponent(tournamentId)}/registrations${qs ? `?${qs}` : ''}`,
      });
    },

    get(tournamentId: string, registrationId: string): Promise<AdminTournamentRegistrationDto> {
      return client.request<AdminTournamentRegistrationDto>({
        method: 'GET',
        path: `/admin/v1/tournaments/${encodeURIComponent(tournamentId)}/registrations/${encodeURIComponent(registrationId)}`,
      });
    },

    approve(tournamentId: string, registrationId: string): Promise<AdminTournamentRegistrationDto> {
      return client.request<AdminTournamentRegistrationDto>({
        method: 'POST',
        path: `/admin/v1/tournaments/${encodeURIComponent(tournamentId)}/registrations/${encodeURIComponent(registrationId)}/approve`,
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
      });
    },

    reject(
      tournamentId: string,
      registrationId: string,
      input?: { reason?: string },
    ): Promise<AdminTournamentRegistrationDto> {
      return client.request<AdminTournamentRegistrationDto>({
        method: 'POST',
        path: `/admin/v1/tournaments/${encodeURIComponent(tournamentId)}/registrations/${encodeURIComponent(registrationId)}/reject`,
        body: JSON.stringify(input ?? {}),
        headers: { 'Content-Type': 'application/json' },
      });
    },

    cancel(tournamentId: string, registrationId: string): Promise<AdminTournamentRegistrationDto> {
      return client.request<AdminTournamentRegistrationDto>({
        method: 'POST',
        path: `/admin/v1/tournaments/${encodeURIComponent(tournamentId)}/registrations/${encodeURIComponent(registrationId)}/cancel`,
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
      });
    },
  };
}
