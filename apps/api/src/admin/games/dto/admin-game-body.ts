import { BadRequestException } from '@nestjs/common';
import type { GameStatus } from '@dragon/types';
import type { CreateGameInput, UpdateGameInput } from '../../../games/game.types';

const MAX_NAME_LENGTH = 200;
const MAX_SLUG_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 1000;

const GAME_STATUSES = new Set<string>(['active', 'inactive', 'archived']);

const KNOWN_CREATE_FIELDS = new Set([
  'name',
  'slug',
  'description',
  'status',
  'coverMediaId',
  'iconMediaId',
]);
const KNOWN_UPDATE_FIELDS = new Set([
  'name',
  'slug',
  'description',
  'status',
  'coverMediaId',
  'iconMediaId',
]);

export function parseAdminCreateGameBody(raw: unknown): CreateGameInput {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new BadRequestException('Request body must be an object.');
  }

  const body = raw as Record<string, unknown>;

  for (const key of Object.keys(body)) {
    if (!KNOWN_CREATE_FIELDS.has(key)) {
      throw new BadRequestException(`Unknown field: ${key}.`);
    }
  }

  if (typeof body.name !== 'string' || body.name.trim().length === 0) {
    throw new BadRequestException('name must be a non-empty string.');
  }
  if (body.name.trim().length > MAX_NAME_LENGTH) {
    throw new BadRequestException(`name must not exceed ${MAX_NAME_LENGTH} characters.`);
  }

  if (typeof body.slug !== 'string' || body.slug.trim().length === 0) {
    throw new BadRequestException('slug must be a non-empty string.');
  }
  if (body.slug.trim().length > MAX_SLUG_LENGTH) {
    throw new BadRequestException(`slug must not exceed ${MAX_SLUG_LENGTH} characters.`);
  }

  const status: GameStatus =
    body.status !== undefined
      ? (() => {
          if (!GAME_STATUSES.has(body.status as string)) {
            throw new BadRequestException('status must be one of: active, inactive, archived.');
          }
          return body.status as GameStatus;
        })()
      : 'active';

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

  let coverMediaId: string | undefined;
  if (body.coverMediaId !== undefined) {
    if (typeof body.coverMediaId !== 'string') {
      throw new BadRequestException('coverMediaId must be a string.');
    }
    const trimmed = body.coverMediaId.trim();
    if (trimmed.length > 0) coverMediaId = trimmed;
  }

  let iconMediaId: string | undefined;
  if (body.iconMediaId !== undefined) {
    if (typeof body.iconMediaId !== 'string') {
      throw new BadRequestException('iconMediaId must be a string.');
    }
    const trimmed = body.iconMediaId.trim();
    if (trimmed.length > 0) iconMediaId = trimmed;
  }

  return {
    name: body.name.trim(),
    slug: body.slug.trim(),
    status,
    ...(description !== undefined ? { description } : {}),
    ...(coverMediaId !== undefined ? { coverMediaId } : {}),
    ...(iconMediaId !== undefined ? { iconMediaId } : {}),
  };
}

export function parseAdminUpdateGameBody(raw: unknown): UpdateGameInput {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new BadRequestException('Request body must be an object.');
  }

  const body = raw as Record<string, unknown>;

  for (const key of Object.keys(body)) {
    if (!KNOWN_UPDATE_FIELDS.has(key)) {
      throw new BadRequestException(`Unknown field: ${key}.`);
    }
  }

  const result: Record<string, unknown> = {};

  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || body.name.trim().length === 0) {
      throw new BadRequestException('name must be a non-empty string.');
    }
    if (body.name.trim().length > MAX_NAME_LENGTH) {
      throw new BadRequestException(`name must not exceed ${MAX_NAME_LENGTH} characters.`);
    }
    result.name = body.name.trim();
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

  if (body.status !== undefined) {
    if (!GAME_STATUSES.has(body.status as string)) {
      throw new BadRequestException('status must be one of: active, inactive, archived.');
    }
    result.status = body.status;
  }

  if (body.description !== undefined) {
    if (typeof body.description !== 'string') {
      throw new BadRequestException('description must be a string.');
    }
    result.description = body.description.trim();
  }

  if (body.coverMediaId !== undefined) {
    if (typeof body.coverMediaId !== 'string') {
      throw new BadRequestException('coverMediaId must be a string.');
    }
    result.coverMediaId = body.coverMediaId.trim();
  }

  if (body.iconMediaId !== undefined) {
    if (typeof body.iconMediaId !== 'string') {
      throw new BadRequestException('iconMediaId must be a string.');
    }
    result.iconMediaId = body.iconMediaId.trim();
  }

  return result as UpdateGameInput;
}
