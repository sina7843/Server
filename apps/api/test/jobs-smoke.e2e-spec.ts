/* global afterEach, describe, expect, fetch, it, jest */
import type { INestApplication } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { AccessTokenGuard } from '../src/auth/guards/access-token.guard';
import { PermissionGuard } from '../src/rbac/guards/permission.guard';
import { PermissionResolverService } from '../src/rbac/resolution/permission-resolver.service';
import { AdminJobsController } from '../src/admin/jobs/admin-jobs.controller';
import { AdminJobsService } from '../src/admin/jobs/admin-jobs.service';
import { RBAC_TEST_TOKENS, RbacTestAccessTokenGuard } from './helpers/rbac-test.factory';

const RAW_PAYLOAD_MARKERS = ['rawOtp', 'otp', 'password', 'refreshToken', 'accessToken'];

function makeJobLog(overrides: Record<string, unknown> = {}) {
  return {
    id: 'job-id-1',
    jobName: 'sms.send',
    queueName: 'sms',
    status: 'completed',
    payload: { userId: 'user-1', recipient: '***00' },
    createdAt: '2025-01-01T00:00:00.000Z',
    completedAt: '2025-01-01T00:00:01.000Z',
    ...overrides,
  };
}

const mockJobsService = {
  listJobs: jest.fn().mockResolvedValue({ items: [makeJobLog()], total: 1, page: 1, limit: 20 }),
  getJob: jest.fn().mockResolvedValue(makeJobLog()),
  retryJob: jest.fn().mockResolvedValue({ success: true, message: 'Job queued for retry.' }),
};

async function createApp(permissionKeys: string[]): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    controllers: [AdminJobsController],
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
      { provide: AdminJobsService, useValue: mockJobsService },
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

describe('Jobs smoke', () => {
  let app: INestApplication;

  afterEach(async () => {
    if (app) await app.close();
    jest.clearAllMocks();
  });

  describe('GET /admin/v1/system/jobs', () => {
    it('returns 401 without auth', async () => {
      app = await createApp(['system.job.read']);
      const res = await fetch(`${await app.getUrl()}/admin/v1/system/jobs`);
      expect(res.status).toBe(401);
    });

    it('returns 403 without system.job.read', async () => {
      app = await createApp([]);
      const res = await fetch(`${await app.getUrl()}/admin/v1/system/jobs`, {
        headers: { authorization: RBAC_TEST_TOKENS.noPermission },
      });
      expect(res.status).toBe(403);
    });

    it('returns 200 with system.job.read', async () => {
      app = await createApp(['system.job.read']);
      const res = await fetch(`${await app.getUrl()}/admin/v1/system/jobs`, {
        headers: { authorization: RBAC_TEST_TOKENS.noPermission },
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { items: unknown[] };
      expect(Array.isArray(body.items)).toBe(true);
    });

    it('job list does not contain raw secrets in payload', async () => {
      app = await createApp(['system.job.read']);
      const res = await fetch(`${await app.getUrl()}/admin/v1/system/jobs`, {
        headers: { authorization: RBAC_TEST_TOKENS.noPermission },
      });
      const text = await res.text();
      for (const marker of RAW_PAYLOAD_MARKERS) {
        expect(text).not.toContain(marker);
      }
    });
  });

  describe('GET /admin/v1/system/jobs/:id', () => {
    it('returns 403 without permission', async () => {
      app = await createApp([]);
      const res = await fetch(`${await app.getUrl()}/admin/v1/system/jobs/job-id-1`, {
        headers: { authorization: RBAC_TEST_TOKENS.noPermission },
      });
      expect(res.status).toBe(403);
    });

    it('returns 200 with permission — payload does not contain raw secrets', async () => {
      app = await createApp(['system.job.read']);
      const res = await fetch(`${await app.getUrl()}/admin/v1/system/jobs/job-id-1`, {
        headers: { authorization: RBAC_TEST_TOKENS.noPermission },
      });
      expect(res.status).toBe(200);
      const text = JSON.stringify(await res.json());
      for (const marker of RAW_PAYLOAD_MARKERS) {
        expect(text).not.toContain(marker);
      }
    });
  });

  describe('POST /admin/v1/system/jobs/:id/retry', () => {
    it('returns 403 without system.job.retry', async () => {
      app = await createApp(['system.job.read']);
      const res = await fetch(`${await app.getUrl()}/admin/v1/system/jobs/job-id-1/retry`, {
        method: 'POST',
        headers: {
          authorization: RBAC_TEST_TOKENS.noPermission,
          'content-type': 'application/json',
        },
      });
      expect(res.status).toBe(403);
    });

    it('returns 201 with system.job.retry', async () => {
      app = await createApp(['system.job.retry']);
      const res = await fetch(`${await app.getUrl()}/admin/v1/system/jobs/job-id-1/retry`, {
        method: 'POST',
        headers: {
          authorization: RBAC_TEST_TOKENS.noPermission,
          'content-type': 'application/json',
        },
      });
      expect(res.status).toBe(201);
    });
  });
});
