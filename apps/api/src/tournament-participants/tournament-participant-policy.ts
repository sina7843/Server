import { UnprocessableEntityException } from '@nestjs/common';
import type { ParticipantStatus } from '@dragon/types';
import type { TournamentRegistrationDocument } from '../tournament-registrations/tournament-registration.schema';

// ─── Participant status derivation ────────────────────────────────────────────
//
// Implementation choice: participants are derived projections from approved
// registrations. No separate TournamentParticipant collection exists.
//
// Derivation rules:
//   participantRemovedAt set         → 'removed'    (admin action, registration stays 'approved')
//   participantDisqualifiedAt set    → 'disqualified' (admin action, registration stays 'approved')
//   status === 'withdrawn' + approvedAt set → 'withdrawn' (was approved, user later withdrew)
//   status === 'approved', no override → 'active'
//
// Locked statuses (Phase 1): active | withdrawn | disqualified | removed
// 'eliminated' is NOT a valid participant status.

export function deriveParticipantStatus(doc: TournamentRegistrationDocument): ParticipantStatus {
  if (doc.participantRemovedAt != null) return 'removed';
  if (doc.participantDisqualifiedAt != null) return 'disqualified';
  if (doc.status === 'withdrawn' && doc.approvedAt != null) return 'withdrawn';
  return 'active';
}

// ─── Active participant check ─────────────────────────────────────────────────

export function isParticipantActive(doc: TournamentRegistrationDocument): boolean {
  return (
    doc.status === 'approved' &&
    doc.participantRemovedAt == null &&
    doc.participantDisqualifiedAt == null
  );
}

export function assertParticipantIsActive(doc: TournamentRegistrationDocument): void {
  if (doc.status !== 'approved') {
    throw new UnprocessableEntityException('Participant is not active.');
  }
  if (doc.participantRemovedAt != null) {
    throw new UnprocessableEntityException('Participant has already been removed.');
  }
  if (doc.participantDisqualifiedAt != null) {
    throw new UnprocessableEntityException('Participant has already been disqualified.');
  }
}

// ─── Participant membership check ─────────────────────────────────────────────
//
// A registration is a participant if it is currently approved OR if it was
// approved and the user subsequently withdrew (has approvedAt).
// Submitted/rejected/waitlisted/cancelled never-approved registrations are NOT
// participants and must not appear in the participant list.

export function isRegistrationAParticipant(doc: TournamentRegistrationDocument): boolean {
  if (doc.status === 'approved') return true;
  if (doc.status === 'withdrawn' && doc.approvedAt != null) return true;
  return false;
}
