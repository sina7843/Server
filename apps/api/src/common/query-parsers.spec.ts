import { parseOptionalBooleanQuery } from './query-parsers';

describe('parseOptionalBooleanQuery', () => {
  it('returns undefined for undefined', () => {
    expect(parseOptionalBooleanQuery(undefined)).toBeUndefined();
  });

  it('returns undefined for null', () => {
    expect(parseOptionalBooleanQuery(null)).toBeUndefined();
  });

  it('returns undefined for empty string', () => {
    expect(parseOptionalBooleanQuery('')).toBeUndefined();
  });

  it('returns true for "true"', () => {
    expect(parseOptionalBooleanQuery('true')).toBe(true);
  });

  it('returns false for "false"', () => {
    expect(parseOptionalBooleanQuery('false')).toBe(false);
  });

  it('returns undefined for "TRUE" (case-sensitive)', () => {
    expect(parseOptionalBooleanQuery('TRUE')).toBeUndefined();
  });

  it('returns undefined for "FALSE" (case-sensitive)', () => {
    expect(parseOptionalBooleanQuery('FALSE')).toBeUndefined();
  });

  it('returns undefined for "1"', () => {
    expect(parseOptionalBooleanQuery('1')).toBeUndefined();
  });

  it('returns undefined for "0"', () => {
    expect(parseOptionalBooleanQuery('0')).toBeUndefined();
  });

  it('returns undefined for "yes"', () => {
    expect(parseOptionalBooleanQuery('yes')).toBeUndefined();
  });

  it('returns undefined for "no"', () => {
    expect(parseOptionalBooleanQuery('no')).toBeUndefined();
  });

  it('returns undefined for arbitrary strings', () => {
    expect(parseOptionalBooleanQuery('random')).toBeUndefined();
  });

  // Array inputs — duplicate query params like ?registrationOpen=true&registrationOpen=true
  // are parsed by qs as arrays. These must be handled explicitly (not via fall-through)
  // and must return undefined rather than throwing.
  it('returns undefined for single-element array ["true"] — explicit array handling', () => {
    expect(parseOptionalBooleanQuery(['true'])).toBeUndefined();
  });

  it('returns undefined for multi-element array ["true","true"] — duplicate query param', () => {
    expect(parseOptionalBooleanQuery(['true', 'true'])).toBeUndefined();
  });

  it('returns undefined for array ["false"] — explicit array handling', () => {
    expect(parseOptionalBooleanQuery(['false'])).toBeUndefined();
  });

  it('returns undefined for empty array [] — explicit array handling', () => {
    expect(parseOptionalBooleanQuery([])).toBeUndefined();
  });

  it('does not throw for any input — lenient parser contract', () => {
    const inputs = [undefined, null, '', 'true', 'false', 'TRUE', 'FALSE', '1', '0', 'yes', 'no', 'random', 42, {}, [], ['true'], ['true', 'true']];
    for (const v of inputs) {
      expect(() => parseOptionalBooleanQuery(v)).not.toThrow();
    }
  });
});
