/* global describe, expect, it, jest */
import { AuthController } from './auth.controller';
import {
  createGenericAuthResponse,
  LOGOUT_ALL_GENERIC_MESSAGE,
  LOGOUT_GENERIC_MESSAGE,
  FORGOT_PASSWORD_GENERIC_MESSAGE,
  RESET_PASSWORD_GENERIC_MESSAGE,
  REVOKE_SESSION_GENERIC_MESSAGE,
  VERIFY_PHONE_GENERIC_MESSAGE,
} from './dto/auth-response.dto';
import { AuthService } from './auth.service';

const verifyPhoneResponse = createGenericAuthResponse(VERIFY_PHONE_GENERIC_MESSAGE);
const tokenResponse = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  tokenType: 'Bearer' as const,
  expiresIn: 900,
};

describe('AuthController', () => {
  function createController() {
    const authService = {
      register: jest.fn().mockResolvedValue(createGenericAuthResponse()),
      verifyPhone: jest.fn().mockResolvedValue(verifyPhoneResponse),
      login: jest.fn().mockResolvedValue(tokenResponse),
      refresh: jest.fn().mockResolvedValue(tokenResponse),
      forgotPassword: jest
        .fn()
        .mockResolvedValue(createGenericAuthResponse(FORGOT_PASSWORD_GENERIC_MESSAGE)),
      verifyResetOtp: jest.fn().mockResolvedValue({ resetToken: 'reset-token' }),
      resetPassword: jest
        .fn()
        .mockResolvedValue(createGenericAuthResponse(RESET_PASSWORD_GENERIC_MESSAGE)),
      logout: jest.fn().mockResolvedValue(createGenericAuthResponse(LOGOUT_GENERIC_MESSAGE)),
      logoutAll: jest.fn().mockResolvedValue(createGenericAuthResponse(LOGOUT_ALL_GENERIC_MESSAGE)),
      listCurrentUserSessions: jest.fn().mockResolvedValue({
        sessions: [
          {
            id: 'session-1',
            deviceName: 'Laptop',
            expiresAt: '2026-02-01T00:00:00.000Z',
            createdAt: '2026-01-01T00:00:00.000Z',
            isCurrent: true,
          },
        ],
      }),
      revokeCurrentUserSession: jest
        .fn()
        .mockResolvedValue(createGenericAuthResponse(REVOKE_SESSION_GENERIC_MESSAGE)),
      getCurrentAuthIdentity: jest.fn().mockResolvedValue({
        user: {
          id: 'user-1',
          phoneVerified: true,
          status: 'active',
          phoneMasked: '***00',
        },
      }),
    } as unknown as jest.Mocked<AuthService>;

    return {
      authService,
      controller: new AuthController(authService),
    };
  }

  it('parses the register payload and returns the generic response', async () => {
    const { authService, controller } = createController();

    const response = await controller.register({
      phone: '+98 912 000 0000',
      password: 'strong-pass',
    });

    expect(authService.register).toHaveBeenCalledWith({
      phone: '+98 912 000 0000',
      password: 'strong-pass',
    });
    expect(response).toEqual(createGenericAuthResponse());
  });

  it('parses the verify-phone payload and returns the generic response', async () => {
    const { authService, controller } = createController();

    const response = await controller.verifyPhone({
      phone: '+98 912 000 0000',
      code: '123456',
    });

    expect(authService.verifyPhone).toHaveBeenCalledWith({
      phone: '+98 912 000 0000',
      code: '123456',
    });
    expect(response).toEqual(verifyPhoneResponse);
  });

  it('parses the login payload and returns token response', async () => {
    const { authService, controller } = createController();

    const response = await controller.login({
      phone: '+98 912 000 0000',
      password: 'correct-password',
      deviceId: 'device-1',
    });

    expect(authService.login).toHaveBeenCalledWith({
      phone: '+98 912 000 0000',
      password: 'correct-password',
      deviceId: 'device-1',
    });
    expect(response).toEqual(tokenResponse);
  });

  it('parses the refresh payload and returns token response', async () => {
    const { authService, controller } = createController();

    const response = await controller.refresh({
      refreshToken: 'raw-refresh-token',
    });

    expect(authService.refresh).toHaveBeenCalledWith({
      refreshToken: 'raw-refresh-token',
    });
    expect(response).toEqual(tokenResponse);
  });

  it('parses the forgot-password payload and returns generic response', async () => {
    const { authService, controller } = createController();

    const response = await controller.forgotPassword({ phone: '+98 912 000 0000' });

    expect(authService.forgotPassword).toHaveBeenCalledWith({ phone: '+98 912 000 0000' });
    expect(response).toEqual(createGenericAuthResponse(FORGOT_PASSWORD_GENERIC_MESSAGE));
  });

  it('parses the verify-reset-otp payload and returns a reset token', async () => {
    const { authService, controller } = createController();

    const response = await controller.verifyResetOtp({
      phone: '+98 912 000 0000',
      code: '123456',
    });

    expect(authService.verifyResetOtp).toHaveBeenCalledWith({
      phone: '+98 912 000 0000',
      code: '123456',
    });
    expect(response).toEqual({ resetToken: 'reset-token' });
  });

  it('parses the reset-password payload and returns generic response', async () => {
    const { authService, controller } = createController();

    const response = await controller.resetPassword({
      resetToken: 'reset-token',
      newPassword: 'new-strong-password',
    });

    expect(authService.resetPassword).toHaveBeenCalledWith({
      resetToken: 'reset-token',
      newPassword: 'new-strong-password',
    });
    expect(response).toEqual(createGenericAuthResponse(RESET_PASSWORD_GENERIC_MESSAGE));
  });

  it('parses empty logout payload and returns generic response', async () => {
    const { authService, controller } = createController();
    const authContext = { userId: 'user-1', sessionId: 'session-1', accessTokenJti: 'jti-1' };

    const response = await controller.logout(authContext, {});

    expect(authService.logout).toHaveBeenCalledWith(authContext);
    expect(response).toEqual(createGenericAuthResponse(LOGOUT_GENERIC_MESSAGE));
  });

  it('parses empty logout-all payload and returns generic response', async () => {
    const { authService, controller } = createController();
    const authContext = { userId: 'user-1', sessionId: 'session-1', accessTokenJti: 'jti-1' };

    const response = await controller.logoutAll(authContext, {});

    expect(authService.logoutAll).toHaveBeenCalledWith(authContext);
    expect(response).toEqual(createGenericAuthResponse(LOGOUT_ALL_GENERIC_MESSAGE));
  });

  it('returns minimal /me identity for authenticated context', async () => {
    const { authService, controller } = createController();
    const authContext = { userId: 'user-1', sessionId: 'session-1', accessTokenJti: 'jti-1' };

    const response = await controller.me(authContext);

    expect(authService.getCurrentAuthIdentity).toHaveBeenCalledWith(authContext);
    expect(response).toEqual({
      user: {
        id: 'user-1',
        phoneVerified: true,
        status: 'active',
        phoneMasked: '***00',
      },
    });
    expect(JSON.stringify(response)).not.toContain('passwordHash');
    expect(JSON.stringify(response)).not.toContain('roles');
    expect(JSON.stringify(response)).not.toContain('permissions');
    expect(JSON.stringify(response)).not.toContain('profile');
    expect(JSON.stringify(response)).not.toContain('session');
    expect(JSON.stringify(response)).not.toContain('jti');
  });

  it('returns only current-user session summaries for authenticated context', async () => {
    const { authService, controller } = createController();
    const authContext = { userId: 'user-1', sessionId: 'session-1', accessTokenJti: 'jti-1' };

    const response = await controller.sessions(authContext);

    expect(authService.listCurrentUserSessions).toHaveBeenCalledWith(authContext);
    expect(response).toEqual({
      sessions: [
        {
          id: 'session-1',
          deviceName: 'Laptop',
          expiresAt: '2026-02-01T00:00:00.000Z',
          createdAt: '2026-01-01T00:00:00.000Z',
          isCurrent: true,
        },
      ],
    });
    expect(JSON.stringify(response)).not.toContain('refreshTokenHash');
    expect(JSON.stringify(response)).not.toContain('accessTokenJti');
    expect(JSON.stringify(response)).not.toContain('roles');
    expect(JSON.stringify(response)).not.toContain('permissions');
    expect(JSON.stringify(response)).not.toContain('profile');
  });

  it('revokes one current-user session by id', async () => {
    const { authService, controller } = createController();
    const authContext = { userId: 'user-1', sessionId: 'session-1', accessTokenJti: 'jti-1' };

    const response = await controller.revokeSession(authContext, '507f1f77bcf86cd799439011');

    expect(authService.revokeCurrentUserSession).toHaveBeenCalledWith(
      authContext,
      '507f1f77bcf86cd799439011',
    );
    expect(response).toEqual(createGenericAuthResponse(REVOKE_SESSION_GENERIC_MESSAGE));
  });
});
