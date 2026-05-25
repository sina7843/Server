# Restore Runbook

## CRITICAL SAFETY NOTICE

**Production restore is dangerous and irreversible.**

- Never run a restore from the admin UI. No restore endpoint or restore button exists — this is by design.
- Never restore without explicit approval from a designated authority (lead engineer or CTO).
- Never restore to the production database without a verified pre-restore backup.
- Always test the restore on a staging environment first.
- A botched restore can result in permanent data loss.

## Who can approve a restore

Production restore must be approved by:

- Lead engineer or CTO
- At least one additional authorized operator

Approval must be recorded (chat message, incident log, or ticket) before restore begins.

## When to restore

Restore is appropriate only when:

1. Data corruption or accidental deletion has occurred and cannot be fixed by other means
2. A migration gone wrong cannot be rolled back through the application
3. A security incident requires restoring to a pre-incident state

## Pre-restore checklist

- [ ] Obtain explicit written approval from authorized parties
- [ ] Identify the correct backup artifact to restore from (verify timestamp and status)
- [ ] Verify the backup artifact is intact (see below)
- [ ] Notify all team members that a restore is about to begin
- [ ] Create a current backup of the production database before restoring (even if corrupted — for forensics)
- [ ] Document the reason for the restore and the chosen backup timestamp

## 1. Verify the backup artifact

```bash
# List available backups via API
ACCESS_TOKEN="your-admin-jwt"
curl -s "https://api.YOUR_DOMAIN/admin/v1/system/backups?limit=20&status=completed" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" | jq '.items[] | {id, startedAt, completedAt, sizeBytes, fileKey}'

# Download the artifact from Object Storage
aws s3 cp \
  "s3://your-bucket/backups/mongodb/2024-01-01T00-00-00Z-<uuid>.tar.gz" \
  /tmp/restore-staging/backup.tar.gz \
  --endpoint-url https://s3.ir-thr-at1.arvanstorage.ir

# Verify the archive is valid
tar -tzf /tmp/restore-staging/backup.tar.gz | head -20
# Expected: list of BSON collection files

# Verify non-empty
du -sh /tmp/restore-staging/backup.tar.gz
```

## 2. Stop services or enable maintenance mode

```bash
# Stop API and worker to prevent writes during restore
docker compose -f /opt/dragon/infra/docker/docker-compose.prod.yml stop api worker

# Optionally: bring nginx down to return 503 to users
docker compose -f /opt/dragon/infra/docker/docker-compose.prod.yml stop reverse-proxy
```

## 3. Create a pre-restore safety backup

```bash
# Even if data is corrupted, take a snapshot for forensics before overwriting
export MONGODB_URI="mongodb://user:pass@localhost:27017/dragon_prod?authSource=admin"
bash /opt/dragon/infra/backup/mongo-backup.sh
```

## 4. Extract the backup archive

```bash
mkdir -p /tmp/restore-staging/extracted
tar -xzf /tmp/restore-staging/backup.tar.gz -C /tmp/restore-staging/extracted
ls /tmp/restore-staging/extracted/
# Expected: directory with BSON files per collection
```

## 5. Restore MongoDB

```bash
# Use mongorestore to restore the dump
# Replace <backup-dir> with the extracted directory path
BACKUP_DIR="/tmp/restore-staging/extracted/mongo-<timestamp>"

mongorestore \
  --uri="mongodb://user:pass@localhost:27017/?authSource=admin" \
  --db dragon_prod \
  --drop \
  "${BACKUP_DIR}/dragon_prod"

# --drop drops each collection before restoring (replaces existing data)
# Verify the command output for any errors
```

## 6. Verify data after restore

- [ ] Connect to MongoDB and check document counts for key collections
- [ ] Verify recent documents exist (check timestamps of last entries in `users`, `posts`, etc.)
- [ ] Check that indexes are intact

```bash
docker compose -f /opt/dragon/infra/docker/docker-compose.prod.yml exec mongodb \
  mongosh -u user -p pass dragon_prod --eval "
    print('users:', db.users.countDocuments());
    print('posts:', db.posts.countDocuments());
    print('sessions:', db.sessions.countDocuments());
  "
```

## 7. Restart services

```bash
docker compose -f /opt/dragon/infra/docker/docker-compose.prod.yml up -d
```

## 8. Run smoke tests

Follow the smoke test checklist at `docs/operations/smoke-test-checklist.md`.

Key tests after restore:

- [ ] `GET /health/ready` returns 200
- [ ] `GET /health/dependencies` shows MongoDB ok
- [ ] Admin login works with a known account
- [ ] API responds to basic content queries

## 9. Post-restore cleanup

```bash
# Remove temp staging files
rm -rf /tmp/restore-staging/

# Record the restore in the incident log:
# - Backup artifact used (timestamp, size, fileKey)
# - Who authorized and performed the restore
# - Time of restore
# - Verification outcome
```

## Rollback considerations

If restore introduces new problems:

1. The pre-restore snapshot (step 3) can be used as a fallback
2. Contact the team immediately
3. Do not attempt a second restore without re-evaluating the backup artifact

## Test restore cadence

**Monthly**: Test restore on a staging environment using the latest completed backup.

Steps for test restore:

1. Spin up a staging MongoDB instance
2. Run mongorestore from the latest backup
3. Verify collection counts and data integrity
4. Document results

This ensures the backup pipeline is working and that restore procedures are practiced before a real incident.
