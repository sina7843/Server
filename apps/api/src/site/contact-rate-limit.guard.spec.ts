import { HttpException } from '@nestjs/common';
import { ContactRateLimitGuard } from './contact-rate-limit.guard';

function ctx(ip: string) {
  return {
    switchToHttp: () => ({ getRequest: () => ({ ip, headers: {} }) }),
  } as never;
}

describe('ContactRateLimitGuard', () => {
  it('allows up to the limit then blocks with 429', () => {
    const guard = new ContactRateLimitGuard(3, 60_000);
    expect(guard.canActivate(ctx('1.1.1.1'))).toBe(true);
    expect(guard.canActivate(ctx('1.1.1.1'))).toBe(true);
    expect(guard.canActivate(ctx('1.1.1.1'))).toBe(true);
    try {
      guard.canActivate(ctx('1.1.1.1'));
      fail('expected throw');
    } catch (err) {
      expect(err).toBeInstanceOf(HttpException);
      expect((err as HttpException).getStatus()).toBe(429);
    }
  });

  it('tracks IPs independently', () => {
    const guard = new ContactRateLimitGuard(1, 60_000);
    expect(guard.canActivate(ctx('2.2.2.2'))).toBe(true);
    expect(guard.canActivate(ctx('3.3.3.3'))).toBe(true);
  });

  it('frees the window after expiry', () => {
    jest.useFakeTimers();
    const guard = new ContactRateLimitGuard(1, 1_000);
    expect(guard.canActivate(ctx('4.4.4.4'))).toBe(true);
    jest.advanceTimersByTime(1_100);
    expect(guard.canActivate(ctx('4.4.4.4'))).toBe(true);
    jest.useRealTimers();
  });
});
