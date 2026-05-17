/* global afterEach, beforeEach, describe, expect, fetch, it, jest */
import type { INestApplication } from '@nestjs/common';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import {
  createForgotPasswordSuccessResponse,
  createResetPasswordSuccessResponse,
} from './helpers/auth-test.factory';

describe('password reset auth routes', () => {
  let app: INestApplication;
  const authService = {
    forgotPassword: jest.fn().mockResolvedValue(createForgotPasswordSuccessResponse()),
    verifyResetOtp: jest.fn().mockResolvedValue({ resetToken: 'reset-token' }),
    resetPassword: jest.fn().mockResolvedValue(createResetPasswordSuccessResponse()),
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

  it('POST /api/v1/auth/password/forgot returns generic success', async () => {
    const response = await fetch(`${await app.getUrl()}/api/v1/auth/password/forgot`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ phone: '+989120000000' }),
    });

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual(createForgotPasswordSuccessResponse());
  });

  it('forgot-password does not reveal unknown phone', async () => {
    authService.forgotPassword.mockResolvedValueOnce(createForgotPasswordSuccessResponse());

    const response = await fetch(`${await app.getUrl()}/api/v1/auth/password/forgot`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ phone: '+989120000001' }),
    });

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual(createForgotPasswordSuccessResponse());
  });

  it('verify-reset-otp returns resetToken for valid OTP', async () => {
    const response = await fetch(`${await app.getUrl()}/api/v1/auth/password/verify-reset-otp`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ phone: '+989120000000', code: '123456' }),
    });

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ resetToken: 'reset-token' });
  });

  it('verify-reset-otp rejects invalid code safely', async () => {
    authService.verifyResetOtp.mockRejectedValueOnce(
      new BadRequestException('Password reset verification could not be completed.'),
    );

    const response = await fetch(`${await app.getUrl()}/api/v1/auth/password/verify-reset-otp`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ phone: '+989120000000', code: '000000' }),
    });

    expect(response.status).toBe(400);
    const body = (await response.json()) as { message?: string };

    expect(body.message).toBe('Password reset verification could not be completed.');
    expect(JSON.stringify(body)).not.toContain('000000');
  });

  it('reset-password changes password through service response', async () => {
    const response = await fetch(`${await app.getUrl()}/api/v1/auth/password/reset`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ resetToken: 'reset-token', newPassword: 'new-strong-password' }),
    });

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual(createResetPasswordSuccessResponse());
  });

  it('reset-password rejects invalid reset token safely', async () => {
    authService.resetPassword.mockRejectedValueOnce(
      new UnauthorizedException('Password reset could not be completed.'),
    );

    const response = await fetch(`${await app.getUrl()}/api/v1/auth/password/reset`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ resetToken: 'bad-reset-token', newPassword: 'new-strong-password' }),
    });

    expect(response.status).toBe(401);
    const body = (await response.json()) as { message?: string };

    expect(body.message).toBe('Password reset could not be completed.');
    expect(JSON.stringify(body)).not.toContain('bad-reset-token');
  });

  it('rejects unknown fields', async () => {
    const response = await fetch(`${await app.getUrl()}/api/v1/auth/password/reset`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        resetToken: 'reset-token',
        newPassword: 'new-strong-password',
        role: 'admin',
      }),
    });

    expect(response.status).toBe(400);
    expect(authService.resetPassword).not.toHaveBeenCalled();
  });
});
