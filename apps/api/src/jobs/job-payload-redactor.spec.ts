import { JobPayloadRedactor } from './job-payload-redactor';

const redactor = new JobPayloadRedactor();

describe('JobPayloadRedactor', () => {
  describe('secret key redaction', () => {
    const secretKeys = [
      'password',
      'passwordHash',
      'rawOtp',
      'otp',
      'code',
      'codeHash',
      'refreshToken',
      'refreshTokenHash',
      'accessToken',
      'accessTokenJti',
      'resetToken',
      'secret',
      'secrets',
      'clientSecret',
      'providerSecret',
      'providerCredentials',
      'authorization',
      'cookie',
      'cookies',
      'smsBody',
      'recipientPhoneNormalized',
    ];

    for (const key of secretKeys) {
      it(`redacts "${key}"`, () => {
        const result = redactor.redact({ [key]: 'sensitive-value' });
        expect(result[key]).toBe('[REDACTED]');
      });
    }
  });

  describe('non-secret keys', () => {
    it('preserves non-secret string fields', () => {
      const result = redactor.redact({ userId: 'abc-123', queueName: 'sms' });
      expect(result.userId).toBe('abc-123');
      expect(result.queueName).toBe('sms');
    });

    it('preserves numeric fields', () => {
      const result = redactor.redact({ attempts: 2, maxAttempts: 5 });
      expect(result.attempts).toBe(2);
      expect(result.maxAttempts).toBe(5);
    });

    it('preserves boolean fields', () => {
      const result = redactor.redact({ active: true });
      expect(result.active).toBe(true);
    });

    it('preserves null fields', () => {
      const result = redactor.redact({ value: null });
      expect(result.value).toBeNull();
    });
  });

  describe('recursive redaction', () => {
    it('redacts secrets in nested objects', () => {
      const result = redactor.redact({
        user: { id: 'abc', password: 'secret' },
      });
      const nested = result.user as Record<string, unknown>;
      expect(nested.id).toBe('abc');
      expect(nested.password).toBe('[REDACTED]');
    });

    it('redacts secrets in arrays', () => {
      const result = redactor.redact({
        tokens: [{ accessToken: 'token1' }, { accessToken: 'token2' }],
      });
      const arr = result.tokens as Array<Record<string, unknown>>;
      expect(arr[0]!.accessToken).toBe('[REDACTED]');
      expect(arr[1]!.accessToken).toBe('[REDACTED]');
    });

    it('redacts secrets deeply nested', () => {
      const result = redactor.redact({
        level1: { level2: { level3: { password: 'deep-secret' } } },
      });
      const l3 = (result.level1 as Record<string, unknown>).level2 as Record<string, unknown>;
      const deepest = l3.level3 as Record<string, unknown>;
      expect(deepest.password).toBe('[REDACTED]');
    });
  });

  describe('non-mutation', () => {
    it('does not mutate the input object', () => {
      const input = { userId: 'abc', password: 'secret' };
      redactor.redact(input);
      expect(input.password).toBe('secret');
    });

    it('does not mutate nested input objects', () => {
      const inner = { password: 'secret' };
      const input = { user: inner };
      redactor.redact(input);
      expect(inner.password).toBe('secret');
    });
  });

  describe('edge cases', () => {
    it('handles empty object', () => {
      const result = redactor.redact({});
      expect(result).toEqual({});
    });

    it('wraps non-object values', () => {
      const result = redactor.redact('plain-string');
      expect(result).toEqual({ _value: 'plain-string' });
    });

    it('wraps null', () => {
      const result = redactor.redact(null);
      expect(result).toEqual({ _value: null });
    });

    it('wraps arrays at top level', () => {
      const result = redactor.redact([{ id: 1 }]);
      expect(result).toHaveProperty('_value');
    });
  });

  describe('security: no raw secrets in output', () => {
    it('output does not contain raw OTP', () => {
      const result = redactor.redact({ otp: '123456', userId: 'abc' });
      expect(JSON.stringify(result)).not.toContain('123456');
    });

    it('output does not contain raw password', () => {
      const result = redactor.redact({ password: 'p@ssw0rd' });
      expect(JSON.stringify(result)).not.toContain('p@ssw0rd');
    });

    it('output does not contain raw token', () => {
      const result = redactor.redact({ refreshToken: 'my-token-value' });
      expect(JSON.stringify(result)).not.toContain('my-token-value');
    });
  });
});
