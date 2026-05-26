/* global afterEach, beforeEach, describe, expect, fetch, it, jest */
import type { INestApplication } from '@nestjs/common';
import { UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { AccessTokenGuard } from '../src/auth/guards/access-token.guard';
import {
  createLoginTokenServiceResult,
  createLoginTokenResponse,
} from './helpers/auth-test.factory';

describe('POST /api/v1/auth/login', () => {
  let app: INestApplication;
  const authService = {
    register: jest.fn(),
    verifyPhone: jest.fn(),
    login: jest.fn().mockResolvedValue(createLoginTokenServiceResult()),
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

  it('succeeds and returns token body without refreshToken', async () => {
    const response = await fetch(`${await app.getUrl()}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        phone: '+989120000000',
        password: 'correct-password',
      }),
    });

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body).toEqual(createLoginTokenResponse());
    expect(JSON.stringify(body)).not.toContain('refreshToken');
    expect(authService.login).toHaveBeenCalledWith({
      phone: '+989120000000',
      password: 'correct-password',
    }, expect.any(Object));
  });

  it('sets HttpOnly dragon_refresh cookie on successful login', async () => {
    const response = await fetch(`${await app.getUrl()}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        phone: '+989120000000',
        password: 'correct-password',
      }),
    });

    expect(response.status).toBe(201);
    const setCookie = response.headers.get('set-cookie') ?? '';
    expect(setCookie).toContain('dragon_refresh=');
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toContain('Path=/api/v1/auth');
    expect(setCookie).toContain('SameSite=Strict');
  });

  it('rejects wrong password safely', async () => {
    authService.login.mockRejectedValueOnce(
      new UnauthorizedException('Invalid phone or password.'),
    );

    const response = await fetch(`${await app.getUrl()}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        phone: '+989120000000',
        password: 'wrong-password',
      }),
    });

    expect(response.status).toBe(401);
    const body = (await response.json()) as { message?: string };

    expect(body.message).toBe('Invalid phone or password.');
    expect(JSON.stringify(body)).not.toContain('wrong-password');
  });

  it('rejects blocked statuses safely', async () => {
    authService.login.mockRejectedValueOnce(
      new UnauthorizedException('Invalid phone or password.'),
    );

    const response = await fetch(`${await app.getUrl()}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        phone: '+989120000000',
        password: 'correct-password',
      }),
    });

    expect(response.status).toBe(401);
    const body = (await response.json()) as { message?: string };

    expect(body.message).toBe('Invalid phone or password.');
  });

  it('rejects unknown fields', async () => {
    const response = await fetch(`${await app.getUrl()}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        phone: '+989120000000',
        password: 'correct-password',
        role: 'admin',
      }),
    });

    expect(response.status).toBe(400);
    expect(authService.login).not.toHaveBeenCalled();
  });
});
