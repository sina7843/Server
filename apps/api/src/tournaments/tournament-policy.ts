import { UnprocessableEntityException } from '@nestjs/common';
import type { TournamentStatus, TournamentFormat } from '@dragon/types';

// ─── Phase 1 locked allowlists ────────────────────────────────────────────────

export const PHASE1_TOURNAMENT_STATUSES: readonly TournamentStatus[] = [
  'draft',
  'published',
  'registration_open',
  'registration_closed',
  'in_progress',
  'completed',
  'cancelled',
  'archived',
] as const;

// Phase 1 supported formats only. Future formats (swiss, double_elimination,
// advanced_bracket_editor) are not implemented and must be rejected at the boundary.
export const PHASE1_TOURNAMENT_FORMATS: readonly TournamentFormat[] = [
  'single_elimination',
  'round_robin',
  'manual',
] as const;

// ─── Allowlist guards ─────────────────────────────────────────────────────────

export function isValidTournamentStatus(value: string): value is TournamentStatus {
  return (PHASE1_TOURNAMENT_STATUSES as readonly string[]).includes(value);
}

export function isValidTournamentFormat(value: string): value is TournamentFormat {
  return (PHASE1_TOURNAMENT_FORMATS as readonly string[]).includes(value);
}

// ─── Lifecycle transitions ────────────────────────────────────────────────────

// Explicit allowed-transitions map. Every edge not listed is forbidden.
// Registration/match/result side effects are NOT implemented here; they belong
// in the Slice 5–7 business logic that calls assertTransition first.
const ALLOWED_TRANSITIONS: Record<TournamentStatus, readonly TournamentStatus[]> = {
  draft: ['published', 'cancelled', 'archived'],
  published: ['registration_open', 'cancelled'],
  registration_open: ['registration_closed', 'cancelled'],
  registration_closed: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: ['archived'],
  cancelled: ['archived'],
  archived: [],
};

export function canTransition(from: TournamentStatus, to: TournamentStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function assertTransition(from: TournamentStatus, to: TournamentStatus): void {
  if (!canTransition(from, to)) {
    throw new UnprocessableEntityException(
      `Cannot transition tournament from "${from}" to "${to}".`,
    );
  }
}
