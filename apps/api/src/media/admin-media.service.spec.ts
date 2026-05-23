import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AdminMediaService } from './admin-media.service';
import { MediaAssetService } from './media-asset.service';
import { STORAGE_SERVICE } from '../storage/storage.service';
import { STORAGE_CONFIG } from '../config/storage.config';
import type { MediaAssetDocument } from './media-asset.schema';
import type { LocalStorageConfig } from '../config/storage.config';

const MOCK_STORAGE_CONFIG: LocalStorageConfig = {
  provider: 'local',
  bucket: 'test-bucket',
  publicBaseUrl: 'http://localhost:3000/storage',
  signedUrlTtlSeconds: 3600,
  localRoot: '/tmp/test-storage',
  localPublicBaseUrl: 'http://localhost:3000/storage',
};

function makeAsset(overrides: Partial<Record<string, unknown>> = {}): MediaAssetDocument {
  return {
    _id: '507f1f77bcf86cd799439011',
    originalName: 'test-image.jpg',
    fileName: 'abc123.jpg',
    mimeType: 'image/jpeg',
    extension: 'jpg',
    sizeBytes: 1024,
    storageProvider: 'local',
    bucket: 'test-bucket',
    objectKey: 'media/original/2026/05/abc123.jpg',
    visibility: 'public',
    variants: [
      {
        type: 'original',
        objectKey: 'media/original/2026/05/abc123.jpg',
        sizeBytes: 1024,
        mimeType: 'image/jpeg',
      },
    ],
    uploadedBy: '507f1f77bcf86cd799439099',
    status: 'ready',
    createdAt: new Date('2026-05-24T00:00:00Z'),
    updatedAt: new Date('2026-05-24T00:00:00Z'),
    ...overrides,
  } as unknown as MediaAssetDocument;
}

function makeFile(overrides: Partial<Record<string, unknown>> = {}): Express.Multer.File {
  return {
    fieldname: 'file',
    originalname: 'photo.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    buffer: Buffer.from('fake-image-data'),
    size: 16,
    ...overrides,
  } as unknown as Express.Multer.File;
}

describe('AdminMediaService', () => {
  let service: AdminMediaService;
  let mediaAssetService: jest.Mocked<MediaAssetService>;
  let storageService: {
    upload: jest.Mock;
    delete: jest.Mock;
    getPublicUrl: jest.Mock;
    getSignedUrl: jest.Mock;
  };

  beforeEach(async () => {
    storageService = {
      upload: jest.fn().mockResolvedValue({
        objectKey: 'media/original/2026/05/abc123.jpg',
        provider: 'local',
        bucket: 'test-bucket',
      }),
      delete: jest.fn().mockResolvedValue(undefined),
      getPublicUrl: jest
        .fn()
        .mockReturnValue('http://localhost:3000/storage/media/original/2026/05/abc123.jpg'),
      getSignedUrl: jest
        .fn()
        .mockResolvedValue(
          'http://localhost:3000/storage/media/original/2026/05/abc123.jpg?expires=99999',
        ),
    };

    const module = await Test.createTestingModule({
      providers: [
        AdminMediaService,
        {
          provide: MediaAssetService,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            updateMetadata: jest.fn(),
            softDelete: jest.fn(),
            list: jest.fn(),
          },
        },
        { provide: STORAGE_SERVICE, useValue: storageService },
        { provide: STORAGE_CONFIG, useValue: MOCK_STORAGE_CONFIG },
      ],
    }).compile();

    service = module.get(AdminMediaService);
    mediaAssetService = module.get(MediaAssetService) as jest.Mocked<MediaAssetService>;
  });

  // ─── uploadMedia ─────────────────────────────────────────────────────────

  describe('uploadMedia', () => {
    it('rejects when no file is provided', async () => {
      await expect(
        service.uploadMedia(undefined as unknown as Express.Multer.File, {}, 'uploader1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects unsupported MIME type', async () => {
      const file = makeFile({ mimetype: 'video/mp4', originalname: 'video.mp4' });
      await expect(service.uploadMedia(file, {}, 'uploader1')).rejects.toThrow(BadRequestException);
    });

    it('rejects dangerous extension', async () => {
      const file = makeFile({ mimetype: 'image/jpeg', originalname: 'evil.exe' });
      await expect(service.uploadMedia(file, {}, 'uploader1')).rejects.toThrow(BadRequestException);
    });

    it('rejects extension/MIME mismatch', async () => {
      const file = makeFile({ mimetype: 'image/png', originalname: 'photo.jpg' });
      await expect(service.uploadMedia(file, {}, 'uploader1')).rejects.toThrow(BadRequestException);
    });

    it('rejects oversized file', async () => {
      const file = makeFile({
        mimetype: 'image/jpeg',
        originalname: 'big.jpg',
        size: 100 * 1024 * 1024,
      });
      await expect(service.uploadMedia(file, {}, 'uploader1')).rejects.toThrow(BadRequestException);
    });

    it('uploads a valid file and creates a MediaAsset', async () => {
      const asset = makeAsset();
      mediaAssetService.create.mockResolvedValue(asset);
      mediaAssetService.updateMetadata.mockResolvedValue(asset);

      const file = makeFile();
      const result = await service.uploadMedia(file, { visibility: 'public' }, 'uploader1');

      expect(storageService.upload).toHaveBeenCalledWith(
        expect.objectContaining({ mimeType: 'image/jpeg', visibility: 'public' }),
      );
      expect(mediaAssetService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          mimeType: 'image/jpeg',
          extension: 'jpg',
          uploadedBy: 'uploader1',
          status: 'ready',
          visibility: 'public',
        }),
      );
      expect(result.asset.id).toBeDefined();
    });

    it('uses a randomized objectKey — not the original filename', async () => {
      const asset = makeAsset();
      mediaAssetService.create.mockResolvedValue(asset);

      const file = makeFile({ originalname: 'my-secret-photo.jpg' });
      await service.uploadMedia(file, {}, 'uploader1');

      const [uploadCall] = storageService.upload.mock.calls;
      const uploadInput = uploadCall[0] as { objectKey: string };
      expect(uploadInput.objectKey).not.toContain('my-secret-photo');
      expect(uploadInput.objectKey).toMatch(/^media\/original\/\d{4}\/\d{2}\//);
    });

    it('does not accept user-controlled objectKey from body', async () => {
      const asset = makeAsset();
      mediaAssetService.create.mockResolvedValue(asset);

      const file = makeFile();
      await service.uploadMedia(file, { objectKey: '../../hack.jpg' }, 'uploader1');

      const [uploadCall] = storageService.upload.mock.calls;
      const uploadInput = uploadCall[0] as { objectKey: string };
      expect(uploadInput.objectKey).not.toContain('hack');
    });

    it('stores original variant metadata', async () => {
      const asset = makeAsset();
      mediaAssetService.create.mockResolvedValue(asset);

      const file = makeFile();
      await service.uploadMedia(file, {}, 'uploader1');

      expect(mediaAssetService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          variants: expect.arrayContaining([
            expect.objectContaining({ type: 'original', mimeType: 'image/jpeg' }),
          ]),
        }),
      );
    });

    it('computes a SHA256 checksum', async () => {
      const asset = makeAsset();
      mediaAssetService.create.mockResolvedValue(asset);

      const file = makeFile();
      await service.uploadMedia(file, {}, 'uploader1');

      expect(mediaAssetService.create).toHaveBeenCalledWith(
        expect.objectContaining({ checksum: expect.stringMatching(/^[a-f0-9]{64}$/) }),
      );
    });

    it('does not expose local filesystem path in the response URL', async () => {
      const asset = makeAsset();
      mediaAssetService.create.mockResolvedValue(asset);
      storageService.getPublicUrl.mockReturnValue(
        'http://localhost:3000/storage/media/original/2026/05/abc123.jpg',
      );

      const file = makeFile();
      const result = await service.uploadMedia(file, {}, 'uploader1');
      expect(result.asset.url).not.toContain('/tmp/');
      expect(result.asset.url).not.toContain('dragon-storage');
    });

    it('uses getSignedUrl for private assets', async () => {
      const asset = makeAsset({ visibility: 'private' });
      mediaAssetService.create.mockResolvedValue(asset);

      const file = makeFile();
      await service.uploadMedia(file, { visibility: 'private' }, 'uploader1');

      expect(storageService.getSignedUrl).toHaveBeenCalled();
      expect(storageService.getPublicUrl).not.toHaveBeenCalled();
    });

    it('uses getPublicUrl for public assets', async () => {
      const asset = makeAsset({ visibility: 'public' });
      mediaAssetService.create.mockResolvedValue(asset);

      const file = makeFile();
      await service.uploadMedia(file, { visibility: 'public' }, 'uploader1');

      expect(storageService.getPublicUrl).toHaveBeenCalled();
      expect(storageService.getSignedUrl).not.toHaveBeenCalled();
    });
  });

  // ─── listMedia ───────────────────────────────────────────────────────────

  describe('listMedia', () => {
    it('returns paginated list with URLs', async () => {
      const asset = makeAsset();
      mediaAssetService.list.mockResolvedValue({ items: [asset], total: 1 });

      const result = await service.listMedia({});
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.items[0]!.url).toBeDefined();
    });

    it('excludes deleted assets by default', async () => {
      mediaAssetService.list.mockResolvedValue({ items: [], total: 0 });
      await service.listMedia({});
      expect(mediaAssetService.list).toHaveBeenCalledWith(
        expect.not.objectContaining({ includeDeleted: true }),
        expect.any(Number),
        expect.any(Number),
      );
    });
  });

  // ─── getMedia ────────────────────────────────────────────────────────────

  describe('getMedia', () => {
    it('returns asset DTO with URL', async () => {
      const asset = makeAsset();
      mediaAssetService.findById.mockResolvedValue(asset);

      const result = await service.getMedia('507f1f77bcf86cd799439011');
      expect(result.id).toBe(String(asset._id));
      expect(result.url).toBeDefined();
    });

    it('throws NotFoundException for deleted asset', async () => {
      mediaAssetService.findById.mockRejectedValue(new NotFoundException());
      await expect(service.getMedia('507f1f77bcf86cd799439011')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── updateMedia ─────────────────────────────────────────────────────────

  describe('updateMedia', () => {
    it('updates allowed metadata fields', async () => {
      const asset = makeAsset({ alt: 'new alt', visibility: 'private' });
      mediaAssetService.updateMetadata.mockResolvedValue(asset);

      const result = await service.updateMedia('507f1f77bcf86cd799439011', {
        alt: 'new alt',
        visibility: 'private',
      });
      expect(result.alt).toBe('new alt');
    });

    it('rejects unknown fields in update body', async () => {
      await expect(
        service.updateMedia('507f1f77bcf86cd799439011', { objectKey: 'hack' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('does not allow updating objectKey', async () => {
      await expect(
        service.updateMedia('507f1f77bcf86cd799439011', { objectKey: 'new/key.jpg' }),
      ).rejects.toThrow();
    });

    it('does not allow updating uploadedBy', async () => {
      await expect(
        service.updateMedia('507f1f77bcf86cd799439011', { uploadedBy: 'attacker' }),
      ).rejects.toThrow();
    });

    it('does not allow updating status', async () => {
      await expect(
        service.updateMedia('507f1f77bcf86cd799439011', { status: 'failed' }),
      ).rejects.toThrow();
    });

    it('does not allow updating variants', async () => {
      await expect(
        service.updateMedia('507f1f77bcf86cd799439011', { variants: [] }),
      ).rejects.toThrow();
    });
  });

  // ─── deleteMedia ─────────────────────────────────────────────────────────

  describe('deleteMedia', () => {
    it('soft deletes the asset', async () => {
      mediaAssetService.softDelete.mockResolvedValue(makeAsset({ deletedAt: new Date() }));
      await service.deleteMedia('507f1f77bcf86cd799439011');
      expect(mediaAssetService.softDelete).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    it('hard delete does not exist', () => {
      expect((service as unknown as Record<string, unknown>).hardDelete).toBeUndefined();
      expect((service as unknown as Record<string, unknown>).destroyMedia).toBeUndefined();
    });
  });

  // ─── Invariants ──────────────────────────────────────────────────────────

  it('does not expose a regenerate variants method', () => {
    expect((service as unknown as Record<string, unknown>).regenerateVariants).toBeUndefined();
  });

  it('does not expose a video upload method', () => {
    const file = makeFile({ mimetype: 'video/mp4', originalname: 'video.mp4' });
    return expect(service.uploadMedia(file, {}, 'user1')).rejects.toThrow(BadRequestException);
  });
});
