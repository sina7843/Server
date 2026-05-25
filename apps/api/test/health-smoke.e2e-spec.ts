/* global afterEach, describe, expect, fetch, it, jest */
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { HealthEndpointsController } from '../src/health/health.controller';
import { HealthService } from '../src/health/health.service';

const SENSITIVE_MARKERS = [
  'MONGODB_URI',
  'REDIS_HOST',
  'connectionString',
  'password',
  'secret',
  'credential',
];

describe('Health smoke', () => {
  let app: INestApplication;

  afterEach(async () => {
    if (app) await app.close();
    jest.clearAllMocks();
  });

  async function createApp(
    overrides: {
      overallStatus?: string;
      readinessResult?: Record<string, unknown>;
      dependenciesResult?: Record<string, unknown>;
    } = {},
  ): Promise<INestApplication> {
    const readinessResult = overrides.readinessResult ?? {
      mongodb: { status: 'ok', latencyMs: 5 },
      redis: { status: 'ok', latencyMs: 3 },
    };
    const dependenciesResult = overrides.dependenciesResult ?? {
      mongodb: { status: 'ok', latencyMs: 5 },
      redis: { status: 'ok', latencyMs: 3 },
      storage: { status: 'ok' },
      sms: { status: 'ok' },
    };
    const overallStatus = overrides.overallStatus ?? 'ok';

    const moduleRef = await Test.createTestingModule({
      controllers: [HealthEndpointsController],
      providers: [
        {
          provide: HealthService,
          useValue: {
            getReadiness: jest.fn().mockResolvedValue(readinessResult),
            getDependencies: jest.fn().mockResolvedValue(dependenciesResult),
            overallStatus: jest.fn().mockReturnValue(overallStatus),
          },
        },
      ],
    }).compile();

    const testApp = moduleRef.createNestApplication();
    await testApp.init();
    await testApp.listen(0);
    return testApp;
  }

  describe('GET /health/live', () => {
    it('returns 200 with status ok — no auth required', async () => {
      app = await createApp();
      const res = await fetch(`${await app.getUrl()}/health/live`);
      expect(res.status).toBe(200);
      const body = (await res.json()) as Record<string, unknown>;
      expect(body.status).toBe('ok');
      expect(body.service).toBe('api');
      expect(body.timestamp).toBeDefined();
    });

    it('response does not expose secrets', async () => {
      app = await createApp();
      const res = await fetch(`${await app.getUrl()}/health/live`);
      const text = await res.text();
      for (const marker of SENSITIVE_MARKERS) {
        expect(text).not.toContain(marker);
      }
    });
  });

  describe('GET /health/ready', () => {
    it('returns 200 when all deps are ok', async () => {
      app = await createApp();
      const res = await fetch(`${await app.getUrl()}/health/ready`);
      expect(res.status).toBe(200);
      const body = (await res.json()) as Record<string, unknown>;
      expect(body.status).toBe('ok');
      expect(body.dependencies).toBeDefined();
    });

    it('returns 503 when a dependency is down', async () => {
      app = await createApp({
        overallStatus: 'down',
        readinessResult: {
          mongodb: { status: 'down', latencyMs: 0 },
          redis: { status: 'ok', latencyMs: 3 },
        },
      });
      const res = await fetch(`${await app.getUrl()}/health/ready`);
      expect(res.status).toBe(503);
    });

    it('response does not expose secrets', async () => {
      app = await createApp();
      const res = await fetch(`${await app.getUrl()}/health/ready`);
      const text = await res.text();
      for (const marker of SENSITIVE_MARKERS) {
        expect(text).not.toContain(marker);
      }
    });
  });

  describe('GET /health/dependencies', () => {
    it('returns 200 with dependency status map', async () => {
      app = await createApp();
      const res = await fetch(`${await app.getUrl()}/health/dependencies`);
      expect(res.status).toBe(200);
      const body = (await res.json()) as { dependencies: Record<string, unknown> };
      expect(body.dependencies).toBeDefined();
    });

    it('response does not expose secrets or connection strings', async () => {
      app = await createApp();
      const res = await fetch(`${await app.getUrl()}/health/dependencies`);
      const text = await res.text();
      for (const marker of SENSITIVE_MARKERS) {
        expect(text).not.toContain(marker);
      }
    });

    it('dependency statuses are bounded values (ok/down/degraded/unknown)', async () => {
      app = await createApp({
        dependenciesResult: {
          mongodb: { status: 'ok', latencyMs: 4 },
          redis: { status: 'ok', latencyMs: 2 },
          storage: { status: 'unknown' },
          sms: { status: 'unknown' },
        },
      });
      const res = await fetch(`${await app.getUrl()}/health/dependencies`);
      const body = (await res.json()) as {
        dependencies: Record<string, { status: string }>;
      };
      const validStatuses = new Set(['ok', 'down', 'degraded', 'unknown']);
      for (const dep of Object.values(body.dependencies)) {
        expect(validStatuses.has(dep.status)).toBe(true);
      }
    });
  });
});
