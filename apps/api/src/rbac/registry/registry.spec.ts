import { PermissionKeys, Permissions } from './permission-keys';
import { PermissionRegistry } from './permission-registry';
import { RolePermissionRegistryMap } from './role-permission-registry';
import { RoleRegistry } from './role-registry';

describe('RBAC registry', () => {
  it('keeps permission keys in module.resource.action format', () => {
    for (const permission of PermissionRegistry) {
      expect(permission.key).toMatch(/^[a-z]+(\.[a-z]+){2}$/);
      expect(permission.key).toBe(
        `${permission.module}.${permission.resource}.${permission.action}`,
      );
    }
  });

  it('does not contain duplicate permission keys', () => {
    const keys = PermissionRegistry.map((permission) => permission.key);

    expect(new Set(keys).size).toBe(keys.length);
  });

  it('does not contain duplicate module/resource/action triples', () => {
    const triples = PermissionRegistry.map(
      (permission) => `${permission.module}.${permission.resource}.${permission.action}`,
    );

    expect(new Set(triples).size).toBe(triples.length);
  });

  it('defines the locked base roles once', () => {
    const roleKeys = RoleRegistry.map((role) => role.key);

    expect(roleKeys).toEqual(['super_admin', 'admin', 'content_manager', 'support', 'user']);
    expect(new Set(roleKeys).size).toBe(roleKeys.length);
  });

  it('maps only known roles and permissions', () => {
    const knownRoles = new Set(RoleRegistry.map((role) => role.key));
    const knownPermissions = new Set(PermissionRegistry.map((permission) => permission.key));

    for (const roleKey of Object.keys(RolePermissionRegistryMap)) {
      expect(knownRoles.has(roleKey as never)).toBe(true);
    }

    for (const permissionKeys of Object.values(RolePermissionRegistryMap)) {
      for (const permissionKey of permissionKeys) {
        expect(knownPermissions.has(permissionKey)).toBe(true);
      }
    }
  });

  it('maps super_admin to all permissions', () => {
    expect(new Set(RolePermissionRegistryMap.super_admin)).toEqual(new Set(PermissionKeys));
  });

  it('keeps support limited and user minimal', () => {
    expect(RolePermissionRegistryMap.support).toContain(Permissions.USER_READ);
    expect(RolePermissionRegistryMap.support).not.toContain('rbac.role.create');
    expect(RolePermissionRegistryMap.user).toEqual([]);
  });
});
