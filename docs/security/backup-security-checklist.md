# Backup Security Checklist

Run this checklist before enabling backup in production.

## Code / repository

- [ ] No backup output files are committed to the repository
- [ ] No real credentials are committed (MongoDB URI, S3 keys, passwords)
- [ ] `.gitignore` covers `/tmp/dragon-backups/` and any local backup staging paths
- [ ] `infra/backup/mongo-backup.sh` contains no hardcoded credentials
- [ ] `BackupLog` schema does not store connection strings, passwords, or S3 secrets
- [ ] `BackupLog.error` field is sanitized — URI patterns and passwords are stripped
- [ ] `BackupService.sanitizeError()` strips URI and password patterns from errors
- [ ] Audit payloads for backup events contain no credentials

## Backup artifact security

- [ ] **Encryption at rest**: backup archives must be encrypted before they are stored off-server (e.g., GPG-encrypted with operator-owned key). This is **required before production** and is NOT implemented in Phase 0.
- [ ] Key ownership is documented (who owns the encryption key, where it is stored)
- [ ] Key rotation cadence is defined
- [ ] Backup artifacts are stored in a dedicated bucket or prefix, not mixed with media
- [ ] Backup bucket has restricted write access (only the backup service account)
- [ ] Backup bucket has no public read access
- [ ] The backup S3 key used for backup upload should be a dedicated key separate from the media upload key

## Transport

- [ ] Object Storage upload uses HTTPS endpoint (`STORAGE_S3_ENDPOINT` must be https://)
- [ ] `mongodump` connection uses TLS (`ssl=true` in connection string) in production

## API security

- [ ] `GET /admin/v1/system/backups` requires `system.backup.read` permission
- [ ] `GET /admin/v1/system/backups/latest` requires `system.backup.read` permission
- [ ] `POST /admin/v1/system/backups/run` requires `system.backup.run` permission
- [ ] `system.backup.run` is mapped only to `super_admin` — not to `admin` role
- [ ] No restore endpoint exists
- [ ] No backup delete endpoint exists
- [ ] No backup download endpoint exists
- [ ] `POST /admin/v1/system/backups/run` does not accept user-controlled shell arguments or file paths
- [ ] Backup log API responses do not expose credentials, connection strings, or raw local paths
- [ ] Backup API responses do not include the MongoDB URI
- [ ] Backup API responses do not include the S3 secret key or access key

## Operational

- [ ] Restore is runbook-driven only — no restore endpoint or restore button exists
- [ ] Restore requires authorized operator with VPS access and a maintenance window
- [ ] Test restore cadence: restore is verified on a staging environment at least monthly
- [ ] Backup retention policy is defined (how many backups to keep, for how long)
- [ ] Stale backups are deleted from Object Storage on schedule

## Not yet implemented (required before production)

- Backup encryption at rest (GPG or cloud-native encryption)
- Backup key management and rotation
- Automated retention policy and lifecycle rules
- Backup integrity verification (checksum of artifact before and after upload)
- Scheduled automatic backup (cron on VPS or BullMQ scheduler)
- Alert on backup failure
