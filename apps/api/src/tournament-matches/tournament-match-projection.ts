import type {
  AdminTournamentMatchDto,
  PublicTournamentMatchDto,
  TournamentMatchListResponseDto,
} from '@dragon/types';
import type { TournamentMatchDocument } from './tournament-match.schema';

export function toAdminMatchDto(doc: TournamentMatchDocument): AdminTournamentMatchDto {
  return {
    id: String(doc._id),
    tournamentId: String(doc.tournamentId),
    round: doc.round,
    matchNumber: doc.matchNumber,
    status: doc.status,
    ...(doc.participant1Id && { participant1Id: String(doc.participant1Id) }),
    ...(doc.participant2Id && { participant2Id: String(doc.participant2Id) }),
    ...(doc.winnerId && { winnerId: String(doc.winnerId) }),
    ...(doc.scheduledAt && { scheduledAt: doc.scheduledAt.toISOString() }),
    ...(doc.completedAt && { completedAt: doc.completedAt.toISOString() }),
    ...(doc.notes && { notes: doc.notes }),
  };
}

export function toPublicMatchDto(doc: TournamentMatchDocument): PublicTournamentMatchDto {
  return {
    id: String(doc._id),
    round: doc.round,
    matchNumber: doc.matchNumber,
    status: doc.status,
    ...(doc.participant1Id && { participant1Id: String(doc.participant1Id) }),
    ...(doc.participant2Id && { participant2Id: String(doc.participant2Id) }),
    ...(doc.winnerId && { winnerId: String(doc.winnerId) }),
    ...(doc.scheduledAt && { scheduledAt: doc.scheduledAt.toISOString() }),
  };
}

export function toAdminMatchListResponse(
  items: TournamentMatchDocument[],
  total: number,
  page: number,
  limit: number,
): { items: AdminTournamentMatchDto[]; total: number; page: number; limit: number } {
  return { items: items.map(toAdminMatchDto), total, page, limit };
}

export function toPublicMatchListResponse(
  items: TournamentMatchDocument[],
  total: number,
  page: number,
  limit: number,
): TournamentMatchListResponseDto {
  return { items: items.map(toPublicMatchDto), total, page, limit };
}
