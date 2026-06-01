import { ConflictException, UnprocessableEntityException } from '@nestjs/common';
import type {
  TournamentRegistrationStatus,
  TournamentParticipantType,
  TournamentRegistrationType,
} from '@dragon/types';

// ─── Duplicate registration policy ───────────────────────────────────────────
//
// Statuses that BLOCK a new registration for the same user+tournament:
//   submitted   — already in the queue
//   approved    — already accepted
//   waitlisted  — already queued (waiting for capacity)
//   rejected    — conservative default: admin rejected for a reason, block retry
//
// Statuses that ALLOW re-registration:
//   withdrawn   — user explicitly withdrew; re-registration is safe
//   cancelled   — admin cancelled (e.g. cleanup); re-registration is safe
//
// Policy change: update this set and re-run tests. Never leave behavior implicit.

const DUPLICATE_BLOCKING_STATUSES = new Set<TournamentRegistrationStatus>([
  'submitted',
  'approved',
  'waitlisted',
  'rejected',
]);

// ─── Capacity counting ────────────────────────────────────────────────────────
//
// These statuses count toward the tournament's capacity limit.
// Only enforced at registration time; admin approve has override power.

export const CAPACITY_COUNTING_STATUSES = new Set<TournamentRegistrationStatus>([
  'submitted',
  'approved',
  'waitlisted',
]);

// ─── Admin-allowed transitions ────────────────────────────────────────────────
//
// Explicit allowed-transitions map. Every edge not listed is forbidden.
// Admin operates on existing registrations regardless of tournament status.

const ADMIN_TRANSITIONS: Record<
  TournamentRegistrationStatus,
  readonly TournamentRegistrationStatus[]
> = {
  submitted: ['approved', 'rejected', 'cancelled'],
  approved: ['rejected', 'cancelled'],
  waitlisted: ['approved', 'rejected', 'cancelled'],
  rejected: [],
  withdrawn: [],
  cancelled: [],
};

// ─── User-allowed transitions ─────────────────────────────────────────────────
//
// Users may withdraw from submitted, approved, or waitlisted registrations.
// Rejected, withdrawn, and cancelled are terminal for the user.

const USER_WITHDRAW_ALLOWED = new Set<TournamentRegistrationStatus>([
  'submitted',
  'approved',
  'waitlisted',
]);

// ─── Exports ──────────────────────────────────────────────────────────────────

export function isDuplicateBlocked(status: TournamentRegistrationStatus): boolean {
  return DUPLICATE_BLOCKING_STATUSES.has(status);
}

export function canAdminTransition(
  from: TournamentRegistrationStatus,
  to: TournamentRegistrationStatus,
): boolean {
  return ADMIN_TRANSITIONS[from].includes(to);
}

export function canUserWithdraw(from: TournamentRegistrationStatus): boolean {
  return USER_WITHDRAW_ALLOWED.has(from);
}

export function assertNoDuplicateBlocking(status: TournamentRegistrationStatus): void {
  if (isDuplicateBlocked(status)) {
    throw new ConflictException('You already have an active registration for this tournament.');
  }
}

export function assertAdminTransition(
  from: TournamentRegistrationStatus,
  to: TournamentRegistrationStatus,
): void {
  if (!canAdminTransition(from, to)) {
    throw new UnprocessableEntityException(
      `Cannot transition registration from "${from}" to "${to}".`,
    );
  }
}

export function assertUserWithdraw(from: TournamentRegistrationStatus): void {
  if (!canUserWithdraw(from)) {
    throw new UnprocessableEntityException(`Cannot withdraw a registration with status "${from}".`);
  }
}

export function assertParticipantTypeCompatible(
  tournamentParticipantType: TournamentParticipantType,
  registrationType: TournamentRegistrationType,
): void {
  if (tournamentParticipantType === 'individual' && registrationType !== 'individual') {
    throw new UnprocessableEntityException(
      'This tournament only accepts individual registrations.',
    );
  }
  if (tournamentParticipantType === 'team' && registrationType !== 'team') {
    throw new UnprocessableEntityException('This tournament only accepts team registrations.');
  }
  // 'both' accepts any type — no check needed.
}
