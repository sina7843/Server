import { AdminAuthController } from './admin-auth.controller';
import type { AuthContext } from '../auth/guards/authenticated-request';

const authContext: AuthContext = {
  userId: 'admin-user-1',
  sessionId: 'session-1',
  accessTokenJti: 'jti-1',
};

function createController(
  overrides: {
    isSuperAdmin?: boolean;
    permissionKeys?: string[];
  } = {},
) {
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

  const permissionResolverService = {
    resolveUserPermissions: jest.fn().mockResolvedValue({
      permissionKeys: overrides.permissionKeys ?? ['admin.dashboard.view'],
      roleKeys: ['admin'],
      isSuperAdmin: overrides.isSuperAdmin ?? false,
    }),
  };

  return {
    authService,
    permissionResolverService,
    controller: new AdminAuthController(authService as never, permissionResolverService as never),
  };
}

describe('AdminAuthController', () => {
  it('returns admin identity with permissions from GET /admin/v1/auth/me', async () => {
    const { controller, authService } = createController();

    const response = await controller.me(authContext);

    expect(authService.getCurrentAuthIdentity).toHaveBeenCalledWith(authContext);
    expect(response.user.id).toBe('admin-user-1');
    expect(response.user.status).toBe('active');
    expect(response.user.phoneVerified).toBe(true);
  });

  it('returns permissions array from resolved permissions', async () => {
    const { controller } = createController({
      permissionKeys: ['admin.dashboard.view', 'user.user.read'],
    });

    const response = await controller.me(authContext);

    expect(Array.isArray(response.permissions)).toBe(true);
    expect(response.permissions).toContain('admin.dashboard.view');
    expect(response.permissions).toContain('user.user.read');
  });

  it('returns isSuperAdmin: false for regular admin', async () => {
    const { controller } = createController({ isSuperAdmin: false });

    const response = await controller.me(authContext);

    expect(response.isSuperAdmin).toBe(false);
  });

  it('returns isSuperAdmin: true for super_admin user', async () => {
    const { controller } = createController({ isSuperAdmin: true });

    const response = await controller.me(authContext);

    expect(response.isSuperAdmin).toBe(true);
  });

  it('response does not contain sensitive fields', async () => {
    const { controller } = createController();

    const response = await controller.me(authContext);
    const serialized = JSON.stringify(response);

    expect(serialized).not.toContain('passwordHash');
    expect(serialized).not.toContain('refreshTokenHash');
    expect(serialized).not.toContain('statusReason');
    expect(serialized).not.toContain('sessionId');
    expect(serialized).not.toContain('roleKeys');
  });

  it('does not expose login, register, or bypass methods', () => {
    const { controller } = createController();

    expect('login' in controller).toBe(false);
    expect('register' in controller).toBe(false);
    expect('bypassPermission' in controller).toBe(false);
  });

  it('delegates to both authService and permissionResolverService in parallel', async () => {
    const { controller, authService, permissionResolverService } = createController();

    await controller.me(authContext);

    expect(authService.getCurrentAuthIdentity).toHaveBeenCalledTimes(1);
    expect(permissionResolverService.resolveUserPermissions).toHaveBeenCalledWith({
      userId: authContext.userId,
    });
  });

  it('super_admin receives all permission keys in response', async () => {
    const allPerms = ['admin.dashboard.view', 'user.user.read', 'rbac.role.read'];
    const { controller } = createController({
      isSuperAdmin: true,
      permissionKeys: allPerms,
    });

    const response = await controller.me(authContext);

    expect(response.isSuperAdmin).toBe(true);
    expect(response.permissions).toHaveLength(allPerms.length);
  });
});
