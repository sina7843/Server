import { isKnownEnvironment, normalizeEnvironment } from './env';

describe('environment utilities', () => {
  it('detects known environment names', () => {
    expect(isKnownEnvironment('local')).toBe(true);
    expect(isKnownEnvironment('development')).toBe(true);
    expect(isKnownEnvironment('test')).toBe(true);
    expect(isKnownEnvironment('staging')).toBe(true);
    expect(isKnownEnvironment('production')).toBe(true);
    expect(isKnownEnvironment('unknown')).toBe(false);
  });

  it('normalizes known environment values and defaults unknown values to development', () => {
    expect(normalizeEnvironment(undefined)).toBe('development');
    expect(normalizeEnvironment('unknown')).toBe('development');
    expect(normalizeEnvironment('local')).toBe('local');
    expect(normalizeEnvironment('development')).toBe('development');
    expect(normalizeEnvironment('test')).toBe('test');
    expect(normalizeEnvironment('staging')).toBe('staging');
    expect(normalizeEnvironment('production')).toBe('production');
  });
});
