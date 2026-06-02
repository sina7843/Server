import { BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';
import type { TournamentMatchDocument } from './tournament-match.schema';
import type { TournamentFormat, TournamentStatus } from '@dragon/types';

// Statuses from which a match can be cancelled.
const CANCELLABLE_STATUSES = new Set(['scheduled', 'in_progress']);

// Tournament statuses that allow match generation.
const GENERATION_ALLOWED_STATUSES: TournamentStatus[] = ['registration_closed', 'in_progress'];

// Tournament formats that support auto-generation.
const GENERATABLE_FORMATS: TournamentFormat[] = ['single_elimination', 'round_robin'];

// Tournament statuses that allow manual match create/update/cancel.
const MATCH_MANAGEMENT_ALLOWED_STATUSES: TournamentStatus[] = [
  'registration_closed',
  'in_progress',
];

export function assertMatchIsCancellable(match: TournamentMatchDocument): void {
  if (!CANCELLABLE_STATUSES.has(match.status)) {
    throw new BadRequestException(`Cannot cancel a match with status '${match.status}'.`);
  }
}

export function assertMatchIsUpdatable(match: TournamentMatchDocument): void {
  if (match.status === 'cancelled') {
    throw new BadRequestException('Cannot update a cancelled match.');
  }
  if (match.status === 'completed') {
    throw new BadRequestException('Cannot update a completed match.');
  }
}

export function assertTournamentAllowsGeneration(
  status: TournamentStatus,
  format: TournamentFormat,
): void {
  if (!GENERATION_ALLOWED_STATUSES.includes(status)) {
    throw new BadRequestException(
      `Match generation requires tournament status 'registration_closed' or 'in_progress'. Current status: '${status}'.`,
    );
  }
  if (!GENERATABLE_FORMATS.includes(format)) {
    throw new BadRequestException(
      `Match generation is not supported for format '${format}'. Supported formats: ${GENERATABLE_FORMATS.join(', ')}.`,
    );
  }
}

export function assertTournamentAllowsMatchCreate(status: TournamentStatus): void {
  if (!MATCH_MANAGEMENT_ALLOWED_STATUSES.includes(status)) {
    throw new BadRequestException(
      `Manual match creation requires tournament status 'registration_closed' or 'in_progress'. Current status: '${status}'.`,
    );
  }
}

export function assertTournamentAllowsMatchManagement(status: TournamentStatus): void {
  if (!MATCH_MANAGEMENT_ALLOWED_STATUSES.includes(status)) {
    throw new BadRequestException(
      `Match management requires tournament status 'registration_closed' or 'in_progress'. Current status: '${status}'.`,
    );
  }
}

export function assertParticipantsAreActiveInTournament(
  activeIdSet: ReadonlySet<string>,
  ...participantIds: (Types.ObjectId | string | null | undefined)[]
): void {
  for (const id of participantIds) {
    if (id == null) continue;
    const idStr = String(id);
    if (!activeIdSet.has(idStr)) {
      throw new BadRequestException(
        `Participant '${idStr}' is not an active participant in this tournament.`,
      );
    }
  }
}
