import { AdminSystemController } from './admin-system.controller';

describe('AdminSystemController', () => {
  it('getHealth returns status ok and service api', () => {
    const controller = new AdminSystemController();

    const result = controller.getHealth();

    expect(result.status).toBe('ok');
    expect(result.service).toBe('api');
  });

  it('getHealth returns an ISO checkedAt timestamp', () => {
    const before = new Date().toISOString();
    const controller = new AdminSystemController();

    const result = controller.getHealth();

    expect(new Date(result.checkedAt).toISOString()).toBe(result.checkedAt);
    expect(result.checkedAt >= before).toBe(true);
  });

  it('getHealth does not expose sensitive fields', () => {
    const controller = new AdminSystemController();

    const result = controller.getHealth();

    expect(JSON.stringify(result)).not.toContain('passwordHash');
    expect(JSON.stringify(result)).not.toContain('secret');
    expect(JSON.stringify(result)).not.toContain('token');
  });
});
