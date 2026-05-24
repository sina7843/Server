# Jobs and Notifications Security Checklist

## Job Payload Safety

- [x] `JobPayloadRedactor` redacts all secret keys before storing in `payloadSummary`.
- [x] Redacted keys include: `password`, `passwordHash`, `rawOtp`, `otp`, `code`, `codeHash`, `refreshToken`, `refreshTokenHash`, `accessToken`, `accessTokenJti`, `resetToken`, `secret`, `secrets`, `clientSecret`, `providerSecret`, `providerCredentials`, `authorization`, `cookie`, `cookies`, `smsBody`, `recipientPhoneNormalized`.
- [x] Redaction is recursive (nested objects and arrays).
- [x] `JobPayloadRedactor` does not mutate its input.
- [x] No raw OTP is ever stored in `payloadSummary`.
- [x] No password or password hash is ever stored in `payloadSummary`.
- [x] No access or refresh tokens are ever stored in `payloadSummary`.
- [x] No large binary or file buffer data is stored in `payloadSummary`.

## Retry Safety

- [x] Retry endpoint requires `system.job.retry` permission.
- [x] Retry is rejected if `job.status !== 'failed'`.
- [x] Retry is rejected if `job.attempts >= job.maxAttempts` (no infinite retry).
- [x] BullMQ retry failure is logged but does not crash the retry endpoint.
- [x] Retry permission (`system.job.retry`) is centralized in `permission-keys.ts` — no raw string in controller.

## Admin Job APIs

- [x] Both GET endpoints require `system.job.read` permission.
- [x] POST retry endpoint requires `system.job.retry` permission.
- [x] Both GET and POST endpoints require `AccessTokenGuard`.
- [x] No `DELETE`, `PATCH`, or bulk-mutation job endpoint exists.
- [x] `payloadSummary` returned in detail response has already been redacted at write time — no re-hydration.
- [x] List response (`JobLogListItemDto`) does not include `payloadSummary`.
- [x] Missing auth returns 401 Unauthorized.
- [x] Missing permission returns 403 Forbidden.

## Admin Jobs UI

- [x] Jobs nav item is visible only with `system.job.read` permission.
- [x] `/system/jobs` uses SDK composable — no scattered direct fetch calls.
- [x] `/system/jobs` handles loading, empty, error, and forbidden states.
- [x] `/system/jobs/:id` renders `payloadSummary` as pre-formatted escaped JSON text — no raw HTML injection.
- [x] Retry action is visible only with `system.job.retry` permission AND `status === 'failed'` AND `attempts < maxAttempts`.
- [x] Retry requires confirmation before executing.
- [x] No `/system/backups` route exists.
- [x] No analytics, monitoring, or realtime dashboard exists.
- [x] No WebSocket or realtime job subscription exists.

## Worker Security

- [x] Worker connects to Redis with configurable credentials — no hardcoded secrets.
- [x] Worker connects to MongoDB with configurable URI — no hardcoded credentials.
- [x] Worker does not log full job payloads (only job name and error messages).
- [x] Worker processors do not re-emit sensitive data in error messages.
- [x] MongoDB connection is optional in the worker — worker starts safely without it.

## Redis / BullMQ Config

- [x] `REDIS_PASSWORD` is never committed to source control.
- [x] `.env.example` contains only placeholder/empty values for credentials.
- [x] `BULLMQ_DEFAULT_ATTEMPTS` is bounded (default: 3, must be positive integer).
- [x] No unlimited retry is possible via config (max configurable, not infinite).

## Event Payload Safety

- [x] `DomainEvent.payload` must not contain passwords, OTPs, tokens, cookies, or provider secrets.
- [x] Event names follow `domain.entity.action` convention — no sensitive data in names.
- [x] Internal event bus only — no external broker in Slice 0.8.

## Notification Recipient Safety

- [x] Raw phone/email recipient is never stored — only `recipientMasked` and `recipientHash`.
- [x] `recipientMasked` uses `maskPhone()` — shows only last 4 digits.
- [x] `recipientHash` uses SHA-256 via `hashToken()` — irreversible.
- [x] `smsBody` (contains OTP text) is a redacted key in `JobPayloadRedactor`.
- [x] `recipientPhoneNormalized` is a redacted key in `JobPayloadRedactor`.

## Notification Error Safety

- [x] `errorMessage` passed through `sanitizeErrorMessage()` before storage.
- [x] `sanitizeErrorMessage()` returns generic message if errorMessage matches `password|token|secret|credential|key|otp` patterns.
- [x] No provider credentials (API keys, secrets) ever stored in `errorMessage` or `errorCode`.
- [x] Provider message ID (`providerMessageId`) does not contain credentials — safe to store and display.

## Admin Notification APIs

- [x] Both GET endpoints require `notification.log.read` permission.
- [x] Both endpoints require `AccessTokenGuard`.
- [x] No POST, PATCH, DELETE, or resend endpoint exists.
- [x] `NotificationLogListItemDto` does not include `recipientHash` or `errorMessage`.
- [x] `NotificationLogDto` exposes `recipientMasked` only — no raw phone/email.
- [x] Missing auth returns 401 Unauthorized.
- [x] Missing permission returns 403 Forbidden.

## Admin Notifications UI

- [x] Notifications nav item is visible only with `notification.log.read` permission.
- [x] `/system/notifications` uses SDK composable — no scattered direct fetch calls.
- [x] `/system/notifications` handles loading, empty, error, and forbidden states.
- [x] `/system/notifications/:id` shows `recipientMasked` — never raw phone/email.
- [x] UI does not display raw OTP or SMS body content.
- [x] UI does not display provider credentials.
- [x] No resend action exists in Slice 0.8.
- [x] No notification center or campaign UI exists.
- [x] No user notification inbox exists.

## Scope Limits

- [x] No Kafka or RabbitMQ integration exists.
- [x] No full event sourcing exists.
- [x] No saga engine exists.
- [x] No real search or analytics job implementation exists.
- [x] No backup jobs exist.
- [x] No notification center or campaign system exists.
- [x] No realtime/WebSocket job or notification dashboard exists.
- [x] SDK `AdminJobsClient` has no cancel, delete, export, or realtime methods.
- [x] SDK `AdminNotificationsClient` has no resend, push, campaign, or notification-center methods.
- [x] No `/system/backups` route exists.
- [x] No analytics, monitoring, or future placeholder nav items exist.
