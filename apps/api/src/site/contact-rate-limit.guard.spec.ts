import { HttpException } from '@nestjs/common';
import { ContactRateLimitGuard } from './contact-rate-limit.guard';

// The guard is fixed at 5 requests / 60s (class-field config, no constructor args,
// so NestJS DI can instantiate it with zero dependencies).
const LIMIT = 5;
const WINDOW_MS = 60_000;

function ctx(ip: string) {
  return {
    switchToHttp: () => ({ getRequest: () => ({ ip, headers: {} }) }),
  } as never;
}

describe('ContactRateLimitGuard', () => {
  it('allows up to the limit then blocks with 429', () => {
    const guard = new ContactRateLimitGuard();
    for (let i = 0; i < LIMIT; i += 1) {
      expect(guard.canActivate(ctx('1.1.1.1'))).toBe(true);
    }
    try {
      guard.canActivate(ctx('1.1.1.1'));
      fail('expected throw');
    } catch (err) {
      expect(err).toBeInstanceOf(HttpException);
      expect((err as HttpException).getStatus()).toBe(429);
    }
  });

  it('tracks IPs independently', () => {
    const guard = new ContactRateLimitGuard();
    // Exhaust one IP's budget; a different IP is unaffected.
    for (let i = 0; i < LIMIT; i += 1) guard.canActivate(ctx('2.2.2.2'));
    expect(() => guard.canActivate(ctx('2.2.2.2'))).toThrow(HttpException);
    expect(guard.canActivate(ctx('3.3.3.3'))).toBe(true);
  });

  it('frees the window after expiry', () => {
    jest.useFakeTimers();
    const guard = new ContactRateLimitGuard();
    for (let i = 0; i < LIMIT; i += 1) guard.canActivate(ctx('4.4.4.4'));
    expect(() => guard.canActivate(ctx('4.4.4.4'))).toThrow(HttpException);

    jest.advanceTimersByTime(WINDOW_MS + 100);
    expect(guard.canActivate(ctx('4.4.4.4'))).toBe(true);
    jest.useRealTimers();
  });
});
