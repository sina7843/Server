export const Permissions = {
  ADMIN_DASHBOARD_VIEW: 'admin.dashboard.view',

  USER_READ: 'user.user.read',
  USER_UPDATE: 'user.user.update',
  USER_STATUS_UPDATE: 'user.status.update',
  USER_SESSION_REVOKE: 'user.session.revoke',

  RBAC_ROLE_READ: 'rbac.role.read',
  RBAC_ROLE_CREATE: 'rbac.role.create',
  RBAC_ROLE_UPDATE: 'rbac.role.update',
  RBAC_ROLE_DEACTIVATE: 'rbac.role.deactivate',
  RBAC_ROLE_ASSIGN: 'rbac.role.assign',
  RBAC_PERMISSION_READ: 'rbac.permission.read',
  RBAC_PERMISSION_ATTACH: 'rbac.permission.attach',
  RBAC_PERMISSION_DETACH: 'rbac.permission.detach',

  SYSTEM_HEALTH_READ: 'system.health.read',
  SYSTEM_BACKUP_READ: 'system.backup.read',
  SYSTEM_JOB_READ: 'system.job.read',
  SYSTEM_JOB_RETRY: 'system.job.retry',

  CONTENT_POST_CREATE: 'content.post.create',
  CONTENT_POST_READ: 'content.post.read',
  CONTENT_POST_UPDATE: 'content.post.update',
  CONTENT_POST_PUBLISH: 'content.post.publish',
  CONTENT_POST_ARCHIVE: 'content.post.archive',

  CONTENT_PAGE_CREATE: 'content.page.create',
  CONTENT_PAGE_READ: 'content.page.read',
  CONTENT_PAGE_UPDATE: 'content.page.update',
  CONTENT_PAGE_PUBLISH: 'content.page.publish',
  CONTENT_PAGE_ARCHIVE: 'content.page.archive',

  CONTENT_CATEGORY_READ: 'content.category.read',
  CONTENT_CATEGORY_CREATE: 'content.category.create',
  CONTENT_CATEGORY_UPDATE: 'content.category.update',
  CONTENT_CATEGORY_DELETE: 'content.category.delete',

  CONTENT_TAG_READ: 'content.tag.read',
  CONTENT_TAG_CREATE: 'content.tag.create',
  CONTENT_TAG_UPDATE: 'content.tag.update',
  CONTENT_TAG_DELETE: 'content.tag.delete',

  MEDIA_ASSET_READ: 'media.asset.read',
  MEDIA_ASSET_UPLOAD: 'media.asset.upload',
  MEDIA_ASSET_UPDATE: 'media.asset.update',
  MEDIA_ASSET_DELETE: 'media.asset.delete',
  MEDIA_ASSET_REGENERATE: 'media.asset.regenerate',

  AUDIT_LOG_READ: 'audit.log.read',
  ANALYTICS_READ: 'analytics.analytics.read',
} as const;

export type PermissionKey = (typeof Permissions)[keyof typeof Permissions];

export const PermissionKeys = Object.values(Permissions) as readonly PermissionKey[];
