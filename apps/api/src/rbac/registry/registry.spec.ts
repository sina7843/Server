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

  it('defines the locked base roles once including tournament_manager', () => {
    const roleKeys = RoleRegistry.map((role) => role.key);

    expect(roleKeys).toEqual([
      'super_admin',
      'admin',
      'content_manager',
      'support',
      'user',
      'tournament_manager',
    ]);
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

describe('Phase 1 RBAC registry', () => {
  const allRegisteredKeys = PermissionRegistry.map((p) => p.key);

  it('has no tournament.bracket.read permission in registry', () => {
    expect(allRegisteredKeys).not.toContain('tournament.bracket.read');
  });

  it('has no tournament.bracket.manage permission in registry', () => {
    expect(allRegisteredKeys).not.toContain('tournament.bracket.manage');
  });

  it('uses tournament.match.read for bracket projection access', () => {
    expect(allRegisteredKeys).toContain(Permissions.TOURNAMENT_MATCH_READ);
    expect(Permissions.TOURNAMENT_MATCH_READ).toBe('tournament.match.read');
  });

  it('uses tournament.result.manage for standings recalculation', () => {
    expect(allRegisteredKeys).toContain(Permissions.TOURNAMENT_RESULT_MANAGE);
    expect(Permissions.TOURNAMENT_RESULT_MANAGE).toBe('tournament.result.manage');
  });

  it('has no game.game.* permissions (wrong namespace)', () => {
    expect(allRegisteredKeys).not.toContain('game.game.read');
    expect(allRegisteredKeys).not.toContain('game.game.create');
    expect(allRegisteredKeys).not.toContain('game.game.update');
    expect(allRegisteredKeys).not.toContain('game.status.update');
  });

  it('registers Phase 1 game permissions under tournament namespace', () => {
    expect(allRegisteredKeys).toContain(Permissions.TOURNAMENT_GAME_READ);
    expect(allRegisteredKeys).toContain(Permissions.TOURNAMENT_GAME_MANAGE);
    expect(Permissions.TOURNAMENT_GAME_READ).toBe('tournament.game.read');
    expect(Permissions.TOURNAMENT_GAME_MANAGE).toBe('tournament.game.manage');
  });

  it('registers all Phase 1 tournament permissions', () => {
    expect(allRegisteredKeys).toContain(Permissions.TOURNAMENT_READ);
    expect(allRegisteredKeys).toContain(Permissions.TOURNAMENT_CREATE);
    expect(allRegisteredKeys).toContain(Permissions.TOURNAMENT_UPDATE);
    expect(allRegisteredKeys).toContain(Permissions.TOURNAMENT_PUBLISH);
    expect(allRegisteredKeys).toContain(Permissions.TOURNAMENT_CANCEL);
    expect(allRegisteredKeys).toContain(Permissions.TOURNAMENT_ARCHIVE);
  });

  it('registers all Phase 1 registration permissions', () => {
    expect(allRegisteredKeys).toContain(Permissions.TOURNAMENT_REGISTRATION_READ);
    expect(allRegisteredKeys).toContain(Permissions.TOURNAMENT_REGISTRATION_MANAGE);
  });

  it('registers all Phase 1 participant permissions', () => {
    expect(allRegisteredKeys).toContain(Permissions.TOURNAMENT_PARTICIPANT_READ);
    expect(allRegisteredKeys).toContain(Permissions.TOURNAMENT_PARTICIPANT_MANAGE);
  });

  it('registers all Phase 1 match permissions', () => {
    expect(allRegisteredKeys).toContain(Permissions.TOURNAMENT_MATCH_READ);
    expect(allRegisteredKeys).toContain(Permissions.TOURNAMENT_MATCH_MANAGE);
  });

  it('registers the Phase 1 result permission', () => {
    expect(allRegisteredKeys).toContain(Permissions.TOURNAMENT_RESULT_MANAGE);
  });

  it('tournament_manager role is registered', () => {
    const roleKeys = RoleRegistry.map((r) => r.key);
    expect(roleKeys).toContain('tournament_manager');
  });

  it('tournament_manager role is system-managed and assignable', () => {
    const role = RoleRegistry.find((r) => r.key === 'tournament_manager');
    expect(role).toBeDefined();
    expect(role?.isSystem).toBe(true);
    expect(role?.isAssignable).toBe(true);
    expect(role?.isActive).toBe(true);
  });

  it('tournament_manager has tournament.match.read permission (bracket projection)', () => {
    expect(RolePermissionRegistryMap.tournament_manager).toContain(
      Permissions.TOURNAMENT_MATCH_READ,
    );
  });

  it('tournament_manager has tournament.result.manage permission (standings)', () => {
    expect(RolePermissionRegistryMap.tournament_manager).toContain(
      Permissions.TOURNAMENT_RESULT_MANAGE,
    );
  });

  it('tournament_manager does not have content or media permissions', () => {
    const tmPerms = RolePermissionRegistryMap.tournament_manager;
    expect(tmPerms).not.toContain(Permissions.CONTENT_POST_CREATE);
    expect(tmPerms).not.toContain(Permissions.MEDIA_ASSET_DELETE);
    expect(tmPerms).not.toContain(Permissions.RBAC_ROLE_CREATE);
  });

  it('tournament_manager permissions are a subset of all registered permissions', () => {
    const knownKeys = new Set(allRegisteredKeys);
    for (const key of RolePermissionRegistryMap.tournament_manager) {
      expect(knownKeys.has(key)).toBe(true);
    }
  });

  it('tournament_manager seed is idempotent (permissions defined in registry)', () => {
    const knownKeys = new Set(allRegisteredKeys);
    const tmPerms = RolePermissionRegistryMap.tournament_manager;
    for (const key of tmPerms) {
      expect(knownKeys.has(key)).toBe(true);
    }
    expect(new Set(tmPerms).size).toBe(tmPerms.length);
  });

  it('super_admin still maps to all permissions including Phase 1 additions', () => {
    expect(new Set(RolePermissionRegistryMap.super_admin)).toEqual(new Set(PermissionKeys));
    expect(RolePermissionRegistryMap.super_admin).toContain(Permissions.TOURNAMENT_MATCH_READ);
    expect(RolePermissionRegistryMap.super_admin).toContain(Permissions.TOURNAMENT_RESULT_MANAGE);
  });

  it('tournament_manager has tournament.game.read and tournament.game.manage', () => {
    expect(RolePermissionRegistryMap.tournament_manager).toContain(
      Permissions.TOURNAMENT_GAME_READ,
    );
    expect(RolePermissionRegistryMap.tournament_manager).toContain(
      Permissions.TOURNAMENT_GAME_MANAGE,
    );
  });

  it('Phase 1 permissions are centralized in the registry (not scattered)', () => {
    const phase1Keys = [
      Permissions.TOURNAMENT_GAME_READ,
      Permissions.TOURNAMENT_GAME_MANAGE,
      Permissions.TOURNAMENT_READ,
      Permissions.TOURNAMENT_CREATE,
      Permissions.TOURNAMENT_UPDATE,
      Permissions.TOURNAMENT_PUBLISH,
      Permissions.TOURNAMENT_CANCEL,
      Permissions.TOURNAMENT_ARCHIVE,
      Permissions.TOURNAMENT_REGISTRATION_READ,
      Permissions.TOURNAMENT_REGISTRATION_MANAGE,
      Permissions.TOURNAMENT_PARTICIPANT_READ,
      Permissions.TOURNAMENT_PARTICIPANT_MANAGE,
      Permissions.TOURNAMENT_MATCH_READ,
      Permissions.TOURNAMENT_MATCH_MANAGE,
      Permissions.TOURNAMENT_RESULT_MANAGE,
    ];

    for (const key of phase1Keys) {
      expect(allRegisteredKeys).toContain(key);
    }
  });
});
