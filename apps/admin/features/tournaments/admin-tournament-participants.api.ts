import { createAdminTournamentParticipantsClient } from '@dragon/sdk';
import type { ApiClient } from '@dragon/sdk';
import type { TournamentParticipantDto } from '@dragon/types';
import type {
  AdminTournamentParticipantListParams,
  AdminTournamentParticipantListResponseDto,
  UpdateTournamentParticipantDto,
} from '@dragon/sdk';

export type { UpdateTournamentParticipantDto };

export async function listParticipants(
  client: ApiClient,
  tournamentId: string,
  params?: AdminTournamentParticipantListParams,
): Promise<AdminTournamentParticipantListResponseDto> {
  return createAdminTournamentParticipantsClient(client).list(tournamentId, params);
}

export async function updateParticipant(
  client: ApiClient,
  tournamentId: string,
  participantId: string,
  input: UpdateTournamentParticipantDto,
): Promise<TournamentParticipantDto> {
  return createAdminTournamentParticipantsClient(client).update(tournamentId, participantId, input);
}

export async function removeParticipant(
  client: ApiClient,
  tournamentId: string,
  participantId: string,
): Promise<void> {
  return createAdminTournamentParticipantsClient(client).remove(tournamentId, participantId);
}

export async function disqualifyParticipant(
  client: ApiClient,
  tournamentId: string,
  participantId: string,
): Promise<TournamentParticipantDto> {
  return createAdminTournamentParticipantsClient(client).disqualify(tournamentId, participantId);
}
