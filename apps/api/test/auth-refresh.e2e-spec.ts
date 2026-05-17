/* global afterEach, beforeEach, describe, expect, fetch, it, jest */
import type { INestApplication } from '@nestjs/common';
import { UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { createRefreshTokenResponse } from './helpers/auth-test.factory';

describe('POST /api/v1/auth/refresh', () => {
  let app: INestApplication;
  const authService = {
    register: jest.fn(),
    verifyPhone: jest.fn(),
    login: jest.fn(),
    refresh: jest.fn().mockResolvedValue(createRefreshTokenResponse()),
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
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    await app.listen(0);
  });

  afterEach(async () => {
    await app.close();
  });

  it('succeeds with a valid refresh token', async () => {
    const response = await fetch(`${await app.getUrl()}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        refreshToken: 'valid-refresh-token',
      }),
    });

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual(createRefreshTokenResponse());
    expect(authService.refresh).toHaveBeenCalledWith({
      refreshToken: 'valid-refresh-token',
    });
  });

  it('rejects reused old refresh token safely', async () => {
    authService.refresh.mockRejectedValueOnce(new UnauthorizedException('Invalid refresh token.'));

    const response = await fetch(`${await app.getUrl()}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        refreshToken: 'old-refresh-token',
      }),
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
      },
      body: JSON.stringify({
        refreshToken: 'invalid-refresh-token',
      }),
    });

    expect(response.status).toBe(401);
    const body = (await response.json()) as { message?: string };

    expect(body.message).toBe('Invalid refresh token.');
  });

  it('rejects unknown fields', async () => {
    const response = await fetch(`${await app.getUrl()}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        refreshToken: 'valid-refresh-token',
        userId: 'user-1',
      }),
    });

    expect(response.status).toBe(400);
    expect(authService.refresh).not.toHaveBeenCalled();
  });
});
