/* global afterEach, beforeEach, describe, expect, fetch, it, jest */
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { AccessTokenGuard } from '../src/auth/guards/access-token.guard';
import { createRegisterSuccessResponse } from './helpers/auth-test.factory';

describe('POST /api/v1/auth/register', () => {
  let app: INestApplication;
  const authService = {
    register: jest.fn().mockResolvedValue(createRegisterSuccessResponse()),
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

  it('returns generic success', async () => {
    const response = await fetch(`${await app.getUrl()}/api/v1/auth/register`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        phone: '+989120000000',
        password: 'strong-pass',
      }),
    });

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual(createRegisterSuccessResponse());
    expect(authService.register).toHaveBeenCalledWith(
      { phone: '+989120000000', password: 'strong-pass' },
      expect.any(Object),
    );
  });

  it('rejects unknown fields', async () => {
    const response = await fetch(`${await app.getUrl()}/api/v1/auth/register`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        phone: '+989120000000',
        password: 'strong-pass',
        email: 'not-accepted@example.test',
      }),
    });

    expect(response.status).toBe(400);
    expect(authService.register).not.toHaveBeenCalled();
  });
});
