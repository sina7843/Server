# Notifications Architecture

## Status

Notification foundation implemented in Slice 0.8.4.
Admin notifications UI implemented in Slice 0.8.5.

## Components

### NotificationLog Schema (`notification_logs` collection)

Stores one document per notification attempt. Append-friendly with status updates.

**Fields:**

| Field               | Type   | Required | Description                              |
| ------------------- | ------ | -------- | ---------------------------------------- |
| `channel`           | enum   | Yes      | `sms` \| `email`                         |
| `provider`          | string | Yes      | Provider name (e.g., `mock`)             |
| `recipientMasked`   | string | Yes      | Masked display (e.g., `+98***7890`)      |
| `recipientHash`     | string | Yes      | SHA-256 hash for lookup — never raw      |
| `templateKey`       | string | No       | Template key if used                     |
| `purpose`           | string | No       | Business purpose (e.g., `otp`)           |
| `status`            | enum   | Yes      | `queued` / `sent` / `failed` / `skipped` |
| `providerMessageId` | string | No       | Provider's message ID on success         |
| `errorCode`         | string | No       | Error classification code                |
| `errorMessage`      | string | No       | Sanitized error message                  |
| `requestId`         | string | No       | Correlation with inbound request         |
| `correlationId`     | string | No       | Cross-service correlation                |
| `createdAt`         | Date   | Yes      | Auto                                     |
| `updatedAt`         | Date   | Yes      | Auto                                     |

**Security invariants:**

- Raw phone/email never stored — only `recipientMasked` and `recipientHash`
- Raw OTP never stored — `smsBody` is a redacted key in `JobPayloadRedactor`
- `errorMessage` is passed through `sanitizeErrorMessage()` — blocks `password`, `token`, `secret`, `credential`, `key`, `otp` patterns
- `providerMessageId` never contains provider credentials

**Indexes:**

1. `{ channel: 1, createdAt: -1 }`
2. `{ status: 1, createdAt: -1 }`
3. `{ recipientHash: 1, createdAt: -1 }`
4. `{ providerMessageId: 1 }` (sparse)
5. `{ provider: 1, createdAt: -1 }`
6. `{ templateKey: 1, createdAt: -1 }` (sparse)
7. `{ requestId: 1 }` (sparse)
8. `{ correlationId: 1 }` (sparse)
9. `{ createdAt: -1 }`

---

### NotificationTemplate Schema (`notification_templates` collection)

Template registry for reusable message bodies.

**Fields:** `key`, `channel`, `locale`, `body` (with `{{varName}}` placeholders), `variables: string[]`, `isActive`

**Unique index:** `(key, channel, locale)`

---

### SmsService (`apps/api/src/auth/sms/`)

**`sendSms(input)`** — Synchronous mock send. Used directly in unit tests and fallback path.

**`enqueueSms(input)`** — Creates a `queued` `NotificationLog`, then enqueues a `sms.send` BullMQ job with safe payload. Falls back to `sendSms()` when `JobLogService` is not injected (unit test environments).

**Payload keys that are redacted in `payloadSummary`:**

- `smsBody` — contains the OTP text
- `recipientPhoneNormalized` — raw phone number

---

### NotificationService (`apps/api/src/notifications/`)

Admin-facing service. Methods:

- `createQueuedLog()` — creates a notification log in `queued` status
- `createQueuedSmsLog()` — masks phone with `maskPhone()`, hashes with `hashToken()`, creates queued log
- `markSent()`, `markFailed()`, `markSkipped()` — status transitions
- `getLog(id)` — find by ID
- `listLogs(filters, page, limit)` — paginated list
- `findTemplate(key, channel, locale)` — template lookup
- `renderTemplate(body, vars)` — `{{varName}}` substitution

---

### Admin Notification APIs

Read-only. Both endpoints require `AccessTokenGuard` + `PermissionGuard`.

```
GET /admin/v1/system/notifications       — paginated list with filters
GET /admin/v1/system/notifications/:id   — notification detail
```

**Permission:** `notification.log.read`

**Filters (GET list):** `channel`, `status`, `provider`, `templateKey`, `purpose`, `recipientHash`, `dateFrom`, `dateTo`, `page`, `limit` (max 100)

**DTO safety:**

- `NotificationLogListItemDto` — no `recipientHash`, no `errorMessage`
- `NotificationLogDto` — has `recipientMasked` only; no raw phone/email
- No resend, no delete, no mutation endpoint

---

### Worker — SMS Processor (`apps/worker/src/processors/sms-processor.ts`)

Handles `sms.send` BullMQ jobs:

1. Reads `notificationLogId`, `recipientPhoneNormalized`, `smsBody`, `purpose` from job data
2. Calls `sendSmsDirectly()` (mock provider)
3. On success: calls `updateNotificationLog(id, 'sent', { providerMessageId })`
4. On failure: calls `updateNotificationLog(id, 'failed', { errorCode, errorMessage })`

Worker maintains a **separate MongoDB connection** (`notification-log-updater.ts`) for updating `notification_logs` — parallel to the `job-log-updater.ts` connection.

---

## packages/types Contracts

```ts
NotificationChannel = 'sms' | 'email';
NotificationStatus = 'queued' | 'sent' | 'failed' | 'skipped';
NotificationTemplateDto;
NotificationLogDto;
NotificationLogListItemDto;
NotificationLogListQueryDto;
NotificationLogListResponseDto;
```

---

## packages/sdk

```ts
createAdminNotificationsClient(client).listNotificationLogs(params);
// GET /admin/v1/system/notifications
createAdminNotificationsClient(client).getNotificationLog(id);
// GET /admin/v1/system/notifications/:id
```

SDK has no resend, delete, push, campaign, or notification-center methods.

---

## Admin UI (`apps/admin`)

```
/system/notifications       — list with filters, pagination, loading/empty/error/forbidden states
/system/notifications/:id   — detail with recipientMasked, status, provider, errorCode/errorMessage
```

**Nav item:** `notifications` — visible only with `notification.log.read` permission.

**Security rules in UI:**

- Displays `recipientMasked` — never raw phone/email
- Does not display raw OTP
- Does not display provider credentials
- Error messages are pre-sanitized by backend before reaching the UI
- No resend action in Slice 0.8.5
- No notification center
- No campaign UI

---

## Out of Scope (Slice 0.8)

- Email provider integration (real SMTP/SES)
- Production SMS provider (Twilio, Kavenegar, etc.)
- Email designer / template builder UI
- Notification center / user inbox
- Campaign system / marketing notifications
- Push notifications
- Notification preferences UI
- Bulk messaging
- Analytics dashboard
- Realtime notification dashboard
- WebSocket notifications
- User-facing notification inbox
