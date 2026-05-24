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
