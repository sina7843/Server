import type { TournamentDto, TournamentListResponseDto } from '@dragon/types';
import {
  toAdminTournamentDto,
  toPublicTournamentSummary,
} from '../../../tournaments/tournament-projection';
import type { TournamentDocument } from '../../../tournaments/tournament.schema';

export function toAdminTournamentResponse(doc: TournamentDocument): TournamentDto {
  return toAdminTournamentDto(doc);
}

export function toAdminTournamentListResponse(
  items: TournamentDocument[],
  total: number,
  page: number,
  limit: number,
): TournamentListResponseDto {
  return { items: items.map(toPublicTournamentSummary), total, page, limit };
}
