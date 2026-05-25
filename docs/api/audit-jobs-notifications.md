# Audit Log, Jobs, and Notifications API

---

## Audit Log

The audit log is **append-only**. Entries cannot be modified, deleted, or manually added through the API.

### GET `/admin/v1/audit-logs` — `audit.log.read`

List audit log entries. Paginated. Max limit: 100.

**Query params:**

| Param      | Type              | Notes                                     |
| ---------- | ----------------- | ----------------------------------------- |
| `userId`   | string (ObjectId) | Filter by acting user                     |
| `action`   | string            | Filter by action type (e.g. `user.login`) |
| `resource` | string            | Filter by resource type                   |
| `page`     | number            | 1-based                                   |
| `limit`    | number            | Max 100                                   |

**Response `200`:**

```json
{
  "items": [
    {
      "id": "...",
      "userId": "...",
      "action": "user.login",
      "resource": "session",
      "resourceId": "...",
      "metadata": { ... },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 500,
  "page": 1,
  "limit": 20
}
```

**Security:** Audit log entries are redacted before storage. The `metadata` field never contains raw OTP codes, passwords, refresh tokens, access tokens, or raw phone numbers. Redaction is case-insensitive and covers mixed-case key names.

---

### GET `/admin/v1/audit-logs/:id` — `audit.log.read`

Single audit log entry.

**Response `200`:** Single audit entry object.

---

## BullMQ Jobs

Job management is read-only via the admin API. Jobs are enqueued internally by the API/worker and cannot be created via the admin API.

### GET `/admin/v1/system/jobs` — `system.job.read`

List job log entries.

**Response `200`:**

```json
{
  "items": [
    {
      "id": "...",
      "queue": "notifications",
      "jobName": "send.sms",
      "status": "completed",
      "payload": { "recipient": "***00", "templateId": "otp" },
      "attempts": 1,
      "error": null,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "completedAt": "2024-01-01T00:00:01.000Z"
    }
  ],
  "total": 20,
  "page": 1,
  "limit": 20
}
```

Job payloads are redacted before logging. Sensitive keys (phone, OTP, tokens, passwords) are replaced with `"[REDACTED]"`. Redaction is case-insensitive.

---

### GET `/admin/v1/system/jobs/:id` — `system.job.read`

Single job log entry.

---

### POST `/admin/v1/system/jobs/:id/retry` — `system.job.retry`

Enqueues a retry for a failed job. Only jobs with `status: "failed"` can be retried.

**Response `201`:** Updated job log entry with incremented attempt count.

**Errors:** `400` if job is not in failed state · `404` job not found

---

## Notifications

Notification logs are read-only records of SMS and other notifications dispatched by the system.

### GET `/admin/v1/system/notifications` — `notification.log.read`

List notification log entries.

**Response `200`:**

```json
{
  "items": [
    {
      "id": "...",
      "channel": "sms",
      "templateId": "otp",
      "recipientMasked": "***4567",
      "status": "sent",
      "sentAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 20
}
```

**Security invariants:**

- `recipientPhone` (full phone number) is **never** returned in any response.
- Only `recipientMasked` (last 4 digits visible) is included.
- Raw OTP codes are never logged or returned.
- SMS body text is never returned.

---

### GET `/admin/v1/system/notifications/:id` — `notification.log.read`

Single notification log entry. Same field restrictions apply.

---

## Known limitations (Phase 0)

- **Audit:** No audit log export. No graphical timeline view. Viewer is read-only list/detail only.
- **Jobs:** No job queue visualization (no Bull Board or equivalent UI). No job cancellation via API.
- **Notifications:** No notification campaign feature. No bulk SMS dispatch API. No notification center or inbox for end users. Logs record system-generated notifications only (OTP delivery, etc.).
- **BullMQ:** Worker queues are implemented but job processing is not visible in real time — only the log entries written by the processor are queryable.
