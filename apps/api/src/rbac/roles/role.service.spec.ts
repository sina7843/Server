import { ConflictException } from '@nestjs/common';
import { RoleService } from './role.service';

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

    await expect(
      service.createAdminRole({ key: 'editor', name: 'Editor' }),
    ).rejects.toThrow(ConflictException);
  });

  it('rejects system role update', async () => {
    const service = new RoleService({
      findById: jest.fn().mockResolvedValue({ _id: 'role-1', isSystem: true }),
    } as never);

    await expect(
      service.updateAdminRole('role-1', { name: 'Updated' }),
    ).rejects.toThrow(ConflictException);
  });

  it('rejects system role deactivation', async () => {
    const service = new RoleService({
      findById: jest.fn().mockResolvedValue({ _id: 'role-1', isSystem: true }),
    } as never);

    await expect(service.deactivateAdminRole('role-1')).rejects.toThrow(
      ConflictException,
    );
  });
});
