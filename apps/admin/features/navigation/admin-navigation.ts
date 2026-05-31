import { DragonPermissions } from '@dragon/sdk';

export interface AdminNavItem {
  readonly key: string;
  readonly label: string;
  readonly labelEn: string;
  readonly path: string;
  readonly permission: string;
}

export const ADMIN_NAV_ITEMS: readonly AdminNavItem[] = [
  {
    key: 'dashboard',
    label: 'داشبورد',
    labelEn: 'Dashboard',
    path: '/dashboard',
    permission: DragonPermissions.ADMIN_DASHBOARD_VIEW,
  },
  {
    key: 'users',
    label: 'کاربران',
    labelEn: 'Users',
    path: '/users',
    permission: DragonPermissions.USER_READ,
  },
  {
    key: 'roles',
    label: 'نقش‌ها',
    labelEn: 'Roles',
    path: '/roles',
    permission: DragonPermissions.RBAC_ROLE_READ,
  },
  {
    key: 'permissions',
    label: 'مجوزها',
    labelEn: 'Permissions',
    path: '/permissions',
    permission: DragonPermissions.RBAC_PERMISSION_READ,
  },
  {
    key: 'content',
    label: 'محتوا',
    labelEn: 'Content',
    path: '/content',
    permission: DragonPermissions.CONTENT_POST_READ,
  },
  {
    key: 'media',
    label: 'رسانه',
    labelEn: 'Media',
    path: '/media',
    permission: DragonPermissions.MEDIA_ASSET_READ,
  },
  {
    key: 'system-health',
    label: 'سلامت سیستم',
    labelEn: 'System Health',
    path: '/system/health',
    permission: DragonPermissions.SYSTEM_HEALTH_READ,
  },
  {
    key: 'backups',
    label: 'پشتیبان‌گیری',
    labelEn: 'Backups',
    path: '/system/backups',
    permission: DragonPermissions.SYSTEM_BACKUP_READ,
  },
  {
    key: 'audit',
    label: 'لاگ‌های حسابرسی',
    labelEn: 'Audit Logs',
    path: '/audit',
    permission: DragonPermissions.AUDIT_LOG_READ,
  },
  {
    key: 'jobs',
    label: 'جاب‌ها',
    labelEn: 'Jobs',
    path: '/system/jobs',
    permission: DragonPermissions.SYSTEM_JOB_READ,
  },
  {
    key: 'notifications',
    label: 'اعلان‌ها',
    labelEn: 'Notifications',
    path: '/system/notifications',
    permission: DragonPermissions.NOTIFICATION_LOG_READ,
  },
  {
    key: 'analytics',
    label: 'آنالیتیکس',
    labelEn: 'Analytics',
    path: '/analytics',
    permission: DragonPermissions.ANALYTICS_READ,
  },
  {
    key: 'games',
    label: 'بازی‌ها',
    labelEn: 'Games',
    path: '/games',
    permission: DragonPermissions.TOURNAMENT_GAME_READ,
  },
] as const;

export function filterNavByPermissions(
  items: readonly AdminNavItem[],
  grantedPermissions: ReadonlySet<string>,
  isSuperAdmin: boolean,
): readonly AdminNavItem[] {
  if (isSuperAdmin) return items;

  return items.filter((item) => grantedPermissions.has(item.permission));
}
