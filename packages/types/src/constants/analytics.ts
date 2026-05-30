export const ANALYTICS_EVENT_TYPES = [
  'user.registered',
  'user.logged_in',
  'otp.requested',
  'otp.verified',
  'otp.failed',
  'content.viewed',
  'content.published',
  'media.uploaded',
  // ─── Phase 1: Tournament analytics events ────────────────────────────────────
  'tournament.viewed',
  'tournament.registration_started',
  'tournament.registration_completed',
  'tournament.bracket_viewed',
  'tournament.match_viewed',
] as const;

export type AnalyticsEventType = (typeof ANALYTICS_EVENT_TYPES)[number];
