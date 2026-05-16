import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('returns a static ok status', () => {
    const controller = new HealthController();

    expect(controller.getHealth()).toEqual({ status: 'ok' });
  });
});
