/* global afterEach, describe, expect, fetch, it, jest */
import type { INestApplication } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { AccessTokenGuard } from '../src/auth/guards/access-token.guard';
import { PermissionGuard } from '../src/rbac/guards/permission.guard';
import { PermissionResolverService } from '../src/rbac/resolution/permission-resolver.service';
import { PublicSearchController } from '../src/search/public-search.controller';
import { AdminSearchController } from '../src/search/admin-search.controller';
import { SearchService } from '../src/search/search.service';
import { TournamentService } from '../src/tournaments/tournament.service';
import { JobLogService } from '../src/jobs/job-log.service';
import { RBAC_TEST_TOKENS, RbacTestAccessTokenGuard } from './helpers/rbac-test.factory';

const EMPTY_RESULT = { items: [], total: 0, page: 1, limit: 20 };

const mockSearchService = {
  searchPublicContent: jest.fn().mockResolvedValue(EMPTY_RESULT),
  searchAdminContent: jest.fn().mockResolvedValue(EMPTY_RESULT),
  searchAdminUsers: jest.fn().mockResolvedValue(EMPTY_RESULT),
  searchAdminMedia: jest.fn().mockResolvedValue(EMPTY_RESULT),
};

const mockJobLogService = {
  enqueue: jest.fn().mockResolvedValue(undefined),
};

const mockTournamentService = {
  list: jest.fn().mockResolvedValue({ items: [], total: 0 }),
};

async function createPublicApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    controllers: [PublicSearchController],
    providers: [
      { provide: SearchService, useValue: mockSearchService },
      { provide: TournamentService, useValue: mockTournamentService },
    ],
  }).compile();

  const testApp = moduleRef.createNestApplication();
  await testApp.init();
  await testApp.listen(0);
  return testApp;
}

async function createAdminApp(permissionKeys: string[]): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    controllers: [AdminSearchController],
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
      { provide: SearchService, useValue: mockSearchService },
      { provide: JobLogService, useValue: mockJobLogService },
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

describe('Public search smoke', () => {
  let app: INestApplication;

  afterEach(async () => {
    if (app) await app.close();
    jest.clearAllMocks();
  });

  describe('GET /api/v1/search/content', () => {
    it('returns 200 with results — no auth required', async () => {
      app = await createPublicApp();
      const res = await fetch(`${await app.getUrl()}/api/v1/search/content?q=test&page=1&limit=10`);
      expect(res.status).toBe(200);
      const body = (await res.json()) as { items: unknown[] };
      expect(Array.isArray(body.items)).toBe(true);
    });

    it('calls searchPublicContent (published-only search)', async () => {
      app = await createPublicApp();
      mockSearchService.searchPublicContent.mockResolvedValueOnce({
        items: [{ id: 'post-1', title: 'Test', type: 'news', slug: 'test' }],
        total: 1,
        page: 1,
        limit: 10,
      });
      await fetch(`${await app.getUrl()}/api/v1/search/content?q=test&page=1&limit=10`);
      expect(mockSearchService.searchPublicContent).toHaveBeenCalledWith(
        expect.objectContaining({ q: 'test', limit: 10, page: 1 }),
      );
    });

    it('rejects limit > 50 with 400', async () => {
      app = await createPublicApp();
      const res = await fetch(
        `${await app.getUrl()}/api/v1/search/content?q=test&limit=999&page=1`,
      );
      expect(res.status).toBe(400);
    });

    it('rejects invalid categoryId with 400', async () => {
      app = await createPublicApp();
      const res = await fetch(
        `${await app.getUrl()}/api/v1/search/content?q=test&categoryId=not-an-id&page=1&limit=10`,
      );
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/v1/search/tournaments', () => {
    it('returns 200 with q param', async () => {
      app = await createPublicApp();
      const res = await fetch(`${await app.getUrl()}/api/v1/search/tournaments?q=test`);
      expect(res.status).toBe(200);
      const body = (await res.json()) as { items: unknown[] };
      expect(Array.isArray(body.items)).toBe(true);
    });

    it('passes registrationOpen=true to service as boolean true', async () => {
      app = await createPublicApp();
      await fetch(`${await app.getUrl()}/api/v1/search/tournaments?q=test&registrationOpen=true`);
      expect(mockTournamentService.list).toHaveBeenCalledWith(
        expect.objectContaining({ registrationOpen: true }),
        expect.any(Number),
        expect.any(Number),
      );
    });

    it('passes registrationOpen=false to service as boolean false', async () => {
      app = await createPublicApp();
      await fetch(`${await app.getUrl()}/api/v1/search/tournaments?q=test&registrationOpen=false`);
      expect(mockTournamentService.list).toHaveBeenCalledWith(
        expect.objectContaining({ registrationOpen: false }),
        expect.any(Number),
        expect.any(Number),
      );
    });

    it('rejects invalid registrationOpen value with 400', async () => {
      app = await createPublicApp();
      const res = await fetch(
        `${await app.getUrl()}/api/v1/search/tournaments?q=test&registrationOpen=yes`,
      );
      expect(res.status).toBe(400);
    });

    it('omits registrationOpen filter when param is absent', async () => {
      app = await createPublicApp();
      await fetch(`${await app.getUrl()}/api/v1/search/tournaments?q=test`);
      const callFilter = (mockTournamentService.list as jest.Mock).mock.calls[0][0] as Record<
        string,
        unknown
      >;
      expect(callFilter).not.toHaveProperty('registrationOpen');
    });
  });
});

describe('Admin search smoke', () => {
  let app: INestApplication;

  afterEach(async () => {
    if (app) await app.close();
    jest.clearAllMocks();
  });

  describe('GET /admin/v1/search/content', () => {
    it('returns 401 without auth', async () => {
      app = await createAdminApp(['search.content.read']);
      const res = await fetch(`${await app.getUrl()}/admin/v1/search/content?q=test`);
      expect(res.status).toBe(401);
    });

    it('returns 403 without search.content.read', async () => {
      app = await createAdminApp([]);
      const res = await fetch(`${await app.getUrl()}/admin/v1/search/content?q=test`, {
        headers: { authorization: RBAC_TEST_TOKENS.noPermission },
      });
      expect(res.status).toBe(403);
    });

    it('returns 200 with search.content.read', async () => {
      app = await createAdminApp(['search.content.read']);
      const res = await fetch(`${await app.getUrl()}/admin/v1/search/content?q=test`, {
        headers: { authorization: RBAC_TEST_TOKENS.noPermission },
      });
      expect(res.status).toBe(200);
    });
  });

  describe('GET /admin/v1/search/users', () => {
    it('returns 403 without search.user.read', async () => {
      app = await createAdminApp([]);
      const res = await fetch(`${await app.getUrl()}/admin/v1/search/users?q=test`, {
        headers: { authorization: RBAC_TEST_TOKENS.noPermission },
      });
      expect(res.status).toBe(403);
    });

    it('returns 200 with search.user.read', async () => {
      app = await createAdminApp(['search.user.read']);
      const res = await fetch(`${await app.getUrl()}/admin/v1/search/users?q=test`, {
        headers: { authorization: RBAC_TEST_TOKENS.noPermission },
      });
      expect(res.status).toBe(200);
    });
  });

  describe('POST /admin/v1/search/reindex', () => {
    it('returns 403 without search.index.reindex', async () => {
      app = await createAdminApp([]);
      const res = await fetch(`${await app.getUrl()}/admin/v1/search/reindex`, {
        method: 'POST',
        headers: {
          authorization: RBAC_TEST_TOKENS.noPermission,
          'content-type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      expect(res.status).toBe(403);
    });
  });
});
