import type { TournamentDto, TournamentListResponseDto } from '@dragon/types';
import {
  toAdminTournamentDto,
  toAdminTournamentListResponse as projectionAdminList,
  type TournamentEnrichment,
} from '../../../tournaments/tournament-projection';
import type { TournamentDocument } from '../../../tournaments/tournament.schema';

export function toAdminTournamentResponse(
  doc: TournamentDocument,
  enrichment: TournamentEnrichment = {},
): TournamentDto {
  return toAdminTournamentDto(doc, enrichment);
}

export function toAdminTournamentListResponse(
  items: TournamentDocument[],
  total: number,
  page: number,
  limit: number,
  enrichmentMap: Map<string, TournamentEnrichment> = new Map(),
): TournamentListResponseDto {
  return projectionAdminList(items, total, page, limit, enrichmentMap);
}
