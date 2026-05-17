/* global afterEach, beforeEach, describe, expect, fetch, it, jest */
import type {
  CanActivate,
  ExecutionContext,
  INestApplication,
} from "@nestjs/common";
import { BadRequestException, UnauthorizedException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { AuthController } from "../src/auth/auth.controller";
import { AuthService } from "../src/auth/auth.service";
import { createGenericAuthResponse } from "../src/auth/dto/auth-response.dto";
import { AccessTokenGuard } from "../src/auth/guards/access-token.guard";
import type { AuthenticatedRequest } from "../src/auth/guards/authenticated-request";
import {
  expectGenericSuccessResponse,
  expectNoSensitiveAuthFields,
  expectNoTokenResponse,
} from "./helpers/security-assertions.helper";

class RejectingGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (request.headers?.authorization !== "Bearer valid-access-token") {
      throw new UnauthorizedException("Authentication is required.");
    }

    request.auth = {
      userId: "user-1",
      sessionId: "session-1",
      accessTokenJti: "jti-1",
    };

    return true;
  }
}

describe("auth security regression", () => {
  let app: INestApplication;
  const authService = {
    register: jest.fn().mockResolvedValue(createGenericAuthResponse()),
    verifyPhone: jest
      .fn()
      .mockRejectedValue(
        new BadRequestException("Phone verification could not be completed."),
      ),
    login: jest
      .fn()
      .mockRejectedValue(
        new UnauthorizedException("Invalid phone or password."),
      ),
    refresh: jest
      .fn()
      .mockRejectedValue(new UnauthorizedException("Invalid refresh token.")),
    forgotPassword: jest
      .fn()
      .mockResolvedValue(
        createGenericAuthResponse(
          "If the phone is eligible, a password reset code will be sent.",
        ),
      ),
    verifyResetOtp: jest
      .fn()
      .mockRejectedValue(
        new BadRequestException("Password reset could not be completed."),
      ),
    resetPassword: jest
      .fn()
      .mockResolvedValue(
        createGenericAuthResponse("Password reset completed."),
      ),
    logout: jest.fn(),
    logoutAll: jest.fn(),
    getCurrentAuthIdentity: jest.fn().mockResolvedValue({
      user: { id: "user-1", phoneVerified: true, status: "active" },
    }),
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
      .useClass(RejectingGuard)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
    await app.listen(0);
  });

  afterEach(async () => {
    await app.close();
  });

  it("keeps registration generic and rejects unknown fields", async () => {
    const baseUrl = await app.getUrl();
    const response = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        phone: "+98 912 000 0000",
        password: "strong-pass",
      }),
    });

    expect(response.status).toBe(201);
    expectGenericSuccessResponse(await response.json());

    const unknownFieldResponse = await fetch(
      `${baseUrl}/api/v1/auth/register`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          phone: "+98 912 000 0000",
          password: "strong-pass",
          role: "admin",
        }),
      },
    );

    expect(unknownFieldResponse.status).toBe(400);
  });

  it("does not leak OTP, hashes, profile, roles, permissions, or token internals in error responses", async () => {
    const baseUrl = await app.getUrl();
    const response = await fetch(`${baseUrl}/api/v1/auth/verify-phone`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ phone: "+989120000000", code: "000000" }),
    });

    expect(response.status).toBe(400);
    expectNoTokenResponse(await response.json());
  });

  it("rejects login for blocked or unknown users without tokens or sessions", async () => {
    const response = await fetch(`${await app.getUrl()}/api/v1/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        phone: "+989120000000",
        password: "wrong-password",
      }),
    });

    expect(response.status).toBe(401);
    expectNoTokenResponse(await response.json());
  });

  it("returns minimal /me identity only", async () => {
    const response = await fetch(`${await app.getUrl()}/api/v1/auth/me`, {
      method: "GET",
      headers: { authorization: "Bearer valid-access-token" },
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({
      user: { id: "user-1", phoneVerified: true, status: "active" },
    });
    expectNoSensitiveAuthFields(body);
  });
});
