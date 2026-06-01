import type { TournamentSummaryDto, TournamentDetailDto, TournamentDto } from '@dragon/types';
import type { TournamentDocument } from './tournament.schema';

// ─── Public visibility ────────────────────────────────────────────────────────

// Statuses that are safe to surface on public endpoints.
// draft and archived are always hidden from public consumers.
// cancelled public behavior is deferred to Slice 8 — excluded here by default.
const PUBLIC_VISIBLE_STATUSES = new Set([
  'published',
  'registration_open',
  'registration_closed',
  'in_progress',
  'completed',
]);

export function isPubliclyVisible(doc: TournamentDocument): boolean {
  if (doc.deletedAt != null) return false;
  return PUBLIC_VISIBLE_STATUSES.has(doc.status);
}

// ─── Public projections ───────────────────────────────────────────────────────

// Maps to TournamentSummaryDto (= TournamentListItemDto).
// Excludes: cancelledAt, deletedAt, slugNormalized, participantType, description, rules.
export function toPublicTournamentSummary(doc: TournamentDocument): TournamentSummaryDto {
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
  };
}

// Maps to TournamentDetailDto (= PublicTournamentDto).
// Excludes: cancelledAt, deletedAt, slugNormalized, participantType.
export function toPublicTournamentDetail(doc: TournamentDocument): TournamentDetailDto {
  return {
    id: String(doc._id),
    gameId: doc.gameId,
    title: doc.title,
    slug: doc.slug,
    format: doc.format,
    status: doc.status,
    capacity: doc.capacity,
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
  };
}

// ─── Admin projection ─────────────────────────────────────────────────────────

// Maps to TournamentDto (admin-safe full DTO).
// Adds cancelledAt and participantType vs public. Still excludes deletedAt and slugNormalized.
// Audit emission for admin actions is deferred to Slice 5 (admin controller layer).
export function toAdminTournamentDto(doc: TournamentDocument): TournamentDto {
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
  };
}

// ─── List response helper ─────────────────────────────────────────────────────

export function toPublicTournamentListResponse(
  items: TournamentDocument[],
  total: number,
  page: number,
  limit: number,
): { items: TournamentSummaryDto[]; total: number; page: number; limit: number } {
  return { items: items.map(toPublicTournamentSummary), total, page, limit };
}

export function toAdminTournamentListResponse(
  items: TournamentDocument[],
  total: number,
  page: number,
  limit: number,
): { items: TournamentDto[]; total: number; page: number; limit: number } {
  return { items: items.map(toAdminTournamentDto), total, page, limit };
}
