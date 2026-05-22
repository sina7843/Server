import { BadRequestException } from '@nestjs/common';

const MAX_NAME_LENGTH = 100;
const MAX_SLUG_LENGTH = 200;

const KNOWN_CREATE_FIELDS = new Set(['name', 'slug']);
const KNOWN_UPDATE_FIELDS = new Set(['name']);

export interface AdminCreateTagBodyDto {
  readonly name: string;
  readonly slug: string;
}

export interface AdminUpdateTagBodyDto {
  readonly name?: string;
}

export function parseAdminCreateTagBody(raw: unknown): AdminCreateTagBodyDto {
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

  return {
    name: body.name.trim(),
    slug: body.slug.trim(),
  };
}

export function parseAdminUpdateTagBody(raw: unknown): AdminUpdateTagBodyDto {
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
    result.name = body.name.trim();
  }

  return result as AdminUpdateTagBodyDto;
}
