import type { TournamentParticipantDto, TournamentParticipantPublicDto } from '@dragon/types';
import type { TournamentRegistrationDocument } from '../tournament-registrations/tournament-registration.schema';
import { deriveParticipantStatus } from './tournament-participant-policy';

// ─── Projection: admin DTO ────────────────────────────────────────────────────
//
// Implementation: participants are derived from approved registrations.
// participantId == registrationId (same ObjectId).
//
// displayName: uses participantDisplayName if set by admin; falls back to
// userId as a stub. Profile integration is deferred to a future slice.
//
// Does NOT expose: phone, email, contact info, rejectedReason, internal
// timestamps, deletedAt, team member contact data.

export function toParticipantDto(doc: TournamentRegistrationDocument): TournamentParticipantDto {
  return {
    id: String(doc._id),
    userId: doc.userId,
    displayName: doc.participantDisplayName ?? doc.userId,
    ...(doc.seed != null ? { seed: doc.seed } : {}),
    status: deriveParticipantStatus(doc),
    ...(doc.teamName != null ? { teamName: doc.teamName } : {}),
  };
}

// ─── Projection: public DTO ───────────────────────────────────────────────────
//
// Privacy-safe: no userId, no email, no phone, no internal fields,
// no team member contact data, no rejectedReason.

export function toParticipantPublicDto(
  doc: TournamentRegistrationDocument,
): TournamentParticipantPublicDto {
  return {
    id: String(doc._id),
    displayName: doc.participantDisplayName ?? doc.userId,
    ...(doc.seed != null ? { seed: doc.seed } : {}),
    status: deriveParticipantStatus(doc),
    ...(doc.teamName != null ? { teamName: doc.teamName } : {}),
  };
}

// ─── List response helpers ────────────────────────────────────────────────────

export function toAdminParticipantListResponse(
  items: TournamentRegistrationDocument[],
  total: number,
  page: number,
  limit: number,
): { items: TournamentParticipantDto[]; total: number; page: number; limit: number } {
  return { items: items.map(toParticipantDto), total, page, limit };
}
