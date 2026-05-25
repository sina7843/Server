import { AnalyticsService } from './analytics.service';
import { AnalyticsEventRepository } from './analytics-event.repository';
import { AnalyticsRedactor } from './analytics-redactor';

function makeRepo(): jest.Mocked<AnalyticsEventRepository> {
  return {
    create: jest.fn().mockResolvedValue(undefined),
    countByType: jest.fn().mockResolvedValue(0),
    countByTypes: jest.fn().mockResolvedValue(new Map()),
    getTopContentByViews: jest.fn().mockResolvedValue([]),
  } as unknown as jest.Mocked<AnalyticsEventRepository>;
}

function makeService() {
  const repo = makeRepo();
  const redactor = new AnalyticsRedactor();
  const service = new AnalyticsService(repo, redactor);
  return { repo, service };
}

describe('AnalyticsService', () => {
  describe('track — non-blocking', () => {
    it('fires repository.create immediately (fire-and-forget)', () => {
      const { repo, service } = makeService();
      service.track({ type: 'user.registered' });
      expect(repo.create).toHaveBeenCalledTimes(1);
    });

    it('does not throw if repository throws', async () => {
      const { repo, service } = makeService();
      repo.create.mockRejectedValue(new Error('DB down'));
      expect(() => service.track({ type: 'user.registered' })).not.toThrow();
      await new Promise((r) => setTimeout(r, 10));
    });

    it('tracking failure does not propagate to caller', async () => {
      const { repo, service } = makeService();
      repo.create.mockRejectedValue(new Error('Network error'));
      let callerError: unknown;
      try {
        service.track({ type: 'content.viewed', resourceId: 'abc' });
        await new Promise((r) => setTimeout(r, 10));
      } catch (err) {
        callerError = err;
      }
      expect(callerError).toBeUndefined();
    });
  });

  describe('track — IP hashing', () => {
    it('does not store raw IP — stores ipHash instead', async () => {
      const { repo, service } = makeService();
      service.track({ type: 'user.logged_in', ip: '192.168.1.1' });
      await new Promise((r) => setTimeout(r, 10));
      expect(repo.create).toHaveBeenCalled();
      const callArg = repo.create.mock.calls[0]?.[0] as unknown as Record<string, unknown>;
      expect(callArg.ip).toBeUndefined();
      expect(typeof callArg.ipHash).toBe('string');
      expect(callArg.ipHash).not.toBe('192.168.1.1');
    });

    it('ipHash is deterministic for same IP', async () => {
      const { repo: repo1, service: service1 } = makeService();
      const { repo: repo2, service: service2 } = makeService();
      service1.track({ type: 'user.logged_in', ip: '10.0.0.1' });
      service2.track({ type: 'user.logged_in', ip: '10.0.0.1' });
      await new Promise((r) => setTimeout(r, 10));
      const hash1 = (repo1.create.mock.calls[0]?.[0] as unknown as Record<string, unknown>).ipHash;
      const hash2 = (repo2.create.mock.calls[0]?.[0] as unknown as Record<string, unknown>).ipHash;
      expect(hash1).toBe(hash2);
    });

    it('ipHash differs for different IPs', async () => {
      const { repo: r1, service: s1 } = makeService();
      const { repo: r2, service: s2 } = makeService();
      s1.track({ type: 'user.logged_in', ip: '1.1.1.1' });
      s2.track({ type: 'user.logged_in', ip: '2.2.2.2' });
      await new Promise((r) => setTimeout(r, 10));
      const h1 = (r1.create.mock.calls[0]?.[0] as unknown as Record<string, unknown>).ipHash;
      const h2 = (r2.create.mock.calls[0]?.[0] as unknown as Record<string, unknown>).ipHash;
      expect(h1).not.toBe(h2);
    });
  });

  describe('track — metadata redaction', () => {
    it('redacts password from metadata', async () => {
      const { repo, service } = makeService();
      service.track({ type: 'user.registered', metadata: { password: 'secret123', info: 'ok' } });
      await new Promise((r) => setTimeout(r, 10));
      const meta = (repo.create.mock.calls[0]?.[0] as unknown as Record<string, unknown>)
        .metadata as Record<string, unknown>;
      expect(meta.password).toBe('[REDACTED]');
      expect(meta.info).toBe('ok');
    });

    it('redacts token fields from metadata', async () => {
      const { repo, service } = makeService();
      service.track({
        type: 'user.logged_in',
        metadata: { accessToken: 'tok', refreshToken: 'ref', sessionId: 'abc' },
      });
      await new Promise((r) => setTimeout(r, 10));
      const meta = (repo.create.mock.calls[0]?.[0] as unknown as Record<string, unknown>)
        .metadata as Record<string, unknown>;
      expect(meta.accessToken).toBe('[REDACTED]');
      expect(meta.refreshToken).toBe('[REDACTED]');
      expect(meta.sessionId).toBe('abc');
    });

    it('redacts phone from metadata', async () => {
      const { repo, service } = makeService();
      service.track({ type: 'otp.requested', metadata: { phone: '+98912', purpose: 'verify' } });
      await new Promise((r) => setTimeout(r, 10));
      const meta = (repo.create.mock.calls[0]?.[0] as unknown as Record<string, unknown>)
        .metadata as Record<string, unknown>;
      expect(meta.phone).toBe('[REDACTED]');
      expect(meta.purpose).toBe('verify');
    });

    it('redacts email from metadata', async () => {
      const { repo, service } = makeService();
      service.track({ type: 'user.registered', metadata: { email: 'test@example.com' } });
      await new Promise((r) => setTimeout(r, 10));
      const meta = (repo.create.mock.calls[0]?.[0] as unknown as Record<string, unknown>)
        .metadata as Record<string, unknown>;
      expect(meta.email).toBe('[REDACTED]');
    });

    it('redacts otp/code from metadata', async () => {
      const { repo, service } = makeService();
      service.track({ type: 'otp.verified', metadata: { otp: '123456', rawOtp: '123456' } });
      await new Promise((r) => setTimeout(r, 10));
      const meta = (repo.create.mock.calls[0]?.[0] as unknown as Record<string, unknown>)
        .metadata as Record<string, unknown>;
      expect(meta.otp).toBe('[REDACTED]');
      expect(meta.rawOtp).toBe('[REDACTED]');
    });

    it('does not store raw OTP in metadata for otp.requested', async () => {
      const { repo, service } = makeService();
      service.track({ type: 'otp.requested', metadata: { code: '654321' } });
      await new Promise((r) => setTimeout(r, 10));
      const meta = (repo.create.mock.calls[0]?.[0] as unknown as Record<string, unknown>)
        .metadata as Record<string, unknown>;
      expect(meta.code).toBe('[REDACTED]');
    });

    it('redacts nested sensitive keys', async () => {
      const { repo, service } = makeService();
      service.track({
        type: 'user.registered',
        metadata: { context: { password: 'p', info: 'safe' } },
      });
      await new Promise((r) => setTimeout(r, 10));
      const meta = (repo.create.mock.calls[0]?.[0] as unknown as Record<string, unknown>)
        .metadata as Record<string, unknown>;
      const context = meta.context as Record<string, unknown>;
      expect(context.password).toBe('[REDACTED]');
      expect(context.info).toBe('safe');
    });
  });

  describe('track — event type coverage', () => {
    const eventTypes = [
      'user.registered',
      'user.logged_in',
      'otp.requested',
      'otp.verified',
      'otp.failed',
      'content.viewed',
      'content.published',
      'media.uploaded',
    ] as const;

    for (const type of eventTypes) {
      it(`can track ${type}`, async () => {
        const { repo, service } = makeService();
        service.track({ type });
        await new Promise((r) => setTimeout(r, 10));
        expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ type }));
      });
    }
  });

  describe('AnalyticsEvent schema fields', () => {
    it('stores userId when provided', async () => {
      const { repo, service } = makeService();
      service.track({ type: 'user.registered', userId: '64f000000000000000000001' });
      await new Promise((r) => setTimeout(r, 10));
      const arg = repo.create.mock.calls[0]?.[0] as unknown as Record<string, unknown>;
      expect(arg.userId).toBe('64f000000000000000000001');
    });

    it('stores resourceType and resourceId', async () => {
      const { repo, service } = makeService();
      service.track({ type: 'content.viewed', resourceType: 'news', resourceId: 'abc123' });
      await new Promise((r) => setTimeout(r, 10));
      const arg = repo.create.mock.calls[0]?.[0] as unknown as Record<string, unknown>;
      expect(arg.resourceType).toBe('news');
      expect(arg.resourceId).toBe('abc123');
    });

    it('does not store userAgent when not provided', async () => {
      const { repo, service } = makeService();
      service.track({ type: 'content.published' });
      await new Promise((r) => setTimeout(r, 10));
      const arg = repo.create.mock.calls[0]?.[0] as unknown as Record<string, unknown>;
      expect(arg.userAgent).toBeUndefined();
    });
  });
});

describe('AnalyticsRedactor', () => {
  const redactor = new AnalyticsRedactor();

  it('redacts password', () => {
    expect(redactor.redact({ password: 'abc' })).toEqual({ password: '[REDACTED]' });
  });

  it('redacts passwordHash', () => {
    expect(redactor.redact({ passwordHash: 'hash' })).toEqual({ passwordHash: '[REDACTED]' });
  });

  it('redacts phone', () => {
    expect(redactor.redact({ phone: '+98912' })).toEqual({ phone: '[REDACTED]' });
  });

  it('redacts email', () => {
    expect(redactor.redact({ email: 'x@y.com' })).toEqual({ email: '[REDACTED]' });
  });

  it('redacts recipient', () => {
    expect(redactor.redact({ recipient: 'r' })).toEqual({ recipient: '[REDACTED]' });
  });

  it('redacts otp and rawOtp', () => {
    expect(redactor.redact({ otp: '123', rawOtp: '456' })).toEqual({
      otp: '[REDACTED]',
      rawOtp: '[REDACTED]',
    });
  });

  it('redacts code and codeHash', () => {
    expect(redactor.redact({ code: '1234', codeHash: 'hashed' })).toEqual({
      code: '[REDACTED]',
      codeHash: '[REDACTED]',
    });
  });

  it('redacts token fields', () => {
    const input = { accessToken: 'a', refreshToken: 'b', accessTokenJti: 'c', resetToken: 'd' };
    const result = redactor.redact(input) as typeof input;
    expect(result.accessToken).toBe('[REDACTED]');
    expect(result.refreshToken).toBe('[REDACTED]');
    expect(result.accessTokenJti).toBe('[REDACTED]');
    expect(result.resetToken).toBe('[REDACTED]');
  });

  it('redacts authorization and cookie headers', () => {
    const input = { headers: { authorization: 'Bearer tok', cookie: 'sess=1', 'x-safe': 'ok' } };
    const result = redactor.redact(input) as typeof input;
    expect(result.headers.authorization).toBe('[REDACTED]');
    expect(result.headers.cookie).toBe('[REDACTED]');
    expect(result.headers['x-safe']).toBe('ok');
  });

  it('preserves safe keys', () => {
    expect(redactor.redact({ info: 'ok', count: 5 })).toEqual({ info: 'ok', count: 5 });
  });

  it('handles arrays', () => {
    const result = redactor.redact([{ password: 'x' }, { safe: 'y' }]) as Record<string, unknown>[];
    expect(result[0]?.password).toBe('[REDACTED]');
    expect(result[1]?.safe).toBe('y');
  });

  it('handles null and primitives', () => {
    expect(redactor.redact(null)).toBeNull();
    expect(redactor.redact(42)).toBe(42);
    expect(redactor.redact('text')).toBe('text');
  });
});
