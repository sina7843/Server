/* global afterEach, describe, expect, fetch, it, jest */
import type { INestApplication } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { AccessTokenGuard } from '../src/auth/guards/access-token.guard';
import { PermissionGuard } from '../src/rbac/guards/permission.guard';
import { PermissionResolverService } from '../src/rbac/resolution/permission-resolver.service';
import { AdminMediaController } from '../src/media/admin-media.controller';
import { AdminMediaService } from '../src/media/admin-media.service';
import { isAllowedMimeType, isAllowedExtension } from '../src/media/media-upload.config';
import { RBAC_TEST_TOKENS, RbacTestAccessTokenGuard } from './helpers/rbac-test.factory';

function makeMediaAsset(overrides: Record<string, unknown> = {}) {
  return {
    id: 'media-id-1',
    filename: 'test.jpg',
    mimeType: 'image/jpeg',
    sizeBytes: 1024,
    visibility: 'private',
    variants: [],
    createdAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  };
}

const mockMediaService = {
  listMedia: jest
    .fn()
    .mockResolvedValue({ items: [makeMediaAsset()], total: 1, page: 1, limit: 20 }),
  uploadMedia: jest.fn().mockResolvedValue({ asset: makeMediaAsset() }),
  getMedia: jest.fn().mockResolvedValue(makeMediaAsset()),
  updateMedia: jest.fn().mockResolvedValue(makeMediaAsset()),
  deleteMedia: jest.fn().mockResolvedValue({ success: true }),
  regenerateVariants: jest.fn().mockResolvedValue({ success: true }),
};

async function createApp(permissionKeys: string[]): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    controllers: [AdminMediaController],
    providers: [
      Reflector,
      PermissionGuard,
      {
        provide: PermissionResolverService,
        useValue: {
          resolveUserPermissions: jest.fn().mockResolvedValue({
            permissionKeys,
            roleKeys: [],
            isSuperAdmin: false,
          }),
        },
      },
      { provide: AdminMediaService, useValue: mockMediaService },
    ],
  })
    .overrideGuard(AccessTokenGuard)
    .useClass(RbacTestAccessTokenGuard)
    .compile();

  const testApp = moduleRef.createNestApplication();
  await testApp.init();
  await testApp.listen(0);
  return testApp;
}

describe('Media smoke — HTTP access control', () => {
  let app: INestApplication;

  afterEach(async () => {
    if (app) await app.close();
    jest.clearAllMocks();
  });

  describe('GET /admin/v1/media', () => {
    it('returns 401 without auth', async () => {
      app = await createApp(['media.asset.read']);
      const res = await fetch(`${await app.getUrl()}/admin/v1/media`);
      expect(res.status).toBe(401);
    });

    it('returns 403 without media.asset.read', async () => {
      app = await createApp([]);
      const res = await fetch(`${await app.getUrl()}/admin/v1/media`, {
        headers: { authorization: RBAC_TEST_TOKENS.noPermission },
      });
      expect(res.status).toBe(403);
    });

    it('returns 200 with media.asset.read', async () => {
      app = await createApp(['media.asset.read']);
      const res = await fetch(`${await app.getUrl()}/admin/v1/media`, {
        headers: { authorization: RBAC_TEST_TOKENS.noPermission },
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { items: unknown[] };
      expect(Array.isArray(body.items)).toBe(true);
    });
  });

  describe('POST /admin/v1/media/upload', () => {
    it('returns 401 without auth', async () => {
      app = await createApp(['media.asset.upload']);
      const formData = new FormData();
      formData.append('file', new Blob(['test'], { type: 'image/jpeg' }), 'test.jpg');
      const res = await fetch(`${await app.getUrl()}/admin/v1/media/upload`, {
        method: 'POST',
        body: formData,
      });
      expect(res.status).toBe(401);
    });

    it('returns 403 without media.asset.upload', async () => {
      app = await createApp([]);
      const formData = new FormData();
      formData.append('file', new Blob(['test'], { type: 'image/jpeg' }), 'test.jpg');
      const res = await fetch(`${await app.getUrl()}/admin/v1/media/upload`, {
        method: 'POST',
        headers: { authorization: RBAC_TEST_TOKENS.noPermission },
        body: formData,
      });
      expect(res.status).toBe(403);
    });
  });

  describe('GET /admin/v1/media/:id', () => {
    it('returns 403 without media.asset.read', async () => {
      app = await createApp([]);
      const res = await fetch(`${await app.getUrl()}/admin/v1/media/media-id-1`, {
        headers: { authorization: RBAC_TEST_TOKENS.noPermission },
      });
      expect(res.status).toBe(403);
    });
  });
});

describe('Media smoke — MIME/extension validation', () => {
  describe('isAllowedMimeType', () => {
    it('accepts image/jpeg', () => {
      expect(isAllowedMimeType('image/jpeg')).toBe(true);
    });

    it('accepts image/png', () => {
      expect(isAllowedMimeType('image/png')).toBe(true);
    });

    it('accepts image/gif', () => {
      expect(isAllowedMimeType('image/gif')).toBe(true);
    });

    it('accepts image/webp', () => {
      expect(isAllowedMimeType('image/webp')).toBe(true);
    });

    it('rejects application/octet-stream (binary)', () => {
      expect(isAllowedMimeType('application/octet-stream')).toBe(false);
    });

    it('rejects application/x-executable', () => {
      expect(isAllowedMimeType('application/x-executable')).toBe(false);
    });

    it('rejects text/html', () => {
      expect(isAllowedMimeType('text/html')).toBe(false);
    });

    it('rejects application/javascript', () => {
      expect(isAllowedMimeType('application/javascript')).toBe(false);
    });
  });

  describe('isAllowedExtension', () => {
    it('accepts jpg', () => {
      expect(isAllowedExtension('jpg')).toBe(true);
    });

    it('accepts png', () => {
      expect(isAllowedExtension('png')).toBe(true);
    });

    it('rejects exe', () => {
      expect(isAllowedExtension('exe')).toBe(false);
    });

    it('rejects sh', () => {
      expect(isAllowedExtension('sh')).toBe(false);
    });

    it('rejects php', () => {
      expect(isAllowedExtension('php')).toBe(false);
    });

    it('rejects js', () => {
      expect(isAllowedExtension('js')).toBe(false);
    });
  });
});
