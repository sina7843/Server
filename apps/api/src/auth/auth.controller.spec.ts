/* global describe, expect, it, jest */
import { AuthController } from './auth.controller';
import {
  createGenericAuthResponse,
  LOGOUT_ALL_GENERIC_MESSAGE,
  LOGOUT_GENERIC_MESSAGE,
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
      logout: jest.fn().mockResolvedValue(createGenericAuthResponse(LOGOUT_GENERIC_MESSAGE)),
      logoutAll: jest.fn().mockResolvedValue(createGenericAuthResponse(LOGOUT_ALL_GENERIC_MESSAGE)),
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
});
