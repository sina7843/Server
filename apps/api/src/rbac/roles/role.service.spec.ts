import { ConflictException, NotFoundException } from '@nestjs/common';
import { RoleService } from './role.service';

const activeCustomRole = {
  _id: 'role-1',
  key: 'custom_admin',
  isSystem: false,
  isActive: true,
};

describe('RoleService admin protections', () => {
  it('rejects reserved base role keys through admin create', async () => {
    const service = new RoleService({ findByKey: jest.fn() } as never);

    await expect(
      service.createAdminRole({
        key: 'super_admin',
        name: 'Super Admin',
        isAssignable: false,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('rejects duplicate role keys', async () => {
    const service = new RoleService({
      findByKey: jest.fn().mockResolvedValue({ key: 'editor' }),
    } as never);

    await expect(service.createAdminRole({ key: 'editor', name: 'Editor' })).rejects.toThrow(
      ConflictException,
    );
  });

  it('rejects system role update', async () => {
    const service = new RoleService({
      findById: jest.fn().mockResolvedValue({ _id: 'role-1', isSystem: true }),
    } as never);

    await expect(service.updateAdminRole('role-1', { name: 'Updated' })).rejects.toThrow(
      ConflictException,
    );
  });

  it('rejects system role deactivation', async () => {
    const service = new RoleService({
      findById: jest.fn().mockResolvedValue({ _id: 'role-1', isSystem: true }),
    } as never);

    await expect(service.deactivateAdminRole('role-1')).rejects.toThrow(ConflictException);
  });

  it('returns active custom role for admin permission mapping changes', async () => {
    const service = new RoleService({
      findById: jest.fn().mockResolvedValue(activeCustomRole),
    } as never);

    await expect(service.findMutableAdminRoleById('role-1')).resolves.toBe(activeCustomRole);
  });

  it('rejects missing or inactive role for admin permission mapping changes', async () => {
    const missingService = new RoleService({
      findById: jest.fn().mockResolvedValue(null),
    } as never);
    const inactiveService = new RoleService({
      findById: jest.fn().mockResolvedValue({ isActive: false }),
    } as never);

    await expect(missingService.findMutableAdminRoleById('missing-role')).rejects.toThrow(
      NotFoundException,
    );
    await expect(inactiveService.findMutableAdminRoleById('inactive-role')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('rejects system role permission mapping changes through admin API path', async () => {
    const service = new RoleService({
      findById: jest.fn().mockResolvedValue({
        _id: 'role-1',
        isSystem: true,
        isActive: true,
      }),
    } as never);

    await expect(service.findMutableAdminRoleById('role-1')).rejects.toThrow(ConflictException);
  });
});
