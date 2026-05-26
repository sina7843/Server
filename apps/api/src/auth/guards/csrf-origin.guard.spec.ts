/* global beforeEach, describe, expect, it */
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { CsrfOriginGuard } from './csrf-origin.guard';

function makeContext(headers: Record<string, string>): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ headers }),
    }),
  } as unknown as ExecutionContext;
}

describe('CsrfOriginGuard', () => {
  const guard = new CsrfOriginGuard();

  const originalEnv = process.env['CORS_ALLOWED_ORIGINS'];

  beforeEach(() => {
    delete process.env['CORS_ALLOWED_ORIGINS'];
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env['CORS_ALLOWED_ORIGINS'] = originalEnv;
    } else {
      delete process.env['CORS_ALLOWED_ORIGINS'];
    }
  });

  describe('when CORS_ALLOWED_ORIGINS is not set', () => {
    it('passes any request (dev/test mode)', () => {
      expect(guard.canActivate(makeContext({ origin: 'https://evil.com' }))).toBe(true);
      expect(guard.canActivate(makeContext({}))).toBe(true);
    });
  });

  describe('when CORS_ALLOWED_ORIGINS is set', () => {
    beforeEach(() => {
      process.env['CORS_ALLOWED_ORIGINS'] = 'https://app.example.com,https://admin.example.com';
    });

    it('passes when Origin matches an allowed origin', () => {
      expect(guard.canActivate(makeContext({ origin: 'https://app.example.com' }))).toBe(true);
    });

    it('passes when Origin matches second allowed origin', () => {
      expect(guard.canActivate(makeContext({ origin: 'https://admin.example.com' }))).toBe(true);
    });

    it('blocks when Origin is not in the allowlist', () => {
      expect(() => guard.canActivate(makeContext({ origin: 'https://evil.com' }))).toThrow(
        ForbiddenException,
      );
    });

    it('passes when Referer is from an allowed origin', () => {
      expect(guard.canActivate(makeContext({ referer: 'https://app.example.com/some/page' }))).toBe(
        true,
      );
    });

    it('blocks when Referer origin is not in the allowlist', () => {
      expect(() =>
        guard.canActivate(makeContext({ referer: 'https://evil.com/attack-page' })),
      ).toThrow(ForbiddenException);
    });

    it('passes when neither Origin nor Referer is present (server-to-server or CLI)', () => {
      expect(guard.canActivate(makeContext({}))).toBe(true);
    });

    it('passes when Referer is malformed (cannot extract origin)', () => {
      expect(guard.canActivate(makeContext({ referer: 'not-a-url' }))).toBe(true);
    });

    it('Origin check takes precedence over Referer', () => {
      expect(() =>
        guard.canActivate(
          makeContext({
            origin: 'https://evil.com',
            referer: 'https://app.example.com/page',
          }),
        ),
      ).toThrow(ForbiddenException);
    });
  });
});
