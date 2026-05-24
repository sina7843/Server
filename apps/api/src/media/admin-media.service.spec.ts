import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AdminMediaService } from './admin-media.service';
import { MediaAssetService } from './media-asset.service';
import { MediaUploadPipeline } from './media-upload-pipeline.service';
import { STORAGE_SERVICE } from '../storage/storage.service';
import type { MediaAssetDocument } from './media-asset.schema';

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
  let pipeline: { upload: jest.Mock; reprocessVariants: jest.Mock };
  let storageService: {
    upload: jest.Mock;
    download: jest.Mock;
    delete: jest.Mock;
    getPublicUrl: jest.Mock;
    getSignedUrl: jest.Mock;
  };

  beforeEach(async () => {
    pipeline = {
      upload: jest.fn(),
      reprocessVariants: jest.fn(),
    };

    storageService = {
      upload: jest.fn().mockResolvedValue({
        objectKey: 'media/original/2026/05/abc123.jpg',
        provider: 'local',
        bucket: 'test-bucket',
      }),
      download: jest.fn().mockResolvedValue(Buffer.from('original-image-data')),
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
            updateVariants: jest.fn(),
            softDelete: jest.fn(),
            list: jest.fn(),
          },
        },
        { provide: MediaUploadPipeline, useValue: pipeline },
        { provide: STORAGE_SERVICE, useValue: storageService },
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

    it('propagates BadRequestException from pipeline for invalid files', async () => {
      pipeline.upload.mockRejectedValue(new BadRequestException('Unsupported file type'));
      const file = makeFile({ mimetype: 'video/mp4', originalname: 'video.mp4' });
      await expect(service.uploadMedia(file, {}, 'uploader1')).rejects.toThrow(BadRequestException);
    });

    it('propagates BadRequestException for oversized file', async () => {
      pipeline.upload.mockRejectedValue(new BadRequestException('File exceeds maximum size'));
      const file = makeFile({ size: 100 * 1024 * 1024 });
      await expect(service.uploadMedia(file, {}, 'uploader1')).rejects.toThrow(BadRequestException);
    });

    it('propagates BadRequestException for fake image content', async () => {
      pipeline.upload.mockRejectedValue(
        new BadRequestException('File content does not match declared type'),
      );
      const file = makeFile();
      await expect(service.uploadMedia(file, {}, 'uploader1')).rejects.toThrow(BadRequestException);
    });

    it('uploads a valid file and returns DTO with URL', async () => {
      const asset = makeAsset({ status: 'ready' });
      pipeline.upload.mockResolvedValue(asset);

      const file = makeFile();
      const result = await service.uploadMedia(file, { visibility: 'public' }, 'uploader1');

      expect(pipeline.upload).toHaveBeenCalledWith(
        expect.objectContaining({
          uploadedBy: 'uploader1',
          visibility: 'public',
        }),
      );
      expect(result.asset.id).toBeDefined();
      expect(result.asset.url).toBeDefined();
    });

    it('uses getPublicUrl for public assets', async () => {
      const asset = makeAsset({ visibility: 'public' });
      pipeline.upload.mockResolvedValue(asset);

      const file = makeFile();
      await service.uploadMedia(file, { visibility: 'public' }, 'uploader1');

      expect(storageService.getPublicUrl).toHaveBeenCalled();
      expect(storageService.getSignedUrl).not.toHaveBeenCalled();
    });

    it('uses getSignedUrl for private assets', async () => {
      const asset = makeAsset({ visibility: 'private' });
      pipeline.upload.mockResolvedValue(asset);

      const file = makeFile();
      await service.uploadMedia(file, { visibility: 'private' }, 'uploader1');

      expect(storageService.getSignedUrl).toHaveBeenCalled();
      expect(storageService.getPublicUrl).not.toHaveBeenCalled();
    });

    it('does not fallback to public URL when getSignedUrl fails for private asset', async () => {
      const asset = makeAsset({ visibility: 'private' });
      pipeline.upload.mockResolvedValue(asset);
      storageService.getSignedUrl.mockRejectedValue(new Error('Signing service unavailable'));

      const file = makeFile();
      const result = await service.uploadMedia(file, { visibility: 'private' }, 'uploader1');

      expect(result.asset.url).toBe('');
      expect(storageService.getPublicUrl).not.toHaveBeenCalled();
    });

    it('does not expose a video upload method', () => {
      pipeline.upload.mockRejectedValue(new BadRequestException('Unsupported file type'));
      const file = makeFile({ mimetype: 'video/mp4', originalname: 'video.mp4' });
      return expect(service.uploadMedia(file, {}, 'user1')).rejects.toThrow(BadRequestException);
    });

    it('does not expose a direct-to-S3 upload method', () => {
      expect((service as unknown as Record<string, unknown>).presignUpload).toBeUndefined();
      expect((service as unknown as Record<string, unknown>).directS3Upload).toBeUndefined();
    });
  });

  // ─── regenerateVariants ──────────────────────────────────────────────────

  describe('regenerateVariants', () => {
    it('returns current asset for GIF without processing', async () => {
      const gifAsset = makeAsset({ mimeType: 'image/gif' });
      mediaAssetService.findById.mockResolvedValue(gifAsset);

      const result = await service.regenerateVariants('507f1f77bcf86cd799439011');
      expect(pipeline.reprocessVariants).not.toHaveBeenCalled();
      expect(result.id).toBeDefined();
    });

    it('sets status to "processing" before downloading original', async () => {
      const asset = makeAsset({ status: 'ready' });
      const processingAsset = makeAsset({ status: 'processing' });
      const readyAsset = makeAsset({ status: 'ready' });
      mediaAssetService.findById.mockResolvedValue(asset);
      mediaAssetService.updateVariants
        .mockResolvedValueOnce(processingAsset)
        .mockResolvedValueOnce(readyAsset);
      pipeline.reprocessVariants.mockResolvedValue(readyAsset);

      await service.regenerateVariants('507f1f77bcf86cd799439011');

      expect(mediaAssetService.updateVariants).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ status: 'processing' }),
      );
    });

    it('downloads original from storage', async () => {
      const asset = makeAsset();
      mediaAssetService.findById.mockResolvedValue(asset);
      mediaAssetService.updateVariants.mockResolvedValue(makeAsset({ status: 'processing' }));
      pipeline.reprocessVariants.mockResolvedValue(makeAsset({ status: 'ready' }));

      await service.regenerateVariants('507f1f77bcf86cd799439011');

      expect(storageService.download).toHaveBeenCalledWith(asset.objectKey);
    });

    it('sets status to "failed" if download throws', async () => {
      const asset = makeAsset();
      const processingAsset = makeAsset({ status: 'processing' });
      const failedAsset = makeAsset({ status: 'failed' });
      mediaAssetService.findById.mockResolvedValue(asset);
      mediaAssetService.updateVariants
        .mockResolvedValueOnce(processingAsset)
        .mockResolvedValueOnce(failedAsset);
      storageService.download.mockRejectedValue(new Error('Storage unavailable'));

      await expect(service.regenerateVariants('507f1f77bcf86cd799439011')).rejects.toThrow(
        BadRequestException,
      );
      expect(mediaAssetService.updateVariants).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ status: 'failed' }),
      );
    });

    it('throws NotFoundException for unknown asset', async () => {
      mediaAssetService.findById.mockRejectedValue(new NotFoundException());
      await expect(service.regenerateVariants('507f1f77bcf86cd799439011')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('does not return public URL for private asset when getSignedUrl fails', async () => {
      const asset = makeAsset({ status: 'ready' });
      const privateAsset = makeAsset({ status: 'ready', visibility: 'private' });
      mediaAssetService.findById.mockResolvedValue(asset);
      mediaAssetService.updateVariants.mockResolvedValue(makeAsset({ status: 'processing' }));
      pipeline.reprocessVariants.mockResolvedValue(privateAsset);
      storageService.getSignedUrl.mockRejectedValue(new Error('Signing service unavailable'));

      const result = await service.regenerateVariants('507f1f77bcf86cd799439011');

      expect(result.url).toBe('');
      expect(storageService.getPublicUrl).not.toHaveBeenCalled();
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

    it('returns empty string URL for private assets when getSignedUrl fails', async () => {
      const privateAsset = makeAsset({ visibility: 'private' });
      mediaAssetService.list.mockResolvedValue({ items: [privateAsset], total: 1 });
      storageService.getSignedUrl.mockRejectedValue(new Error('Signing service unavailable'));

      const result = await service.listMedia({});

      expect(result.items[0]!.url).toBe('');
      expect(storageService.getPublicUrl).not.toHaveBeenCalled();
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
});
