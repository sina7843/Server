/* global afterEach, beforeEach, describe, expect, fetch, it, jest */
import type { CanActivate, ExecutionContext, INestApplication } from '@nestjs/common';
import { UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { AccessTokenGuard } from '../src/auth/guards/access-token.guard';
import type { AuthenticatedRequest } from '../src/auth/guards/authenticated-request';
import {
  createRevokeSessionSuccessResponse,
  createSessionsResponse,
} from './helpers/auth-test.factory';

class TestAccessTokenGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers?.authorization;

    if (authorization !== 'Bearer valid-access-token') {
      throw new UnauthorizedException('Authentication is required.');
    }

    request.auth = {
      userId: 'user-1',
      sessionId: 'session-1',
      accessTokenJti: 'jti-1',
    };

    return true;
  }
}

describe('current-user session management routes', () => {
  let app: INestApplication;
  const authService = {
    register: jest.fn(),
    verifyPhone: jest.fn(),
    login: jest.fn(),
    refresh: jest.fn(),
    forgotPassword: jest.fn(),
    verifyResetOtp: jest.fn(),
    resetPassword: jest.fn(),
    logout: jest.fn(),
    logoutAll: jest.fn(),
    getCurrentAuthIdentity: jest.fn(),
    listCurrentUserSessions: jest.fn().mockResolvedValue(createSessionsResponse()),
    revokeCurrentUserSession: jest.fn().mockResolvedValue(createRevokeSessionSuccessResponse()),
  } as unknown as jest.Mocked<AuthService>;

  beforeEach(async () => {
    jest.clearAllMocks();
    authService.listCurrentUserSessions.mockResolvedValue(createSessionsResponse());
    authService.revokeCurrentUserSession.mockResolvedValue(createRevokeSessionSuccessResponse());

    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
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

  it('lists only current user sessions for authenticated active user', async () => {
    const response = await fetch(`${await app.getUrl()}/api/v1/auth/sessions`, {
      method: 'GET',
      headers: {
        authorization: 'Bearer valid-access-token',
      },
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual(createSessionsResponse());
    expect(JSON.stringify(body)).not.toContain('refreshTokenHash');
    expect(JSON.stringify(body)).not.toContain('accessTokenJti');
    expect(JSON.stringify(body)).not.toContain('roles');
    expect(JSON.stringify(body)).not.toContain('permissions');
    expect(JSON.stringify(body)).not.toContain('profile');
  });

  it('rejects missing token safely for session list', async () => {
    const response = await fetch(`${await app.getUrl()}/api/v1/auth/sessions`, {
      method: 'GET',
    });

    expect(response.status).toBe(401);
    expect(authService.listCurrentUserSessions).not.toHaveBeenCalled();
  });

  it('revokes own session by session id', async () => {
    const response = await fetch(`${await app.getUrl()}/api/v1/auth/sessions/session-1`, {
      method: 'DELETE',
      headers: {
        authorization: 'Bearer valid-access-token',
      },
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(createRevokeSessionSuccessResponse());
    expect(authService.revokeCurrentUserSession).toHaveBeenCalledWith(
      {
        userId: 'user-1',
        sessionId: 'session-1',
        accessTokenJti: 'jti-1',
      },
      'session-1',
    );
  });

  it('cannot revoke another user session because service scopes by current user', async () => {
    authService.revokeCurrentUserSession.mockResolvedValue(createRevokeSessionSuccessResponse());

    const response = await fetch(`${await app.getUrl()}/api/v1/auth/sessions/other-session`, {
      method: 'DELETE',
      headers: {
        authorization: 'Bearer valid-access-token',
      },
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(createRevokeSessionSuccessResponse());
    expect(authService.revokeCurrentUserSession).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1' }),
      'other-session',
    );
  });
});
