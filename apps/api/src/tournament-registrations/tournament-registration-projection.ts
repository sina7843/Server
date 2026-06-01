import type {
  TournamentRegistrationDto,
  MyTournamentRegistrationDto,
  AdminTournamentRegistrationDto,
  TeamRegistrationMemberDto,
} from '@dragon/types';
import type {
  TournamentRegistrationDocument,
  RegistrationMember,
} from './tournament-registration.schema';

// ─── Member mapping ───────────────────────────────────────────────────────────

function toMemberDto(m: RegistrationMember): TeamRegistrationMemberDto {
  return {
    userId: m.userId,
    displayName: m.displayName,
    ...(m.role != null ? { role: m.role } : {}),
  };
}

// ─── Public user-facing projection ───────────────────────────────────────────
//
// Does NOT expose userId (caller already knows their own identity).
// Does NOT expose internal fields: rejectedReason, lifecycle timestamps.

export function toMyRegistrationDto(
  doc: TournamentRegistrationDocument,
): MyTournamentRegistrationDto {
  return {
    id: String(doc._id),
    tournamentId: String(doc.tournamentId),
    type: doc.type,
    status: doc.status,
    ...(doc.teamName != null ? { teamName: doc.teamName } : {}),
    ...(doc.members != null && doc.members.length > 0
      ? { members: doc.members.map(toMemberDto) }
      : {}),
    registeredAt: doc.submittedAt.toISOString(),
  };
}

// ─── Public tournament registration projection ────────────────────────────────
//
// For generic tournament.register / my-registration endpoints (includes userId).

export function toTournamentRegistrationDto(
  doc: TournamentRegistrationDocument,
): TournamentRegistrationDto {
  return {
    id: String(doc._id),
    tournamentId: String(doc.tournamentId),
    userId: doc.userId,
    type: doc.type,
    status: doc.status,
    ...(doc.teamName != null ? { teamName: doc.teamName } : {}),
    ...(doc.members != null && doc.members.length > 0
      ? { members: doc.members.map(toMemberDto) }
      : {}),
    registeredAt: doc.submittedAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

// ─── Admin projection ─────────────────────────────────────────────────────────
//
// Full DTO for admin use. Does NOT expose rejectedReason in the typed DTO
// (not in the locked AdminTournamentRegistrationDto shape), but the value
// is stored in the database and accessible via the document if needed.

export function toAdminRegistrationDto(
  doc: TournamentRegistrationDocument,
): AdminTournamentRegistrationDto {
  return {
    id: String(doc._id),
    tournamentId: String(doc.tournamentId),
    userId: doc.userId,
    type: doc.type,
    status: doc.status,
    ...(doc.teamName != null ? { teamName: doc.teamName } : {}),
    ...(doc.members != null && doc.members.length > 0
      ? { members: doc.members.map(toMemberDto) }
      : {}),
    registeredAt: doc.submittedAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

// ─── List response helpers ────────────────────────────────────────────────────

export function toAdminRegistrationListResponse(
  items: TournamentRegistrationDocument[],
  total: number,
  page: number,
  limit: number,
): { items: AdminTournamentRegistrationDto[]; total: number; page: number; limit: number } {
  return { items: items.map(toAdminRegistrationDto), total, page, limit };
}
