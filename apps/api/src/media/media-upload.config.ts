import sharp from 'sharp';
import {
  ALLOWED_MEDIA_EXTENSIONS,
  ALLOWED_MEDIA_MIME_TYPES,
  MIME_TO_EXTENSION_MAP,
  type AllowedMediaExtension,
  type AllowedMediaMimeType,
} from '@dragon/types';
import { BadRequestException } from '@nestjs/common';

export const DEFAULT_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export function getMaxFileSizeBytes(): number {
  const raw = process.env['MEDIA_MAX_FILE_SIZE_BYTES']?.trim();
  if (!raw) return DEFAULT_MAX_FILE_SIZE_BYTES;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) return DEFAULT_MAX_FILE_SIZE_BYTES;
  return parsed;
}

export function isAllowedMimeType(mimeType: string): mimeType is AllowedMediaMimeType {
  return (ALLOWED_MEDIA_MIME_TYPES as readonly string[]).includes(mimeType);
}

export function isAllowedExtension(ext: string): ext is AllowedMediaExtension {
  return (ALLOWED_MEDIA_EXTENSIONS as readonly string[]).includes(ext.toLowerCase());
}

export function normalizeExtensionFromMime(mimeType: string): string | undefined {
  return MIME_TO_EXTENSION_MAP[mimeType];
}

export function validateUploadedFile(file: {
  originalname: string;
  mimetype: string;
  size: number;
}): { extension: string; safeOriginalName: string } {
  if (!isAllowedMimeType(file.mimetype)) {
    throw new BadRequestException(
      `Unsupported file type: ${file.mimetype}. Allowed: ${ALLOWED_MEDIA_MIME_TYPES.join(', ')}.`,
    );
  }

  const maxSize = getMaxFileSizeBytes();
  if (file.size > maxSize) {
    throw new BadRequestException(`File exceeds maximum size of ${maxSize} bytes.`);
  }

  const rawOriginalName = file.originalname ?? '';
  const dotIndex = rawOriginalName.lastIndexOf('.');
  const rawExt = dotIndex >= 0 ? rawOriginalName.slice(dotIndex + 1).toLowerCase() : '';

  if (!isAllowedExtension(rawExt)) {
    throw new BadRequestException(
      `Unsupported file extension: ${rawExt || '(none)'}. Allowed: ${ALLOWED_MEDIA_EXTENSIONS.join(', ')}.`,
    );
  }

  const expectedExt = normalizeExtensionFromMime(file.mimetype);
  const allowedExtsForMime =
    file.mimetype === 'image/jpeg' ? ['jpg', 'jpeg'] : expectedExt ? [expectedExt] : [];

  if (allowedExtsForMime.length > 0 && !allowedExtsForMime.includes(rawExt)) {
    throw new BadRequestException(
      `File extension does not match MIME type. Expected extension for ${file.mimetype}: ${allowedExtsForMime.join(' or ')}.`,
    );
  }

  const safeOriginalName = rawOriginalName
    .replace(/[^\w.-]/g, '_')
    .replace(/\.{2,}/g, '_')
    .slice(0, 200);

  return { extension: rawExt === 'jpeg' ? 'jpg' : rawExt, safeOriginalName };
}

const MIME_TO_SHARP_FORMAT: Readonly<Record<string, string>> = {
  'image/jpeg': 'jpeg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

/**
 * Validates that the buffer's actual content matches the declared MIME type.
 * Uses sharp to read real image headers — rejects fake/mismatched content.
 */
export async function validateImageContent(buffer: Buffer, mimeType: string): Promise<void> {
  const expectedFormat = MIME_TO_SHARP_FORMAT[mimeType];

  if (!expectedFormat) {
    throw new BadRequestException(`Content validation is not supported for type: ${mimeType}.`);
  }

  let detectedFormat: string | undefined;

  try {
    const meta = await sharp(buffer, { failOn: 'error' }).metadata();
    detectedFormat = meta.format;
  } catch {
    throw new BadRequestException('File content is not a valid image or is corrupt.');
  }

  if (detectedFormat !== expectedFormat) {
    throw new BadRequestException(
      `File content does not match declared type. Declared: ${mimeType}, detected: ${detectedFormat ?? 'unknown'}.`,
    );
  }
}
