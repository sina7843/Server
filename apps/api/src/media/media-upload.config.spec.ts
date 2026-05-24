import { BadRequestException } from '@nestjs/common';
import {
  validateUploadedFile,
  validateImageContent,
  isAllowedMimeType,
  isAllowedExtension,
} from './media-upload.config';

jest.mock('sharp');
import sharp from 'sharp';

const VALID_JPEG = { originalname: 'photo.jpg', mimetype: 'image/jpeg', size: 1024 };
const VALID_PNG = { originalname: 'image.png', mimetype: 'image/png', size: 2048 };
const VALID_WEBP = { originalname: 'pic.webp', mimetype: 'image/webp', size: 512 };
const VALID_GIF = { originalname: 'anim.gif', mimetype: 'image/gif', size: 4096 };

describe('validateUploadedFile', () => {
  it('accepts valid JPEG', () => {
    const result = validateUploadedFile(VALID_JPEG);
    expect(result.extension).toBe('jpg');
  });

  it('accepts jpeg extension', () => {
    const result = validateUploadedFile({
      originalname: 'photo.jpeg',
      mimetype: 'image/jpeg',
      size: 100,
    });
    expect(result.extension).toBe('jpg');
  });

  it('accepts valid PNG', () => {
    const result = validateUploadedFile(VALID_PNG);
    expect(result.extension).toBe('png');
  });

  it('accepts valid WebP', () => {
    const result = validateUploadedFile(VALID_WEBP);
    expect(result.extension).toBe('webp');
  });

  it('accepts valid GIF', () => {
    const result = validateUploadedFile(VALID_GIF);
    expect(result.extension).toBe('gif');
  });

  it('rejects unsupported MIME type (video/mp4)', () => {
    expect(() =>
      validateUploadedFile({ originalname: 'video.mp4', mimetype: 'video/mp4', size: 100 }),
    ).toThrow(BadRequestException);
  });

  it('rejects unsupported MIME type (application/pdf)', () => {
    expect(() =>
      validateUploadedFile({ originalname: 'doc.pdf', mimetype: 'application/pdf', size: 100 }),
    ).toThrow(BadRequestException);
  });

  it('rejects dangerous extension (.exe)', () => {
    expect(() =>
      validateUploadedFile({ originalname: 'evil.exe', mimetype: 'image/jpeg', size: 100 }),
    ).toThrow(BadRequestException);
  });

  it('rejects extension/MIME mismatch (png file with jpeg MIME)', () => {
    expect(() =>
      validateUploadedFile({ originalname: 'photo.png', mimetype: 'image/jpeg', size: 100 }),
    ).toThrow(BadRequestException);
  });

  it('rejects extension/MIME mismatch (webp file with png MIME)', () => {
    expect(() =>
      validateUploadedFile({ originalname: 'image.webp', mimetype: 'image/png', size: 100 }),
    ).toThrow(BadRequestException);
  });

  it('rejects oversized files (> 10MB default)', () => {
    expect(() =>
      validateUploadedFile({
        originalname: 'big.jpg',
        mimetype: 'image/jpeg',
        size: 11 * 1024 * 1024,
      }),
    ).toThrow(BadRequestException);
  });

  it('sanitizes safeOriginalName to not contain path separators', () => {
    const result = validateUploadedFile({
      originalname: '../../etc/passwd.jpg',
      mimetype: 'image/jpeg',
      size: 100,
    });
    expect(result.safeOriginalName).not.toContain('/');
    expect(result.safeOriginalName).not.toContain('..');
  });
});

describe('validateImageContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('passes when detected format matches declared JPEG MIME', async () => {
    (sharp as unknown as jest.Mock).mockReturnValue({
      metadata: jest.fn().mockResolvedValue({ format: 'jpeg' }),
    });
    await expect(validateImageContent(Buffer.from('fake'), 'image/jpeg')).resolves.toBeUndefined();
  });

  it('passes when detected format matches declared PNG MIME', async () => {
    (sharp as unknown as jest.Mock).mockReturnValue({
      metadata: jest.fn().mockResolvedValue({ format: 'png' }),
    });
    await expect(validateImageContent(Buffer.from('fake'), 'image/png')).resolves.toBeUndefined();
  });

  it('passes when detected format matches declared WebP MIME', async () => {
    (sharp as unknown as jest.Mock).mockReturnValue({
      metadata: jest.fn().mockResolvedValue({ format: 'webp' }),
    });
    await expect(validateImageContent(Buffer.from('fake'), 'image/webp')).resolves.toBeUndefined();
  });

  it('passes when detected format matches declared GIF MIME', async () => {
    (sharp as unknown as jest.Mock).mockReturnValue({
      metadata: jest.fn().mockResolvedValue({ format: 'gif' }),
    });
    await expect(validateImageContent(Buffer.from('fake'), 'image/gif')).resolves.toBeUndefined();
  });

  it('rejects when sharp detects a different format than declared (content/MIME mismatch)', async () => {
    (sharp as unknown as jest.Mock).mockReturnValue({
      metadata: jest.fn().mockResolvedValue({ format: 'png' }),
    });
    await expect(validateImageContent(Buffer.from('fake'), 'image/jpeg')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejects when file content is not a valid image (sharp throws)', async () => {
    (sharp as unknown as jest.Mock).mockReturnValue({
      metadata: jest
        .fn()
        .mockRejectedValue(new Error('Input buffer contains unsupported image format')),
    });
    await expect(validateImageContent(Buffer.from('not-an-image'), 'image/jpeg')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejects unsupported MIME type (no sharp format mapping)', async () => {
    await expect(validateImageContent(Buffer.from('fake'), 'application/pdf')).rejects.toThrow(
      BadRequestException,
    );
    expect(sharp).not.toHaveBeenCalled();
  });

  it('error message identifies declared vs detected type on mismatch', async () => {
    (sharp as unknown as jest.Mock).mockReturnValue({
      metadata: jest.fn().mockResolvedValue({ format: 'gif' }),
    });
    await expect(validateImageContent(Buffer.from('fake'), 'image/jpeg')).rejects.toThrow(
      /declared/i,
    );
  });
});

describe('isAllowedMimeType', () => {
  it('returns true for image/jpeg', () => {
    expect(isAllowedMimeType('image/jpeg')).toBe(true);
  });
  it('returns false for video/mp4', () => {
    expect(isAllowedMimeType('video/mp4')).toBe(false);
  });
  it('returns false for text/html', () => {
    expect(isAllowedMimeType('text/html')).toBe(false);
  });
});

describe('isAllowedExtension', () => {
  it('returns true for jpg', () => {
    expect(isAllowedExtension('jpg')).toBe(true);
  });
  it('returns false for exe', () => {
    expect(isAllowedExtension('exe')).toBe(false);
  });
  it('returns false for php', () => {
    expect(isAllowedExtension('php')).toBe(false);
  });
});
