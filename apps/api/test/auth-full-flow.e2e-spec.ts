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
  VERIFY_PHONE_GENERIC_MESSAGE,
} from '../src/auth/dto/auth-response.dto';
import { AccessTokenGuard } from '../src/auth/guards/access-token.guard';
import type { AuthenticatedRequest } from '../src/auth/guards/authenticated-request';
import {
  expectGenericSuccessResponse,
  expectNoSensitiveAuthFields,
} from './helpers/security-assertions.helper';
import { createTestTokenResponse, expectTokenResponse } from './helpers/token-test.helper';

class TestAccessTokenGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (request.headers?.authorization !== 'Bearer valid-access-token') {
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

describe('auth full-flow regression', () => {
  let app: INestApplication;
  const firstTokenResponse = createTestTokenResponse({
    accessToken: 'access-token-1',
    refreshToken: 'refresh-token-1',
  });
  const rotatedTokenResponse = createTestTokenResponse({
    accessToken: 'access-token-2',
    refreshToken: 'refresh-token-2',
  });
  const authService = {
    register: jest.fn().mockResolvedValue(createGenericAuthResponse()),
    verifyPhone: jest
      .fn()
      .mockResolvedValue(createGenericAuthResponse(VERIFY_PHONE_GENERIC_MESSAGE)),
    login: jest.fn().mockResolvedValue(firstTokenResponse),
    refresh: jest.fn().mockResolvedValue(rotatedTokenResponse),
    logout: jest.fn().mockResolvedValue(createGenericAuthResponse(LOGOUT_GENERIC_MESSAGE)),
    logoutAll: jest.fn().mockResolvedValue(createGenericAuthResponse(LOGOUT_ALL_GENERIC_MESSAGE)),
    forgotPassword: jest.fn(),
    verifyResetOtp: jest.fn(),
    resetPassword: jest.fn(),
    getCurrentAuthIdentity: jest.fn(),
    listCurrentUserSessions: jest.fn(),
    revokeCurrentUserSession: jest.fn(),
  } as unknown as jest.Mocked<AuthService>;

  beforeEach(async () => {
    jest.clearAllMocks();

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

  it('covers register, verify-phone, login, refresh, logout, and logout-all without sensitive leakage', async () => {
    const baseUrl = await app.getUrl();

    const registerResponse = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ phone: '+989120000000', password: 'strong-pass' }),
    });
    expect(registerResponse.status).toBe(201);
    expectGenericSuccessResponse(await registerResponse.json());

    const verifyResponse = await fetch(`${baseUrl}/api/v1/auth/verify-phone`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ phone: '+989120000000', code: '123456' }),
    });
    expect(verifyResponse.status).toBe(201);
    expectGenericSuccessResponse(await verifyResponse.json());

    const loginResponse = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ phone: '+989120000000', password: 'strong-pass' }),
    });
    expect(loginResponse.status).toBe(201);
    const loginBody = await loginResponse.json();
    expectTokenResponse(loginBody);

    // Refresh token is in the HttpOnly cookie, not the response body
    const loginSetCookie = loginResponse.headers.get('set-cookie') ?? '';
    expect(loginSetCookie).toContain('dragon_refresh=');
    expect(loginSetCookie).toContain('HttpOnly');
    expect(loginSetCookie).toContain('SameSite=Strict');

    // Use cookie for refresh
    const refreshResponse = await fetch(`${baseUrl}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: `dragon_refresh=${firstTokenResponse.refreshToken}`,
      },
    });
    expect(refreshResponse.status).toBe(201);
    const refreshBody = await refreshResponse.json();
    expectTokenResponse(refreshBody);

    // Rotated cookie must differ from the original
    const refreshSetCookie = refreshResponse.headers.get('set-cookie') ?? '';
    expect(refreshSetCookie).toContain('dragon_refresh=');
    expect(refreshSetCookie).not.toContain(`dragon_refresh=${firstTokenResponse.refreshToken}`);

    const logoutResponse = await fetch(`${baseUrl}/api/v1/auth/logout`, {
      method: 'POST',
      headers: {
        authorization: 'Bearer valid-access-token',
        'content-type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    expect(logoutResponse.status).toBe(201);
    expectGenericSuccessResponse(await logoutResponse.json());

    // Logout clears the refresh cookie
    const logoutSetCookie = logoutResponse.headers.get('set-cookie') ?? '';
    expect(logoutSetCookie).toContain('dragon_refresh=;');

    const logoutAllResponse = await fetch(`${baseUrl}/api/v1/auth/logout-all`, {
      method: 'POST',
      headers: {
        authorization: 'Bearer valid-access-token',
        'content-type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    expect(logoutAllResponse.status).toBe(201);
    expectGenericSuccessResponse(await logoutAllResponse.json());

    expectNoSensitiveAuthFields({ loginBody, refreshBody });
  });
});
