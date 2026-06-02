import type { ApiClient } from './client';
import type { AdminTournamentsClient, TournamentListParams } from './tournament-types';
import type {
  AdminTournamentCreateInput,
  AdminTournamentUpdateInput,
  AdminTournamentDto,
  TournamentListResponseDto,
  TournamentLifecycleActionDto,
  BracketProjectionDto,
} from '@dragon/types';

export function createAdminTournamentsClient(client: ApiClient): AdminTournamentsClient {
  return {
    list(params?: TournamentListParams): Promise<TournamentListResponseDto> {
      const search = new URLSearchParams();
      if (params?.gameId) search.set('gameId', params.gameId);
      if (params?.status) search.set('status', params.status);
      if (params?.format) search.set('format', params.format);
      if (params?.registrationOpen !== undefined)
        search.set('registrationOpen', String(params.registrationOpen));
      if (params?.page !== undefined) search.set('page', String(params.page));
      if (params?.limit !== undefined) search.set('limit', String(params.limit));
      const qs = search.toString();
      return client.request<TournamentListResponseDto>({
        method: 'GET',
        path: `/admin/v1/tournaments${qs ? `?${qs}` : ''}`,
      });
    },

    get(id: string): Promise<AdminTournamentDto> {
      return client.request<AdminTournamentDto>({
        method: 'GET',
        path: `/admin/v1/tournaments/${encodeURIComponent(id)}`,
      });
    },

    create(input: AdminTournamentCreateInput): Promise<AdminTournamentDto> {
      return client.request<AdminTournamentDto>({
        method: 'POST',
        path: '/admin/v1/tournaments',
        body: JSON.stringify(input),
        headers: { 'Content-Type': 'application/json' },
      });
    },

    update(id: string, input: AdminTournamentUpdateInput): Promise<AdminTournamentDto> {
      return client.request<AdminTournamentDto>({
        method: 'PATCH',
        path: `/admin/v1/tournaments/${encodeURIComponent(id)}`,
        body: JSON.stringify(input),
        headers: { 'Content-Type': 'application/json' },
      });
    },

    publish(id: string, input?: TournamentLifecycleActionDto): Promise<AdminTournamentDto> {
      return client.request<AdminTournamentDto>({
        method: 'POST',
        path: `/admin/v1/tournaments/${encodeURIComponent(id)}/publish`,
        body: JSON.stringify(input ?? {}),
        headers: { 'Content-Type': 'application/json' },
      });
    },

    cancel(id: string, input?: TournamentLifecycleActionDto): Promise<AdminTournamentDto> {
      return client.request<AdminTournamentDto>({
        method: 'POST',
        path: `/admin/v1/tournaments/${encodeURIComponent(id)}/cancel`,
        body: JSON.stringify(input ?? {}),
        headers: { 'Content-Type': 'application/json' },
      });
    },

    archive(id: string, input?: TournamentLifecycleActionDto): Promise<AdminTournamentDto> {
      return client.request<AdminTournamentDto>({
        method: 'POST',
        path: `/admin/v1/tournaments/${encodeURIComponent(id)}/archive`,
        body: JSON.stringify(input ?? {}),
        headers: { 'Content-Type': 'application/json' },
      });
    },

    delete(id: string): Promise<void> {
      return client.request<void>({
        method: 'DELETE',
        path: `/admin/v1/tournaments/${encodeURIComponent(id)}`,
      });
    },

    openRegistration(id: string): Promise<AdminTournamentDto> {
      return client.request<AdminTournamentDto>({
        method: 'POST',
        path: `/admin/v1/tournaments/${encodeURIComponent(id)}/open-registration`,
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
      });
    },

    closeRegistration(id: string): Promise<AdminTournamentDto> {
      return client.request<AdminTournamentDto>({
        method: 'POST',
        path: `/admin/v1/tournaments/${encodeURIComponent(id)}/close-registration`,
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
      });
    },

    start(id: string): Promise<AdminTournamentDto> {
      return client.request<AdminTournamentDto>({
        method: 'POST',
        path: `/admin/v1/tournaments/${encodeURIComponent(id)}/start`,
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
      });
    },

    complete(id: string): Promise<AdminTournamentDto> {
      return client.request<AdminTournamentDto>({
        method: 'POST',
        path: `/admin/v1/tournaments/${encodeURIComponent(id)}/complete`,
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
      });
    },

    getBracket(id: string): Promise<BracketProjectionDto> {
      return client.request<BracketProjectionDto>({
        method: 'GET',
        path: `/admin/v1/tournaments/${encodeURIComponent(id)}/bracket`,
      });
    },
  };
}
