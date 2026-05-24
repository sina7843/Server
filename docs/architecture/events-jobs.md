# Events and Jobs Architecture

## Status

Internal event bus and background jobs foundation implemented in Slice 0.8.3.
SMS queued sending implemented in Slice 0.8.4.
Admin jobs UI implemented in Slice 0.8.5.

## Components

### EventsModule (`apps/api/src/events/`)

Internal event bus using `@nestjs/event-emitter` (EventEmitter2). Events are emitted in-process only. No Kafka, RabbitMQ, or external message broker.

**DomainEvent contract:**

```ts
DomainEvent {
  eventId: string        // UUID v4
  name: string           // domain.entity.action format
  occurredAt: Date

  actorId?: string
  actorType?: 'user' | 'admin' | 'system' | 'job'

  resourceType?: string
  resourceId?: string

  payload: object        // must not contain secrets

  requestId?: string
  correlationId?: string
}
```

**Event naming convention:** `domain.entity.action` (e.g., `auth.user.login_success`)

**Rules:**

- Event payloads must never contain passwords, OTPs, tokens, cookies, or provider secrets.
- Event emission failure is safely handled (EventEmitter2 `ignoreErrors: false` — calling code must wrap if needed).
- No event sourcing, no outbox dispatcher, no saga orchestration.

---

### JobsModule (`apps/api/src/jobs/`)

Background job infrastructure using **BullMQ** with **Redis**. Jobs are enqueued by the API and processed by the worker app.

**Queue registry:**

| Queue         | Purpose                   |
| ------------- | ------------------------- |
| `sms`         | SMS delivery (Task 0.8.4) |
| `media`       | Async media processing    |
| `maintenance` | Cleanup jobs              |

**Job names:**

| Job                                    | Queue       | Status                       |
| -------------------------------------- | ----------- | ---------------------------- |
| `sms.send`                             | sms         | Foundation only (Task 0.8.4) |
| `media.generate_variants`              | media       | Foundation only              |
| `media.regenerate_variants`            | media       | Foundation only              |
| `maintenance.cleanup_expired_sessions` | maintenance | Foundation only              |
| `maintenance.cleanup_expired_otps`     | maintenance | Foundation only              |
| `maintenance.cleanup_unverified_users` | maintenance | Foundation only              |

**Retry policy:**

- Bounded attempts (default: 3, configurable via `BULLMQ_DEFAULT_ATTEMPTS`).
- Exponential backoff (default delay: 2000ms).
- No infinite retry.
- Admin retry endpoint enforces `attempts < maxAttempts`.

---

### JobLog Schema (`job_logs` collection)

Append-only safety: no hard delete. Stores safe payload summary only (redacted).

**Fields:**

| Field            | Type   | Required | Description                                         |
| ---------------- | ------ | -------- | --------------------------------------------------- |
| `queueName`      | string | Yes      | Name of the BullMQ queue                            |
| `jobName`        | string | Yes      | Job type name                                       |
| `bullJobId`      | string | No       | BullMQ internal job ID                              |
| `status`         | enum   | Yes      | queued / processing / completed / failed / retrying |
| `attempts`       | number | Yes      | How many times the job has been attempted           |
| `maxAttempts`    | number | Yes      | Maximum allowed attempts                            |
| `payloadSummary` | object | No       | Redacted payload summary — no secrets               |
| `error`          | string | No       | Last error message on failure                       |
| `startedAt`      | Date   | No       | When processing began                               |
| `completedAt`    | Date   | No       | When processing completed                           |
| `createdAt`      | Date   | Yes      | Auto (timestamps)                                   |
| `updatedAt`      | Date   | Yes      | Auto (timestamps)                                   |

**Indexes:**

1. `{ queueName: 1, createdAt: -1 }`
2. `{ jobName: 1, createdAt: -1 }`
3. `{ status: 1, createdAt: -1 }`
4. `{ bullJobId: 1 }` (sparse)
5. `{ createdAt: -1 }`

---

### JobPayloadRedactor

Recursive secret redaction before any payload data is persisted to `JobLog.payloadSummary`. Same redacted keys as `AuditRedactor`. Does not mutate input.

**Redacted keys:** `password`, `passwordHash`, `rawOtp`, `otp`, `code`, `codeHash`, `refreshToken`, `refreshTokenHash`, `accessToken`, `accessTokenJti`, `resetToken`, `secret`, `secrets`, `clientSecret`, `providerSecret`, `providerCredentials`, `authorization`, `cookie`, `cookies`

---

### JobLogService

Provides `enqueue(input)` — creates a `JobLog`, redacts the payload, and adds the job to the correct BullMQ queue. On BullMQ failure, marks the JobLog as failed.

Also provides: `findById`, `updateStatus`, `list`.

---

### Admin Job APIs

Read-only + safe retry. Both endpoints require `AccessTokenGuard` + `PermissionGuard`.

```
GET  /admin/v1/system/jobs            — paginated list with filters
GET  /admin/v1/system/jobs/:id        — job detail (includes payloadSummary)
POST /admin/v1/system/jobs/:id/retry  — retry a failed job
```

**Permissions:**

- `system.job.read` — required for GET endpoints
- `system.job.retry` — required for POST retry

**Filters (GET /admin/v1/system/jobs):** `queueName`, `jobName`, `status`, `dateFrom`, `dateTo`, `page`, `limit` (max 100)

**Retry guards:**

- Job must be in `failed` status.
- `attempts < maxAttempts` — will not retry beyond the configured limit.

No cancel, no delete, no export.

---

## Worker App (`apps/worker/`)

Standalone Node.js app (no NestJS) using BullMQ `Worker` class directly.

**Architecture:**

- API enqueues jobs → BullMQ (Redis) → Worker processes them
- Worker connects to Redis and MongoDB independently
- Worker updates `JobLog` status via direct MongoDB collection access (no Mongoose schemas)

**Processors:**

- `sms-processor.ts` — handles `sms.*` jobs
- `media-processor.ts` — handles `media.*` jobs
- `maintenance-processor.ts` — handles `maintenance.*` jobs

Each processor receives a `JobStatusUpdater` function for testability (MongoDB dependency is injected, not hardcoded).

**MongoDB:** Optional. If `MONGODB_URI` is not set, JobLog status updates are disabled (no-op updater). Worker still processes jobs.

---

## Redis Configuration

```
REDIS_HOST=localhost       # default
REDIS_PORT=6379            # default
REDIS_PASSWORD=            # optional
REDIS_DB=0                 # default

BULLMQ_DEFAULT_ATTEMPTS=3  # default
BULLMQ_DEFAULT_BACKOFF_MS=2000  # default, exponential backoff
BULLMQ_PREFIX=dragon       # default
```

Redis is required for the API to enqueue jobs. BullMQ uses ioredis internally with automatic reconnection. If Redis is unreachable, job enqueuing fails (JobLog marked `failed`) but the API continues to serve requests.

---

## packages/types Contracts

```ts
JobStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'retrying'
QueueNames = { SMS, MEDIA, MAINTENANCE }
JobNames = { SMS_SEND, MEDIA_GENERATE_VARIANTS, ... }
DomainEventDto
JobLogDto
JobLogListItemDto
JobLogListQueryDto
JobLogListResponseDto
RetryJobResponseDto
```

---

## packages/sdk

```ts
createAdminJobsClient(client).listJobs(params); // GET /admin/v1/system/jobs
createAdminJobsClient(client).getJob(id); // GET /admin/v1/system/jobs/:id
createAdminJobsClient(client).retryJob(id); // POST /admin/v1/system/jobs/:id/retry
```

SDK has no realtime/WebSocket methods, no cancel method, no search/analytics job methods.

---

## Admin UI (`apps/admin`)

```
/system/jobs        — list with filters, pagination, loading/empty/error/forbidden states
/system/jobs/:id    — detail with payloadSummary (redacted), retry action
```

**Nav item:** `jobs` — visible only with `system.job.read` permission.

**Retry action rules:**

- Visible only when `job.status === 'failed'` AND `job.attempts < job.maxAttempts`
- Requires `system.job.retry` permission
- Requires confirmation before executing
- Success and error states shown inline

**Security rules in UI:**

- `payloadSummary` rendered as pre-formatted JSON text — no raw HTML injection
- No raw OTP, password, token, cookie, or provider secret is ever displayed (backend redacts before storing)
- No cancel, delete, or export action

---

## Out of Scope (Slice 0.8)

- Kafka / RabbitMQ
- Full event sourcing
- Outbox dispatcher / saga engine
- Search indexing implementation
- Analytics aggregation implementation
- Backup jobs
- Monitoring stack / realtime dashboard
- WebSocket job dashboard
- Notification center
- Campaigns
