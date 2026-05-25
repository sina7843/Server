# Backup Runbook

## Status

Task 0.10.4 — Phase 0 backup foundation.

Backup encryption is **not implemented** in Phase 0. Before enabling production backups, implement encryption at rest (see security checklist).

## Two backup paths

| Path                             | Runs inside   | Requires                                                  |
| -------------------------------- | ------------- | --------------------------------------------------------- |
| Admin API (`POST /run`)          | API container | Object Storage configured; `mongodump` in container image |
| Shell script (`mongo-backup.sh`) | VPS host      | `mongodump` + AWS CLI installed on the VPS host           |

The API container image ships with `mongodump` (installed via the `mongo:7` build stage). You do **not** need `mongodump` on the VPS host to use the admin API backup.

To verify `mongodump` is available inside the running container:

```bash
docker compose -f infra/docker/docker-compose.prod.yml exec api mongodump --version
# Expected: mongodump version 100.x.x
```

## Prerequisites

**For admin API backup** — no host-level tools needed. Verify the container has `mongodump`:

```bash
docker compose -f infra/docker/docker-compose.prod.yml exec api mongodump --version
```

**For shell script backup** — on the VPS host:

```bash
# mongodump must be installed on the VPS host
mongodump --version
# Expected: mongodump version 100.x.x

# AWS CLI must be installed (for Object Storage upload via shell script)
aws --version

# Verify env vars are set
echo "MONGODB_URI is set: ${MONGODB_URI:+yes}"
echo "STORAGE_S3_ACCESS_KEY_ID is set: ${STORAGE_S3_ACCESS_KEY_ID:+yes}"
```

## Manual backup via shell script (VPS)

Run this from the VPS, outside any Docker container:

```bash
# 1. Set required env vars (never commit these):
export MONGODB_URI="mongodb://user:pass@mongodb:27017/dragon_prod?authSource=admin"
export STORAGE_PROVIDER=arvan
export STORAGE_BUCKET=your-bucket-name
export STORAGE_S3_ENDPOINT=https://s3.ir-thr-at1.arvanstorage.ir
export STORAGE_S3_REGION=ir-thr-at1
export STORAGE_S3_ACCESS_KEY_ID=your-access-key
export STORAGE_S3_SECRET_ACCESS_KEY=your-secret-key
export BACKUP_STORAGE_BUCKET_PREFIX=backups/mongodb
export BACKUP_TEMP_DIR=/tmp/dragon-backups

# 2. Run the backup script:
bash /opt/dragon/infra/backup/mongo-backup.sh
```

Expected output:

```
[INFO] Backup staging directory: /tmp/dragon-backups/mongo-2024-01-01T00-00-00Z
[INFO] Starting mongodump at 2024-01-01T00-00-00Z
[INFO] mongodump completed.
[INFO] Compressing backup to /tmp/dragon-backups/mongo-2024-01-01T00-00-00Z.tar.gz
[INFO] Compressed size: 12345678 bytes
[INFO] Uploading to s3://your-bucket-name/backups/mongodb/2024-01-01T00-00-00Z.tar.gz
[INFO] Upload complete: s3://your-bucket-name/backups/mongodb/2024-01-01T00-00-00Z.tar.gz
[INFO] Local temp files removed.
[INFO] Backup completed at 2024-01-01T00:00:00Z
```

## Manual backup via admin API

Requires: `super_admin` account, API running and healthy.

```bash
# 1. Obtain access token (use your admin credentials)
ACCESS_TOKEN="your-admin-jwt-token"

# 2. Trigger backup run
curl -s -X POST "https://api.YOUR_DOMAIN/admin/v1/system/backups/run" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{}' | jq .

# Expected: { "id": "...", "status": "started", ... }

# 3. Check backup status
curl -s "https://api.YOUR_DOMAIN/admin/v1/system/backups/latest" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" | jq .

# Wait for status: "completed" or "failed"
```

## Check backup status

```bash
# List recent backups
curl -s "https://api.YOUR_DOMAIN/admin/v1/system/backups?limit=5" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" | jq .

# Get latest completed backup
curl -s "https://api.YOUR_DOMAIN/admin/v1/system/backups/latest" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" | jq .
```

## Setting up scheduled backups (cron — VPS)

Add to crontab on the VPS:

```bash
crontab -e
```

```cron
# Run MongoDB backup daily at 02:00 UTC
0 2 * * * MONGODB_URI="..." STORAGE_PROVIDER=arvan ... bash /opt/dragon/infra/backup/mongo-backup.sh >> /var/log/dragon-backup.log 2>&1
```

Store credentials in a dedicated environment file with restricted permissions:

```bash
# Create /etc/dragon-backup.env
chmod 600 /etc/dragon-backup.env
# Load in crontab:
0 2 * * * set -a; . /etc/dragon-backup.env; set +a; bash /opt/dragon/infra/backup/mongo-backup.sh >> /var/log/dragon-backup.log 2>&1
```

## Verify a backup artifact

```bash
# Check the archive is valid:
tar -tzf /tmp/dragon-backups/mongo-backup.tar.gz | head -20

# Check size is non-zero:
stat /tmp/dragon-backups/mongo-backup.tar.gz

# Verify content in staging environment — never restore to production without testing
```

## Before production: encrypt backups

Phase 0 does not implement encryption. Before production:

1. Generate a GPG key pair (keep private key OFF the server):

   ```bash
   gpg --full-generate-key
   gpg --export --armor your@email.com > backup-public-key.asc
   ```

2. Encrypt after creating tarball:

   ```bash
   gpg --encrypt --recipient your@email.com backup.tar.gz
   # Produces: backup.tar.gz.gpg
   ```

3. Upload `.tar.gz.gpg` to Object Storage instead of `.tar.gz`.

4. Store the private key in a secure, off-server location (hardware key, vault).

## Security constraints

- Never print the MONGODB_URI to logs
- Never include credentials in the BackupLog record
- Never download a backup artifact through the admin API (no download endpoint exists)
- Never run restore from any UI — use the restore runbook only
