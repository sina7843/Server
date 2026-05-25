# Slice 0.8 Verification Guide

## Task 0.8.1 — AuditLog Foundation and Integration

### What was built

**packages/types**

- `AuditActorType` union type: `'user' | 'admin' | 'system' | 'job'`
- `AuditSeverity` union type: `'info' | 'warning' | 'critical'`
- `AUDIT_RESOURCE_TYPES` constant map (12 resource types)
- `AuditAction` constant object (40+ namespaced action strings)
- `AuditLogDto` and `AuditLogListItemDto` contract interfaces

**apps/api/src/audit/**

- `audit-log.schema.ts` — Mongoose schema, append-only (`updatedAt` suppressed), 5 indexes
- `audit-log.repository.ts` — `create()` and `findById()` only; no update/delete
- `audit-redactor.ts` — recursive secret redaction, no mutation
- `audit.service.ts` — best-effort writer, catches all errors
- `audit.module.ts` — leaf module, safe to import anywhere

**Integration hooks added to:**

- `auth.service.ts` — login success/failure, logout, logout-all
- `profile.service.ts` — profile updated
- `avatar.service.ts` — avatar set, upload-and-set, delete
- `role.service.ts` — role created/updated/deactivated (admin)
- `user-role.service.ts` — role assigned/removed
- `role-permission.service.ts` — permission attached/detached
- `admin-content-posts.service.ts` — post created/updated/published/archived/soft-deleted
- `admin-media.service.ts` — media uploaded/deleted, variants regenerated

**Modules updated to import AuditModule:**

- `auth.module.ts`
- `profile.module.ts`
- `rbac.module.ts`
- `admin-content.module.ts`
- `media.module.ts`

### Verification commands

```bash
# Types package
pnpm --filter @dragon/types lint
pnpm --filter @dragon/types typecheck
pnpm --filter @dragon/types test
pnpm --filter @dragon/types build

# API
pnpm --filter @dragon/api lint
pnpm --filter @dragon/api typecheck
pnpm --filter @dragon/api test
pnpm --filter @dragon/api build

# Root
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm format:check
```

### Expected test counts

After Task 0.8.1, the `@dragon/api` test suite should include:

- `audit-log.schema.spec.ts` — schema field and index tests
- `audit-log.repository.spec.ts` — create/findById, no update/delete
- `audit-redactor.spec.ts` — ~25 tests covering key coverage, nesting, arrays, non-mutation
- `audit.service.spec.ts` — ~20 tests covering write, redaction, best-effort failure

### Security invariants

1. No secret key (`password`, `otp`, `refreshToken`, `accessToken`, etc.) ever appears in a persisted audit log.
2. AuditService.log() never throws. A failing write produces a structured error log only.
3. AuditLogRepository has no update or delete methods.
4. `audit_logs` documents have no `updatedAt` field.

### Out of scope for Task 0.8.1

Admin audit viewer API (`GET /admin/v1/audit-logs`, `GET /admin/v1/audit-logs/:id`) — implemented in Task 0.8.2.

---

## Task 0.8.2 — Audit Admin APIs and Viewer

### What was built

**apps/api/src/admin/audit/**

- `admin-audit.controller.ts` — `GET /admin/v1/audit-logs` and `GET /admin/v1/audit-logs/:id`, both protected by `AccessTokenGuard` + `PermissionGuard` with `audit.log.read`
- `admin-audit.service.ts` — list with filters/pagination and get-by-id
- `admin-audit.module.ts` — imports `AuditModule` (for `AuditLogRepository`) and `RbacModule`
- `dto/admin-audit-query.ts` — parser and validator for all query filters
- `dto/admin-audit-response.ts` — safe DTO mappers (no secrets)
- `admin-audit.controller.spec.ts` — controller and query parser tests

**apps/api/src/audit/**

- `audit-log.repository.ts` — added `list(filters, page, limit)` method (sorted newest-first)
- `audit-log.types.ts` — added `AuditLogFilters` interface
- `audit.module.ts` — now also exports `AuditLogRepository`

**Permission wiring**

- `role-permission-registry.ts` — `AUDIT_LOG_READ` added to `admin` role
- `app.module.ts` — `AdminAuditModule` registered

**packages/types**

- `AuditLogDetailDto` (type alias for `AuditLogDto`)
- `AuditLogListQueryDto`
- `AuditLogListResponseDto`

**packages/sdk**

- `admin-audit-types.ts` — `AdminAuditListParams`, `AdminAuditClient`
- `admin-audit.ts` — `createAdminAuditClient()` with `listAuditLogs()` and `getAuditLog()`

**apps/admin**

- `features/audit/admin-audit.api.ts` — thin SDK wrapper
- `composables/useAuditLogs.ts` — list + detail state with loading/error management
- `pages/audit/index.vue` — list page with all filters, pagination, loading/empty/error/forbidden states
- `pages/audit/[id].vue` — detail page with `AuditDiffViewer`, loading/error/not-found states
- `components/audit/AuditDiffViewer.vue` — safe before/after/metadata JSON viewer (escaped text, no HTML rendering)
- `features/navigation/admin-navigation.ts` — audit nav item with `audit.log.read` permission gate

### Security invariants

1. No `POST`, `PATCH`, or `DELETE` admin audit endpoint exists.
2. Both admin endpoints require `audit.log.read` — requests without it get 403.
3. List response uses `AuditLogListItemDto` — no `before`, `after`, or `metadata`.
4. Detail response exposes redaction-already-applied data only — no re-hydration.
5. Admin frontend renders audit data as escaped JSON text — no raw HTML injection.
6. SDK `AdminAuditClient` has no mutation methods.
7. Audit nav item hidden without `audit.log.read`.

### Out of scope for Task 0.8.2

Export, purge/retention, SIEM, anomaly detection, full event sourcing, Jobs, Notifications.

---

## Task 0.8.3 — Internal Event Bus and BullMQ Jobs Foundation

### What was built

**apps/api/src/events/**

- `domain-event.ts` — `DomainEvent` interface + `createDomainEvent()` factory
- `event-names.ts` — `EventNames` constant map (domain.entity.action convention)
- `events.module.ts` — `EventsModule` wrapping `@nestjs/event-emitter`
- `events.module.spec.ts` — DomainEvent contract and EventNames tests

**apps/api/src/jobs/**

- `queue-registry.ts` — `QueueNames` and `JobNames` constants
- `job-log.schema.ts` — Mongoose schema, 5 indexes, `updatedAt` enabled
- `job-log.schema.spec.ts` — schema field and index tests
- `job-log.repository.ts` — `create()`, `findById()`, `updateStatus()`, `list()` — no delete
- `job-log.repository.spec.ts` — CRUD tests
- `job-payload-redactor.ts` — Injectable recursive secret redactor
- `job-payload-redactor.spec.ts` — ~25 tests covering all secret keys, nesting, arrays, non-mutation
- `job-log.service.ts` — `enqueue()`, `findById()`, `updateStatus()`, `list()`
- `job-log.service.spec.ts` — enqueue tests, redaction, failure handling
- `jobs.module.ts` — `BullModule.forRootAsync()` + 3 registered queues

**apps/api/src/admin/jobs/**

- `admin-jobs.controller.ts` — `GET /admin/v1/system/jobs`, `GET :id`, `POST :id/retry`
- `admin-jobs.service.ts` — list, get, retry with bounds check
- `admin-jobs.module.ts` — imports `JobsModule` and `RbacModule`
- `dto/admin-jobs-query.ts` — query parser and validator
- `dto/admin-jobs-response.ts` — DTO mappers
- `admin-jobs.controller.spec.ts` — controller tests

**apps/api/src/config/**

- `redis.config.ts` — `getBullMQConfig()` with optional env var defaults
- `redis.config.spec.ts` — config validation tests
- `app-config.module.ts` — now provides `BULLMQ_CONFIG` globally

**apps/worker/src/**

- `processors/processor-types.ts` — `JobStatusUpdater` type
- `processors/sms-processor.ts` — `processSmsJob()` (foundation; SMS sending is Task 0.8.4)
- `processors/sms-processor.spec.ts` — processing/completed/failed tests
- `processors/media-processor.ts` — `processMediaJob()` (foundation)
- `processors/media-processor.spec.ts` — tests
- `processors/maintenance-processor.ts` — `processMaintenanceJob()` (foundation)
- `processors/maintenance-processor.spec.ts` — tests
- `job-log-updater.ts` — MongoDB-backed `JobStatusUpdater` + noop variant
- `queue-worker.ts` — `startQueueWorkers()`, `stopQueueWorkers()`, `getRedisConfigFromEnv()`
- `main.ts` — updated to start BullMQ workers on startup

**Permission wiring**

- `permission-keys.ts` — `SYSTEM_JOB_RETRY` added
- `role-permission-registry.ts` — `SYSTEM_JOB_RETRY` added to `admin` role
- `app.module.ts` — `EventsModule`, `JobsModule`, `AdminJobsModule` registered

**packages/types**

- `contracts/jobs.ts` — `JobStatus`, `QueueNames`, `JobNames`, `DomainEventDto`, `JobLogDto`, `JobLogListItemDto`, `JobLogListQueryDto`, `JobLogListResponseDto`, `RetryJobResponseDto`

**packages/sdk**

- `admin-jobs-types.ts` — `AdminJobsListParams`, `AdminJobsClient`
- `admin-jobs.ts` — `createAdminJobsClient()` with `listJobs()`, `getJob()`, `retryJob()`
- `admin-jobs.spec.ts` — SDK method tests

**Docs created/updated**

- `docs/architecture/events-jobs.md`
- `docs/security/jobs-notifications-security-checklist.md`
- `docs/development/slice-0.8-verification.md` (this file)
- `apps/api/.env.example` — Redis/BullMQ vars added
- `apps/worker/.env.example` — Redis/BullMQ/MongoDB vars added

### Verification commands

```bash
pnpm --filter @dragon/api lint
pnpm --filter @dragon/api typecheck
pnpm --filter @dragon/api test
pnpm --filter @dragon/api build

pnpm --filter @dragon/worker lint
pnpm --filter @dragon/worker typecheck
pnpm --filter @dragon/worker test
pnpm --filter @dragon/worker build

pnpm --filter @dragon/sdk lint
pnpm --filter @dragon/sdk typecheck
pnpm --filter @dragon/sdk test
pnpm --filter @dragon/sdk build

pnpm --filter @dragon/types lint
pnpm --filter @dragon/types typecheck
pnpm --filter @dragon/types test
pnpm --filter @dragon/types build

pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm format:check
```

### Security invariants

1. `JobPayloadRedactor` redacts all known secret keys recursively — no raw OTP, password, or token in `payloadSummary`.
2. Retry endpoint enforces `attempts < maxAttempts` — no infinite retry.
3. Retry endpoint requires `system.job.retry` — requests without it get 403.
4. No delete or cancel job endpoint exists.
5. `JobLogListItemDto` does not expose `payloadSummary`.
6. Worker connects to MongoDB and Redis via env vars only — no hardcoded credentials.
7. Worker starts safely without MongoDB (`MONGODB_URI` optional — falls back to noop updater).

### Out of scope for Task 0.8.3

Kafka, RabbitMQ, full event sourcing, saga engine, search indexing, analytics aggregation, backup jobs, monitoring stack, realtime dashboard, WebSocket job dashboard, admin jobs frontend UI (Task 0.8.5), SMS queued sending (Task 0.8.4), notifications, notification center, campaigns.

---

## Task 0.8.4 — Notification/SMS Logging and Queued Sending

### What was built

**packages/types**

- `contracts/notifications.ts` — `NotificationChannel`, `NotificationStatus`, `NotificationTemplateDto`, `NotificationLogDto`, `NotificationLogListItemDto`, `NotificationLogListQueryDto`, `NotificationLogListResponseDto`

**apps/api/src/auth/notifications/**

- `notification-log.schema.ts` — extended with 8 indexes (including sparse for optional fields)
- `notification-log.repository.ts` — added `findById()`, `updateStatus()`, `list()` methods
- `notification-log.service.ts` — added `updateStatus()` delegation

**apps/api/src/auth/sms/sms.service.ts**

- Added `enqueueSms(input)` — creates queued `NotificationLog`, enqueues `sms.send` via BullMQ, falls back to `sendSms()` when `JobLogService` not injected
- `auth.service.ts` and `password-reset.service.ts` now call `enqueueSms()` instead of `sendSms()`

**apps/api/src/jobs/job-payload-redactor.ts**

- Added `smsBody` and `recipientPhoneNormalized` to redacted keys — OTP and raw phone never appear in `payloadSummary`

**apps/api/src/notifications/**

- `notification-template.schema.ts` — schema + unique(key, channel, locale) index
- `notification-template.repository.ts` — `findTemplate()` and `create()`
- `notification.service.ts` — admin-facing; `createQueuedSmsLog()` masks/hashes phone; `sanitizeErrorMessage()` blocks sensitive patterns from error fields
- `notifications.module.ts` — re-registers `NotificationLog`; exports `NotificationService`

**apps/api/src/admin/notifications/**

- `admin-notifications.controller.ts` — `GET /admin/v1/system/notifications` and `GET :id`, both with `notification.log.read` permission
- `admin-notifications.service.ts` — list and get-by-id
- `dto/admin-notifications-query.ts` — validated filters
- `dto/admin-notifications-response.ts` — safe DTO mappers

**Permission wiring**

- `permission-keys.ts` — `NOTIFICATION_LOG_READ: 'notification.log.read'`
- `role-permission-registry.ts` — `NOTIFICATION_LOG_READ` added to `admin` role
- `app.module.ts` — `AdminNotificationsModule` registered

**apps/worker/src/**

- `sms/sms-sender.ts` — `sendSmsDirectly()` mock provider
- `notification-log-updater.ts` — separate MongoDB connection for `notification_logs` updates
- `processors/sms-processor.ts` — rewritten with 3rd arg `updateNotificationLog`; implements `sms.send`: calls provider, marks sent/failed
- `queue-worker.ts` — `QueueWorkerOptions.notificationLogUpdater` added
- `main.ts` — connects notification log MongoDB, passes updater to `startQueueWorkers()`

**packages/sdk**

- `admin-notifications-types.ts` — `AdminNotificationsListParams`, `AdminNotificationsClient`
- `admin-notifications.ts` — `createAdminNotificationsClient()` with `listNotificationLogs()` and `getNotificationLog()`

### Security invariants

1. Raw OTP is never stored in `payloadSummary` — `smsBody` is a redacted key.
2. Raw phone is never stored in `payloadSummary` — `recipientPhoneNormalized` is a redacted key.
3. `recipientMasked` uses `maskPhone()` — only last 4 digits visible.
4. `recipientHash` uses SHA-256 — irreversible.
5. `errorMessage` sanitized via `sanitizeErrorMessage()` — blocks credential leak patterns.
6. No POST/PATCH/DELETE notification endpoint exists.
7. Both GET endpoints require `notification.log.read`.

### Out of scope for Task 0.8.4

Admin notifications UI (Task 0.8.5), real SMS provider, email provider, notification center, campaigns, push notifications, email designer, bulk messaging, analytics, realtime dashboard.

---

## Task 0.8.5 — Operations Views for Jobs and Notifications

### What was built

**packages/types/src/constants/permissions.ts**

- Added `NOTIFICATION_LOG_READ: 'notification.log.read'` to `DragonPermissions`

**packages/sdk/src/admin-jobs-types.ts**

- Added `JobLogListItemDto` and `JobStatus` to re-exports (were missing)

**apps/admin/features/jobs/**

- `admin-jobs.api.ts` — thin SDK wrappers: `listJobs()`, `getJob()`, `retryJob()`
- `admin-jobs.api.spec.ts` — ~15 tests: request paths, query params, security invariants, no realtime/cancel methods

**apps/admin/features/notifications/**

- `admin-notifications.api.ts` — thin SDK wrappers: `listNotificationLogs()`, `getNotificationLog()`
- `admin-notifications.api.spec.ts` — ~15 tests: request paths, query params, recipient safety, no mutation/push/campaign methods

**apps/admin/composables/**

- `useSystemJobs.ts` — list + detail + retry state with loading/error management
- `useNotificationLogs.ts` — list + detail state with loading/error management

**apps/admin/features/navigation/admin-navigation.ts**

- Added `jobs` nav item (`/system/jobs`, `system.job.read`)
- Added `notifications` nav item (`/system/notifications`, `notification.log.read`)

**apps/admin/features/navigation/admin-navigation.spec.ts**

- Updated to include `jobs` and `notifications` in `ALLOWED_KEYS`
- Added permission-gate tests for both new items
- Removed stale test asserting jobs/notifications were absent

**apps/admin/pages/system/**

- `jobs.vue` — list page with filters (queueName, status, jobName, date range), pagination, loading/empty/error/forbidden states
- `jobs/[id].vue` — detail page: safe `payloadSummary` as pre-formatted JSON text; retry action with confirmation (visible only for `failed` jobs under `maxAttempts` with `system.job.retry`)
- `notifications.vue` — list page with filters (channel, status, provider, templateKey, purpose, date range), pagination, all states
- `notifications/[id].vue` — detail page: `recipientMasked` only, safe `errorCode`/`errorMessage`, no resend action
- `index.vue` — updated to include permission-aware links to jobs and notifications

**Docs**

- `docs/architecture/events-jobs.md` — updated status; added Admin UI section
- `docs/architecture/notifications.md` — created; full architecture for Slice 0.8.4–0.8.5
- `docs/security/jobs-notifications-security-checklist.md` — all items checked
- `docs/development/slice-0.8-verification.md` — this file, Tasks 0.8.4 and 0.8.5 sections added

### Verification commands

```bash
pnpm --filter @dragon/admin lint
pnpm --filter @dragon/admin typecheck
pnpm --filter @dragon/admin test
pnpm --filter @dragon/admin build

pnpm --filter @dragon/sdk lint
pnpm --filter @dragon/sdk typecheck
pnpm --filter @dragon/sdk test
pnpm --filter @dragon/sdk build

pnpm --filter @dragon/types lint
pnpm --filter @dragon/types typecheck
pnpm --filter @dragon/types test
pnpm --filter @dragon/types build

pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm format:check
```

### Security invariants

1. Jobs nav item hidden without `system.job.read`.
2. Notifications nav item hidden without `notification.log.read`.
3. `payloadSummary` rendered as escaped pre-formatted JSON text — no raw HTML injection.
4. Retry requires `system.job.retry` permission, `status === 'failed'`, and `attempts < maxAttempts`.
5. Retry requires user confirmation before executing.
6. Notifications UI shows only `recipientMasked` — no raw phone/email.
7. Notifications UI shows no raw OTP, SMS body, or provider credentials.
8. No resend action in Slice 0.8.5.
9. No `/system/backups` route exists.
10. No analytics, monitoring, or realtime dashboard exists.
11. No notification center, campaign, or push notification UI exists.
12. SDK clients have no WebSocket/realtime, cancel, export, campaign, or backup methods.

### Out of scope for Task 0.8.5

Backup page (`/system/backups`), analytics dashboard, monitoring dashboard, realtime/WebSocket dashboard, WebSocket job subscription, notification center, user notification inbox, campaign UI, email designer, push notification UI, notification preferences UI, bulk messaging, coming-soon placeholder pages.

---

## Slice 0.8 Audit & Notification Hardening Fixes

Post-slice hardening applied after Task 0.8.5. No new routes, dependencies, or features were introduced.

### Fix 1 — Missing Audit Hooks

Added audit integration points that were out of scope during initial implementation tasks:

**Auth registration and password reset** (`auth.service.ts`, `password-reset.service.ts`):

- `auth.register_requested` — fired at registration entry point; `actorType: 'system'`; metadata: `phoneMasked` only
- `otp.created` — fired after OTP challenge creation; no raw OTP or codeHash
- `otp.verified` — fired after successful OTP check; `actorType: 'user'` when userId available
- `otp.failed` — fired after failed OTP attempt; severity: `warning`; no raw OTP
- `otp.rate_limited` — fired when rate limit is hit; severity: `warning`; metadata: `phoneMasked`, `purpose`
- `auth.password_reset_requested` — fired on forgot-password; no raw phone or token
- `auth.password_reset_completed` — fired after successful reset; no new password or reset token

New `AuditAction` constant added to `packages/types/src/constants/audit.ts`: `USER_SESSION_REVOKED`.

**Admin users** (`admin-users.service.ts`, `admin-users.controller.ts`, `admin-users.module.ts`):

- `user.status_changed` — `before: { status }`, `after: { status }`; no phone, no tokens
- `user.session_revoked` — metadata: `{ sessionId }`; no phone, no tokens
- `AuditModule` imported into `AdminUsersModule`

**Content pages** (`admin-content-pages.service.ts`, `admin-content-pages.controller.ts`):

- `content.page_created`, `content.page_updated`, `content.page_published`, `content.page_archived`, `content.page_soft_deleted`

**Content categories** (`admin-content-categories.controller.ts`):

- `content.category_created`, `content.category_updated`, `content.category_deleted`

**Content tags** (`admin-content-tags.controller.ts`):

- `content.tag_created`, `content.tag_updated`, `content.tag_deleted`

### Fix 2 — Notification Error Sanitization (Legacy Auth Path)

New file: `apps/api/src/auth/notifications/notification-error-sanitizer.ts`

`sanitizeNotificationErrorMessage()` applies the same pattern-based sanitization as the main `NotificationService` path. Applied in:

- `notification-log.service.ts` `createSmsLog()` — when `input.errorMessage` is present
- `notification-log.repository.ts` `updateStatus()` — before any `errorMessage` DB write

Sensitive patterns: `password|token|secret|credential|key|otp|authorization|cookie` (case-insensitive). Safe messages truncated to 500 characters.

### Fix 3 — ObjectId Validation for Admin Notification Detail

`admin-notifications.service.ts` `getNotificationLog(rawId)` now calls `validateObjectId(rawId, 'id')` before the repository call. An invalid ObjectId string returns `400 Bad Request`; a valid ObjectId with no matching document returns `404 Not Found`. Mongoose CastError is never surfaced.

### Fix 4 — AuditRedactor Case-Insensitive Globally

`audit-redactor.ts` now matches all keys case-insensitively at every nesting depth (not only for `authorization`/`cookie` inside `headers` objects). Implementation: all entries in `REDACTED_KEYS` are stored lowercase; the lookup uses `key.toLowerCase()`.

### Security invariants after hardening

1. Raw OTP, codeHash, password, newPassword, resetToken, refreshToken, and accessToken are never stored in any audit log entry — enforced by OTP/auth hook design and AuditRedactor.
2. `phoneNormalized` (full phone) is never stored in audit metadata — only `phoneMasked` via `maskPhone()`.
3. `errorMessage` in `notification_logs` is sanitized before storage across both notification paths.
4. Invalid ObjectIds passed to `GET /admin/v1/system/notifications/:id` return 400, not 500.
5. AuditRedactor secret-key redaction is case-insensitive for all keys at all nesting depths.
