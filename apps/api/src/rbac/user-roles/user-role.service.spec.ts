import { UserRoleService } from './user-role.service';

describe('UserRoleService', () => {
  it('prevents duplicate user-role assignment by returning existing assignment', async () => {
    const existing = { _id: 'existing' };
    const assignRole = jest.fn();

    const service = new UserRoleService({
      findByUserRoleAndScope: jest.fn().mockResolvedValue(existing),
      assignRole,
    } as never);

    await expect(
      service.assignRole({ userId: 'user-1', roleId: 'role-1' }),
    ).resolves.toBe(existing);

    expect(assignRole).not.toHaveBeenCalled();
  });

  it('creates assignment when no existing assignment exists', async () => {
    const created = { _id: 'created' };
    const service = new UserRoleService({
      findByUserRoleAndScope: jest.fn().mockResolvedValue(null),
      assignRole: jest.fn().mockResolvedValue(created),
    } as never);

    await expect(
      service.assignRole({
        userId: 'user-1',
        roleId: 'role-1',
        scopeType: 'organization',
        scopeId: 'org-1',
      }),
    ).resolves.toBe(created);
  });

  it('scopes removal by user id and assignment id', async () => {
    const removeUserRoleForUser = jest.fn().mockResolvedValue({ _id: 'role' });
    const service = new UserRoleService({
      removeUserRoleForUser,
    } as never);

    await service.removeUserRoleForUser('user-1', 'assignment-1');

    expect(removeUserRoleForUser).toHaveBeenCalledWith(
      'user-1',
      'assignment-1',
    );
  });
});
