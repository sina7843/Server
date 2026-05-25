/* global afterEach, describe, expect, fetch, it, jest */
import type { INestApplication } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { AccessTokenGuard } from '../src/auth/guards/access-token.guard';
import { PermissionGuard } from '../src/rbac/guards/permission.guard';
import { PermissionResolverService } from '../src/rbac/resolution/permission-resolver.service';
import { AdminAuditController } from '../src/admin/audit/admin-audit.controller';
import { AdminAuditService } from '../src/admin/audit/admin-audit.service';
import { RBAC_TEST_TOKENS, RbacTestAccessTokenGuard } from './helpers/rbac-test.factory';

const RAW_SECRET_MARKERS = ['rawOtp', 'password', 'passwordHash', 'accessToken', 'refreshToken'];

function makeAuditLog(overrides: Record<string, unknown> = {}) {
  return {
    id: 'audit-id-1',
    action: 'auth.login',
    userId: 'user-1',
    resourceType: 'session',
    resourceId: 'session-1',
    metadata: { ip: '127.0.0.1', userAgent: 'jest' },
    createdAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  };
}

const mockAuditService = {
  listAuditLogs: jest.fn().mockResolvedValue({
    items: [makeAuditLog()],
    total: 1,
    page: 1,
    limit: 20,
  }),
  getAuditLog: jest.fn().mockResolvedValue(makeAuditLog()),
};

async function createApp(permissionKeys: string[]): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    controllers: [AdminAuditController],
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
      { provide: AdminAuditService, useValue: mockAuditService },
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

describe('Audit smoke', () => {
  let app: INestApplication;

  afterEach(async () => {
    if (app) await app.close();
    jest.clearAllMocks();
  });

  describe('GET /admin/v1/audit-logs', () => {
    it('returns 401 without auth', async () => {
      app = await createApp(['audit.log.read']);
      const res = await fetch(`${await app.getUrl()}/admin/v1/audit-logs`);
      expect(res.status).toBe(401);
    });

    it('returns 403 without audit.log.read', async () => {
      app = await createApp([]);
      const res = await fetch(`${await app.getUrl()}/admin/v1/audit-logs`, {
        headers: { authorization: RBAC_TEST_TOKENS.noPermission },
      });
      expect(res.status).toBe(403);
    });

    it('returns 200 with audit.log.read', async () => {
      app = await createApp(['audit.log.read']);
      const res = await fetch(`${await app.getUrl()}/admin/v1/audit-logs`, {
        headers: { authorization: RBAC_TEST_TOKENS.noPermission },
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { items: unknown[] };
      expect(Array.isArray(body.items)).toBe(true);
    });

    it('list response does not contain raw secrets', async () => {
      app = await createApp(['audit.log.read']);
      const res = await fetch(`${await app.getUrl()}/admin/v1/audit-logs`, {
        headers: { authorization: RBAC_TEST_TOKENS.noPermission },
      });
      const text = await res.text();
      for (const marker of RAW_SECRET_MARKERS) {
        expect(text).not.toContain(marker);
      }
    });

    it('rejects limit above 100 with 400', async () => {
      app = await createApp(['audit.log.read']);
      const res = await fetch(`${await app.getUrl()}/admin/v1/audit-logs?limit=101`, {
        headers: { authorization: RBAC_TEST_TOKENS.noPermission },
      });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /admin/v1/audit-logs/:id', () => {
    it('returns 403 without permission', async () => {
      app = await createApp([]);
      const res = await fetch(
        `${await app.getUrl()}/admin/v1/audit-logs/507f1f77bcf86cd799439011`,
        {
          headers: { authorization: RBAC_TEST_TOKENS.noPermission },
        },
      );
      expect(res.status).toBe(403);
    });

    it('returns 200 with permission — detail does not contain raw secrets', async () => {
      app = await createApp(['audit.log.read']);
      const res = await fetch(
        `${await app.getUrl()}/admin/v1/audit-logs/507f1f77bcf86cd799439011`,
        {
          headers: { authorization: RBAC_TEST_TOKENS.noPermission },
        },
      );
      expect(res.status).toBe(200);
      const text = JSON.stringify(await res.json());
      for (const marker of RAW_SECRET_MARKERS) {
        expect(text).not.toContain(marker);
      }
    });
  });
});
