import { createAdminTournamentsClient } from '@dragon/sdk';
import type { ApiClient } from '@dragon/sdk';
import type { BracketProjectionDto } from '@dragon/types';

export async function getBracket(
  client: ApiClient,
  tournamentId: string,
): Promise<BracketProjectionDto> {
  return createAdminTournamentsClient(client).getBracket(tournamentId);
}
