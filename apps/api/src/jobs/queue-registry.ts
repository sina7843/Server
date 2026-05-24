export const QueueNames = {
  SMS: 'sms',
  MEDIA: 'media',
  MAINTENANCE: 'maintenance',
} as const;

export type QueueName = (typeof QueueNames)[keyof typeof QueueNames];

export const ALL_QUEUE_NAMES = Object.values(QueueNames) as QueueName[];

export const JobNames = {
  SMS_SEND: 'sms.send',

  MEDIA_GENERATE_VARIANTS: 'media.generate_variants',
  MEDIA_REGENERATE_VARIANTS: 'media.regenerate_variants',

  MAINTENANCE_CLEANUP_EXPIRED_SESSIONS: 'maintenance.cleanup_expired_sessions',
  MAINTENANCE_CLEANUP_EXPIRED_OTPS: 'maintenance.cleanup_expired_otps',
  MAINTENANCE_CLEANUP_UNVERIFIED_USERS: 'maintenance.cleanup_unverified_users',
} as const;

export type JobName = (typeof JobNames)[keyof typeof JobNames];
