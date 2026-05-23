import { randomUUID } from 'node:crypto';

const SAFE_EXTENSION_PATTERN = /^[a-z0-9]{1,10}$/;
const DISALLOWED_KEY_PATTERN = /\.\.|\\|\0/;

const MIME_TO_EXTENSION: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
  'image/svg+xml': 'svg',
  'application/pdf': 'pdf',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'audio/mpeg': 'mp3',
  'audio/ogg': 'ogg',
  'application/zip': 'zip',
  'text/plain': 'txt',
  'application/json': 'json',
};

export interface ObjectKeyOptions {
  namespace?: string;
  suffix?: string;
  mimeType?: string;
}

export function extensionFromMimeType(mimeType: string): string | undefined {
  return MIME_TO_EXTENSION[mimeType.toLowerCase().trim()];
}

export function generateObjectKey(options: ObjectKeyOptions = {}): string {
  const { namespace = 'media/original', suffix, mimeType } = options;

  if (DISALLOWED_KEY_PATTERN.test(namespace)) {
    throw new Error('Object key namespace contains disallowed characters.');
  }
  if (namespace.startsWith('/')) {
    throw new Error('Object key namespace must not be an absolute path.');
  }

  const now = new Date();
  const yyyy = now.getUTCFullYear().toString();
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');

  const id = randomUUID().replace(/-/g, '');

  let ext = '';
  if (mimeType) {
    const derived = extensionFromMimeType(mimeType);
    if (derived) ext = `.${derived}`;
  }

  const name = suffix ? `${id}-${suffix}` : id;

  return `${namespace}/${yyyy}/${mm}/${name}${ext}`;
}

export function assertSafeObjectKey(objectKey: string): void {
  if (DISALLOWED_KEY_PATTERN.test(objectKey)) {
    throw new Error('Object key contains disallowed characters (path traversal or null byte).');
  }
  if (objectKey.startsWith('/')) {
    throw new Error('Object key must not be an absolute path.');
  }
  const parts = objectKey.split('/');
  for (const part of parts) {
    if (part === '' && parts.indexOf(part) !== 0) {
      throw new Error('Object key must not contain empty segments.');
    }
  }
}

export function normalizeSafeExtension(raw: string): string | undefined {
  const cleaned = raw.replace(/^\./, '').toLowerCase().trim();
  return SAFE_EXTENSION_PATTERN.test(cleaned) ? cleaned : undefined;
}
