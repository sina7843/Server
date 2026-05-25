import { PermissionKeys, Permissions } from './permission-keys';
import type { RolePermissionRegistry } from './registry.types';

export const RolePermissionRegistryMap = {
  super_admin: PermissionKeys,

  admin: [
    Permissions.ADMIN_DASHBOARD_VIEW,

    Permissions.USER_READ,
    Permissions.USER_UPDATE,
    Permissions.USER_STATUS_UPDATE,
    Permissions.USER_SESSION_REVOKE,

    Permissions.RBAC_ROLE_READ,
    Permissions.RBAC_ROLE_CREATE,
    Permissions.RBAC_ROLE_UPDATE,
    Permissions.RBAC_ROLE_DEACTIVATE,
    Permissions.RBAC_ROLE_ASSIGN,
    Permissions.RBAC_PERMISSION_READ,
    Permissions.RBAC_PERMISSION_ATTACH,
    Permissions.RBAC_PERMISSION_DETACH,

    Permissions.SYSTEM_HEALTH_READ,
    Permissions.SYSTEM_BACKUP_READ,
    Permissions.SYSTEM_JOB_READ,
    Permissions.SYSTEM_JOB_RETRY,

    Permissions.AUDIT_LOG_READ,
    Permissions.NOTIFICATION_LOG_READ,

    Permissions.SEARCH_USER_READ,
    Permissions.SEARCH_CONTENT_READ,
    Permissions.SEARCH_MEDIA_READ,
    Permissions.SEARCH_REINDEX,
  ],

  content_manager: [
    Permissions.CONTENT_POST_CREATE,
    Permissions.CONTENT_POST_READ,
    Permissions.CONTENT_POST_UPDATE,
    Permissions.CONTENT_POST_PUBLISH,
    Permissions.CONTENT_POST_ARCHIVE,

    Permissions.CONTENT_PAGE_CREATE,
    Permissions.CONTENT_PAGE_READ,
    Permissions.CONTENT_PAGE_UPDATE,
    Permissions.CONTENT_PAGE_PUBLISH,
    Permissions.CONTENT_PAGE_ARCHIVE,

    Permissions.CONTENT_CATEGORY_READ,
    Permissions.CONTENT_CATEGORY_CREATE,
    Permissions.CONTENT_CATEGORY_UPDATE,
    Permissions.CONTENT_CATEGORY_DELETE,

    Permissions.CONTENT_TAG_READ,
    Permissions.CONTENT_TAG_CREATE,
    Permissions.CONTENT_TAG_UPDATE,
    Permissions.CONTENT_TAG_DELETE,

    Permissions.MEDIA_ASSET_READ,
    Permissions.MEDIA_ASSET_UPLOAD,
    Permissions.MEDIA_ASSET_UPDATE,

    Permissions.SEARCH_CONTENT_READ,
    Permissions.SEARCH_MEDIA_READ,
  ],

  support: [
    Permissions.ADMIN_DASHBOARD_VIEW,
    Permissions.USER_READ,
    Permissions.USER_SESSION_REVOKE,
    Permissions.SYSTEM_HEALTH_READ,
  ],

  user: [],
} as const satisfies RolePermissionRegistry;
