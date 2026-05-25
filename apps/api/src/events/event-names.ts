export const EventNames = {
  AUTH_LOGIN_SUCCESS: 'auth.user.login_success',
  AUTH_LOGIN_FAILED: 'auth.user.login_failed',
  AUTH_LOGOUT: 'auth.user.logout',
  AUTH_LOGOUT_ALL: 'auth.user.logout_all',

  PROFILE_UPDATED: 'profile.user.updated',

  MEDIA_AVATAR_UPDATED: 'media.user.avatar_updated',
  MEDIA_AVATAR_DELETED: 'media.user.avatar_deleted',
  MEDIA_ASSET_UPLOADED: 'media.asset.uploaded',
  MEDIA_ASSET_DELETED: 'media.asset.deleted',
  MEDIA_VARIANTS_REGENERATED: 'media.asset.variants_regenerated',

  RBAC_ROLE_CREATED: 'rbac.role.created',
  RBAC_ROLE_UPDATED: 'rbac.role.updated',
  RBAC_ROLE_DEACTIVATED: 'rbac.role.deactivated',
  RBAC_ROLE_ASSIGNED: 'rbac.role.assigned',
  RBAC_ROLE_REMOVED: 'rbac.role.removed',

  CONTENT_POST_CREATED: 'content.post.created',
  CONTENT_POST_UPDATED: 'content.post.updated',
  CONTENT_POST_PUBLISHED: 'content.post.published',
  CONTENT_POST_ARCHIVED: 'content.post.archived',
  CONTENT_POST_SOFT_DELETED: 'content.post.soft_deleted',

  JOB_FAILED: 'job.failed',
  JOB_RETRIED: 'job.retried',

  SEARCH_REINDEX_REQUESTED: 'search.reindex_requested',
  SEARCH_INDEX_CONTENT: 'search.index_content',
  SEARCH_REMOVE_CONTENT: 'search.remove_content',
} as const;

export type EventName = (typeof EventNames)[keyof typeof EventNames];
