import { AdminDashboardController } from './admin-dashboard.controller';
import type { AdminDashboardService } from './admin-dashboard.service';

function createController(overrides: Partial<{ getSummary: jest.Mock }> = {}) {
  const service = {
    getSummary: jest.fn().mockResolvedValue({
      users: { total: 10, active: 7, pending: 3 },
      system: { status: 'ok' },
    }),
    ...overrides,
  };
  return {
    controller: new AdminDashboardController(service as unknown as AdminDashboardService),
    service,
  };
}

describe('AdminDashboardController', () => {
  it('getSummary delegates to service', async () => {
    const { controller, service } = createController();

    const result = await controller.getSummary();

    expect(service.getSummary).toHaveBeenCalledTimes(1);
    expect(result.users?.total).toBe(10);
    expect(result.users?.active).toBe(7);
    expect(result.users?.pending).toBe(3);
    expect(result.system?.status).toBe('ok');
  });

  it('getSummary does not include sensitive user fields', async () => {
    const { controller } = createController();

    const result = await controller.getSummary();

    expect(JSON.stringify(result)).not.toContain('passwordHash');
    expect(JSON.stringify(result)).not.toContain('refreshTokenHash');
    expect(JSON.stringify(result)).not.toContain('phoneNormalized');
  });

  it('getSummary propagates service errors', async () => {
    const { controller } = createController({
      getSummary: jest.fn().mockRejectedValue(new Error('db error')),
    });

    await expect(controller.getSummary()).rejects.toThrow('db error');
  });
});
