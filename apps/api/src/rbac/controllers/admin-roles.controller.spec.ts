import { ConflictException } from '@nestjs/common';
import { AdminRolesController } from './admin-roles.controller';

const roleId = '64f000000000000000000001';
const permissionId = '64f000000000000000000002';

describe('AdminRolesController', () => {
  it('validates create role body and delegates to role service', async () => {
    const controller = new AdminRolesController(
      {
        createAdminRole: jest.fn().mockResolvedValue({
          _id: roleId,
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
      id: roleId,
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

    await expect(controller.deactivateRole(roleId)).rejects.toThrow(ConflictException);
  });

  it('returns 409 and does not attach permissions to system roles', async () => {
    const attachPermission = jest.fn();
    const controller = new AdminRolesController(
      {
        findMutableAdminRoleById: jest
          .fn()
          .mockRejectedValue(
            new ConflictException('System role permission mappings are seed-owned.'),
          ),
      } as never,
      { findById: jest.fn() } as never,
      { attachPermission } as never,
    );

    await expect(controller.attachPermission(roleId, { permissionId })).rejects.toThrow(
      ConflictException,
    );
    expect(attachPermission).not.toHaveBeenCalled();
  });

  it('returns 409 and does not detach permissions from system roles', async () => {
    const detachPermission = jest.fn();
    const controller = new AdminRolesController(
      {
        findMutableAdminRoleById: jest
          .fn()
          .mockRejectedValue(
            new ConflictException('System role permission mappings are seed-owned.'),
          ),
      } as never,
      { findById: jest.fn() } as never,
      { detachPermission } as never,
    );

    await expect(controller.detachPermission(roleId, permissionId)).rejects.toThrow(
      ConflictException,
    );
    expect(detachPermission).not.toHaveBeenCalled();
  });

  it('attaches permission to active non-system role', async () => {
    const attachPermission = jest.fn().mockResolvedValue({ _id: 'mapping-1' });
    const controller = new AdminRolesController(
      { findMutableAdminRoleById: jest.fn().mockResolvedValue({ _id: roleId }) } as never,
      { findById: jest.fn().mockResolvedValue({ _id: permissionId }) } as never,
      { attachPermission } as never,
    );

    await expect(controller.attachPermission(roleId, { permissionId })).resolves.toEqual({
      success: true,
      message: 'Permission attached to role.',
    });
    expect(attachPermission).toHaveBeenCalledWith({ roleId, permissionId });
  });

  it('detaches permission from active non-system role', async () => {
    const detachPermission = jest.fn().mockResolvedValue({ _id: 'mapping-1' });
    const controller = new AdminRolesController(
      { findMutableAdminRoleById: jest.fn().mockResolvedValue({ _id: roleId }) } as never,
      { findById: jest.fn().mockResolvedValue({ _id: permissionId }) } as never,
      { detachPermission } as never,
    );

    await expect(controller.detachPermission(roleId, permissionId)).resolves.toEqual({
      success: true,
      message: 'Permission detached from role.',
    });
    expect(detachPermission).toHaveBeenCalledWith({ roleId, permissionId });
  });
});
