import { AuditRedactor } from './audit-redactor';

describe('AuditRedactor', () => {
  let redactor: AuditRedactor;

  beforeEach(() => {
    redactor = new AuditRedactor();
  });

  it('returns primitives unchanged', () => {
    expect(redactor.redact('hello')).toBe('hello');
    expect(redactor.redact(42)).toBe(42);
    expect(redactor.redact(true)).toBe(true);
    expect(redactor.redact(null)).toBeNull();
  });

  it('redacts password', () => {
    const result = redactor.redact({ password: 'secret123', name: 'Alice' });
    expect(result.password).toBe('[REDACTED]');
    expect(result.name).toBe('Alice');
  });

  it('redacts passwordHash', () => {
    const result = redactor.redact({ passwordHash: '$2b$10$abc', userId: '123' });
    expect(result.passwordHash).toBe('[REDACTED]');
    expect(result.userId).toBe('123');
  });

  it('redacts rawOtp and otp', () => {
    const result = redactor.redact({ rawOtp: '123456', otp: '654321' });
    expect(result.rawOtp).toBe('[REDACTED]');
    expect(result.otp).toBe('[REDACTED]');
  });

  it('redacts code and codeHash', () => {
    const result = redactor.redact({ code: '111111', codeHash: 'hashvalue' });
    expect(result.code).toBe('[REDACTED]');
    expect(result.codeHash).toBe('[REDACTED]');
  });

  it('redacts refreshToken and refreshTokenHash', () => {
    const result = redactor.redact({ refreshToken: 'tok123', refreshTokenHash: 'hash456' });
    expect(result.refreshToken).toBe('[REDACTED]');
    expect(result.refreshTokenHash).toBe('[REDACTED]');
  });

  it('redacts accessToken and accessTokenJti', () => {
    const result = redactor.redact({ accessToken: 'jwt.tok', accessTokenJti: 'jti-abc' });
    expect(result.accessToken).toBe('[REDACTED]');
    expect(result.accessTokenJti).toBe('[REDACTED]');
  });

  it('redacts resetToken', () => {
    const result = redactor.redact({ resetToken: 'reset-tok' });
    expect(result.resetToken).toBe('[REDACTED]');
  });

  it('redacts secret and secrets', () => {
    const result = redactor.redact({ secret: 'my-secret', secrets: { key: 'value' } });
    expect(result.secret).toBe('[REDACTED]');
    expect(result.secrets).toBe('[REDACTED]');
  });

  it('redacts clientSecret and providerSecret', () => {
    const result = redactor.redact({ clientSecret: 'cs-abc', providerSecret: 'ps-xyz' });
    expect(result.clientSecret).toBe('[REDACTED]');
    expect(result.providerSecret).toBe('[REDACTED]');
  });

  it('redacts providerCredentials', () => {
    const result = redactor.redact({ providerCredentials: { key: 'val' } });
    expect(result.providerCredentials).toBe('[REDACTED]');
  });

  it('redacts authorization and cookie at top level', () => {
    const result = redactor.redact({ authorization: 'Bearer tok', cookie: 'session=abc' });
    expect(result.authorization).toBe('[REDACTED]');
    expect(result.cookie).toBe('[REDACTED]');
  });

  it('redacts cookies (plural) at top level', () => {
    const result = redactor.redact({ cookies: { sessionId: 'abc' } });
    expect(result.cookies).toBe('[REDACTED]');
  });

  it('redacts authorization in headers object (case-insensitive)', () => {
    const result = redactor.redact({
      headers: { Authorization: 'Bearer tok', 'content-type': 'application/json' },
    });
    expect((result.headers as Record<string, unknown>)['Authorization']).toBe('[REDACTED]');
    expect((result.headers as Record<string, unknown>)['content-type']).toBe('application/json');
  });

  it('redacts cookie in headers object (case-insensitive)', () => {
    const result = redactor.redact({ headers: { Cookie: 'sess=abc', accept: '*/*' } });
    expect((result.headers as Record<string, unknown>)['Cookie']).toBe('[REDACTED]');
    expect((result.headers as Record<string, unknown>)['accept']).toBe('*/*');
  });

  it('handles nested objects recursively', () => {
    const result = redactor.redact({
      user: {
        id: 'u1',
        auth: {
          password: 'nested-password',
          email: 'user@example.com',
        },
      },
    });
    const user = result.user as Record<string, unknown>;
    const auth = user.auth as Record<string, unknown>;
    expect(auth.password).toBe('[REDACTED]');
    expect(auth.email).toBe('user@example.com');
    expect(user.id).toBe('u1');
  });

  it('handles arrays and redacts secrets inside them', () => {
    const result = redactor.redact([
      { userId: '1', password: 'p1' },
      { userId: '2', password: 'p2' },
    ]);
    const arr = result as Array<Record<string, unknown>>;
    expect(Array.isArray(arr)).toBe(true);
    expect(arr[0]!.password).toBe('[REDACTED]');
    expect(arr[1]!.password).toBe('[REDACTED]');
    expect(arr[0]!.userId).toBe('1');
  });

  it('does not mutate the original input object', () => {
    const original = { password: 'secret', name: 'Alice' };
    const originalCopy = { ...original };
    redactor.redact(original);
    expect(original).toEqual(originalCopy);
  });

  it('does not mutate nested original objects', () => {
    const nested = { auth: { password: 'p', email: 'e@e.com' } };
    const authCopy = { ...nested.auth };
    redactor.redact(nested);
    expect(nested.auth).toEqual(authCopy);
  });

  it('preserves safe metadata fields unchanged', () => {
    const result = redactor.redact({
      userId: 'u1',
      action: 'login',
      ip: '1.2.3.4',
      timestamp: '2026-01-01T00:00:00.000Z',
    });
    expect(result.userId).toBe('u1');
    expect(result.action).toBe('login');
    expect(result.ip).toBe('1.2.3.4');
    expect(result.timestamp).toBe('2026-01-01T00:00:00.000Z');
  });

  it('handles empty object', () => {
    expect(redactor.redact({})).toEqual({});
  });

  it('handles empty array', () => {
    expect(redactor.redact([])).toEqual([]);
  });

  describe('case-insensitive key redaction', () => {
    it('redacts Password (mixed case)', () => {
      const result = redactor.redact({ Password: 'secret' });
      expect(result.Password).toBe('[REDACTED]');
    });

    it('redacts PASSWORD (uppercase)', () => {
      const result = redactor.redact({ PASSWORD: 'secret' });
      expect(result.PASSWORD).toBe('[REDACTED]');
    });

    it('redacts REFRESHTOKEN (uppercase)', () => {
      const result = redactor.redact({ REFRESHTOKEN: 'tok' });
      expect(result.REFRESHTOKEN).toBe('[REDACTED]');
    });

    it('redacts Authorization at top level (mixed case)', () => {
      const result = redactor.redact({ Authorization: 'Bearer xyz' });
      expect(result.Authorization).toBe('[REDACTED]');
    });

    it('redacts COOKIE at top level (uppercase)', () => {
      const result = redactor.redact({ COOKIE: 'session=abc' });
      expect(result.COOKIE).toBe('[REDACTED]');
    });

    it('redacts Otp (mixed case)', () => {
      const result = redactor.redact({ Otp: '123456' });
      expect(result.Otp).toBe('[REDACTED]');
    });

    it('redacts CodeHash (mixed case)', () => {
      const result = redactor.redact({ CodeHash: 'hashval' });
      expect(result.CodeHash).toBe('[REDACTED]');
    });

    it('redacts ProviderCredentials (mixed case)', () => {
      const result = redactor.redact({ ProviderCredentials: { key: 'val' } });
      expect(result.ProviderCredentials).toBe('[REDACTED]');
    });

    it('redacts nested mixed-case secret keys', () => {
      const result = redactor.redact({ user: { id: 'u1', RefreshToken: 'tok' } });
      const user = result.user as Record<string, unknown>;
      expect(user.RefreshToken).toBe('[REDACTED]');
      expect(user.id).toBe('u1');
    });

    it('preserves non-secret keys unchanged regardless of case', () => {
      const result = redactor.redact({ UserName: 'alice', IP: '1.2.3.4' });
      expect(result.UserName).toBe('alice');
      expect(result.IP).toBe('1.2.3.4');
    });

    it('preserves original key names in output (does not lowercase keys)', () => {
      const result = redactor.redact({ Password: 'secret', UserName: 'alice' });
      expect('Password' in result).toBe(true);
      expect('UserName' in result).toBe(true);
    });
  });
});
