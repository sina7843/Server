import { NotFoundException } from '@nestjs/common';
import { AdminUserRolesController } from './admin-user-roles.controller';

const userId = '64f000000000000000000001';
const roleId = '64f000000000000000000002';
const userRoleId = '64f000000000000000000003';

describe('AdminUserRolesController', () => {
  it('assigns role to existing user with assignable active role', async () => {
    const controller = new AdminUserRolesController(
      { findById: jest.fn().mockResolvedValue({ _id: userId, status: 'active' }) } as never,
      {
        findById: jest
          .fn()
          .mockResolvedValue({ _id: roleId, isActive: true, isAssignable: true }),
      } as never,
      {
        assignRole: jest.fn().mockResolvedValue({
          _id: userRoleId,
          userId,
          roleId,
          assignedBy: userId,
          assignedAt: new Date('2030-01-01T00:00:00.000Z'),
        }),
      } as never,
    );

    await expect(
      controller.assignUserRole(
        userId,
        { roleId },
        { userId, sessionId: 'session', accessTokenJti: 'jti' },
      ),
    ).resolves.toMatchObject({ id: userRoleId, userId, roleId });
  });

  it('rejects inactive or non-assignable roles', async () => {
    const controller = new AdminUserRolesController(
      { findById: jest.fn().mockResolvedValue({ _id: userId, status: 'active' }) } as never,
      {
        findById: jest
          .fn()
          .mockResolvedValue({ _id: roleId, isActive: true, isAssignable: false }),
      } as never,
      {} as never,
    );

    await expect(
      controller.assignUserRole(
        userId,
        { roleId },
        { userId, sessionId: 'session', accessTokenJti: 'jti' },
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('removes only target user assignment', async () => {
    const removeUserRoleForUser = jest.fn().mockResolvedValue({ _id: userRoleId });
    const controller = new AdminUserRolesController(
      {} as never,
      {} as never,
      { removeUserRoleForUser } as never,
    );

    await controller.removeUserRole(userId, userRoleId);

    expect(removeUserRoleForUser).toHaveBeenCalledWith(userId, userRoleId);
  });
});
