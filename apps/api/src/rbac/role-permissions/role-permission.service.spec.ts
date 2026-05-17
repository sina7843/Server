import { RolePermissionService } from './role-permission.service';

describe('RolePermissionService', () => {
  it('prevents duplicate role-permission attachment by returning existing mapping', async () => {
    const existing = { _id: 'existing' };
    const attachPermission = jest.fn();

    const service = new RolePermissionService({
      findByRolePermission: jest.fn().mockResolvedValue(existing),
      attachPermission,
    } as never);

    await expect(
      service.attachPermission({
        roleId: 'role-1',
        permissionId: 'permission-1',
      }),
    ).resolves.toBe(existing);

    expect(attachPermission).not.toHaveBeenCalled();
  });

  it('creates mapping when no existing mapping exists', async () => {
    const created = { _id: 'created' };
    const service = new RolePermissionService({
      findByRolePermission: jest.fn().mockResolvedValue(null),
      attachPermission: jest.fn().mockResolvedValue(created),
    } as never);

    await expect(
      service.attachPermission({
        roleId: 'role-1',
        permissionId: 'permission-1',
      }),
    ).resolves.toBe(created);
  });
});
