import { ConflictException } from '@nestjs/common';
import { AdminRolesController } from './admin-roles.controller';

const objectId = '64f000000000000000000001';

describe('AdminRolesController', () => {
  it('validates create role body and delegates to role service', async () => {
    const controller = new AdminRolesController(
      {
        createAdminRole: jest.fn().mockResolvedValue({
          _id: objectId,
          key: 'editor',
          name: 'Editor',
          isSystem: false,
          isAssignable: true,
          isActive: true,
        }),
      } as never,
      {} as never,
      {} as never,
    );

    await expect(controller.createRole({ key: 'editor', name: 'Editor' })).resolves.toMatchObject({
      id: objectId,
      key: 'editor',
      isSystem: false,
    });
  });

  it('rejects internal role create fields before service mutation', async () => {
    const controller = new AdminRolesController(
      { createAdminRole: jest.fn() } as never,
      {} as never,
      {} as never,
    );

    await expect(
      controller.createRole({
        key: 'editor',
        name: 'Editor',
        isSystem: true,
      } as never),
    ).rejects.toThrow();
  });

  it('surfaces system-role protection from service', async () => {
    const controller = new AdminRolesController(
      {
        deactivateAdminRole: jest
          .fn()
          .mockRejectedValue(new ConflictException('System role cannot be deactivated.')),
      } as never,
      {} as never,
      {} as never,
    );

    await expect(controller.deactivateRole(objectId)).rejects.toThrow(ConflictException);
  });
});
