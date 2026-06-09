import { BadRequestException } from '@nestjs/common';
import type { TournamentFormat, TournamentParticipantType } from '@dragon/types';
import type {
  CreateTournamentInput,
  UpdateTournamentInput,
} from '../../../tournaments/tournament.types';

const VALID_PARTICIPANT_TYPES: readonly TournamentParticipantType[] = [
  'individual',
  'team',
  'both',
] as const;

const MAX_TITLE_LENGTH = 200;
const MAX_SLUG_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 2000;
const MAX_RULES_LENGTH = 10000;

const KNOWN_CREATE_FIELDS = new Set([
  'gameId',
  'title',
  'slug',
  'description',
  'format',
  'participantType',
  'capacity',
  'registrationOpenAt',
  'registrationCloseAt',
  'startsAt',
  'endsAt',
  'rules',
  'coverMediaId',
]);

// status, publishedAt, cancelledAt, archivedAt, deletedAt are NOT allowed on PATCH —
// status changes go through the lifecycle endpoints; timestamps are managed by the service.
const KNOWN_UPDATE_FIELDS = new Set([
  'gameId',
  'title',
  'slug',
  'description',
  'format',
  'participantType',
  'capacity',
  'registrationOpenAt',
  'registrationCloseAt',
  'startsAt',
  'endsAt',
  'rules',
  'coverMediaId',
]);

const LIFECYCLE_BLOCKED_FIELDS = new Set([
  'status',
  'publishedAt',
  'cancelledAt',
  'archivedAt',
  'deletedAt',
]);

function parseOptionalDate(value: unknown, fieldName: string): Date | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'string') {
    throw new BadRequestException(`${fieldName} must be a date string.`);
  }
  const d = new Date(value);
  if (isNaN(d.getTime())) {
    throw new BadRequestException(`${fieldName} must be a valid ISO date string.`);
  }
  return d;
}

export function parseAdminCreateTournamentBody(raw: unknown): CreateTournamentInput {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new BadRequestException('Request body must be an object.');
  }

  const body = raw as Record<string, unknown>;

  for (const key of Object.keys(body)) {
    if (LIFECYCLE_BLOCKED_FIELDS.has(key)) {
      throw new BadRequestException(
        `Field "${key}" is not allowed. Use the lifecycle endpoints to manage tournament status.`,
      );
    }
    if (!KNOWN_CREATE_FIELDS.has(key)) {
      throw new BadRequestException(`Unknown field: ${key}.`);
    }
  }

  if (typeof body.gameId !== 'string' || body.gameId.trim().length === 0) {
    throw new BadRequestException('gameId must be a non-empty string.');
  }

  if (typeof body.title !== 'string' || body.title.trim().length === 0) {
    throw new BadRequestException('title must be a non-empty string.');
  }
  if (body.title.trim().length > MAX_TITLE_LENGTH) {
    throw new BadRequestException(`title must not exceed ${MAX_TITLE_LENGTH} characters.`);
  }

  if (typeof body.slug !== 'string' || body.slug.trim().length === 0) {
    throw new BadRequestException('slug must be a non-empty string.');
  }
  if (body.slug.trim().length > MAX_SLUG_LENGTH) {
    throw new BadRequestException(`slug must not exceed ${MAX_SLUG_LENGTH} characters.`);
  }

  if (typeof body.format !== 'string') {
    throw new BadRequestException('format must be a string.');
  }

  if (typeof body.capacity !== 'number' || !Number.isInteger(body.capacity)) {
    throw new BadRequestException('capacity must be an integer.');
  }

  let description: string | undefined;
  if (body.description !== undefined) {
    if (typeof body.description !== 'string') {
      throw new BadRequestException('description must be a string.');
    }
    const trimmed = body.description.trim();
    if (trimmed.length > MAX_DESCRIPTION_LENGTH) {
      throw new BadRequestException(
        `description must not exceed ${MAX_DESCRIPTION_LENGTH} characters.`,
      );
    }
    if (trimmed.length > 0) description = trimmed;
  }

  let rules: string | undefined;
  if (body.rules !== undefined) {
    if (typeof body.rules !== 'string') {
      throw new BadRequestException('rules must be a string.');
    }
    const trimmed = body.rules.trim();
    if (trimmed.length > MAX_RULES_LENGTH) {
      throw new BadRequestException(`rules must not exceed ${MAX_RULES_LENGTH} characters.`);
    }
    if (trimmed.length > 0) rules = trimmed;
  }

  let participantType: TournamentParticipantType | undefined;
  if (body.participantType !== undefined) {
    if (
      typeof body.participantType !== 'string' ||
      !(VALID_PARTICIPANT_TYPES as readonly string[]).includes(body.participantType)
    ) {
      throw new BadRequestException(
        `participantType must be one of: ${VALID_PARTICIPANT_TYPES.join(', ')}.`,
      );
    }
    participantType = body.participantType as TournamentParticipantType;
  }

  const registrationOpenAt = parseOptionalDate(body.registrationOpenAt, 'registrationOpenAt');
  const registrationCloseAt = parseOptionalDate(body.registrationCloseAt, 'registrationCloseAt');
  const startsAt = parseOptionalDate(body.startsAt, 'startsAt');
  const endsAt = parseOptionalDate(body.endsAt, 'endsAt');

  let coverMediaId: string | null | undefined;
  if (body.coverMediaId !== undefined) {
    if (body.coverMediaId === null) {
      coverMediaId = null;
    } else if (typeof body.coverMediaId !== 'string') {
      throw new BadRequestException('coverMediaId must be a string or null.');
    } else {
      const trimmed = body.coverMediaId.trim();
      coverMediaId = trimmed.length > 0 ? trimmed : null;
    }
  }

  return {
    gameId: body.gameId.trim(),
    title: body.title.trim(),
    slug: body.slug.trim(),
    format: body.format as TournamentFormat,
    capacity: body.capacity as number,
    ...(participantType !== undefined ? { participantType } : {}),
    ...(description !== undefined ? { description } : {}),
    ...(rules !== undefined ? { rules } : {}),
    ...(registrationOpenAt !== undefined ? { registrationOpenAt } : {}),
    ...(registrationCloseAt !== undefined ? { registrationCloseAt } : {}),
    ...(startsAt !== undefined ? { startsAt } : {}),
    ...(endsAt !== undefined ? { endsAt } : {}),
    ...(coverMediaId !== undefined ? { coverMediaId } : {}),
  };
}

export function parseAdminUpdateTournamentBody(raw: unknown): UpdateTournamentInput {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new BadRequestException('Request body must be an object.');
  }

  const body = raw as Record<string, unknown>;

  for (const key of Object.keys(body)) {
    if (LIFECYCLE_BLOCKED_FIELDS.has(key)) {
      throw new BadRequestException(
        `Field "${key}" is not allowed. Use the lifecycle endpoints to manage tournament status.`,
      );
    }
    if (!KNOWN_UPDATE_FIELDS.has(key)) {
      throw new BadRequestException(`Unknown field: ${key}.`);
    }
  }

  const result: Record<string, unknown> = {};

  if (body.gameId !== undefined) {
    if (typeof body.gameId !== 'string' || body.gameId.trim().length === 0) {
      throw new BadRequestException('gameId must be a non-empty string.');
    }
    result.gameId = body.gameId.trim();
  }

  if (body.title !== undefined) {
    if (typeof body.title !== 'string' || body.title.trim().length === 0) {
      throw new BadRequestException('title must be a non-empty string.');
    }
    if (body.title.trim().length > MAX_TITLE_LENGTH) {
      throw new BadRequestException(`title must not exceed ${MAX_TITLE_LENGTH} characters.`);
    }
    result.title = body.title.trim();
  }

  if (body.slug !== undefined) {
    if (typeof body.slug !== 'string' || body.slug.trim().length === 0) {
      throw new BadRequestException('slug must be a non-empty string.');
    }
    if (body.slug.trim().length > MAX_SLUG_LENGTH) {
      throw new BadRequestException(`slug must not exceed ${MAX_SLUG_LENGTH} characters.`);
    }
    result.slug = body.slug.trim();
  }

  if (body.format !== undefined) {
    if (typeof body.format !== 'string') {
      throw new BadRequestException('format must be a string.');
    }
    result.format = body.format;
  }

  if (body.participantType !== undefined) {
    if (
      typeof body.participantType !== 'string' ||
      !(VALID_PARTICIPANT_TYPES as readonly string[]).includes(body.participantType)
    ) {
      throw new BadRequestException(
        `participantType must be one of: ${VALID_PARTICIPANT_TYPES.join(', ')}.`,
      );
    }
    result.participantType = body.participantType;
  }

  if (body.capacity !== undefined) {
    if (typeof body.capacity !== 'number' || !Number.isInteger(body.capacity)) {
      throw new BadRequestException('capacity must be an integer.');
    }
    result.capacity = body.capacity;
  }

  if (body.description !== undefined) {
    if (typeof body.description !== 'string') {
      throw new BadRequestException('description must be a string.');
    }
    const trimmed = body.description.trim();
    if (trimmed.length > MAX_DESCRIPTION_LENGTH) {
      throw new BadRequestException(
        `description must not exceed ${MAX_DESCRIPTION_LENGTH} characters.`,
      );
    }
    result.description = trimmed;
  }

  if (body.rules !== undefined) {
    if (typeof body.rules !== 'string') {
      throw new BadRequestException('rules must be a string.');
    }
    const trimmed = body.rules.trim();
    if (trimmed.length > MAX_RULES_LENGTH) {
      throw new BadRequestException(`rules must not exceed ${MAX_RULES_LENGTH} characters.`);
    }
    result.rules = trimmed;
  }

  const registrationOpenAt = parseOptionalDate(body.registrationOpenAt, 'registrationOpenAt');
  const registrationCloseAt = parseOptionalDate(body.registrationCloseAt, 'registrationCloseAt');
  const startsAt = parseOptionalDate(body.startsAt, 'startsAt');
  const endsAt = parseOptionalDate(body.endsAt, 'endsAt');

  if (registrationOpenAt !== undefined) result.registrationOpenAt = registrationOpenAt;
  if (registrationCloseAt !== undefined) result.registrationCloseAt = registrationCloseAt;
  if (startsAt !== undefined) result.startsAt = startsAt;
  if (endsAt !== undefined) result.endsAt = endsAt;

  if (body.coverMediaId !== undefined) {
    if (body.coverMediaId === null) {
      result.coverMediaId = null;
    } else if (typeof body.coverMediaId !== 'string') {
      throw new BadRequestException('coverMediaId must be a string or null.');
    } else {
      result.coverMediaId = body.coverMediaId.trim() || null;
    }
  }

  return result as UpdateTournamentInput;
}

export function parseLifecycleActionBody(raw: unknown): { reason?: string } {
  if (raw === undefined || raw === null) return {};
  if (typeof raw !== 'object' || Array.isArray(raw)) {
    throw new BadRequestException('Request body must be an object.');
  }
  const body = raw as Record<string, unknown>;
  for (const key of Object.keys(body)) {
    if (key !== 'reason') throw new BadRequestException(`Unknown field: ${key}.`);
  }
  if (body.reason !== undefined) {
    if (typeof body.reason !== 'string') {
      throw new BadRequestException('reason must be a string.');
    }
    return { reason: body.reason };
  }
  return {};
}
