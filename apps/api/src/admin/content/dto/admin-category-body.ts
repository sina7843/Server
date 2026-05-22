import { BadRequestException } from '@nestjs/common';

const MAX_NAME_LENGTH = 200;
const MAX_SLUG_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 1000;

const KNOWN_CREATE_FIELDS = new Set(['name', 'slug', 'description', 'parentId', 'sortOrder']);
const KNOWN_UPDATE_FIELDS = new Set(['name', 'description', 'parentId', 'sortOrder']);

export interface AdminCreateCategoryBodyDto {
  readonly name: string;
  readonly slug: string;
  readonly description?: string;
  readonly parentId?: string;
  readonly sortOrder: number;
}

export interface AdminUpdateCategoryBodyDto {
  readonly name?: string;
  readonly description?: string;
  readonly parentId?: string;
  readonly sortOrder?: number;
}

export function parseAdminCreateCategoryBody(raw: unknown): AdminCreateCategoryBodyDto {
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

  let description: string | undefined;
  if (body.description !== undefined) {
    if (typeof body.description !== 'string')
      throw new BadRequestException('description must be a string.');
    const trimmed = body.description.trim();
    if (trimmed.length > MAX_DESCRIPTION_LENGTH) {
      throw new BadRequestException(
        `description must not exceed ${MAX_DESCRIPTION_LENGTH} characters.`,
      );
    }
    if (trimmed.length > 0) description = trimmed;
  }

  let parentId: string | undefined;
  if (body.parentId !== undefined) {
    if (typeof body.parentId !== 'string')
      throw new BadRequestException('parentId must be a string.');
    parentId = body.parentId;
  }

  let sortOrder = 0;
  if (body.sortOrder !== undefined) {
    const n = Number(body.sortOrder);
    if (!Number.isInteger(n)) throw new BadRequestException('sortOrder must be an integer.');
    sortOrder = n;
  }

  return {
    name: body.name.trim(),
    slug: body.slug.trim(),
    ...(description !== undefined ? { description } : {}),
    ...(parentId !== undefined ? { parentId } : {}),
    sortOrder,
  };
}

export function parseAdminUpdateCategoryBody(raw: unknown): AdminUpdateCategoryBodyDto {
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

  if (body.description !== undefined) {
    if (typeof body.description !== 'string')
      throw new BadRequestException('description must be a string.');
    result.description = body.description.trim();
  }

  if (body.parentId !== undefined) {
    if (typeof body.parentId !== 'string')
      throw new BadRequestException('parentId must be a string.');
    result.parentId = body.parentId;
  }

  if (body.sortOrder !== undefined) {
    const n = Number(body.sortOrder);
    if (!Number.isInteger(n)) throw new BadRequestException('sortOrder must be an integer.');
    result.sortOrder = n;
  }

  return result as AdminUpdateCategoryBodyDto;
}
