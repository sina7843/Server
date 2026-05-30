import { Permissions, type PermissionKey } from './permission-keys';
import type { RegisteredPermission } from './registry.types';

function permission(
  key: PermissionKey,
  module: string,
  resource: string,
  action: string,
  description?: string,
): RegisteredPermission {
  const expectedKey = `${module}.${resource}.${action}`;

  if (key !== expectedKey) {
    throw new Error(`Invalid permission registry key: ${key}`);
  }

  return {
    key,
    module,
    resource,
    action,
    ...(description ? { description } : {}),
  };
}

export const PermissionRegistry = [
  permission(
    Permissions.ADMIN_DASHBOARD_VIEW,
    'admin',
    'dashboard',
    'view',
    'View admin dashboard shell',
  ),

  permission(Permissions.USER_READ, 'user', 'user', 'read', 'Read user account foundation data'),
  permission(
    Permissions.USER_UPDATE,
    'user',
    'user',
    'update',
    'Update user account foundation data',
  ),
  permission(
    Permissions.USER_STATUS_UPDATE,
    'user',
    'status',
    'update',
    'Update user account status',
  ),
  permission(
    Permissions.USER_SESSION_REVOKE,
    'user',
    'session',
    'revoke',
    'Revoke user-owned sessions',
  ),

  permission(Permissions.RBAC_ROLE_READ, 'rbac', 'role', 'read', 'Read roles'),
  permission(Permissions.RBAC_ROLE_CREATE, 'rbac', 'role', 'create', 'Create roles'),
  permission(Permissions.RBAC_ROLE_UPDATE, 'rbac', 'role', 'update', 'Update roles'),
  permission(Permissions.RBAC_ROLE_DEACTIVATE, 'rbac', 'role', 'deactivate', 'Deactivate roles'),
  permission(Permissions.RBAC_ROLE_ASSIGN, 'rbac', 'role', 'assign', 'Assign roles'),
  permission(Permissions.RBAC_PERMISSION_READ, 'rbac', 'permission', 'read', 'Read permissions'),
  permission(
    Permissions.RBAC_PERMISSION_ATTACH,
    'rbac',
    'permission',
    'attach',
    'Attach permissions to roles',
  ),
  permission(
    Permissions.RBAC_PERMISSION_DETACH,
    'rbac',
    'permission',
    'detach',
    'Detach permissions from roles',
  ),

  permission(
    Permissions.SYSTEM_HEALTH_READ,
    'system',
    'health',
    'read',
    'Read system health status',
  ),
  permission(
    Permissions.SYSTEM_BACKUP_READ,
    'system',
    'backup',
    'read',
    'Read backup status metadata',
  ),
  permission(
    Permissions.SYSTEM_BACKUP_RUN,
    'system',
    'backup',
    'run',
    'Trigger a manual backup run — restricted to super_admin',
  ),
  permission(Permissions.SYSTEM_JOB_READ, 'system', 'job', 'read', 'Read system job metadata'),
  permission(Permissions.SYSTEM_JOB_RETRY, 'system', 'job', 'retry', 'Retry failed system jobs'),

  permission(Permissions.CONTENT_POST_CREATE, 'content', 'post', 'create', 'Create content posts'),
  permission(Permissions.CONTENT_POST_READ, 'content', 'post', 'read', 'Read content posts'),
  permission(Permissions.CONTENT_POST_UPDATE, 'content', 'post', 'update', 'Update content posts'),
  permission(
    Permissions.CONTENT_POST_PUBLISH,
    'content',
    'post',
    'publish',
    'Publish content posts',
  ),
  permission(
    Permissions.CONTENT_POST_ARCHIVE,
    'content',
    'post',
    'archive',
    'Archive content posts',
  ),

  permission(Permissions.CONTENT_PAGE_CREATE, 'content', 'page', 'create', 'Create content pages'),
  permission(Permissions.CONTENT_PAGE_READ, 'content', 'page', 'read', 'Read content pages'),
  permission(Permissions.CONTENT_PAGE_UPDATE, 'content', 'page', 'update', 'Update content pages'),
  permission(
    Permissions.CONTENT_PAGE_PUBLISH,
    'content',
    'page',
    'publish',
    'Publish content pages',
  ),
  permission(
    Permissions.CONTENT_PAGE_ARCHIVE,
    'content',
    'page',
    'archive',
    'Archive content pages',
  ),

  permission(
    Permissions.CONTENT_CATEGORY_READ,
    'content',
    'category',
    'read',
    'Read content categories',
  ),
  permission(
    Permissions.CONTENT_CATEGORY_CREATE,
    'content',
    'category',
    'create',
    'Create content categories',
  ),
  permission(
    Permissions.CONTENT_CATEGORY_UPDATE,
    'content',
    'category',
    'update',
    'Update content categories',
  ),
  permission(
    Permissions.CONTENT_CATEGORY_DELETE,
    'content',
    'category',
    'delete',
    'Delete content categories',
  ),

  permission(Permissions.CONTENT_TAG_READ, 'content', 'tag', 'read', 'Read content tags'),
  permission(Permissions.CONTENT_TAG_CREATE, 'content', 'tag', 'create', 'Create content tags'),
  permission(Permissions.CONTENT_TAG_UPDATE, 'content', 'tag', 'update', 'Update content tags'),
  permission(Permissions.CONTENT_TAG_DELETE, 'content', 'tag', 'delete', 'Delete content tags'),

  permission(Permissions.MEDIA_ASSET_READ, 'media', 'asset', 'read', 'Read media asset metadata'),
  permission(Permissions.MEDIA_ASSET_UPLOAD, 'media', 'asset', 'upload', 'Upload media assets'),
  permission(
    Permissions.MEDIA_ASSET_UPDATE,
    'media',
    'asset',
    'update',
    'Update media asset metadata',
  ),
  permission(Permissions.MEDIA_ASSET_DELETE, 'media', 'asset', 'delete', 'Delete media assets'),
  permission(
    Permissions.MEDIA_ASSET_REGENERATE,
    'media',
    'asset',
    'regenerate',
    'Regenerate media asset variants',
  ),

  permission(Permissions.AUDIT_LOG_READ, 'audit', 'log', 'read', 'Read audit logs'),
  permission(
    Permissions.NOTIFICATION_LOG_READ,
    'notification',
    'log',
    'read',
    'Read notification logs',
  ),
  permission(
    Permissions.ANALYTICS_READ,
    'analytics',
    'analytics',
    'read',
    'Read analytics metadata',
  ),

  permission(
    Permissions.SEARCH_CONTENT_READ,
    'search',
    'content',
    'read',
    'Search published and admin content',
  ),
  permission(Permissions.SEARCH_USER_READ, 'search', 'user', 'read', 'Search admin user records'),
  permission(Permissions.SEARCH_MEDIA_READ, 'search', 'media', 'read', 'Search media assets'),
  permission(
    Permissions.SEARCH_REINDEX,
    'search',
    'index',
    'reindex',
    'Trigger search reindex job',
  ),

  // ─── Phase 1: Game permissions ──────────────────────────────────────────────
  permission(Permissions.GAME_READ, 'game', 'game', 'read', 'Read game list and detail'),
  permission(Permissions.GAME_CREATE, 'game', 'game', 'create', 'Create a game'),
  permission(Permissions.GAME_UPDATE, 'game', 'game', 'update', 'Update game fields'),
  permission(Permissions.GAME_STATUS_UPDATE, 'game', 'status', 'update', 'Update game status'),

  // ─── Phase 1: Tournament permissions ────────────────────────────────────────
  permission(
    Permissions.TOURNAMENT_READ,
    'tournament',
    'tournament',
    'read',
    'Read tournament data (admin)',
  ),
  permission(
    Permissions.TOURNAMENT_CREATE,
    'tournament',
    'tournament',
    'create',
    'Create a tournament',
  ),
  permission(
    Permissions.TOURNAMENT_UPDATE,
    'tournament',
    'tournament',
    'update',
    'Update tournament fields',
  ),
  permission(
    Permissions.TOURNAMENT_PUBLISH,
    'tournament',
    'tournament',
    'publish',
    'Publish a tournament (status transition)',
  ),
  permission(
    Permissions.TOURNAMENT_CANCEL,
    'tournament',
    'tournament',
    'cancel',
    'Cancel a tournament',
  ),
  permission(
    Permissions.TOURNAMENT_ARCHIVE,
    'tournament',
    'tournament',
    'archive',
    'Archive a tournament',
  ),

  // ─── Phase 1: Registration permissions ──────────────────────────────────────
  permission(
    Permissions.TOURNAMENT_REGISTRATION_READ,
    'tournament',
    'registration',
    'read',
    'Read tournament registrations',
  ),
  permission(
    Permissions.TOURNAMENT_REGISTRATION_MANAGE,
    'tournament',
    'registration',
    'manage',
    'Approve or reject tournament registrations',
  ),

  // ─── Phase 1: Participant permissions ────────────────────────────────────────
  permission(
    Permissions.TOURNAMENT_PARTICIPANT_READ,
    'tournament',
    'participant',
    'read',
    'Read tournament participant list',
  ),
  permission(
    Permissions.TOURNAMENT_PARTICIPANT_MANAGE,
    'tournament',
    'participant',
    'manage',
    'Manage tournament participants (seed, disqualify)',
  ),

  // ─── Phase 1: Match permissions (also covers bracket projection read) ─────────
  permission(
    Permissions.TOURNAMENT_MATCH_READ,
    'tournament',
    'match',
    'read',
    'Read tournament matches and bracket projection',
  ),
  permission(
    Permissions.TOURNAMENT_MATCH_MANAGE,
    'tournament',
    'match',
    'manage',
    'Manage tournament match data',
  ),

  // ─── Phase 1: Result permissions (also covers standings recalculation) ────────
  permission(
    Permissions.TOURNAMENT_RESULT_MANAGE,
    'tournament',
    'result',
    'manage',
    'Manage tournament results and trigger standings recalculation',
  ),
] as const satisfies readonly RegisteredPermission[];
