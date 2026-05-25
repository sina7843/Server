import { DragonPermissions } from '@dragon/sdk';
import { ADMIN_NAV_ITEMS, filterNavByPermissions } from './admin-navigation';

const ALLOWED_KEYS = [
  'dashboard',
  'users',
  'roles',
  'permissions',
  'content',
  'media',
  'system-health',
  'audit',
  'jobs',
  'notifications',
  'analytics',
];

describe('ADMIN_NAV_ITEMS', () => {
  it('contains exactly the allowed Slice 0.5–0.9 navigation items', () => {
    expect(ADMIN_NAV_ITEMS.map((i) => i.key)).toEqual(ALLOWED_KEYS);
  });

  it('contains content nav item added in Task 0.6.4', () => {
    const keys = ADMIN_NAV_ITEMS.map((i) => i.key);
    expect(keys).toContain('content');
  });

  it('content nav item points to /content', () => {
    const contentItem = ADMIN_NAV_ITEMS.find((i) => i.key === 'content');
    expect(contentItem).toBeDefined();
    expect(contentItem!.path).toBe('/content');
  });

  it('content nav item uses content.post.read permission as gate', () => {
    const contentItem = ADMIN_NAV_ITEMS.find((i) => i.key === 'content');
    expect(contentItem!.permission).toBe(DragonPermissions.CONTENT_POST_READ);
  });

  it('contains media nav item added in Task 0.7.4', () => {
    const keys = ADMIN_NAV_ITEMS.map((i) => i.key);
    expect(keys).toContain('media');
  });

  it('media nav item uses media.asset.read permission as gate', () => {
    const mediaItem = ADMIN_NAV_ITEMS.find((i) => i.key === 'media');
    expect(mediaItem).toBeDefined();
    expect(mediaItem!.permission).toBe(DragonPermissions.MEDIA_ASSET_READ);
    expect(mediaItem!.path).toBe('/media');
  });

  it('contains audit nav item added in Task 0.8.2', () => {
    const keys = ADMIN_NAV_ITEMS.map((i) => i.key);
    expect(keys).toContain('audit');
  });

  it('audit nav item uses audit.log.read permission as gate', () => {
    const auditItem = ADMIN_NAV_ITEMS.find((i) => i.key === 'audit');
    expect(auditItem).toBeDefined();
    expect(auditItem!.permission).toBe(DragonPermissions.AUDIT_LOG_READ);
    expect(auditItem!.path).toBe('/audit');
  });

  it('contains jobs nav item added in Task 0.8.5', () => {
    const keys = ADMIN_NAV_ITEMS.map((i) => i.key);
    expect(keys).toContain('jobs');
  });

  it('jobs nav item uses system.job.read permission as gate', () => {
    const jobsItem = ADMIN_NAV_ITEMS.find((i) => i.key === 'jobs');
    expect(jobsItem).toBeDefined();
    expect(jobsItem!.permission).toBe(DragonPermissions.SYSTEM_JOB_READ);
    expect(jobsItem!.path).toBe('/system/jobs');
  });

  it('contains notifications nav item added in Task 0.8.5', () => {
    const keys = ADMIN_NAV_ITEMS.map((i) => i.key);
    expect(keys).toContain('notifications');
  });

  it('notifications nav item uses notification.log.read permission as gate', () => {
    const notifItem = ADMIN_NAV_ITEMS.find((i) => i.key === 'notifications');
    expect(notifItem).toBeDefined();
    expect(notifItem!.permission).toBe(DragonPermissions.NOTIFICATION_LOG_READ);
    expect(notifItem!.path).toBe('/system/notifications');
  });

  it('contains analytics nav item added in Task 0.9.4', () => {
    const keys = ADMIN_NAV_ITEMS.map((i) => i.key);
    expect(keys).toContain('analytics');
  });

  it('analytics nav item uses analytics.analytics.read permission as gate', () => {
    const analyticsItem = ADMIN_NAV_ITEMS.find((i) => i.key === 'analytics');
    expect(analyticsItem).toBeDefined();
    expect(analyticsItem!.permission).toBe(DragonPermissions.ANALYTICS_READ);
    expect(analyticsItem!.path).toBe('/analytics');
  });

  it('does not contain Backup nav item', () => {
    const keys = ADMIN_NAV_ITEMS.map((i) => i.key);
    expect(keys).not.toContain('backup');
  });

  it('does not contain future module nav items', () => {
    const keys = ADMIN_NAV_ITEMS.map((i) => i.key);
    expect(keys).not.toContain('tournament');
    expect(keys).not.toContain('shop');
    expect(keys).not.toContain('academy');
    expect(keys).not.toContain('streaming');
    expect(keys).not.toContain('boardgame');
  });

  it('does not contain BI/funnels/cohorts/revenue nav items', () => {
    const keys = ADMIN_NAV_ITEMS.map((i) => i.key);
    expect(keys).not.toContain('funnels');
    expect(keys).not.toContain('cohorts');
    expect(keys).not.toContain('revenue');
    expect(keys).not.toContain('retention');
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

  it('shows Content nav with content.post.read permission', () => {
    const permissions = new Set([DragonPermissions.CONTENT_POST_READ]);
    const result = filterNavByPermissions(ADMIN_NAV_ITEMS, permissions, false);
    expect(result).toHaveLength(1);
    expect(result[0]!.key).toBe('content');
  });

  it('does not show Content nav without content.post.read permission', () => {
    const permissions = new Set([DragonPermissions.USER_READ, DragonPermissions.RBAC_ROLE_READ]);
    const result = filterNavByPermissions(ADMIN_NAV_ITEMS, permissions, false);
    const keys = result.map((i) => i.key);
    expect(keys).not.toContain('content');
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

  it('shows Media nav with media.asset.read permission', () => {
    const permissions = new Set([DragonPermissions.MEDIA_ASSET_READ]);
    const result = filterNavByPermissions(ADMIN_NAV_ITEMS, permissions, false);
    expect(result).toHaveLength(1);
    expect(result[0]!.key).toBe('media');
  });

  it('shows all allowed items when user has all effective permissions', () => {
    const allPermissions = new Set(ADMIN_NAV_ITEMS.map((i) => i.permission));
    const result = filterNavByPermissions(ADMIN_NAV_ITEMS, allPermissions, false);
    expect(result).toHaveLength(ALLOWED_KEYS.length);
  });

  it('shows multiple items when multiple permissions are granted', () => {
    const permissions = new Set([
      DragonPermissions.ADMIN_DASHBOARD_VIEW,
      DragonPermissions.CONTENT_POST_READ,
    ]);
    const result = filterNavByPermissions(ADMIN_NAV_ITEMS, permissions, false);
    expect(result).toHaveLength(2);
    expect(result.map((i) => i.key)).toContain('dashboard');
    expect(result.map((i) => i.key)).toContain('content');
  });

  it('shows Jobs nav only with system.job.read permission', () => {
    const permissions = new Set([DragonPermissions.SYSTEM_JOB_READ]);
    const result = filterNavByPermissions(ADMIN_NAV_ITEMS, permissions, false);
    expect(result).toHaveLength(1);
    expect(result[0]!.key).toBe('jobs');
  });

  it('does not show Jobs nav without system.job.read permission', () => {
    const permissions = new Set([DragonPermissions.USER_READ, DragonPermissions.AUDIT_LOG_READ]);
    const result = filterNavByPermissions(ADMIN_NAV_ITEMS, permissions, false);
    const keys = result.map((i) => i.key);
    expect(keys).not.toContain('jobs');
  });

  it('shows Notifications nav only with notification.log.read permission', () => {
    const permissions = new Set([DragonPermissions.NOTIFICATION_LOG_READ]);
    const result = filterNavByPermissions(ADMIN_NAV_ITEMS, permissions, false);
    expect(result).toHaveLength(1);
    expect(result[0]!.key).toBe('notifications');
  });

  it('does not show Notifications nav without notification.log.read permission', () => {
    const permissions = new Set([DragonPermissions.USER_READ, DragonPermissions.AUDIT_LOG_READ]);
    const result = filterNavByPermissions(ADMIN_NAV_ITEMS, permissions, false);
    const keys = result.map((i) => i.key);
    expect(keys).not.toContain('notifications');
  });

  it('shows Analytics nav only with analytics.analytics.read permission', () => {
    const permissions = new Set([DragonPermissions.ANALYTICS_READ]);
    const result = filterNavByPermissions(ADMIN_NAV_ITEMS, permissions, false);
    expect(result).toHaveLength(1);
    expect(result[0]!.key).toBe('analytics');
  });

  it('does not show Analytics nav without analytics.analytics.read permission', () => {
    const permissions = new Set([DragonPermissions.USER_READ, DragonPermissions.AUDIT_LOG_READ]);
    const result = filterNavByPermissions(ADMIN_NAV_ITEMS, permissions, false);
    const keys = result.map((i) => i.key);
    expect(keys).not.toContain('analytics');
  });
});
