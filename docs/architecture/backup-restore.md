# Backup and Restore Architecture

## Scope

Task 0.10.4 — Phase 0 backup foundation. This document describes what is implemented, what is explicitly out of scope, and how the backup system is designed.

## What is implemented

- `BackupLog` MongoDB schema with required indexes
- `BackupLogRepository` for CRUD operations on backup metadata
- `BackupService` with MongoDB backup execution via `mongodump`, compression, and optional Object Storage upload
- Admin APIs: `GET /admin/v1/system/backups`, `GET /admin/v1/system/backups/latest`, `POST /admin/v1/system/backups/run`
- Audit events for all backup lifecycle actions
- Shell script `infra/backup/mongo-backup.sh` for VPS-level standalone execution
- Permissions: `system.backup.read`, `system.backup.run` (run restricted to `super_admin`)
- Restore runbook and verification checklist (manual process only)

## What is explicitly NOT implemented

- Automatic restore endpoint or restore API
- Restore UI or restore button
- Scheduled backup automation (cron/BullMQ scheduler)
- Complex backup key management
- Backup file download API
- Backup delete API
- Multi-server or distributed backup architecture
- Backup encryption implementation (required before production — see security checklist)

## BackupLog schema

```
backup_logs collection
├── type:          'mongodb' | 'media_metadata' | 'manual'
├── status:        'started' | 'completed' | 'failed'
├── fileKey:       string?       — object storage key (safe, not a credential)
├── bucket:        string?       — object storage bucket name
├── sizeBytes:     number?       — compressed archive size
├── startedAt:     Date          — when the backup began
├── completedAt:   Date?         — when it finished
├── triggeredBy:   'system' | 'admin' | 'manual_script'
├── actorId:       ObjectId?     — admin user ID if triggered via API
├── error:         string?       — sanitized error message (no credentials)
├── createdAt:     Date          — auto (Mongoose timestamps)
└── updatedAt:     Date          — auto (Mongoose timestamps)
```

Required indexes:

| Index fields              | Purpose                        |
| ------------------------- | ------------------------------ |
| `status + createdAt`      | Filter by status, newest first |
| `type + createdAt`        | Filter by backup type          |
| `startedAt`               | Time-range queries             |
| `triggeredBy + createdAt` | Filter by trigger source       |

## Admin APIs

All endpoints require `AccessTokenGuard` + `PermissionGuard`.

| Method | Path                            | Permission         | Notes                             |
| ------ | ------------------------------- | ------------------ | --------------------------------- |
| GET    | /admin/v1/system/backups        | system.backup.read | Paginated list, newest first      |
| GET    | /admin/v1/system/backups/latest | system.backup.read | Latest completed backup           |
| POST   | /admin/v1/system/backups/run    | system.backup.run  | Manual trigger — super_admin only |

`POST /admin/v1/system/backups/run` is a thin endpoint — it creates a `BackupLog` with `status='started'` and returns immediately. The actual backup executes asynchronously.

## Backup execution flow

```
POST /admin/v1/system/backups/run
  ↓
BackupService.runMongoBackup('admin', userId)
  ↓
1. Create BackupLog { status: 'started' }
2. Emit audit: system.backup_started
3. Emit audit: system.backup_manual_triggered
4. Return RunBackupResponseDto { status: 'started', ... }
  ↓ (async, via setImmediate)
5. mkdir BACKUP_TEMP_DIR/<timestamp>
6. spawn mongodump --uri <MONGODB_URI> --out <dir>
7. spawn tar -czf <dir>.tar.gz <dir>
8. If STORAGE_PROVIDER=arvan|minio:
     upload to Object Storage at BACKUP_STORAGE_BUCKET_PREFIX/<ts>.tar.gz
     delete local temp files
9. markCompleted(id, { fileKey, bucket, sizeBytes })
10. Emit audit: system.backup_completed
    — OR —
9. markFailed(id, sanitized_error)
10. Emit audit: system.backup_failed
```

## Standalone shell script

`infra/backup/mongo-backup.sh` provides an equivalent standalone backup flow for direct VPS execution, without requiring the API to be running. Use this for:

- Scheduled cron backups on the VPS
- Emergency manual backups before migrations
- Testing the backup pipeline independently

Required env vars: `MONGODB_URI` (or `BACKUP_MONGODB_URI`), and S3 vars if uploading.

## Object Storage backup destination

Production backups should be uploaded to Arvan Object Storage under a dedicated bucket or prefix separated from media assets. The backup bucket should be:

- In a different region or account from the application bucket (for disaster recovery)
- Access-controlled — only the backup user/key should have write access
- Versioned or lifecycle-managed to retain N recent backups

Backup object keys follow the pattern: `backups/mongodb/<YYYY-MM-DDTHH-MM-SSZ>-<uuid>.tar.gz`

Keys are generated from timestamp and UUID — not user-controlled. Path traversal characters are not permitted.

## Error sanitization

BackupLog `error` field and log messages never contain:

- MongoDB connection strings (`mongodb://...`)
- Object Storage credentials (access key, secret key)
- Local file paths with sensitive segments
- Passwords

The `sanitizeError()` method strips URI patterns and password fields, capping at 200 characters.

## Audit events

| Event                            | Trigger                        |
| -------------------------------- | ------------------------------ |
| `system.backup_started`          | Start of any backup            |
| `system.backup_manual_triggered` | Admin-triggered backup via API |
| `system.backup_completed`        | Successful completion          |
| `system.backup_failed`           | Failure (error sanitized)      |

All audit payloads are processed through `AuditRedactor` — no credentials appear in audit logs.

## Restore

**Restore is a runbook-driven manual process only.**

There is no restore endpoint, restore API, or restore UI. Restore requires:

1. A completed backup artifact
2. Authorized operator with VPS access
3. Maintenance window
4. Manual execution of `mongorestore`
5. Post-restore verification

See `docs/operations/restore-runbook.md` and `docs/operations/restore-verification-checklist.md`.

## Not implemented in Phase 0

- Backup encryption at rest (required before production — see security checklist)
- Backup of media binary files (only MongoDB data; media files live in Object Storage)
- `media_metadata` backup type (schema stub only — not wired)
- Multi-region replication
- Scheduled backup via BullMQ or cron inside the API
- Retention policy automation
