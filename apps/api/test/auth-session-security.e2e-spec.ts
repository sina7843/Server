/* global afterEach, beforeEach, describe, expect, fetch, it, jest */
import type { CanActivate, ExecutionContext, INestApplication } from '@nestjs/common';
import { UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import {
  createGenericAuthResponse,
  REVOKE_SESSION_GENERIC_MESSAGE,
} from '../src/auth/dto/auth-response.dto';
import { AccessTokenGuard } from '../src/auth/guards/access-token.guard';
import type { AuthenticatedRequest } from '../src/auth/guards/authenticated-request';
import {
  expectNoSensitiveAuthFields,
  expectNoTokenResponse,
} from './helpers/security-assertions.helper';

class TestAccessTokenGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (request.headers?.authorization !== 'Bearer valid-access-token') {
      throw new UnauthorizedException('Authentication is required.');
    }

    request.auth = {
      userId: 'user-1',
      sessionId: 'session-current',
      accessTokenJti: 'jti-1',
    };

    return true;
  }
}

describe('auth session security regression', () => {
  let app: INestApplication;
  const sessionsResponse = {
    sessions: [
      {
        id: 'session-current',
        deviceName: 'Laptop',
        expiresAt: '2026-01-01T00:00:00.000Z',
        createdAt: '2025-12-01T00:00:00.000Z',
        isCurrent: true,
      },
    ],
  };
  const authService = {
    register: jest.fn(),
    verifyPhone: jest.fn(),
    login: jest.fn(),
    refresh: jest.fn().mockRejectedValue(new UnauthorizedException('Invalid refresh token.')),
    logout: jest.fn(),
    logoutAll: jest.fn(),
    forgotPassword: jest.fn(),
    verifyResetOtp: jest.fn(),
    resetPassword: jest.fn(),
    getCurrentAuthIdentity: jest.fn(),
    listCurrentUserSessions: jest.fn().mockResolvedValue(sessionsResponse),
    revokeCurrentUserSession: jest
      .fn()
      .mockResolvedValue(createGenericAuthResponse(REVOKE_SESSION_GENERIC_MESSAGE)),
  } as unknown as jest.Mocked<AuthService>;

  beforeEach(async () => {
    jest.clearAllMocks();
    authService.listCurrentUserSessions.mockResolvedValue(sessionsResponse);
    authService.revokeCurrentUserSession.mockResolvedValue(
      createGenericAuthResponse(REVOKE_SESSION_GENERIC_MESSAGE),
    );

    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    })
      .overrideGuard(AccessTokenGuard)
      .useClass(TestAccessTokenGuard)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
    await app.listen(0);
  });

  afterEach(async () => {
    await app.close();
  });

  it('lists only safe current-user session metadata', async () => {
    const response = await fetch(`${await app.getUrl()}/api/v1/auth/sessions`, {
      method: 'GET',
      headers: { authorization: 'Bearer valid-access-token' },
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual(sessionsResponse);
    expectNoSensitiveAuthFields(body);
    expect(JSON.stringify(body)).not.toContain('refreshTokenHash');
    expect(JSON.stringify(body)).not.toContain('accessTokenJti');
  });

  it('rejects missing token safely for session listing', async () => {
    const response = await fetch(`${await app.getUrl()}/api/v1/auth/sessions`, {
      method: 'GET',
    });

    expect(response.status).toBe(401);
    expect(authService.listCurrentUserSessions).not.toHaveBeenCalled();
  });

  it('revokes only the current user scoped session id', async () => {
    const response = await fetch(`${await app.getUrl()}/api/v1/auth/sessions/session-current`, {
      method: 'DELETE',
      headers: { authorization: 'Bearer valid-access-token' },
    });

    expect(response.status).toBe(200);
    expectNoTokenResponse(await response.json());
    expect(authService.revokeCurrentUserSession).toHaveBeenCalledWith(
      {
        userId: 'user-1',
        sessionId: 'session-current',
        accessTokenJti: 'jti-1',
      },
      'session-current',
    );
  });

  it('does not expose another user session or token hash when revoke fails safely', async () => {
    authService.revokeCurrentUserSession.mockResolvedValue(
      createGenericAuthResponse(REVOKE_SESSION_GENERIC_MESSAGE),
    );

    const response = await fetch(`${await app.getUrl()}/api/v1/auth/sessions/other-user-session`, {
      method: 'DELETE',
      headers: { authorization: 'Bearer valid-access-token' },
    });

    expect(response.status).toBe(200);
    expectNoSensitiveAuthFields(await response.json());
  });

  it('keeps revoked or reused refresh tokens rejected safely', async () => {
    const response = await fetch(`${await app.getUrl()}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        refreshToken: 'revoked-or-rotated-refresh-token',
      }),
    });

    expect(response.status).toBe(401);
    expectNoTokenResponse(await response.json());
  });
});
