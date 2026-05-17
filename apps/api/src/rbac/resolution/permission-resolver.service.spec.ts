import { PermissionKeys } from '../registry/permission-keys';
import { PermissionResolverService } from './permission-resolver.service';

const role = (id: string, key: string, isActive = true) =>
  ({ _id: id, key, isActive }) as never;

const userRole = (roleId: string) => ({ roleId }) as never;

const permission = (id: string, key: string) => ({ _id: id, key }) as never;

describe('PermissionResolverService', () => {
  it('returns permission keys, not permission ids', async () => {
    const service = new PermissionResolverService(
      { findActiveByUserId: jest.fn().mockResolvedValue([userRole('role-1')]) } as never,
      { findById: jest.fn().mockResolvedValue(role('role-1', 'admin')) } as never,
      {
        findPermissionIdsByRoleIds: jest
          .fn()
          .mockResolvedValue(['permission-id-1']),
      } as never,
      {
        findById: jest
          .fn()
          .mockResolvedValue(permission('permission-id-1', 'rbac.role.read')),
      } as never,
    );

    await expect(
      service.resolveUserPermissions({ userId: 'user-1' }),
    ).resolves.toEqual({
      permissionKeys: ['rbac.role.read'],
      roleKeys: ['admin'],
      isSuperAdmin: false,
    });
  });

  it('grants all registered permission keys for active super_admin role', async () => {
    const service = new PermissionResolverService(
      {
        findActiveByUserId: jest.fn().mockResolvedValue([userRole('role-super')]),
      } as never,
      {
        findById: jest.fn().mockResolvedValue(role('role-super', 'super_admin')),
      } as never,
      { findPermissionIdsByRoleIds: jest.fn() } as never,
      { findById: jest.fn() } as never,
    );

    await expect(
      service.resolveUserPermissions({ userId: 'user-1' }),
    ).resolves.toEqual({
      permissionKeys: PermissionKeys,
      roleKeys: ['super_admin'],
      isSuperAdmin: true,
    });
  });

  it('ignores inactive roles', async () => {
    const service = new PermissionResolverService(
      { findActiveByUserId: jest.fn().mockResolvedValue([userRole('role-1')]) } as never,
      { findById: jest.fn().mockResolvedValue(role('role-1', 'admin', false)) } as never,
      { findPermissionIdsByRoleIds: jest.fn().mockResolvedValue([]) } as never,
      { findById: jest.fn() } as never,
    );

    await expect(
      service.resolveUserPermissions({ userId: 'user-1' }),
    ).resolves.toEqual({
      permissionKeys: [],
      roleKeys: [],
      isSuperAdmin: false,
    });
  });

  it('denies by default when user has no active assignments', async () => {
    const service = new PermissionResolverService(
      { findActiveByUserId: jest.fn().mockResolvedValue([]) } as never,
      { findById: jest.fn() } as never,
      { findPermissionIdsByRoleIds: jest.fn() } as never,
      { findById: jest.fn() } as never,
    );

    await expect(
      service.resolveUserPermissions({ userId: 'user-1' }),
    ).resolves.toEqual({
      permissionKeys: [],
      roleKeys: [],
      isSuperAdmin: false,
    });
  });
});
