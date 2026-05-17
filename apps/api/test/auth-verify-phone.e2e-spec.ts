/* global afterEach, beforeEach, describe, expect, fetch, it, jest */
import type { INestApplication } from '@nestjs/common';
import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { createVerifyPhoneSuccessResponse } from './helpers/auth-test.factory';

describe('POST /api/v1/auth/verify-phone', () => {
  let app: INestApplication;
  const authService = {
    register: jest.fn(),
    verifyPhone: jest.fn().mockResolvedValue(createVerifyPhoneSuccessResponse()),
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

  it('returns generic success for valid pending verification', async () => {
    const response = await fetch(`${await app.getUrl()}/api/v1/auth/verify-phone`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        phone: '+989120000000',
        code: '123456',
      }),
    });

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual(createVerifyPhoneSuccessResponse());
    expect(authService.verifyPhone).toHaveBeenCalledWith({
      phone: '+989120000000',
      code: '123456',
    });
  });

  it('rejects invalid code safely', async () => {
    authService.verifyPhone.mockRejectedValueOnce(
      new BadRequestException('Phone verification could not be completed.'),
    );

    const response = await fetch(`${await app.getUrl()}/api/v1/auth/verify-phone`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        phone: '+989120000000',
        code: '000000',
      }),
    });

    expect(response.status).toBe(400);
    const body = (await response.json()) as { message?: string };

    expect(body.message).toBe('Phone verification could not be completed.');
    expect(JSON.stringify(body)).not.toContain('000000');
  });

  it('rejects unknown fields', async () => {
    const response = await fetch(`${await app.getUrl()}/api/v1/auth/verify-phone`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        phone: '+989120000000',
        code: '123456',
        role: 'admin',
      }),
    });

    expect(response.status).toBe(400);
    expect(authService.verifyPhone).not.toHaveBeenCalled();
  });
});
