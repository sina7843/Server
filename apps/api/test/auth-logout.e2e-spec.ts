/* global afterEach, beforeEach, describe, expect, fetch, it, jest */
import type { CanActivate, ExecutionContext, INestApplication } from '@nestjs/common';
import { UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import {
  createGenericAuthResponse,
  LOGOUT_ALL_GENERIC_MESSAGE,
  LOGOUT_GENERIC_MESSAGE,
} from '../src/auth/dto/auth-response.dto';
import { AccessTokenGuard } from '../src/auth/guards/access-token.guard';
import type { AuthenticatedRequest } from '../src/auth/guards/authenticated-request';

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

describe('POST /api/v1/auth/logout', () => {
  let app: INestApplication;
  const authService = {
    register: jest.fn(),
    verifyPhone: jest.fn(),
    login: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn().mockResolvedValue(createGenericAuthResponse(LOGOUT_GENERIC_MESSAGE)),
    logoutAll: jest.fn().mockResolvedValue(createGenericAuthResponse(LOGOUT_ALL_GENERIC_MESSAGE)),
  } as unknown as jest.Mocked<AuthService>;

  beforeEach(async () => {
    jest.clearAllMocks();

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
    const response = await fetch(`${await app.getUrl()}/api/v1/auth/logout`, {
      method: 'POST',
      headers: {
        authorization: 'Bearer valid-access-token',
        'content-type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual(
      createGenericAuthResponse(LOGOUT_GENERIC_MESSAGE),
    );
    expect(authService.logout).toHaveBeenCalledWith({
      userId: 'user-1',
      sessionId: 'session-1',
      accessTokenJti: 'jti-1',
    });
  });

  it('rejects missing token safely', async () => {
    const response = await fetch(`${await app.getUrl()}/api/v1/auth/logout`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(401);
    expect(authService.logout).not.toHaveBeenCalled();
  });

  it('rejects unknown fields', async () => {
    const response = await fetch(`${await app.getUrl()}/api/v1/auth/logout`, {
      method: 'POST',
      headers: {
        authorization: 'Bearer valid-access-token',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ sessionId: 'attacker-session' }),
    });

    expect(response.status).toBe(400);
    expect(authService.logout).not.toHaveBeenCalled();
  });
});

describe('POST /api/v1/auth/logout-all', () => {
  let app: INestApplication;
  const authService = {
    register: jest.fn(),
    verifyPhone: jest.fn(),
    login: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(),
    logoutAll: jest.fn().mockResolvedValue(createGenericAuthResponse(LOGOUT_ALL_GENERIC_MESSAGE)),
  } as unknown as jest.Mocked<AuthService>;

  beforeEach(async () => {
    jest.clearAllMocks();

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

  it('revokes all current-user sessions', async () => {
    const response = await fetch(`${await app.getUrl()}/api/v1/auth/logout-all`, {
      method: 'POST',
      headers: {
        authorization: 'Bearer valid-access-token',
        'content-type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual(
      createGenericAuthResponse(LOGOUT_ALL_GENERIC_MESSAGE),
    );
    expect(authService.logoutAll).toHaveBeenCalledWith({
      userId: 'user-1',
      sessionId: 'session-1',
      accessTokenJti: 'jti-1',
    });
  });

  it('does not affect another user session through request body input', async () => {
    const response = await fetch(`${await app.getUrl()}/api/v1/auth/logout-all`, {
      method: 'POST',
      headers: {
        authorization: 'Bearer valid-access-token',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ userId: 'other-user' }),
    });

    expect(response.status).toBe(400);
    expect(authService.logoutAll).not.toHaveBeenCalled();
  });
});
