/**
 * Result recording policy (Task 7.2).
 *
 * Tournament lifecycle restriction:
 *   Result recording, updating, and voiding are only allowed when the
 *   tournament is in `in_progress` status. Admin correction outside this
 *   state is not supported in Phase 1.
 *
 * Match state restrictions:
 *   record  — match must be in `scheduled` or `in_progress` (not yet completed or cancelled).
 *   update  — match must be in `completed` (result already exists).
 *   void    — match must be in `completed` (result exists to void).
 *
 * Winner policy:
 *   Winner is required for every result (no draw/tie support in Phase 1).
 *   Winner must be participant1Id or participant2Id of the match.
 *   Both participants must be set on the match before a result can be recorded.
 *
 * Void policy:
 *   Voiding clears winnerId, participant1Score, participant2Score, resultNotes,
 *   resultRecordedAt, and completedAt, and moves the match back to `scheduled`.
 */

import { BadRequestException } from '@nestjs/common';
import type { TournamentMatchDocument } from './tournament-match.schema';
import type { TournamentStatus } from '@dragon/types';
import type { Types } from 'mongoose';

// Tournament statuses that allow result operations.
const RESULT_ALLOWED_TOURNAMENT_STATUSES: TournamentStatus[] = ['in_progress'];

export function assertTournamentAllowsResult(status: TournamentStatus): void {
  if (!RESULT_ALLOWED_TOURNAMENT_STATUSES.includes(status)) {
    throw new BadRequestException(
      `Result operations require tournament status 'in_progress'. Current status: '${status}'.`,
    );
  }
}

export function assertMatchIsRecordable(match: TournamentMatchDocument): void {
  if (match.status === 'completed') {
    throw new BadRequestException(
      'A result has already been recorded for this match. Use PATCH to update it.',
    );
  }
  if (match.status === 'cancelled') {
    throw new BadRequestException('Cannot record a result for a cancelled match.');
  }
}

export function assertMatchHasResult(match: TournamentMatchDocument): void {
  if (match.status !== 'completed') {
    throw new BadRequestException(
      'This match does not have a recorded result. Use POST to record one.',
    );
  }
}

export function assertBothParticipantsPresent(match: TournamentMatchDocument): void {
  if (!match.participant1Id || !match.participant2Id) {
    throw new BadRequestException(
      'Both participants must be set on the match before a result can be recorded.',
    );
  }
}

export function assertWinnerIsParticipant(
  winnerId: Types.ObjectId,
  match: TournamentMatchDocument,
): void {
  const p1 = match.participant1Id ? String(match.participant1Id) : null;
  const p2 = match.participant2Id ? String(match.participant2Id) : null;
  const w = String(winnerId);

  if (w !== p1 && w !== p2) {
    throw new BadRequestException(
      'Winner must be one of the match participants (participant1Id or participant2Id).',
    );
  }
}
