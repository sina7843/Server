/* global afterEach, beforeEach, describe, expect, fetch, it, jest */
import type { CanActivate, ExecutionContext, INestApplication } from '@nestjs/common';
import { UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { AccessTokenGuard } from '../src/auth/guards/access-token.guard';
import type { AuthenticatedRequest } from '../src/auth/guards/authenticated-request';
import { createMeResponse } from './helpers/auth-test.factory';

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

describe('GET /api/v1/auth/me', () => {
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
    getCurrentAuthIdentity: jest.fn().mockResolvedValue(createMeResponse()),
  } as unknown as jest.Mocked<AuthService>;

  beforeEach(async () => {
    jest.clearAllMocks();
    authService.getCurrentAuthIdentity.mockResolvedValue(createMeResponse());

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

  it('succeeds for an authenticated active user', async () => {
    const response = await fetch(`${await app.getUrl()}/api/v1/auth/me`, {
      method: 'GET',
      headers: {
        authorization: 'Bearer valid-access-token',
      },
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual(createMeResponse());
    expect(JSON.stringify(body)).not.toContain('passwordHash');
    expect(JSON.stringify(body)).not.toContain('profile');
    expect(JSON.stringify(body)).not.toContain('roles');
    expect(JSON.stringify(body)).not.toContain('permissions');
    expect(JSON.stringify(body)).not.toContain('session');
  });

  it('rejects missing token safely', async () => {
    const response = await fetch(`${await app.getUrl()}/api/v1/auth/me`, {
      method: 'GET',
    });

    expect(response.status).toBe(401);
    expect(authService.getCurrentAuthIdentity).not.toHaveBeenCalled();
  });

  it('rejects invalid token safely', async () => {
    const response = await fetch(`${await app.getUrl()}/api/v1/auth/me`, {
      method: 'GET',
      headers: {
        authorization: 'Bearer invalid-access-token',
      },
    });

    expect(response.status).toBe(401);
    expect(authService.getCurrentAuthIdentity).not.toHaveBeenCalled();
  });

  it('rejects blocked statuses safely through the auth service', async () => {
    authService.getCurrentAuthIdentity.mockRejectedValue(
      new UnauthorizedException('Authentication is required.'),
    );

    const response = await fetch(`${await app.getUrl()}/api/v1/auth/me`, {
      method: 'GET',
      headers: {
        authorization: 'Bearer valid-access-token',
      },
    });

    expect(response.status).toBe(401);
  });
});
