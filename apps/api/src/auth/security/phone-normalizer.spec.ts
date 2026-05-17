import { isLikelyNormalizedPhone, normalizePhoneNumber } from './phone-normalizer';

describe('auth phone normalizer', () => {
  it('wraps the shared phone normalizer for auth use', () => {
    expect(normalizePhoneNumber(' +98 912-345-6789 ')).toBe('+989123456789');
  });

  it('rejects invalid phone values', () => {
    expect(() => normalizePhoneNumber('not-a-phone')).toThrow('invalid characters');
  });

  it('checks normalized phone shape without logging raw values', () => {
    expect(isLikelyNormalizedPhone('+989123456789')).toBe(true);
    expect(isLikelyNormalizedPhone('+98 912 345 6789')).toBe(false);
  });
});
