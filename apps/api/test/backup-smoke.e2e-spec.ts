/* global afterEach, describe, expect, fetch, it, jest */
import type { INestApplication } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { AccessTokenGuard } from '../src/auth/guards/access-token.guard';
import { PermissionGuard } from '../src/rbac/guards/permission.guard';
import { PermissionResolverService } from '../src/rbac/resolution/permission-resolver.service';
import { AdminBackupController } from '../src/backups/admin-backup.controller';
import { BackupService } from '../src/backups/backup.service';
import { RBAC_TEST_TOKENS, RbacTestAccessTokenGuard } from './helpers/rbac-test.factory';

const CREDENTIAL_MARKERS = [
  'MONGODB_URI',
  'connectionString',
  'mongoUri',
  'password',
  'secret',
  'credential',
];

const mockBackupService = {
  listBackups: jest.fn().mockResolvedValue({ items: [], total: 0, page: 1, limit: 20 }),
  getLatestBackup: jest.fn().mockResolvedValue(null),
  runMongoBackup: jest.fn().mockResolvedValue({ message: 'Backup started.' }),
};

async function createApp(permissionKeys: string[]): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    controllers: [AdminBackupController],
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
      { provide: BackupService, useValue: mockBackupService },
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

describe('Backup smoke', () => {
  let app: INestApplication;

  afterEach(async () => {
    if (app) await app.close();
  });

  describe('GET /admin/v1/system/backups', () => {
    it('returns 401 without auth', async () => {
      app = await createApp(['system.backup.read']);
      const res = await fetch(`${await app.getUrl()}/admin/v1/system/backups`);
      expect(res.status).toBe(401);
    });

    it('returns 403 without system.backup.read permission', async () => {
      app = await createApp([]);
      const res = await fetch(`${await app.getUrl()}/admin/v1/system/backups`, {
        headers: { authorization: RBAC_TEST_TOKENS.noPermission },
      });
      expect(res.status).toBe(403);
    });

    it('returns 200 with system.backup.read permission', async () => {
      app = await createApp(['system.backup.read']);
      const res = await fetch(`${await app.getUrl()}/admin/v1/system/backups`, {
        headers: { authorization: RBAC_TEST_TOKENS.noPermission },
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { items: unknown[] };
      expect(Array.isArray(body.items)).toBe(true);
    });

    it('response does not expose credentials', async () => {
      app = await createApp(['system.backup.read']);
      const res = await fetch(`${await app.getUrl()}/admin/v1/system/backups`, {
        headers: { authorization: RBAC_TEST_TOKENS.noPermission },
      });
      const text = await res.text();
      for (const marker of CREDENTIAL_MARKERS) {
        expect(text).not.toContain(marker);
      }
    });
  });

  describe('GET /admin/v1/system/backups/latest', () => {
    it('returns 403 without permission', async () => {
      app = await createApp([]);
      const res = await fetch(`${await app.getUrl()}/admin/v1/system/backups/latest`, {
        headers: { authorization: RBAC_TEST_TOKENS.noPermission },
      });
      expect(res.status).toBe(403);
    });

    it('returns 200 (null) when no backup exists', async () => {
      app = await createApp(['system.backup.read']);
      const res = await fetch(`${await app.getUrl()}/admin/v1/system/backups/latest`, {
        headers: { authorization: RBAC_TEST_TOKENS.noPermission },
      });
      expect(res.status).toBe(200);
    });
  });

  describe('POST /admin/v1/system/backups/run', () => {
    it('returns 403 without system.backup.run permission', async () => {
      app = await createApp(['system.backup.read']);
      const res = await fetch(`${await app.getUrl()}/admin/v1/system/backups/run`, {
        method: 'POST',
        headers: {
          authorization: RBAC_TEST_TOKENS.noPermission,
          'content-type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      expect(res.status).toBe(403);
    });

    it('returns 201 with system.backup.run permission', async () => {
      app = await createApp(['system.backup.run']);
      const res = await fetch(`${await app.getUrl()}/admin/v1/system/backups/run`, {
        method: 'POST',
        headers: {
          authorization: RBAC_TEST_TOKENS.noPermission,
          'content-type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      expect(res.status).toBe(201);
      const body = (await res.json()) as { message: string };
      expect(body.message).toBeDefined();
    });
  });

  describe('No restore endpoint', () => {
    it('GET /admin/v1/system/backups/restore returns 404', async () => {
      app = await createApp(['system.backup.read']);
      const res = await fetch(`${await app.getUrl()}/admin/v1/system/backups/restore`, {
        headers: { authorization: RBAC_TEST_TOKENS.noPermission },
      });
      expect(res.status).toBe(404);
    });

    it('POST /admin/v1/system/backups/restore returns 404', async () => {
      app = await createApp(['system.backup.run']);
      const res = await fetch(`${await app.getUrl()}/admin/v1/system/backups/restore`, {
        method: 'POST',
        headers: {
          authorization: RBAC_TEST_TOKENS.noPermission,
          'content-type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      expect(res.status).toBe(404);
    });
  });

  describe('No download endpoint', () => {
    it('GET /admin/v1/system/backups/download returns 404', async () => {
      app = await createApp(['system.backup.read']);
      const res = await fetch(`${await app.getUrl()}/admin/v1/system/backups/download`, {
        headers: { authorization: RBAC_TEST_TOKENS.noPermission },
      });
      expect(res.status).toBe(404);
    });
  });
});
