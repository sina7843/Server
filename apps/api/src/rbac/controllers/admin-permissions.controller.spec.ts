import { AdminPermissionsController } from './admin-permissions.controller';

describe('AdminPermissionsController', () => {
  it('lists permissions through list-only permission service', async () => {
    const controller = new AdminPermissionsController({
      listFiltered: jest.fn().mockResolvedValue([
        {
          _id: '64f000000000000000000001',
          key: 'rbac.role.read',
          module: 'rbac',
          resource: 'role',
          action: 'read',
          isSystem: true,
        },
      ]),
    } as never);

    await expect(controller.listPermissions('rbac')).resolves.toEqual({
      permissions: [
        {
          id: '64f000000000000000000001',
          key: 'rbac.role.read',
          module: 'rbac',
          resource: 'role',
          action: 'read',
          isSystem: true,
        },
      ],
    });
  });

  it('does not expose create/update/delete methods', () => {
    const controller = new AdminPermissionsController({} as never);

    expect('createPermission' in controller).toBe(false);
    expect('updatePermission' in controller).toBe(false);
    expect('deletePermission' in controller).toBe(false);
  });
});
