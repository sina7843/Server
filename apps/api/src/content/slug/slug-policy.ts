const MAX_SLUG_LENGTH = 200;
const NORMALIZED_SLUG_PATTERN = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
const UNSAFE_SLUG_CHARS = /[/?#[\]@!$&'()*+,;=<>{}|\\^`"]/;

export class SlugPolicyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SlugPolicyError';
  }
}

export function normalizeSlug(raw: string): string {
  if (typeof raw !== 'string') {
    throw new SlugPolicyError('Slug must be a string.');
  }

  const trimmed = raw.trim();

  if (trimmed.length === 0) {
    throw new SlugPolicyError('Slug must not be empty.');
  }

  if (UNSAFE_SLUG_CHARS.test(trimmed)) {
    throw new SlugPolicyError('Slug contains unsafe characters.');
  }

  const normalized = trimmed.toLowerCase().replace(/\s+/g, '-').replace(/-{2,}/g, '-');

  if (normalized.length === 0) {
    throw new SlugPolicyError('Slug must not be empty after normalization.');
  }

  if (normalized.length > MAX_SLUG_LENGTH) {
    throw new SlugPolicyError(`Slug must not exceed ${MAX_SLUG_LENGTH} characters.`);
  }

  if (!NORMALIZED_SLUG_PATTERN.test(normalized)) {
    throw new SlugPolicyError(
      'Slug must contain only lowercase letters, numbers, and hyphens, and must start and end with a letter or number.',
    );
  }

  return normalized;
}
