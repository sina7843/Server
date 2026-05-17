import { createAuthTestConfig } from '../../../test/helpers/auth-test.factory';
import { safeCompareHash } from '../security/token-hasher';
import { RefreshTokenService } from './refresh-token.service';

describe('RefreshTokenService', () => {
  it('issues a high-entropy refresh token and stores only its hash metadata', () => {
    const service = new RefreshTokenService(createAuthTestConfig({ refreshTokenTtlDays: 30 }));
    const now = new Date('2026-01-01T00:00:00.000Z');

    const issued = service.issueRefreshToken(now);

    expect(issued.refreshToken).toEqual(expect.any(String));
    expect(issued.refreshToken.length).toBeGreaterThan(40);
    expect(issued.refreshTokenHash).not.toBe(issued.refreshToken);
    expect(safeCompareHash(issued.refreshToken, issued.refreshTokenHash)).toBe(true);
    expect(issued.expiresAt).toEqual(new Date('2026-01-31T00:00:00.000Z'));
  });
});
