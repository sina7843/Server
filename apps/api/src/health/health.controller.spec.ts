import { HttpException, HttpStatus } from '@nestjs/common';
import { HealthEndpointsController } from './health.controller';
import { HealthService } from './health.service';

const makeController = (overrides: Partial<HealthService> = {}) => {
  const service = {
    getReadiness: jest.fn(),
    getDependencies: jest.fn(),
    overallStatus: jest.fn(),
    ...overrides,
  } as unknown as HealthService;
  return { controller: new HealthEndpointsController(service), service };
};

describe('HealthEndpointsController.getLive', () => {
  it('always returns status ok', () => {
    const { controller } = makeController();
    const result = controller.getLive();
    expect(result.status).toBe('ok');
    expect(result.service).toBe('api');
    expect(result.timestamp).toBeTruthy();
  });
});

describe('HealthEndpointsController.getReady', () => {
  it('returns 200 with ok status when all deps are up', async () => {
    const deps = { mongodb: { status: 'ok' as const }, redis: { status: 'ok' as const } };
    const { controller, service } = makeController();
    jest.spyOn(service, 'getReadiness').mockResolvedValue(deps);
    jest.spyOn(service, 'overallStatus').mockReturnValue('ok');

    const result = await controller.getReady();
    expect(result.status).toBe('ok');
    expect(result.dependencies).toEqual(deps);
  });

  it('throws 503 when a dependency is down', async () => {
    const deps = { mongodb: { status: 'down' as const }, redis: { status: 'ok' as const } };
    const { controller, service } = makeController();
    jest.spyOn(service, 'getReadiness').mockResolvedValue(deps);
    jest.spyOn(service, 'overallStatus').mockReturnValue('down');

    await expect(controller.getReady()).rejects.toThrow(
      new HttpException(
        expect.objectContaining({ status: 'down' }),
        HttpStatus.SERVICE_UNAVAILABLE,
      ),
    );
  });
});

describe('HealthEndpointsController.getDependencies', () => {
  it('always returns 200 with all dependency statuses', async () => {
    const deps = {
      mongodb: { status: 'ok' as const },
      redis: { status: 'ok' as const },
      storage: { status: 'ok' as const },
      sms: { status: 'unknown' as const },
    };
    const { controller, service } = makeController();
    jest.spyOn(service, 'getDependencies').mockResolvedValue(deps);
    jest.spyOn(service, 'overallStatus').mockReturnValue('degraded');

    const result = await controller.getDependencies();
    expect(result.status).toBe('degraded');
    expect(result.dependencies.sms.status).toBe('unknown');
  });
});
