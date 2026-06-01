import { createAdminTournamentsClient, createAdminGamesClient } from '@dragon/sdk';
import type { ApiClient, TournamentListParams } from '@dragon/sdk';
import type {
  AdminTournamentDto,
  TournamentListResponseDto,
  TournamentFormat,
  TournamentParticipantType,
  GameListResponseDto,
} from '@dragon/types';

export type CreateTournamentInput = {
  gameId: string;
  title: string;
  slug: string;
  format: TournamentFormat;
  participantType?: TournamentParticipantType;
  capacity: number;
  description?: string;
  rules?: string;
  registrationOpenAt?: string;
  registrationCloseAt?: string;
  startsAt?: string;
  endsAt?: string;
};

export type UpdateTournamentInput = {
  title?: string;
  format?: TournamentFormat;
  participantType?: TournamentParticipantType;
  capacity?: number;
  description?: string;
  rules?: string;
  registrationOpenAt?: string;
  registrationCloseAt?: string;
  startsAt?: string;
  endsAt?: string;
};

export async function listTournaments(
  client: ApiClient,
  params?: TournamentListParams,
): Promise<TournamentListResponseDto> {
  return createAdminTournamentsClient(client).list(params);
}

export async function getTournament(client: ApiClient, id: string): Promise<AdminTournamentDto> {
  return createAdminTournamentsClient(client).get(id);
}

export async function createTournament(
  client: ApiClient,
  input: CreateTournamentInput,
): Promise<AdminTournamentDto> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createAdminTournamentsClient(client).create(input as any);
}

export async function updateTournament(
  client: ApiClient,
  id: string,
  input: UpdateTournamentInput,
): Promise<AdminTournamentDto> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createAdminTournamentsClient(client).update(id, input as any);
}

export async function publishTournament(
  client: ApiClient,
  id: string,
): Promise<AdminTournamentDto> {
  return createAdminTournamentsClient(client).publish(id);
}

export async function openRegistration(client: ApiClient, id: string): Promise<AdminTournamentDto> {
  return createAdminTournamentsClient(client).openRegistration(id);
}

export async function closeRegistration(
  client: ApiClient,
  id: string,
): Promise<AdminTournamentDto> {
  return createAdminTournamentsClient(client).closeRegistration(id);
}

export async function startTournament(client: ApiClient, id: string): Promise<AdminTournamentDto> {
  return createAdminTournamentsClient(client).start(id);
}

export async function completeTournament(
  client: ApiClient,
  id: string,
): Promise<AdminTournamentDto> {
  return createAdminTournamentsClient(client).complete(id);
}

export async function cancelTournament(client: ApiClient, id: string): Promise<AdminTournamentDto> {
  return createAdminTournamentsClient(client).cancel(id);
}

export async function archiveTournament(
  client: ApiClient,
  id: string,
): Promise<AdminTournamentDto> {
  return createAdminTournamentsClient(client).archive(id);
}

export async function deleteTournament(client: ApiClient, id: string): Promise<void> {
  return createAdminTournamentsClient(client).delete(id);
}

// Loads games for the tournament form game selector
export async function listGamesForSelector(client: ApiClient): Promise<GameListResponseDto> {
  return createAdminGamesClient(client).list({ limit: 100 });
}
