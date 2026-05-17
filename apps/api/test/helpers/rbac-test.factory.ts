import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { UnauthorizedException } from '@nestjs/common';
import type { AuthenticatedRequest } from '../../src/auth/guards/authenticated-request';

export const RBAC_TEST_IDS = {
  adminUserId: '64f000000000000000000001',
  normalUserId: '64f000000000000000000002',
  roleId: '64f000000000000000000101',
  systemRoleId: '64f000000000000000000102',
  inactiveRoleId: '64f000000000000000000103',
  nonAssignableRoleId: '64f000000000000000000104',
  permissionId: '64f000000000000000000201',
  userRoleId: '64f000000000000000000301',
} as const;

export const RBAC_TEST_TOKENS = {
  superAdmin: 'Bearer rbac-super-admin-token',
  noPermission: 'Bearer rbac-no-permission-token',
  inactiveRole: 'Bearer rbac-inactive-role-token',
  expiredRole: 'Bearer rbac-expired-role-token',
} as const;

export class RbacTestAccessTokenGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers?.authorization;

    if (!authorization || Array.isArray(authorization)) {
      throw new UnauthorizedException('Authentication is required.');
    }

    const userId = resolveUserIdFromAuthorization(authorization);

    if (!userId) {
      throw new UnauthorizedException('Authentication is required.');
    }

    request.auth = {
      userId,
      sessionId: '64f000000000000000000401',
      accessTokenJti: 'rbac-test-jti',
    };

    return true;
  }
}

function resolveUserIdFromAuthorization(authorization: string): string | undefined {
  switch (authorization) {
    case RBAC_TEST_TOKENS.superAdmin:
      return RBAC_TEST_IDS.adminUserId;
    case RBAC_TEST_TOKENS.noPermission:
    case RBAC_TEST_TOKENS.inactiveRole:
    case RBAC_TEST_TOKENS.expiredRole:
      return RBAC_TEST_IDS.normalUserId;
    default:
      return undefined;
  }
}

export function createRbacPermissionResolverMock() {
  return {
    resolveUserPermissions: jest.fn(async (input: { readonly userId: string }) => {
      if (input.userId === RBAC_TEST_IDS.adminUserId) {
        return {
          permissionKeys: [],
          roleKeys: ['super_admin'],
          isSuperAdmin: true,
        };
      }

      return {
        permissionKeys: [],
        roleKeys: [],
        isSuperAdmin: false,
      };
    }),
  };
}

export function createRbacRoleDocument(overrides: Record<string, unknown> = {}) {
  return {
    _id: RBAC_TEST_IDS.roleId,
    key: 'custom_admin',
    name: 'Custom Admin',
    description: 'Custom admin role for tests',
    isSystem: false,
    isAssignable: true,
    isActive: true,
    createdAt: new Date('2030-01-01T00:00:00.000Z'),
    updatedAt: new Date('2030-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

export function createRbacPermissionDocument(overrides: Record<string, unknown> = {}) {
  return {
    _id: RBAC_TEST_IDS.permissionId,
    key: 'rbac.role.read',
    module: 'rbac',
    resource: 'role',
    action: 'read',
    description: 'Read roles',
    isSystem: true,
    createdAt: new Date('2030-01-01T00:00:00.000Z'),
    updatedAt: new Date('2030-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

export function createRbacUserRoleDocument(overrides: Record<string, unknown> = {}) {
  return {
    _id: RBAC_TEST_IDS.userRoleId,
    userId: RBAC_TEST_IDS.normalUserId,
    roleId: RBAC_TEST_IDS.roleId,
    scopeType: 'organization',
    scopeId: 'org-1',
    assignedBy: RBAC_TEST_IDS.adminUserId,
    assignedAt: new Date('2030-01-01T00:00:00.000Z'),
    createdAt: new Date('2030-01-01T00:00:00.000Z'),
    updatedAt: new Date('2030-01-01T00:00:00.000Z'),
    ...overrides,
  };
}
