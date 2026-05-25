/* global afterEach, describe, expect, fetch, it, jest */
import type { INestApplication } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { AccessTokenGuard } from '../src/auth/guards/access-token.guard';
import { PermissionGuard } from '../src/rbac/guards/permission.guard';
import { PermissionResolverService } from '../src/rbac/resolution/permission-resolver.service';
import { AdminNotificationsController } from '../src/admin/notifications/admin-notifications.controller';
import { AdminNotificationsService } from '../src/admin/notifications/admin-notifications.service';
import { RBAC_TEST_TOKENS, RbacTestAccessTokenGuard } from './helpers/rbac-test.factory';

// Notification logs must never expose raw OTP, phone numbers, or raw SMS body
const RAW_NOTIFICATION_MARKERS = ['rawOtp', 'smsBody', 'recipientPhone', '+98', '123456', '654321'];

function makeNotificationLog(overrides: Record<string, unknown> = {}) {
  return {
    id: 'notif-id-1',
    type: 'sms',
    status: 'sent',
    // recipient is masked/hashed — never raw phone
    recipientMasked: '***00',
    provider: 'mock',
    createdAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  };
}

const mockNotificationsService = {
  listNotificationLogs: jest.fn().mockResolvedValue({
    items: [makeNotificationLog()],
    total: 1,
    page: 1,
    limit: 20,
  }),
  getNotificationLog: jest.fn().mockResolvedValue(makeNotificationLog()),
};

async function createApp(permissionKeys: string[]): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    controllers: [AdminNotificationsController],
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
      { provide: AdminNotificationsService, useValue: mockNotificationsService },
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

describe('Notifications smoke', () => {
  let app: INestApplication;

  afterEach(async () => {
    if (app) await app.close();
    jest.clearAllMocks();
  });

  describe('GET /admin/v1/system/notifications', () => {
    it('returns 401 without auth', async () => {
      app = await createApp(['notification.log.read']);
      const res = await fetch(`${await app.getUrl()}/admin/v1/system/notifications`);
      expect(res.status).toBe(401);
    });

    it('returns 403 without notification.log.read', async () => {
      app = await createApp([]);
      const res = await fetch(`${await app.getUrl()}/admin/v1/system/notifications`, {
        headers: { authorization: RBAC_TEST_TOKENS.noPermission },
      });
      expect(res.status).toBe(403);
    });

    it('returns 200 with notification.log.read', async () => {
      app = await createApp(['notification.log.read']);
      const res = await fetch(`${await app.getUrl()}/admin/v1/system/notifications`, {
        headers: { authorization: RBAC_TEST_TOKENS.noPermission },
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { items: unknown[] };
      expect(Array.isArray(body.items)).toBe(true);
    });

    it('notification list does not expose raw OTP, phone, or SMS body', async () => {
      app = await createApp(['notification.log.read']);
      const res = await fetch(`${await app.getUrl()}/admin/v1/system/notifications`, {
        headers: { authorization: RBAC_TEST_TOKENS.noPermission },
      });
      const text = await res.text();
      for (const marker of RAW_NOTIFICATION_MARKERS) {
        expect(text).not.toContain(marker);
      }
    });

    it('recipient in notification log is masked (not raw phone)', async () => {
      app = await createApp(['notification.log.read']);
      const res = await fetch(`${await app.getUrl()}/admin/v1/system/notifications`, {
        headers: { authorization: RBAC_TEST_TOKENS.noPermission },
      });
      const body = (await res.json()) as { items: Array<Record<string, unknown>> };
      for (const item of body.items) {
        // recipientPhone should not be present; recipientMasked may be present
        expect(item).not.toHaveProperty('recipientPhone');
        expect(JSON.stringify(item)).not.toMatch(/\+\d{10,}/);
      }
    });
  });

  describe('GET /admin/v1/system/notifications/:id', () => {
    it('returns 403 without permission', async () => {
      app = await createApp([]);
      const res = await fetch(`${await app.getUrl()}/admin/v1/system/notifications/notif-id-1`, {
        headers: { authorization: RBAC_TEST_TOKENS.noPermission },
      });
      expect(res.status).toBe(403);
    });

    it('returns 200 with permission — does not contain raw OTP', async () => {
      app = await createApp(['notification.log.read']);
      const res = await fetch(`${await app.getUrl()}/admin/v1/system/notifications/notif-id-1`, {
        headers: { authorization: RBAC_TEST_TOKENS.noPermission },
      });
      expect(res.status).toBe(200);
      const text = JSON.stringify(await res.json());
      for (const marker of RAW_NOTIFICATION_MARKERS) {
        expect(text).not.toContain(marker);
      }
    });
  });
});
