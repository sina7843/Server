import { isKnownEnvironment, normalizeEnvironment } from './env';

describe('environment utilities', () => {
  it('detects known environment names', () => {
    expect(isKnownEnvironment('development')).toBe(true);
    expect(isKnownEnvironment('test')).toBe(true);
    expect(isKnownEnvironment('production')).toBe(true);
    expect(isKnownEnvironment('local')).toBe(false);
  });

  it('normalizes unknown or missing environment values to development', () => {
    expect(normalizeEnvironment(undefined)).toBe('development');
    expect(normalizeEnvironment('local')).toBe('development');
    expect(normalizeEnvironment('test')).toBe('test');
    expect(normalizeEnvironment('production')).toBe('production');
  });
});
