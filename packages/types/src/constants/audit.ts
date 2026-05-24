export const AUDIT_ACTOR_TYPES = ['user', 'admin', 'system', 'job'] as const;
export type AuditActorType = (typeof AUDIT_ACTOR_TYPES)[number];

export const AUDIT_SEVERITIES = ['info', 'warning', 'critical'] as const;
export type AuditSeverity = (typeof AUDIT_SEVERITIES)[number];

export const AUDIT_RESOURCE_TYPES = {
  AUTH: 'auth',
  USER: 'user',
  PROFILE: 'profile',
  ROLE: 'role',
  USER_ROLE: 'user_role',
  ROLE_PERMISSION: 'role_permission',
  CONTENT_POST: 'content_post',
  CONTENT_PAGE: 'content_page',
  CONTENT_CATEGORY: 'content_category',
  CONTENT_TAG: 'content_tag',
  MEDIA_ASSET: 'media_asset',
  SYSTEM: 'system',
} as const;
export type AuditResourceType = (typeof AUDIT_RESOURCE_TYPES)[keyof typeof AUDIT_RESOURCE_TYPES];

export const AuditAction = {
  AUTH_REGISTER_REQUESTED: 'auth.register_requested',
  AUTH_LOGIN_SUCCESS: 'auth.login_success',
  AUTH_LOGIN_FAILED: 'auth.login_failed',
  AUTH_LOGOUT: 'auth.logout',
  AUTH_LOGOUT_ALL: 'auth.logout_all',
  AUTH_PASSWORD_RESET_REQUESTED: 'auth.password_reset_requested',
  AUTH_PASSWORD_RESET_COMPLETED: 'auth.password_reset_completed',

  OTP_CREATED: 'otp.created',
  OTP_VERIFIED: 'otp.verified',
  OTP_FAILED: 'otp.failed',
  OTP_RATE_LIMITED: 'otp.rate_limited',

  USER_STATUS_CHANGED: 'user.status_changed',

  PROFILE_UPDATED: 'profile.updated',

  RBAC_ROLE_CREATED: 'rbac.role_created',
  RBAC_ROLE_UPDATED: 'rbac.role_updated',
  RBAC_ROLE_DEACTIVATED: 'rbac.role_deactivated',
  RBAC_ROLE_ASSIGNED: 'rbac.role_assigned',
  RBAC_ROLE_REMOVED: 'rbac.role_removed',
  RBAC_PERMISSION_ATTACHED: 'rbac.permission_attached',
  RBAC_PERMISSION_DETACHED: 'rbac.permission_detached',

  CONTENT_POST_CREATED: 'content.post_created',
  CONTENT_POST_UPDATED: 'content.post_updated',
  CONTENT_POST_PUBLISHED: 'content.post_published',
  CONTENT_POST_ARCHIVED: 'content.post_archived',
  CONTENT_POST_SOFT_DELETED: 'content.post_soft_deleted',
  CONTENT_PAGE_CREATED: 'content.page_created',
  CONTENT_PAGE_UPDATED: 'content.page_updated',
  CONTENT_PAGE_PUBLISHED: 'content.page_published',
  CONTENT_PAGE_ARCHIVED: 'content.page_archived',
  CONTENT_PAGE_SOFT_DELETED: 'content.page_soft_deleted',
  CONTENT_CATEGORY_CREATED: 'content.category_created',
  CONTENT_CATEGORY_UPDATED: 'content.category_updated',
  CONTENT_CATEGORY_DELETED: 'content.category_deleted',
  CONTENT_TAG_CREATED: 'content.tag_created',
  CONTENT_TAG_UPDATED: 'content.tag_updated',
  CONTENT_TAG_DELETED: 'content.tag_deleted',

  MEDIA_ASSET_UPLOADED: 'media.asset_uploaded',
  MEDIA_ASSET_UPDATED: 'media.asset_updated',
  MEDIA_ASSET_DELETED: 'media.asset_deleted',
  MEDIA_VARIANT_REGENERATED: 'media.variant_regenerated',
  MEDIA_AVATAR_UPDATED: 'media.avatar_updated',
  MEDIA_AVATAR_DELETED: 'media.avatar_deleted',

  JOB_FAILED: 'job.failed',
  JOB_RETRIED: 'job.retried',

  NOTIFICATION_SMS_QUEUED: 'notification.sms_queued',
  NOTIFICATION_SMS_SENT: 'notification.sms_sent',
  NOTIFICATION_SMS_FAILED: 'notification.sms_failed',

  SECURITY_CSRF_FAILED: 'security.csrf_failed',
  SECURITY_ORIGIN_CHECK_FAILED: 'security.origin_check_failed',
} as const;

export type AuditActionKey = keyof typeof AuditAction;
export type AuditActionValue = (typeof AuditAction)[AuditActionKey];
