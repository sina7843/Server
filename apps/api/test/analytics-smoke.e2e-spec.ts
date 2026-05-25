/* global afterEach, describe, expect, fetch, it, jest */
import type { INestApplication } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { AccessTokenGuard } from '../src/auth/guards/access-token.guard';
import { PermissionGuard } from '../src/rbac/guards/permission.guard';
import { PermissionResolverService } from '../src/rbac/resolution/permission-resolver.service';
import { AdminAnalyticsController } from '../src/analytics/admin/admin-analytics.controller';
import { AdminAnalyticsService } from '../src/analytics/admin/admin-analytics.service';
import { RBAC_TEST_TOKENS, RbacTestAccessTokenGuard } from './helpers/rbac-test.factory';

const SENSITIVE_ANALYTICS_MARKERS = [
  'rawOtp',
  'otp',
  'password',
  'token',
  'ipAddress',
  'phoneNumber',
  'email',
];

const mockAnalyticsSummary = {
  totalEvents: 100,
  totalUsers: 50,
  period: { from: '2025-01-01', to: '2025-01-31' },
};

const mockAnalyticsService = {
  getSummary: jest.fn().mockResolvedValue(mockAnalyticsSummary),
  getContentTop: jest.fn().mockResolvedValue({ items: [], period: {} }),
  getAuth: jest.fn().mockResolvedValue({ loginCount: 10, registerCount: 5, period: {} }),
  getOtp: jest.fn().mockResolvedValue({ totalRequested: 20, totalVerified: 18, period: {} }),
  getMedia: jest.fn().mockResolvedValue({ uploadCount: 15, totalSizeBytes: 1024, period: {} }),
};

async function createApp(permissionKeys: string[]): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    controllers: [AdminAnalyticsController],
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
      { provide: AdminAnalyticsService, useValue: mockAnalyticsService },
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

describe('Analytics smoke', () => {
  let app: INestApplication;

  afterEach(async () => {
    if (app) await app.close();
    jest.clearAllMocks();
  });

  describe('GET /admin/v1/analytics/summary', () => {
    it('returns 401 without auth', async () => {
      app = await createApp(['analytics.analytics.read']);
      const res = await fetch(`${await app.getUrl()}/admin/v1/analytics/summary`);
      expect(res.status).toBe(401);
    });

    it('returns 403 without analytics.analytics.read', async () => {
      app = await createApp([]);
      const res = await fetch(`${await app.getUrl()}/admin/v1/analytics/summary`, {
        headers: { authorization: RBAC_TEST_TOKENS.noPermission },
      });
      expect(res.status).toBe(403);
    });

    it('returns 200 with analytics.analytics.read', async () => {
      app = await createApp(['analytics.analytics.read']);
      const res = await fetch(`${await app.getUrl()}/admin/v1/analytics/summary`, {
        headers: { authorization: RBAC_TEST_TOKENS.noPermission },
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { totalEvents: number };
      expect(typeof body.totalEvents).toBe('number');
    });

    it('response does not expose raw OTP, IP addresses, or credentials', async () => {
      app = await createApp(['analytics.analytics.read']);
      const res = await fetch(`${await app.getUrl()}/admin/v1/analytics/summary`, {
        headers: { authorization: RBAC_TEST_TOKENS.noPermission },
      });
      const text = await res.text();
      for (const marker of SENSITIVE_ANALYTICS_MARKERS) {
        expect(text).not.toContain(marker);
      }
    });
  });

  describe('GET /admin/v1/analytics/auth', () => {
    it('returns 403 without permission', async () => {
      app = await createApp([]);
      const res = await fetch(`${await app.getUrl()}/admin/v1/analytics/auth`, {
        headers: { authorization: RBAC_TEST_TOKENS.noPermission },
      });
      expect(res.status).toBe(403);
    });

    it('returns 200 with permission', async () => {
      app = await createApp(['analytics.analytics.read']);
      const res = await fetch(`${await app.getUrl()}/admin/v1/analytics/auth`, {
        headers: { authorization: RBAC_TEST_TOKENS.noPermission },
      });
      expect(res.status).toBe(200);
    });
  });

  describe('GET /admin/v1/analytics/otp', () => {
    it('returns 403 without permission', async () => {
      app = await createApp([]);
      const res = await fetch(`${await app.getUrl()}/admin/v1/analytics/otp`, {
        headers: { authorization: RBAC_TEST_TOKENS.noPermission },
      });
      expect(res.status).toBe(403);
    });

    it('OTP summary returns aggregate counts — not raw OTP values', async () => {
      app = await createApp(['analytics.analytics.read']);
      const res = await fetch(`${await app.getUrl()}/admin/v1/analytics/otp`, {
        headers: { authorization: RBAC_TEST_TOKENS.noPermission },
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as Record<string, unknown>;
      // Aggregate counts only — no raw OTP codes
      expect(body).not.toHaveProperty('code');
      expect(body).not.toHaveProperty('rawOtp');
      expect(JSON.stringify(body)).not.toMatch(/\d{6}/);
    });
  });

  describe('GET /admin/v1/analytics/content/top', () => {
    it('returns 403 without permission', async () => {
      app = await createApp([]);
      const res = await fetch(`${await app.getUrl()}/admin/v1/analytics/content/top`, {
        headers: { authorization: RBAC_TEST_TOKENS.noPermission },
      });
      expect(res.status).toBe(403);
    });
  });
});
