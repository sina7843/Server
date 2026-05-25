import { AdminSystemController } from './admin-system.controller';
import { HealthService } from '../../health/health.service';

const makeController = () => {
  const healthService = {
    getDependencies: jest.fn().mockResolvedValue({
      mongodb: { status: 'ok', latencyMs: 2 },
      redis: { status: 'ok', latencyMs: 1 },
      storage: { status: 'ok' },
      sms: { status: 'ok' },
    }),
    overallStatus: jest.fn().mockReturnValue('ok'),
  } as unknown as HealthService;
  return new AdminSystemController(healthService);
};

describe('AdminSystemController', () => {
  it('getHealth returns status ok and service api', async () => {
    const controller = makeController();

    const result = await controller.getHealth();

    expect(result.status).toBe('ok');
    expect(result.service).toBe('api');
  });

  it('getHealth returns an ISO checkedAt timestamp', async () => {
    const before = new Date().toISOString();
    const controller = makeController();

    const result = await controller.getHealth();

    expect(new Date(result.checkedAt).toISOString()).toBe(result.checkedAt);
    expect(result.checkedAt >= before).toBe(true);
  });

  it('getHealth maps down to unavailable', async () => {
    const healthService = {
      getDependencies: jest.fn().mockResolvedValue({
        mongodb: { status: 'down' },
        redis: { status: 'ok' },
        storage: { status: 'ok' },
        sms: { status: 'ok' },
      }),
      overallStatus: jest.fn().mockReturnValue('down'),
    } as unknown as HealthService;
    const controller = new AdminSystemController(healthService);

    const result = await controller.getHealth();

    expect(result.status).toBe('unavailable');
  });

  it('getHealth does not expose sensitive fields', async () => {
    const controller = makeController();

    const result = await controller.getHealth();

    expect(JSON.stringify(result)).not.toContain('password');
    expect(JSON.stringify(result)).not.toContain('secret');
    expect(JSON.stringify(result)).not.toContain('token');
    expect(JSON.stringify(result)).not.toContain('connectionString');
  });
});
