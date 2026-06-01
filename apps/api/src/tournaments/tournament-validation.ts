import { BadRequestException, UnprocessableEntityException } from '@nestjs/common';
import type { TournamentFormat, TournamentStatus } from '@dragon/types';
import { isValidTournamentFormat, isValidTournamentStatus } from './tournament-policy';

// ─── Required-field guards ────────────────────────────────────────────────────

export function assertTournamentTitle(title: unknown): asserts title is string {
  if (typeof title !== 'string' || title.trim().length === 0) {
    throw new BadRequestException('Tournament title is required.');
  }
}

export function assertTournamentGameId(gameId: unknown): asserts gameId is string {
  if (typeof gameId !== 'string' || gameId.trim().length === 0) {
    throw new BadRequestException('Tournament gameId is required.');
  }
}

// ─── Enum guards ──────────────────────────────────────────────────────────────

export function assertTournamentFormat(format: unknown): asserts format is TournamentFormat {
  if (typeof format !== 'string' || !isValidTournamentFormat(format)) {
    throw new UnprocessableEntityException(
      `Unsupported tournament format: "${String(format)}". ` +
        'Supported formats: single_elimination, round_robin, manual.',
    );
  }
}

export function assertTournamentStatus(status: unknown): asserts status is TournamentStatus {
  if (typeof status !== 'string' || !isValidTournamentStatus(status)) {
    throw new UnprocessableEntityException(`Invalid tournament status: "${String(status)}".`);
  }
}

// ─── Numeric guards ───────────────────────────────────────────────────────────

export function assertTournamentCapacity(capacity: unknown): asserts capacity is number {
  if (typeof capacity !== 'number' || !Number.isInteger(capacity) || capacity < 1) {
    throw new BadRequestException('Tournament capacity must be a positive integer of at least 1.');
  }
}

// ─── Date-window consistency ──────────────────────────────────────────────────

export function assertRegistrationWindow(
  registrationOpenAt?: Date,
  registrationCloseAt?: Date,
): void {
  if (registrationOpenAt !== undefined && registrationCloseAt !== undefined) {
    if (registrationCloseAt <= registrationOpenAt) {
      throw new UnprocessableEntityException(
        'registrationCloseAt must be after registrationOpenAt.',
      );
    }
  }
}

export function assertTournamentSchedule(startsAt?: Date, endsAt?: Date): void {
  if (startsAt !== undefined && endsAt !== undefined) {
    if (endsAt <= startsAt) {
      throw new UnprocessableEntityException('endsAt must be after startsAt.');
    }
  }
}
