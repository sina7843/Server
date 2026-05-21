import { AdminAuthController } from './admin-auth.controller';
import type { AuthContext } from '../auth/guards/authenticated-request';

const authContext: AuthContext = {
  userId: 'admin-user-1',
  sessionId: 'session-1',
  accessTokenJti: 'jti-1',
};

function createController() {
  const authService = {
    getCurrentAuthIdentity: jest.fn().mockResolvedValue({
      user: {
        id: 'admin-user-1',
        phoneVerified: true,
        status: 'active',
        phoneMasked: '***00',
      },
    }),
  };

  return { authService, controller: new AdminAuthController(authService as never) };
}

describe('AdminAuthController', () => {
  it('returns minimal admin identity from GET /admin/v1/auth/me', async () => {
    const { controller, authService } = createController();

    const response = await controller.me(authContext);

    expect(authService.getCurrentAuthIdentity).toHaveBeenCalledWith(authContext);
    expect(response.user.id).toBe('admin-user-1');
    expect(response.user.status).toBe('active');
    expect(response.user.phoneVerified).toBe(true);
  });

  it('response does not contain sensitive fields', async () => {
    const { controller } = createController();

    const response = await controller.me(authContext);
    const serialized = JSON.stringify(response);

    expect(serialized).not.toContain('passwordHash');
    expect(serialized).not.toContain('refreshTokenHash');
    expect(serialized).not.toContain('statusReason');
    expect(serialized).not.toContain('sessionId');
    expect(serialized).not.toContain('roles');
    expect(serialized).not.toContain('permissions');
  });

  it('does not expose login, register, or bypass methods', () => {
    const { controller } = createController();

    expect('login' in controller).toBe(false);
    expect('register' in controller).toBe(false);
    expect('bypassPermission' in controller).toBe(false);
  });

  it('delegates to authService.getCurrentAuthIdentity', async () => {
    const { controller, authService } = createController();

    await controller.me(authContext);

    expect(authService.getCurrentAuthIdentity).toHaveBeenCalledTimes(1);
    expect(authService.getCurrentAuthIdentity).toHaveBeenCalledWith(authContext);
  });
});
