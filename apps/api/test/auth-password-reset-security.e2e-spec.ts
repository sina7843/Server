/* global afterEach, beforeEach, describe, expect, fetch, it, jest */
import type { INestApplication } from '@nestjs/common';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { AccessTokenGuard } from '../src/auth/guards/access-token.guard';
import {
  createGenericAuthResponse,
  FORGOT_PASSWORD_GENERIC_MESSAGE,
  RESET_PASSWORD_GENERIC_MESSAGE,
} from '../src/auth/dto/auth-response.dto';
import {
  expectGenericSuccessResponse,
  expectNoSensitiveAuthFields,
  expectNoTokenResponse,
} from './helpers/security-assertions.helper';

const verifyResetOtpResponse = {
  resetToken: 'short-lived-reset-token',
};

describe('auth password reset security regression', () => {
  let app: INestApplication;
  const authService = {
    register: jest.fn(),
    verifyPhone: jest.fn(),
    login: jest.fn().mockRejectedValue(new UnauthorizedException('Invalid phone or password.')),
    refresh: jest.fn().mockRejectedValue(new UnauthorizedException('Invalid refresh token.')),
    logout: jest.fn(),
    logoutAll: jest.fn(),
    forgotPassword: jest
      .fn()
      .mockResolvedValue(createGenericAuthResponse(FORGOT_PASSWORD_GENERIC_MESSAGE)),
    verifyResetOtp: jest.fn().mockResolvedValue(verifyResetOtpResponse),
    resetPassword: jest
      .fn()
      .mockResolvedValue(createGenericAuthResponse(RESET_PASSWORD_GENERIC_MESSAGE)),
    getCurrentAuthIdentity: jest.fn(),
    listCurrentUserSessions: jest.fn(),
    revokeCurrentUserSession: jest.fn(),
  } as unknown as jest.Mocked<AuthService>;

  beforeEach(async () => {
    jest.clearAllMocks();
    authService.forgotPassword.mockResolvedValue(
      createGenericAuthResponse(FORGOT_PASSWORD_GENERIC_MESSAGE),
    );
    authService.verifyResetOtp.mockResolvedValue(verifyResetOtpResponse);
    authService.resetPassword.mockResolvedValue(
      createGenericAuthResponse(RESET_PASSWORD_GENERIC_MESSAGE),
    );

    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
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

  it('forgot-password returns the same generic response for eligible and unknown phones', async () => {
    const baseUrl = await app.getUrl();
    const knownResponse = await fetch(`${baseUrl}/api/v1/auth/password/forgot`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ phone: '+989120000000' }),
    });
    const unknownResponse = await fetch(`${baseUrl}/api/v1/auth/password/forgot`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ phone: '+989129999999' }),
    });

    expect(knownResponse.status).toBe(201);
    expect(unknownResponse.status).toBe(201);
    expect(await knownResponse.json()).toEqual(await unknownResponse.json());
  });

  it('verify-reset-otp returns only a reset token and never OTP internals', async () => {
    const response = await fetch(`${await app.getUrl()}/api/v1/auth/password/verify-reset-otp`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ phone: '+989120000000', code: '123456' }),
    });

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body).toEqual(verifyResetOtpResponse);
    expectNoSensitiveAuthFields(body);
    expect(JSON.stringify(body)).not.toContain('codeHash');
  });

  it('invalid or consumed reset OTP fails safely without leaking account state', async () => {
    authService.verifyResetOtp.mockRejectedValueOnce(
      new BadRequestException('Password reset could not be completed.'),
    );

    const response = await fetch(`${await app.getUrl()}/api/v1/auth/password/verify-reset-otp`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ phone: '+989120000000', code: '000000' }),
    });

    expect(response.status).toBe(400);
    expectNoTokenResponse(await response.json());
  });

  it('reset-password returns generic success without auto-login tokens', async () => {
    const response = await fetch(`${await app.getUrl()}/api/v1/auth/password/reset`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        resetToken: 'short-lived-reset-token',
        newPassword: 'new-strong-pass',
      }),
    });

    expect(response.status).toBe(201);
    expectGenericSuccessResponse(await response.json());
  });

  it('old password and previous refresh token fail safely after reset', async () => {
    const baseUrl = await app.getUrl();
    const loginResponse = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        phone: '+989120000000',
        password: 'old-password',
      }),
    });
    const refreshResponse = await fetch(`${baseUrl}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: 'dragon_refresh=previous-refresh-token',
      },
    });

    expect(loginResponse.status).toBe(401);
    expect(refreshResponse.status).toBe(401);
    expectNoTokenResponse(await loginResponse.json());
    expectNoTokenResponse(await refreshResponse.json());
  });
});
