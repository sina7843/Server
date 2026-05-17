import { RbacSeedService } from './rbac-seed.service';

describe('RbacSeedService', () => {
  const createRepositoryMock = () => {
    const permissionIds = new Map<string, string>();
    const roleIds = new Map<string, string>();
    let permissionCounter = 0;
    let roleCounter = 0;
    const attachedRolePermissions = new Set<string>();
    const assignedRoles = new Set<string>();

    return {
      permissionRepository: {
        upsertSystemPermissionForSeed: jest.fn(async (permission: { key: string }) => {
          const existing = permissionIds.get(permission.key);

          if (existing) {
            return {
              document: { _id: existing, key: permission.key },
              created: false,
              updated: true,
            };
          }

          permissionCounter += 1;
          const id = `permission-${permissionCounter}`;
          permissionIds.set(permission.key, id);

          return {
            document: { _id: id, key: permission.key },
            created: true,
            updated: false,
          };
        }),
      },
      roleRepository: {
        upsertRoleForSeed: jest.fn(async (role: { key: string }) => {
          const existing = roleIds.get(role.key);

          if (existing) {
            return {
              document: { _id: existing, key: role.key },
              created: false,
              updated: true,
            };
          }

          roleCounter += 1;
          const id = `role-${roleCounter}`;
          roleIds.set(role.key, id);

          return {
            document: { _id: id, key: role.key },
            created: true,
            updated: false,
          };
        }),
      },
      rolePermissionRepository: {
        attachPermissionForSeed: jest.fn(
          async (input: { roleId: string; permissionId: string }) => {
            const key = `${input.roleId}:${input.permissionId}`;
            const created = !attachedRolePermissions.has(key);
            attachedRolePermissions.add(key);

            return {
              document: { _id: key, ...input },
              created,
            };
          },
        ),
      },
      userRoleRepository: {
        assignRoleForSeed: jest.fn(async (input: { userId: string; roleId: string }) => {
          const key = `${input.userId}:${input.roleId}`;
          const created = !assignedRoles.has(key);
          assignedRoles.add(key);

          return {
            document: { _id: key, ...input },
            created,
          };
        }),
      },
      userRepository: {
        findActiveByPhoneNormalized: jest.fn(async (phone: string) => {
          if (phone === '+989121234567') {
            return { _id: 'existing-active-user' };
          }

          return null;
        }),
      },
    };
  };

  it('seeds permissions, roles, and role-permissions idempotently', async () => {
    const repositories = createRepositoryMock();
    const service = new RbacSeedService(
      repositories.permissionRepository as never,
      repositories.roleRepository as never,
      repositories.rolePermissionRepository as never,
      repositories.userRoleRepository as never,
      repositories.userRepository as never,
    );

    const first = await service.runRbacSeed();
    const second = await service.runRbacSeed();

    expect(first.permissionsCreated).toBeGreaterThan(0);
    expect(first.rolesCreated).toBe(5);
    expect(first.rolePermissionsAttached).toBeGreaterThan(0);

    expect(second.permissionsCreated).toBe(0);
    expect(second.permissionsUpdated).toBeGreaterThan(0);
    expect(second.rolesCreated).toBe(0);
    expect(second.rolesUpdated).toBe(5);
    expect(second.rolePermissionsAttached).toBe(0);
  });

  it('does not create users during optional bootstrap assignment', async () => {
    const repositories = createRepositoryMock();
    const service = new RbacSeedService(
      repositories.permissionRepository as never,
      repositories.roleRepository as never,
      repositories.rolePermissionRepository as never,
      repositories.userRoleRepository as never,
      repositories.userRepository as never,
    );

    const result = await service.runRbacSeed({
      bootstrapSuperAdminPhone: '+98 912 123 4567',
    });

    expect(repositories.userRepository.findActiveByPhoneNormalized).toHaveBeenCalledWith(
      '+989121234567',
    );
    expect(repositories.userRoleRepository.assignRoleForSeed).toHaveBeenCalledTimes(1);
    expect(result.superAdminAssignmentCreated).toBe(1);
  });

  it('skips optional bootstrap assignment for missing or non-active users', async () => {
    const repositories = createRepositoryMock();
    const service = new RbacSeedService(
      repositories.permissionRepository as never,
      repositories.roleRepository as never,
      repositories.rolePermissionRepository as never,
      repositories.userRoleRepository as never,
      repositories.userRepository as never,
    );

    const result = await service.runRbacSeed({
      bootstrapSuperAdminPhone: '+98 912 000 0000',
    });

    expect(repositories.userRoleRepository.assignRoleForSeed).not.toHaveBeenCalled();
    expect(result.superAdminAssignmentCreated).toBe(0);
    expect(result.skipped).toContain('super-admin-bootstrap:user-not-found-or-not-active');
  });

  it('returns counts and skipped keys only', async () => {
    const repositories = createRepositoryMock();
    const service = new RbacSeedService(
      repositories.permissionRepository as never,
      repositories.roleRepository as never,
      repositories.rolePermissionRepository as never,
      repositories.userRoleRepository as never,
      repositories.userRepository as never,
    );

    const result = await service.runRbacSeed();

    expect(Object.keys(result).sort()).toEqual([
      'permissionsCreated',
      'permissionsUpdated',
      'rolePermissionsAttached',
      'rolesCreated',
      'rolesUpdated',
      'skipped',
      'superAdminAssignmentCreated',
    ]);
  });
});
