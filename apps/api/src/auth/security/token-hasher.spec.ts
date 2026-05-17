import { hashToken, safeCompareHash } from './token-hasher';

describe('token hasher', () => {
  it('hashes the same token deterministically', () => {
    expect(hashToken('refresh-token-value')).toBe(hashToken('refresh-token-value'));
  });

  it('does not return the raw token', () => {
    const token = 'refresh-token-value';

    expect(hashToken(token)).not.toBe(token);
  });

  it('accepts a matching token and hash', () => {
    const expectedHash = hashToken('refresh-token-value');

    expect(safeCompareHash('refresh-token-value', expectedHash)).toBe(true);
  });

  it('rejects a wrong token or invalid hash', () => {
    const expectedHash = hashToken('refresh-token-value');

    expect(safeCompareHash('wrong-token', expectedHash)).toBe(false);
    expect(safeCompareHash('refresh-token-value', 'invalid-hash')).toBe(false);
  });
});
