import { maskEmail, maskPhone, maskSecret } from './masking';

describe('masking utilities', () => {
  it('masks phone numbers without exposing the full phone', () => {
    const phone = '+989123456789';
    const masked = maskPhone(phone);

    expect(masked).not.toBe(phone);
    expect(masked).not.toContain('9123456789');
    expect(masked).toContain('89');
  });

  it('masks email addresses without exposing the full email', () => {
    const email = 'person@example.com';
    const masked = maskEmail(email);

    expect(masked).not.toBe(email);
    expect(masked).not.toContain('person');
    expect(masked).toContain('.com');
  });

  it('masks secrets without exposing the full secret', () => {
    const secret = 'super-secret-token';
    const masked = maskSecret(secret);

    expect(masked).not.toBe(secret);
    expect(masked).not.toContain('super');
    expect(masked).toBe(`[masked:${secret.length}]`);
  });
});
