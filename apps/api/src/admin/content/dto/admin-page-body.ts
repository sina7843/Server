import { BadRequestException } from '@nestjs/common';

const MAX_TITLE_LENGTH = 500;
const MAX_SLUG_LENGTH = 200;

const KNOWN_CREATE_FIELDS = new Set(['title', 'slug', 'bodyJson', 'bodyHtml', 'seo']);
const KNOWN_UPDATE_FIELDS = new Set(['title', 'slug', 'bodyJson', 'bodyHtml', 'seo']);
const KNOWN_SEO_FIELDS = new Set(['title', 'description', 'canonicalUrl', 'noIndex']);

export interface AdminCreatePageBodyDto {
  readonly title: string;
  readonly slug: string;
  readonly bodyJson: Record<string, unknown>;
  readonly bodyHtml: string;
  readonly seo: {
    readonly title?: string;
    readonly description?: string;
    readonly canonicalUrl?: string;
    readonly noIndex?: boolean;
  };
}

export interface AdminUpdatePageBodyDto {
  readonly title?: string;
  readonly slug?: string;
  readonly bodyJson?: Record<string, unknown>;
  readonly bodyHtml?: string;
  readonly seo?: {
    readonly title?: string;
    readonly description?: string;
    readonly canonicalUrl?: string;
    readonly noIndex?: boolean;
  };
}

function validateSeoInput(raw: unknown): AdminCreatePageBodyDto['seo'] {
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
  return seo as AdminCreatePageBodyDto['seo'];
}

export function parseAdminCreatePageBody(raw: unknown): AdminCreatePageBodyDto {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new BadRequestException('Request body must be an object.');
  }

  const body = raw as Record<string, unknown>;

  for (const key of Object.keys(body)) {
    if (!KNOWN_CREATE_FIELDS.has(key)) {
      throw new BadRequestException(`Unknown field: ${key}.`);
    }
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

  const seo = validateSeoInput(body.seo);

  return {
    title: body.title.trim(),
    slug: body.slug.trim(),
    bodyJson,
    bodyHtml,
    seo,
  };
}

export function parseAdminUpdatePageBody(raw: unknown): AdminUpdatePageBodyDto {
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
    result.title = body.title.trim();
  }

  if (body.slug !== undefined) {
    if (typeof body.slug !== 'string' || body.slug.trim().length === 0) {
      throw new BadRequestException('slug must be a non-empty string.');
    }
    result.slug = body.slug.trim();
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

  if (body.seo !== undefined) {
    result.seo = validateSeoInput(body.seo);
  }

  return result as AdminUpdatePageBodyDto;
}
