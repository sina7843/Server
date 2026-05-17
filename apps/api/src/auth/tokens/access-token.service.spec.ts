import { UnauthorizedException } from '@nestjs/common';
import { createAuthTestConfig } from '../../../test/helpers/auth-test.factory';
import { AccessTokenService } from './access-token.service';

function decodePayload(token: string): Record<string, unknown> {
  const payload = token.split('.')[1];

  if (payload === undefined) {
    throw new Error('Access token payload segment is missing.');
  }

  return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as Record<string, unknown>;
}

describe('AccessTokenService', () => {
  it('issues a signed access token with minimal claims', () => {
    const service = new AccessTokenService(createAuthTestConfig());
    const token = service.issueAccessToken({
      sub: 'user-1',
      jti: 'jti-1',
      sessionId: 'session-1',
    });
    const claims = decodePayload(token.accessToken);

    expect(token.accessToken.split('.')).toHaveLength(3);
    expect(token.expiresIn).toBe(900);
    expect(claims).toEqual(
      expect.objectContaining({
        sub: 'user-1',
        jti: 'jti-1',
        sessionId: 'session-1',
      }),
    );
    expect(claims).not.toHaveProperty('phone');
    expect(claims).not.toHaveProperty('passwordHash');
    expect(claims).not.toHaveProperty('roles');
    expect(claims).not.toHaveProperty('permissions');
    expect(claims).not.toHaveProperty('profile');
  });

  it('verifies a valid access token and returns minimal claims', () => {
    const service = new AccessTokenService(createAuthTestConfig());
    const token = service.issueAccessToken({
      sub: 'user-1',
      jti: 'jti-1',
      sessionId: 'session-1',
    });

    expect(service.verifyAccessToken(token.accessToken)).toEqual({
      sub: 'user-1',
      jti: 'jti-1',
      sessionId: 'session-1',
    });
  });

  it('rejects tampered access tokens', () => {
    const service = new AccessTokenService(createAuthTestConfig());
    const token = service.issueAccessToken({
      sub: 'user-1',
      jti: 'jti-1',
      sessionId: 'session-1',
    });

    expect(() => service.verifyAccessToken(`${token.accessToken}tampered`)).toThrow(
      UnauthorizedException,
    );
  });

  it('rejects expired access tokens', () => {
    const service = new AccessTokenService(createAuthTestConfig({ accessTokenTtlSeconds: 1 }));
    const token = service.issueAccessToken({
      sub: 'user-1',
      jti: 'jti-1',
      sessionId: 'session-1',
    });

    expect(() =>
      service.verifyAccessToken(token.accessToken, new Date(Date.now() + 2_000)),
    ).toThrow(UnauthorizedException);
  });
});
