# System, Health, and Backup API

---

## Health probes

Health endpoints are **public** (no auth required) and are used by the load balancer, Docker healthcheck, and deployment smoke tests.

### GET `/health/live`

Liveness probe. Returns 200 as long as the Node.js process is running. Does not check dependencies.

**Response `200`:**

```json
{
  "status": "ok",
  "service": "api",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

### GET `/health/ready`

Readiness probe. Checks MongoDB and Redis connectivity.

**Response `200`** (all dependencies healthy):

```json
{
  "status": "ok",
  "service": "api",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "dependencies": {
    "mongodb": { "status": "ok" },
    "redis": { "status": "ok" },
    "storage": { "status": "ok" }
  }
}
```

**Response `503`** (any dependency is down):

```json
{
  "status": "down",
  "service": "api",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "dependencies": {
    "mongodb": { "status": "down" },
    "redis": { "status": "ok" },
    "storage": { "status": "unknown" }
  }
}
```

Dependency status values: `"ok"` | `"down"` | `"degraded"` | `"unknown"`.

`storage` status is `"unknown"` when `STORAGE_PROVIDER=local` (no reachability check is possible for the local adapter).

---

### GET `/health/dependencies`

Full dependency status. Always returns 200 regardless of dependency state (unlike `/health/ready`). Intended for monitoring dashboards.

**Response `200`:** Same shape as `/health/ready` response, but always HTTP 200.

---

### GET `/admin/v1/system/health` — `system.health.read`

Admin view of health status. Requires authentication and `system.health.read` permission.

**Response `200`:** Same shape as `/health/dependencies`.

---

## Security invariants for health endpoints

Health responses **never** contain:

- MongoDB connection strings or URIs
- Redis passwords or connection details
- Object storage bucket names or credentials
- Internal file paths
- JWT secrets or any API keys

---

## Admin backup

### GET `/admin/v1/system/backups` — `system.backup.read`

List backup log entries, newest first.

**Response `200`:**

```json
{
  "items": [
    {
      "id": "...",
      "status": "completed",
      "startedAt": "2024-01-01T00:00:00.000Z",
      "completedAt": "2024-01-01T00:05:00.000Z",
      "sizeBytes": 52428800,
      "storageKey": "backups/mongodb/2024-01-01T000000Z.tar.gz"
    }
  ],
  "total": 10,
  "page": 1,
  "limit": 20
}
```

**Security:** The response never contains `MONGODB_URI`, Object Storage credentials, bucket names beyond the storage key prefix, or raw error messages. Errors are sanitized before logging.

---

### GET `/admin/v1/system/backups/latest` — `system.backup.read`

Returns the most recent backup log entry.

**Response `200`:** Single backup log object (same fields as list item).

Returns `404` if no backup has ever run.

---

### POST `/admin/v1/system/backups/run` — `system.backup.run`

Triggers a manual backup job. The job is enqueued in BullMQ and runs asynchronously.

**Response `201`:**

```json
{ "status": "enqueued" }
```

**Permission:** `system.backup.run` is granted to `super_admin` only. Admin role does not receive this permission by default.

---

## Endpoints that do NOT exist

> The following endpoints are intentionally not implemented. Requests to these paths return `404 Not Found`.

- `GET /admin/v1/system/backups/restore` — No restore endpoint
- `POST /admin/v1/system/backups/restore` — No restore endpoint
- `GET /admin/v1/system/backups/download` — No backup download endpoint
- `DELETE /admin/v1/system/backups/:id` — No backup delete endpoint

**Restore is a manual procedure.** See [restore-runbook.md](../operations/restore-runbook.md).

---

## Backup internals

The backup process is implemented as a shell script (`infra/backup/mongo-backup.sh`) that:

1. Runs `mongodump` against the MongoDB instance
2. Compresses the dump to a `.tar.gz` archive
3. Uploads the archive to Arvan Object Storage under `BACKUP_STORAGE_BUCKET_PREFIX`
4. Writes a `BackupLog` entry to MongoDB

The backup job is triggered by BullMQ via the worker process or by the `POST /admin/v1/system/backups/run` endpoint.

**Encryption:** Backup archives are **not encrypted** in Phase 0. Encryption (GPG or cloud-native) is required before production use. See [backup-security-checklist.md](../security/backup-security-checklist.md).

---

## Known limitations (Phase 0)

- No automated backup schedule (cron) — backup is manual or operator-triggered.
- No backup encryption.
- No backup retention / automatic expiry of old archives.
- No multi-region backup replication.
- Restore is manual shell procedure only — no restore endpoint, no restore UI.
- No backup integrity verification (checksums, test restore).
- Backup runs `mongodump` which creates a point-in-time snapshot; it is not a streaming or incremental backup.
