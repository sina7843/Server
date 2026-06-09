import type { TournamentSummaryDto, TournamentDetailDto, TournamentDto } from '@dragon/types';
import type { TournamentDocument } from './tournament.schema';

export interface TournamentEnrichment {
  readonly coverImageUrl?: string;
  readonly gameCoverImageUrl?: string;
}

// ─── Public visibility ────────────────────────────────────────────────────────

// Statuses that are safe to surface on public endpoints.
// draft and archived are always hidden from public consumers.
// cancelled is visible for transparency — CTAs must be non-actionable (enforced in frontend).
const PUBLIC_VISIBLE_STATUSES = new Set([
  'published',
  'registration_open',
  'registration_closed',
  'in_progress',
  'completed',
  'cancelled',
]);

export function isPubliclyVisible(doc: TournamentDocument): boolean {
  if (doc.deletedAt != null) return false;
  // archivedAt is a soft-archive marker independent of status; never expose publicly.
  if (doc.archivedAt != null) return false;
  return PUBLIC_VISIBLE_STATUSES.has(doc.status);
}

// ─── Public projections ───────────────────────────────────────────────────────

// Maps to TournamentSummaryDto (= TournamentListItemDto).
// Excludes: cancelledAt, deletedAt, slugNormalized, participantType, description, rules.
export function toPublicTournamentSummary(
  doc: TournamentDocument,
  enrichment: TournamentEnrichment = {},
): TournamentSummaryDto {
  return {
    id: String(doc._id),
    gameId: doc.gameId,
    title: doc.title,
    slug: doc.slug,
    format: doc.format,
    status: doc.status,
    capacity: doc.capacity,
    ...(doc.startsAt != null ? { startsAt: doc.startsAt.toISOString() } : {}),
    ...(doc.publishedAt != null ? { publishedAt: doc.publishedAt.toISOString() } : {}),
    ...(enrichment.coverImageUrl !== undefined ? { coverImageUrl: enrichment.coverImageUrl } : {}),
    ...(enrichment.gameCoverImageUrl !== undefined ? { gameCoverImageUrl: enrichment.gameCoverImageUrl } : {}),
  };
}

// Maps to TournamentDetailDto (= PublicTournamentDto).
// Excludes: cancelledAt, deletedAt, slugNormalized.
// Includes participantType for public consumption (task 8.3 — detail page renders participant type).
export function toPublicTournamentDetail(
  doc: TournamentDocument,
  enrichment: TournamentEnrichment = {},
): TournamentDetailDto {
  return {
    id: String(doc._id),
    gameId: doc.gameId,
    title: doc.title,
    slug: doc.slug,
    format: doc.format,
    status: doc.status,
    capacity: doc.capacity,
    ...(doc.participantType != null ? { participantType: doc.participantType } : {}),
    ...(doc.description != null ? { description: doc.description } : {}),
    ...(doc.registrationOpenAt != null
      ? { registrationOpenAt: doc.registrationOpenAt.toISOString() }
      : {}),
    ...(doc.registrationCloseAt != null
      ? { registrationCloseAt: doc.registrationCloseAt.toISOString() }
      : {}),
    ...(doc.startsAt != null ? { startsAt: doc.startsAt.toISOString() } : {}),
    ...(doc.endsAt != null ? { endsAt: doc.endsAt.toISOString() } : {}),
    ...(doc.rules != null ? { rules: doc.rules } : {}),
    ...(doc.publishedAt != null ? { publishedAt: doc.publishedAt.toISOString() } : {}),
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
    ...(enrichment.coverImageUrl !== undefined ? { coverImageUrl: enrichment.coverImageUrl } : {}),
    ...(enrichment.gameCoverImageUrl !== undefined ? { gameCoverImageUrl: enrichment.gameCoverImageUrl } : {}),
  };
}

// ─── Admin projection ─────────────────────────────────────────────────────────

// Maps to TournamentDto (admin-safe full DTO).
// Adds cancelledAt and participantType vs public. Still excludes deletedAt and slugNormalized.
// Audit emission for admin actions is deferred to Slice 5 (admin controller layer).
export function toAdminTournamentDto(
  doc: TournamentDocument,
  enrichment: TournamentEnrichment = {},
): TournamentDto {
  return {
    id: String(doc._id),
    gameId: doc.gameId,
    title: doc.title,
    slug: doc.slug,
    format: doc.format,
    status: doc.status,
    capacity: doc.capacity,
    ...(doc.participantType != null ? { participantType: doc.participantType } : {}),
    ...(doc.description != null ? { description: doc.description } : {}),
    ...(doc.registrationOpenAt != null
      ? { registrationOpenAt: doc.registrationOpenAt.toISOString() }
      : {}),
    ...(doc.registrationCloseAt != null
      ? { registrationCloseAt: doc.registrationCloseAt.toISOString() }
      : {}),
    ...(doc.startsAt != null ? { startsAt: doc.startsAt.toISOString() } : {}),
    ...(doc.endsAt != null ? { endsAt: doc.endsAt.toISOString() } : {}),
    ...(doc.rules != null ? { rules: doc.rules } : {}),
    ...(doc.publishedAt != null ? { publishedAt: doc.publishedAt.toISOString() } : {}),
    ...(doc.cancelledAt != null ? { cancelledAt: doc.cancelledAt.toISOString() } : {}),
    ...(doc.archivedAt != null ? { archivedAt: doc.archivedAt.toISOString() } : {}),
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
    ...(doc.coverMediaId != null ? { coverMediaId: doc.coverMediaId } : {}),
    ...(enrichment.coverImageUrl !== undefined ? { coverImageUrl: enrichment.coverImageUrl } : {}),
    ...(enrichment.gameCoverImageUrl !== undefined ? { gameCoverImageUrl: enrichment.gameCoverImageUrl } : {}),
  };
}

// ─── List response helper ─────────────────────────────────────────────────────

export function toPublicTournamentListResponse(
  items: TournamentDocument[],
  total: number,
  page: number,
  limit: number,
  enrichmentMap: Map<string, TournamentEnrichment> = new Map(),
): { items: TournamentSummaryDto[]; total: number; page: number; limit: number } {
  return {
    items: items.map((doc) => toPublicTournamentSummary(doc, enrichmentMap.get(String(doc._id)))),
    total,
    page,
    limit,
  };
}

export function toAdminTournamentListResponse(
  items: TournamentDocument[],
  total: number,
  page: number,
  limit: number,
  enrichmentMap: Map<string, TournamentEnrichment> = new Map(),
): { items: TournamentDto[]; total: number; page: number; limit: number } {
  return {
    items: items.map((doc) => toAdminTournamentDto(doc, enrichmentMap.get(String(doc._id)))),
    total,
    page,
    limit,
  };
}
