/* global afterEach, beforeEach, describe, expect, fetch, it, jest */
import type { INestApplication } from '@nestjs/common';
import { UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { AccessTokenGuard } from '../src/auth/guards/access-token.guard';
import {
  createRefreshTokenServiceResult,
  createRefreshTokenResponse,
} from './helpers/auth-test.factory';

describe('POST /api/v1/auth/refresh', () => {
  let app: INestApplication;
  const authService = {
    register: jest.fn(),
    verifyPhone: jest.fn(),
    login: jest.fn(),
    refresh: jest.fn().mockResolvedValue(createRefreshTokenServiceResult()),
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
      .useValue({ canActivate: () => false })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
    await app.listen(0);
  });

  afterEach(async () => {
    await app.close();
  });

  it('succeeds with a valid dragon_refresh cookie and returns token body without refreshToken', async () => {
    const response = await fetch(`${await app.getUrl()}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: 'dragon_refresh=valid-refresh-token',
      },
    });

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body).toEqual(createRefreshTokenResponse());
    expect(JSON.stringify(body)).not.toContain('refreshToken');
    expect(authService.refresh).toHaveBeenCalledWith({ refreshToken: 'valid-refresh-token' });
  });

  it('rotates the dragon_refresh cookie on success', async () => {
    const response = await fetch(`${await app.getUrl()}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: 'dragon_refresh=valid-refresh-token',
      },
    });

    expect(response.status).toBe(201);
    const setCookie = response.headers.get('set-cookie') ?? '';
    expect(setCookie).toContain('dragon_refresh=');
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toContain('Path=/api/v1/auth');
    expect(setCookie).toContain('SameSite=Strict');
  });

  it('rejects request with no dragon_refresh cookie', async () => {
    const response = await fetch(`${await app.getUrl()}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
    });

    expect(response.status).toBe(401);
    expect(authService.refresh).not.toHaveBeenCalled();
  });

  it('rejects reused old refresh token safely', async () => {
    authService.refresh.mockRejectedValueOnce(new UnauthorizedException('Invalid refresh token.'));

    const response = await fetch(`${await app.getUrl()}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: 'dragon_refresh=old-refresh-token',
      },
    });

    expect(response.status).toBe(401);
    const body = (await response.json()) as { message?: string };

    expect(body.message).toBe('Invalid refresh token.');
    expect(JSON.stringify(body)).not.toContain('old-refresh-token');
  });

  it('rejects invalid refresh token safely', async () => {
    authService.refresh.mockRejectedValueOnce(new UnauthorizedException('Invalid refresh token.'));

    const response = await fetch(`${await app.getUrl()}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: 'dragon_refresh=invalid-refresh-token',
      },
    });

    expect(response.status).toBe(401);
    const body = (await response.json()) as { message?: string };

    expect(body.message).toBe('Invalid refresh token.');
  });
});
