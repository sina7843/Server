import type { ApiClient } from './client';
import type { AdminTournamentBracketClient } from './admin-tournament-bracket-types';
import type { BracketProjectionDto } from '@dragon/types';

// Display-only projection. Read-only access via GET only.
export function createAdminTournamentBracketClient(
  client: ApiClient,
): AdminTournamentBracketClient {
  return {
    get(tournamentId: string): Promise<BracketProjectionDto> {
      return client.request<BracketProjectionDto>({
        method: 'GET',
        path: `/admin/v1/tournaments/${encodeURIComponent(tournamentId)}/bracket`,
      });
    },
  };
}
