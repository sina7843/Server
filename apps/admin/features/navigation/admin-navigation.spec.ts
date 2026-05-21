import { DragonPermissions } from '@dragon/sdk';
import { ADMIN_NAV_ITEMS, filterNavByPermissions } from './admin-navigation';

const ALLOWED_KEYS = ['dashboard', 'users', 'roles', 'permissions', 'system-health'];

describe('ADMIN_NAV_ITEMS', () => {
  it('contains exactly the allowed Slice 0.5 navigation items', () => {
    expect(ADMIN_NAV_ITEMS.map((i) => i.key)).toEqual(ALLOWED_KEYS);
  });

  it('does not contain Content, Media, Audit, or Analytics nav items', () => {
    const keys = ADMIN_NAV_ITEMS.map((i) => i.key);

    expect(keys).not.toContain('content');
    expect(keys).not.toContain('media');
    expect(keys).not.toContain('audit');
    expect(keys).not.toContain('analytics');
  });

  it('does not contain Backup, Jobs, or Notifications nav items', () => {
    const keys = ADMIN_NAV_ITEMS.map((i) => i.key);

    expect(keys).not.toContain('backup');
    expect(keys).not.toContain('jobs');
    expect(keys).not.toContain('notifications');
  });

  it('does not contain future module nav items', () => {
    const keys = ADMIN_NAV_ITEMS.map((i) => i.key);

    expect(keys).not.toContain('tournament');
    expect(keys).not.toContain('shop');
    expect(keys).not.toContain('academy');
    expect(keys).not.toContain('streaming');
    expect(keys).not.toContain('boardgame');
  });
});

describe('filterNavByPermissions', () => {
  it('returns empty array with no permissions and no super_admin flag', () => {
    const result = filterNavByPermissions(ADMIN_NAV_ITEMS, new Set(), false);

    expect(result).toHaveLength(0);
  });

  it('shows only Dashboard with admin.dashboard.view permission', () => {
    const permissions = new Set([DragonPermissions.ADMIN_DASHBOARD_VIEW]);
    const result = filterNavByPermissions(ADMIN_NAV_ITEMS, permissions, false);

    expect(result).toHaveLength(1);
    expect(result[0]!.key).toBe('dashboard');
  });

  it('shows only Users with user.user.read permission', () => {
    const permissions = new Set([DragonPermissions.USER_READ]);
    const result = filterNavByPermissions(ADMIN_NAV_ITEMS, permissions, false);

    expect(result).toHaveLength(1);
    expect(result[0]!.key).toBe('users');
  });

  it('shows only Roles with rbac.role.read permission', () => {
    const permissions = new Set([DragonPermissions.RBAC_ROLE_READ]);
    const result = filterNavByPermissions(ADMIN_NAV_ITEMS, permissions, false);

    expect(result).toHaveLength(1);
    expect(result[0]!.key).toBe('roles');
  });

  it('shows only Permissions with rbac.permission.read permission', () => {
    const permissions = new Set([DragonPermissions.RBAC_PERMISSION_READ]);
    const result = filterNavByPermissions(ADMIN_NAV_ITEMS, permissions, false);

    expect(result).toHaveLength(1);
    expect(result[0]!.key).toBe('permissions');
  });

  it('shows only System Health with system.health.read permission', () => {
    const permissions = new Set([DragonPermissions.SYSTEM_HEALTH_READ]);
    const result = filterNavByPermissions(ADMIN_NAV_ITEMS, permissions, false);

    expect(result).toHaveLength(1);
    expect(result[0]!.key).toBe('system-health');
  });

  it('shows all allowed items when isSuperAdmin is true regardless of permissions', () => {
    const result = filterNavByPermissions(ADMIN_NAV_ITEMS, new Set(), true);

    expect(result).toHaveLength(ALLOWED_KEYS.length);
    expect(result.map((i) => i.key)).toEqual(ALLOWED_KEYS);
  });

  it('shows all allowed items when user has all effective permissions', () => {
    const allPermissions = new Set(ADMIN_NAV_ITEMS.map((i) => i.permission));
    const result = filterNavByPermissions(ADMIN_NAV_ITEMS, allPermissions, false);

    expect(result).toHaveLength(ALLOWED_KEYS.length);
  });

  it('shows multiple items when multiple permissions are granted', () => {
    const permissions = new Set([
      DragonPermissions.ADMIN_DASHBOARD_VIEW,
      DragonPermissions.RBAC_ROLE_READ,
    ]);
    const result = filterNavByPermissions(ADMIN_NAV_ITEMS, permissions, false);

    expect(result).toHaveLength(2);
    expect(result.map((i) => i.key)).toContain('dashboard');
    expect(result.map((i) => i.key)).toContain('roles');
  });
});
