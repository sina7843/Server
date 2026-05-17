import { isLikelyNormalizedPhone, normalizePhoneNumber } from './phone';

describe('phone utilities', () => {
  it('trims and normalizes deterministic phone inputs', () => {
    expect(normalizePhoneNumber(' +98 912-345-6789 ')).toBe('+989123456789');
    expect(normalizePhoneNumber('(021) 1234 5678')).toBe('02112345678');
  });

  it('preserves a valid leading plus sign only', () => {
    expect(normalizePhoneNumber('+1 (202) 555-0199')).toBe('+12025550199');
    expect(() => normalizePhoneNumber('++12025550199')).toThrow('invalid plus sign');
    expect(() => normalizePhoneNumber('120+25550199')).toThrow('invalid plus sign');
  });

  it('rejects invalid phone values', () => {
    expect(() => normalizePhoneNumber('')).toThrow('required');
    expect(() => normalizePhoneNumber('abc')).toThrow('invalid characters');
    expect(() => normalizePhoneNumber('123')).toThrow('length');
  });

  it('detects likely normalized phone values', () => {
    expect(isLikelyNormalizedPhone('+989123456789')).toBe(true);
    expect(isLikelyNormalizedPhone('09123456789')).toBe(true);
    expect(isLikelyNormalizedPhone('+98 912 345 6789')).toBe(false);
    expect(isLikelyNormalizedPhone('123')).toBe(false);
  });
});
