export const ANALYTICS_EVENT_TYPES = [
  'user.registered',
  'user.logged_in',
  'otp.requested',
  'otp.verified',
  'otp.failed',
  'content.viewed',
  'content.published',
  'media.uploaded',
] as const;

export type AnalyticsEventType = (typeof ANALYTICS_EVENT_TYPES)[number];
