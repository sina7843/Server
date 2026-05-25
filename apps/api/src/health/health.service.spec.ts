import { HealthService } from './health.service';
import type { HealthDependencyDto } from '@dragon/types';

const makeService = (
  mongoOk: boolean,
  redisOk: boolean,
  env: Record<string, string> = {},
): HealthService => {
  const connection = {
    db: mongoOk ? { command: jest.fn().mockResolvedValue({ ok: 1 }) } : undefined,
  } as unknown as import('mongoose').Connection;

  const smsQueue = {
    client: redisOk
      ? Promise.resolve({ ping: jest.fn().mockResolvedValue('PONG') })
      : Promise.reject(new Error('connection refused')),
  } as unknown as import('bullmq').Queue;

  const service = new HealthService(connection, smsQueue);

  for (const [k, v] of Object.entries(env)) {
    process.env[k] = v;
  }

  return service;
};

afterEach(() => {
  delete process.env['STORAGE_PROVIDER'];
  delete process.env['SMS_PROVIDER'];
});

describe('HealthService.checkMongoDB', () => {
  it('returns ok when MongoDB responds to ping', async () => {
    const svc = makeService(true, true);
    const result = await svc.checkMongoDB();
    expect(result.status).toBe('ok');
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it('returns down when db is undefined', async () => {
    const svc = makeService(false, true);
    const result = await svc.checkMongoDB();
    expect(result.status).toBe('down');
  });
});

describe('HealthService.checkRedis', () => {
  it('returns ok when Redis responds to ping', async () => {
    const svc = makeService(true, true);
    const result = await svc.checkRedis();
    expect(result.status).toBe('ok');
  });

  it('returns down when Redis connection fails', async () => {
    const svc = makeService(true, false);
    const result = await svc.checkRedis();
    expect(result.status).toBe('down');
  });
});

describe('HealthService.checkStorage', () => {
  it('returns ok when STORAGE_PROVIDER is set', () => {
    const svc = makeService(true, true, { STORAGE_PROVIDER: 'arvan' });
    expect(svc.checkStorage().status).toBe('ok');
  });

  it('returns unknown when STORAGE_PROVIDER is not set', () => {
    const svc = makeService(true, true);
    expect(svc.checkStorage().status).toBe('unknown');
  });
});

describe('HealthService.checkSms', () => {
  it('returns ok when SMS_PROVIDER is set', () => {
    const svc = makeService(true, true, { SMS_PROVIDER: 'kavenegar' });
    expect(svc.checkSms().status).toBe('ok');
  });

  it('returns unknown when SMS_PROVIDER is not set', () => {
    const svc = makeService(true, true);
    expect(svc.checkSms().status).toBe('unknown');
  });
});

describe('HealthService.overallStatus', () => {
  const toRecord = (entries: [string, string][]) =>
    Object.fromEntries(entries.map(([k, v]) => [k, { status: v } as HealthDependencyDto]));

  it('returns ok when all deps are ok', () => {
    const svc = makeService(true, true);
    expect(
      svc.overallStatus(
        toRecord([
          ['a', 'ok'],
          ['b', 'ok'],
        ]),
      ),
    ).toBe('ok');
  });

  it('returns down when any dep is down', () => {
    const svc = makeService(true, true);
    expect(
      svc.overallStatus(
        toRecord([
          ['a', 'ok'],
          ['b', 'down'],
        ]),
      ),
    ).toBe('down');
  });

  it('returns degraded when any dep is unknown', () => {
    const svc = makeService(true, true);
    expect(
      svc.overallStatus(
        toRecord([
          ['a', 'ok'],
          ['b', 'unknown'],
        ]),
      ),
    ).toBe('degraded');
  });
});
