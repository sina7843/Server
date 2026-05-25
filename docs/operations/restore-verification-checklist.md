# Restore Verification Checklist

Run this checklist after completing a restore operation. Do not declare restore successful until all items pass.

## 1. Services are running

```bash
docker compose -f /opt/dragon/infra/docker/docker-compose.prod.yml ps
```

- [ ] `dragon-prod-api` — running (healthy)
- [ ] `dragon-prod-worker` — running (healthy)
- [ ] `dragon-prod-mongodb` — running (healthy)
- [ ] `dragon-prod-redis` — running (healthy)
- [ ] `dragon-prod-proxy` — running (healthy)

## 2. Health endpoints pass

```bash
curl -s "https://api.YOUR_DOMAIN/health/live" | jq .
# Expected: { "status": "ok" }

curl -o /dev/null -w "%{http_code}" "https://api.YOUR_DOMAIN/health/ready"
# Expected: 200

curl -s "https://api.YOUR_DOMAIN/health/dependencies" | jq .
# Expected: mongodb.status = "ok", redis.status = "ok"
```

- [ ] `/health/live` returns `{ "status": "ok" }`
- [ ] `/health/ready` returns 200
- [ ] `/health/dependencies` shows MongoDB and Redis as `ok`

## 3. Collection counts are plausible

```bash
docker compose -f /opt/dragon/infra/docker/docker-compose.prod.yml exec mongodb \
  mongosh -u YOUR_USER -p YOUR_PASSWORD dragon_prod --quiet --eval "
    print('users:', db.users.countDocuments());
    print('sessions:', db.sessions.countDocuments());
    print('posts:', db.posts.countDocuments());
    print('pages:', db.pages.countDocuments());
    print('media_assets:', db.media_assets.countDocuments());
    print('audit_logs:', db.audit_logs.countDocuments());
    print('backup_logs:', db.backup_logs.countDocuments());
  "
```

- [ ] `users` count matches expected (check against known count from before incident)
- [ ] `posts` / `pages` counts are non-zero and match expected
- [ ] No collection reports 0 when it should have documents

## 4. Most recent documents are present

```bash
docker compose -f /opt/dragon/infra/docker/docker-compose.prod.yml exec mongodb \
  mongosh -u YOUR_USER -p YOUR_PASSWORD dragon_prod --quiet --eval "
    const latest = db.users.find().sort({ createdAt: -1 }).limit(1).toArray();
    print('latest user createdAt:', latest[0]?.createdAt);
  "
```

- [ ] Latest user timestamp matches expected (within backup age window)
- [ ] Latest content timestamps are plausible

## 5. Admin login works

- [ ] Open `https://admin.YOUR_DOMAIN` — admin login page loads
- [ ] Log in with a known test account — OTP received and login succeeds
- [ ] Admin dashboard loads without errors

## 6. API public endpoints respond

```bash
curl -s "https://api.YOUR_DOMAIN/api/v1/search/content?q=test" | jq .
# Expected: JSON with { data, meta } structure
```

- [ ] Search endpoint returns valid JSON
- [ ] No 500 errors in API logs

## 7. No error logs at startup

```bash
docker compose -f /opt/dragon/infra/docker/docker-compose.prod.yml logs --tail=50 api | grep -i error
docker compose -f /opt/dragon/infra/docker/docker-compose.prod.yml logs --tail=50 worker | grep -i error
```

- [ ] No unexpected errors in API startup logs
- [ ] No unexpected errors in worker startup logs

## 8. Backup log confirms restore context

- [ ] A new backup was taken before the restore (pre-restore snapshot appears in backup logs)
- [ ] Incident log records: backup used, authorized by, performed by, timestamp

## 9. Media files are intact

Media binary files live in Arvan Object Storage — they are NOT part of the MongoDB restore.

- [ ] Spot-check 2-3 media assets load correctly via their public URLs
- [ ] If media metadata and Object Storage are out of sync, document the discrepancy

## Sign-off

All items above must be checked before declaring restore successful.

| Field                     | Value       |
| ------------------------- | ----------- |
| Restore performed by      |             |
| Authorized by             |             |
| Backup artifact used      |             |
| Backup timestamp          |             |
| Restore completed at      |             |
| Verification completed at |             |
| Overall outcome           | PASS / FAIL |
| Notes                     |             |
