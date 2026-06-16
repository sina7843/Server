/* global afterEach, beforeEach, describe, expect, fetch, it, jest */
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PublicSiteController } from '../src/site/public/public-site.controller';
import { AdminSiteController } from '../src/site/admin/admin-site.controller';
import { SiteSettingsService } from '../src/site/site-settings.service';
import { ContactMessageService } from '../src/site/contact-message.service';
import { ContactRateLimitGuard } from '../src/site/contact-rate-limit.guard';
import { AccessTokenGuard } from '../src/auth/guards/access-token.guard';
import { PermissionGuard } from '../src/rbac/guards/permission.guard';

const ADMIN_USER_ID = 'admin-user-id-1';

function port(app: INestApplication): number {
  return (app.getHttpServer() as { address(): { port: number } }).address().port;
}

function makeRequest(app: INestApplication, method: string, path: string, body?: unknown) {
  const init: RequestInit = { method };
  if (body !== undefined) {
    init.headers = { 'content-type': 'application/json' };
    init.body = JSON.stringify(body);
  }
  return fetch(`http://127.0.0.1:${port(app)}${path}`, init);
}

async function readJson<T>(res: Awaited<ReturnType<typeof fetch>>): Promise<T> {
  return (await res.json()) as T;
}

interface PublicSettingsBody {
  settings: {
    about: { title: string; bodyHtml: string; bodyJson?: unknown };
    contact: { email?: string; socials: { platform: string; url: string }[] };
  };
}
interface AdminSettingsBody {
  settings: { about: { bodyJson: unknown }; updatedAt: string };
}
interface MessageListBody {
  total: number;
  page: number;
  limit: number;
  items: Record<string, unknown>[];
}
interface GenericBody {
  success: boolean;
  message?: string;
}

function makeSettingsView(overrides: Record<string, unknown> = {}) {
  return {
    about: { title: 'درباره ما', bodyJson: { type: 'doc' }, bodyHtml: '<p>hi</p>' },
    contact: {
      email: 'hello@dragon.gg',
      phone: '021',
      address: 'Tehran',
      mapEmbedUrl: 'https://maps.example/embed',
      socials: [{ platform: 'instagram', url: 'https://ig/dragon' }],
    },
    updatedAt: new Date('2026-06-15T00:00:00.000Z'),
    ...overrides,
  };
}

const mockSettingsService = {
  getSettings: jest.fn(),
  updateSettings: jest.fn(),
};

const mockMessageService = {
  submit: jest.fn(),
  list: jest.fn(),
  getById: jest.fn(),
  delete: jest.fn(),
};

describe('Site module (e2e — real HTTP app)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      controllers: [PublicSiteController, AdminSiteController],
      providers: [
        { provide: SiteSettingsService, useValue: mockSettingsService },
        { provide: ContactMessageService, useValue: mockMessageService },
        // Real rate-limit guard (5/min default) — exercised for real over HTTP.
        ContactRateLimitGuard,
      ],
    })
      .overrideGuard(AccessTokenGuard)
      .useValue({
        canActivate: (ctx: { switchToHttp(): { getRequest(): Record<string, unknown> } }) => {
          const req = ctx.switchToHttp().getRequest();
          req['auth'] = { userId: ADMIN_USER_ID, sessionId: 'session-1', accessTokenJti: 'jti-1' };
          return true;
        },
      })
      .overrideGuard(PermissionGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
    await app.listen(0);
  });

  afterEach(async () => {
    await app.close();
  });

  // ─── Public: settings ───────────────────────────────────────────────────────

  describe('GET /api/v1/site/settings', () => {
    it('returns public settings (about + contact, no bodyJson)', async () => {
      mockSettingsService.getSettings.mockResolvedValue(makeSettingsView());

      const res = await makeRequest(app, 'GET', '/api/v1/site/settings');
      expect(res.status).toBe(200);
      const json = await readJson<PublicSettingsBody>(res);

      expect(json.settings.about).toEqual({ title: 'درباره ما', bodyHtml: '<p>hi</p>' });
      expect(json.settings.about.bodyJson).toBeUndefined();
      expect(json.settings.contact.email).toBe('hello@dragon.gg');
      expect(json.settings.contact.socials).toEqual([
        { platform: 'instagram', url: 'https://ig/dragon' },
      ]);
    });

    it('omits empty optional contact fields', async () => {
      mockSettingsService.getSettings.mockResolvedValue(
        makeSettingsView({ contact: { socials: [] } }),
      );

      const res = await makeRequest(app, 'GET', '/api/v1/site/settings');
      const json = await readJson<PublicSettingsBody>(res);
      expect(json.settings.contact).toEqual({ socials: [] });
    });
  });

  // ─── Public: contact form ─────────────────────────────────────────────────────

  describe('POST /api/v1/site/contact-messages', () => {
    it('stores a valid message with a hashed ip and returns success', async () => {
      mockMessageService.submit.mockResolvedValue({ _id: 'm1' });

      const res = await makeRequest(app, 'POST', '/api/v1/site/contact-messages', {
        name: 'Ali',
        email: 'ali@example.com',
        message: 'سلام',
      });

      expect(res.status).toBe(201);
      expect(await readJson<GenericBody>(res)).toEqual({ success: true });
      expect(mockMessageService.submit).toHaveBeenCalledTimes(1);
      const arg = mockMessageService.submit.mock.calls[0][0];
      expect(arg).toMatchObject({ name: 'Ali', email: 'ali@example.com', message: 'سلام' });
      expect(typeof arg.ipHash).toBe('string');
      expect(arg.ipHash.length).toBeGreaterThan(0);
    });

    it('silently drops a honeypot submission without storing', async () => {
      const res = await makeRequest(app, 'POST', '/api/v1/site/contact-messages', {
        name: 'Bot',
        email: 'bot@spam.com',
        message: 'spam',
        website: 'http://spam.example',
      });

      expect(res.status).toBe(201);
      expect(await readJson<GenericBody>(res)).toEqual({ success: true });
      expect(mockMessageService.submit).not.toHaveBeenCalled();
    });

    it('rejects an invalid email with 400', async () => {
      const res = await makeRequest(app, 'POST', '/api/v1/site/contact-messages', {
        name: 'Ali',
        email: 'not-an-email',
        message: 'hi',
      });
      expect(res.status).toBe(400);
      expect(mockMessageService.submit).not.toHaveBeenCalled();
    });

    it('rate-limits after 5 requests from the same client (429)', async () => {
      mockMessageService.submit.mockResolvedValue({ _id: 'm' });
      const body = { name: 'Ali', email: 'ali@example.com', message: 'hi' };

      const statuses: number[] = [];
      for (let i = 0; i < 6; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        const res = await makeRequest(app, 'POST', '/api/v1/site/contact-messages', body);
        statuses.push(res.status);
      }

      expect(statuses.slice(0, 5)).toEqual([201, 201, 201, 201, 201]);
      expect(statuses[5]).toBe(429);
    });
  });

  // ─── Admin: settings ──────────────────────────────────────────────────────────

  describe('admin/v1/site/settings', () => {
    it('GET returns admin settings including bodyJson + updatedAt', async () => {
      mockSettingsService.getSettings.mockResolvedValue(makeSettingsView());

      const res = await makeRequest(app, 'GET', '/admin/v1/site/settings');
      expect(res.status).toBe(200);
      const json = await readJson<AdminSettingsBody>(res);
      expect(json.settings.about.bodyJson).toEqual({ type: 'doc' });
      expect(json.settings.updatedAt).toBe('2026-06-15T00:00:00.000Z');
    });

    it('PUT updates settings and passes the requesting user id', async () => {
      mockSettingsService.updateSettings.mockResolvedValue(makeSettingsView());

      const res = await makeRequest(app, 'PUT', '/admin/v1/site/settings', {
        about: { title: 'About', bodyJson: {}, bodyHtml: '<p>a</p>' },
        contact: { email: 'x@y.z', socials: [{ platform: 'telegram', url: 'https://t.me/x' }] },
      });

      expect(res.status).toBe(200);
      expect(mockSettingsService.updateSettings).toHaveBeenCalledTimes(1);
      const [input, userId] = mockSettingsService.updateSettings.mock.calls[0];
      expect(userId).toBe(ADMIN_USER_ID);
      expect(input.about.title).toBe('About');
      expect(input.contact.socials).toEqual([{ platform: 'telegram', url: 'https://t.me/x' }]);
    });

    it('PUT rejects a malformed social entry with 400', async () => {
      const res = await makeRequest(app, 'PUT', '/admin/v1/site/settings', {
        about: { title: 'A', bodyJson: {}, bodyHtml: '' },
        contact: { socials: [{ platform: '', url: '' }] },
      });
      expect(res.status).toBe(400);
      expect(mockSettingsService.updateSettings).not.toHaveBeenCalled();
    });
  });

  // ─── Admin: contact messages ──────────────────────────────────────────────────

  describe('admin/v1/site/contact-messages', () => {
    it('GET lists messages with pagination metadata', async () => {
      mockMessageService.list.mockResolvedValue({
        items: [
          {
            _id: 'm1',
            name: 'Ali',
            email: 'ali@example.com',
            subject: 'سوال',
            message: 'سلام',
            createdAt: new Date('2026-06-15T10:00:00.000Z'),
          },
        ],
        total: 1,
      });

      const res = await makeRequest(app, 'GET', '/admin/v1/site/contact-messages?page=1&limit=20');
      expect(res.status).toBe(200);
      const json = await readJson<MessageListBody>(res);
      expect(json.total).toBe(1);
      expect(json.page).toBe(1);
      expect(json.limit).toBe(20);
      expect(json.items[0]).toMatchObject({
        id: 'm1',
        name: 'Ali',
        subject: 'سوال',
        createdAt: '2026-06-15T10:00:00.000Z',
      });
    });

    it('DELETE removes a message and returns success', async () => {
      mockMessageService.delete.mockResolvedValue(undefined);

      const res = await makeRequest(app, 'DELETE', '/admin/v1/site/contact-messages/m1');
      expect(res.status).toBe(200);
      expect(await readJson<GenericBody>(res)).toEqual({
        success: true,
        message: 'Contact message deleted.',
      });
      expect(mockMessageService.delete).toHaveBeenCalledWith('m1');
    });
  });
});
