import { BadRequestException } from '@nestjs/common';
import { CONTENT_POST_TYPES, type ContentPostType } from '@dragon/types';

const MAX_TITLE_LENGTH = 500;
const MAX_SLUG_LENGTH = 200;
const MAX_EXCERPT_LENGTH = 1000;

export interface AdminCreatePostBodyDto {
  readonly type: ContentPostType;
  readonly title: string;
  readonly slug: string;
  readonly excerpt?: string;
  readonly bodyJson: Record<string, unknown>;
  readonly bodyHtml: string;
  readonly categoryIds: string[];
  readonly tagIds: string[];
  readonly seo: {
    readonly title?: string;
    readonly description?: string;
    readonly canonicalUrl?: string;
    readonly noIndex?: boolean;
  };
  readonly coverMediaId?: string | null;
}

export interface AdminUpdatePostBodyDto {
  readonly title?: string;
  readonly slug?: string;
  readonly excerpt?: string;
  readonly bodyJson?: Record<string, unknown>;
  readonly bodyHtml?: string;
  readonly categoryIds?: string[];
  readonly tagIds?: string[];
  readonly seo?: {
    readonly title?: string;
    readonly description?: string;
    readonly canonicalUrl?: string;
    readonly noIndex?: boolean;
  };
  readonly coverMediaId?: string | null;
}

const KNOWN_CREATE_FIELDS = new Set([
  'type',
  'title',
  'slug',
  'excerpt',
  'bodyJson',
  'bodyHtml',
  'categoryIds',
  'tagIds',
  'seo',
  'coverMediaId',
]);

const KNOWN_UPDATE_FIELDS = new Set([
  'title',
  'slug',
  'excerpt',
  'bodyJson',
  'bodyHtml',
  'categoryIds',
  'tagIds',
  'seo',
  'coverMediaId',
]);

const KNOWN_SEO_FIELDS = new Set(['title', 'description', 'canonicalUrl', 'noIndex']);

function validateSeoInput(raw: unknown): AdminCreatePostBodyDto['seo'] {
  if (raw === undefined || raw === null) return {};
  if (typeof raw !== 'object' || Array.isArray(raw)) {
    throw new BadRequestException('seo must be an object.');
  }
  const obj = raw as Record<string, unknown>;
  for (const key of Object.keys(obj)) {
    if (!KNOWN_SEO_FIELDS.has(key)) {
      throw new BadRequestException(`Unknown seo field: ${key}.`);
    }
  }
  const seo: Record<string, unknown> = {};
  if (obj.title !== undefined) {
    if (typeof obj.title !== 'string') throw new BadRequestException('seo.title must be a string.');
    seo.title = obj.title.trim();
  }
  if (obj.description !== undefined) {
    if (typeof obj.description !== 'string')
      throw new BadRequestException('seo.description must be a string.');
    seo.description = obj.description.trim();
  }
  if (obj.canonicalUrl !== undefined) {
    if (typeof obj.canonicalUrl !== 'string')
      throw new BadRequestException('seo.canonicalUrl must be a string.');
    seo.canonicalUrl = obj.canonicalUrl.trim();
  }
  if (obj.noIndex !== undefined) {
    if (typeof obj.noIndex !== 'boolean')
      throw new BadRequestException('seo.noIndex must be a boolean.');
    seo.noIndex = obj.noIndex;
  }
  return seo as AdminCreatePostBodyDto['seo'];
}

function validateStringArray(value: unknown, fieldName: string): string[] {
  if (!Array.isArray(value)) throw new BadRequestException(`${fieldName} must be an array.`);
  for (const item of value) {
    if (typeof item !== 'string')
      throw new BadRequestException(`${fieldName} must be an array of strings.`);
  }
  return value as string[];
}

export function parseAdminCreatePostBody(raw: unknown): AdminCreatePostBodyDto {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new BadRequestException('Request body must be an object.');
  }

  const body = raw as Record<string, unknown>;

  for (const key of Object.keys(body)) {
    if (!KNOWN_CREATE_FIELDS.has(key)) {
      throw new BadRequestException(`Unknown field: ${key}.`);
    }
  }

  if (!(CONTENT_POST_TYPES as readonly unknown[]).includes(body.type)) {
    throw new BadRequestException(`type must be one of: ${CONTENT_POST_TYPES.join(', ')}.`);
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

  let excerpt: string | undefined;
  if (body.excerpt !== undefined) {
    if (typeof body.excerpt !== 'string')
      throw new BadRequestException('excerpt must be a string.');
    const trimmed = body.excerpt.trim();
    if (trimmed.length > MAX_EXCERPT_LENGTH) {
      throw new BadRequestException(`excerpt must not exceed ${MAX_EXCERPT_LENGTH} characters.`);
    }
    if (trimmed.length > 0) excerpt = trimmed;
  }

  const bodyJson =
    body.bodyJson !== undefined
      ? typeof body.bodyJson === 'object' && !Array.isArray(body.bodyJson) && body.bodyJson !== null
        ? (body.bodyJson as Record<string, unknown>)
        : (() => {
            throw new BadRequestException('bodyJson must be an object.');
          })()
      : {};

  const bodyHtml =
    body.bodyHtml !== undefined
      ? typeof body.bodyHtml === 'string'
        ? body.bodyHtml
        : (() => {
            throw new BadRequestException('bodyHtml must be a string.');
          })()
      : '';

  const categoryIds =
    body.categoryIds !== undefined ? validateStringArray(body.categoryIds, 'categoryIds') : [];

  const tagIds = body.tagIds !== undefined ? validateStringArray(body.tagIds, 'tagIds') : [];

  const seo = validateSeoInput(body.seo);

  let coverMediaId: string | null | undefined;
  if (body.coverMediaId !== undefined) {
    if (body.coverMediaId !== null && typeof body.coverMediaId !== 'string') {
      throw new BadRequestException('coverMediaId must be a string or null.');
    }
    const cov = body.coverMediaId === '' ? null : (body.coverMediaId as string | null);
    if (cov !== null && !/^[0-9a-f]{24}$/i.test(cov)) {
      throw new BadRequestException('coverMediaId must be a valid 24-character ObjectId.');
    }
    coverMediaId = cov;
  }

  return {
    type: body.type as ContentPostType,
    title: body.title.trim(),
    slug: body.slug.trim(),
    ...(excerpt !== undefined ? { excerpt } : {}),
    bodyJson,
    bodyHtml,
    categoryIds,
    tagIds,
    seo,
    ...(coverMediaId !== undefined ? { coverMediaId } : {}),
  };
}

export function parseAdminUpdatePostBody(raw: unknown): AdminUpdatePostBodyDto {
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
    result.slug = body.slug.trim();
  }

  if (body.excerpt !== undefined) {
    if (typeof body.excerpt !== 'string')
      throw new BadRequestException('excerpt must be a string.');
    const trimmed = body.excerpt.trim();
    if (trimmed.length > MAX_EXCERPT_LENGTH) {
      throw new BadRequestException(`excerpt must not exceed ${MAX_EXCERPT_LENGTH} characters.`);
    }
    result.excerpt = trimmed;
  }

  if (body.bodyJson !== undefined) {
    if (
      typeof body.bodyJson !== 'object' ||
      Array.isArray(body.bodyJson) ||
      body.bodyJson === null
    ) {
      throw new BadRequestException('bodyJson must be an object.');
    }
    result.bodyJson = body.bodyJson as Record<string, unknown>;
  }

  if (body.bodyHtml !== undefined) {
    if (typeof body.bodyHtml !== 'string')
      throw new BadRequestException('bodyHtml must be a string.');
    result.bodyHtml = body.bodyHtml;
  }

  if (body.categoryIds !== undefined) {
    result.categoryIds = validateStringArray(body.categoryIds, 'categoryIds');
  }

  if (body.tagIds !== undefined) {
    result.tagIds = validateStringArray(body.tagIds, 'tagIds');
  }

  if (body.seo !== undefined) {
    result.seo = validateSeoInput(body.seo);
  }

  if (body.coverMediaId !== undefined) {
    if (body.coverMediaId !== null && typeof body.coverMediaId !== 'string') {
      throw new BadRequestException('coverMediaId must be a string or null.');
    }
    result.coverMediaId = body.coverMediaId === '' ? null : (body.coverMediaId as string | null);
  }

  return result as AdminUpdatePostBodyDto;
}
