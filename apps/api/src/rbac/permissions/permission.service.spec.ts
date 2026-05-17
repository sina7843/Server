import { PermissionService } from './permission.service';

describe('PermissionService', () => {
  it('lists filtered permissions without creating permissions from request input', async () => {
    const listFiltered = jest.fn().mockResolvedValue([]);
    const service = new PermissionService({ listFiltered } as never);

    await service.listFiltered({ module: 'rbac', resource: 'role' });

    expect(listFiltered).toHaveBeenCalledWith({
      module: 'rbac',
      resource: 'role',
    });
  });

  it('finds permission documents by id for permission-key resolution', async () => {
    const findById = jest.fn().mockResolvedValue({ key: 'rbac.role.read' });
    const service = new PermissionService({ findById } as never);

    await expect(service.findById('permission-id')).resolves.toEqual({
      key: 'rbac.role.read',
    });
  });
});
