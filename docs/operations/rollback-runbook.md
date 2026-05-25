# Rollback Runbook — Single Arvan VPS

## When to use this runbook

Roll back to the previous deployment when:

1. A new release breaks production functionality and the fix cannot be deployed quickly.
2. Health endpoints (`/health/ready`, `/health/dependencies`) fail after a deploy.
3. Repeated 5xx errors or FATAL logs appear after a deploy.
4. A migration or data change introduced instability that cannot be patched forward.

Do not roll back for every failure — first check logs, check health endpoints, and determine the scope. A rollback introduces downtime and may require additional steps if data was written during the failed deployment.

## Rollback does NOT restore the database

Rolling back code does not restore MongoDB data. If the failed release wrote new data (new schema fields, new documents), the old code may encounter data it cannot parse.

If you need to restore data to a pre-deploy state, follow the separate restore runbook at `docs/operations/restore-runbook.md`. Database restore is a manual, approval-gated operation. No restore endpoint or restore UI exists.

## Pre-rollback checklist

- [ ] Identify the previous working image tag or Git commit
- [ ] Confirm a backup exists that predates the failed deploy (check admin `/system/backups` or backup logs)
- [ ] Notify the team that a rollback is about to begin
- [ ] Determine whether the release wrote schema changes or new data that may be incompatible with the rollback image

## 1. Stop the affected services

```bash
cd /opt/dragon
docker compose -f infra/docker/docker-compose.prod.yml stop api worker
```

Optionally stop the reverse proxy to show users a maintenance response:

```bash
docker compose -f infra/docker/docker-compose.prod.yml stop reverse-proxy
```

## 2. Identify the previous commit

```bash
git log --oneline -5
```

Note the commit hash of the last known-good release (one before the failed one).

## 3. Roll back the code

```bash
# Check out the previous commit
git checkout <previous-good-commit-hash>
```

Or, if you deploy via tagged releases:

```bash
git checkout tags/v0.9.2   # replace with previous good tag
```

## 4. Rebuild affected images

```bash
docker compose -f infra/docker/docker-compose.prod.yml build api worker
```

If web or admin also changed and are suspected, include them:

```bash
docker compose -f infra/docker/docker-compose.prod.yml build
```

## 5. Restart the stack

```bash
docker compose -f infra/docker/docker-compose.prod.yml up -d
```

## 6. Verify health

```bash
# Wait 30–60 seconds for startup, then:
docker compose -f infra/docker/docker-compose.prod.yml ps

# API liveness
curl -s "https://api.YOUR_DOMAIN/health/live"
# Expected: { "status": "ok" }

# API readiness (MongoDB + Redis)
curl -o /dev/null -w "%{http_code}" "https://api.YOUR_DOMAIN/health/ready"
# Expected: 200

# Full dependencies
curl -s "https://api.YOUR_DOMAIN/health/dependencies" | jq .
```

- [ ] `/health/live` returns `{ "status": "ok" }`
- [ ] `/health/ready` returns 200
- [ ] `/health/dependencies` shows MongoDB and Redis as `ok`

## 7. Check logs

```bash
docker compose -f infra/docker/docker-compose.prod.yml logs --tail=100 api
docker compose -f infra/docker/docker-compose.prod.yml logs --tail=100 worker
```

- [ ] No `Error`, `FATAL`, `ECONNREFUSED`, or `MongoError` in recent logs
- [ ] Structured JSON logs appear with `requestId`

## 8. Run smoke tests

Follow `docs/operations/smoke-test-checklist.md`. Verify:

- [ ] Public web loads
- [ ] Admin loads with `X-Robots-Tag: noindex,nofollow,noarchive`
- [ ] Admin `/system/health` shows ok
- [ ] Admin login works with a known account

## 9. Post-rollback

```bash
# Return to main branch after rollback is stable
git checkout main
```

- Record the rollback in an incident log: which commit rolled back, which commit was the rollback target, reason, outcome, who performed it.
- Investigate the root cause of the failed release before attempting another deploy.
- If data was written during the failed release and the old code cannot process it, evaluate whether a database restore is required (see `docs/operations/restore-runbook.md`).

## Rollback limitations

- No automated rollback exists.
- Rollback reverts code only — not database state.
- If a database migration ran during the failed release, rolling back code without reversing the migration may cause additional errors.
- Volume data (`dragon_prod_mongodb_data`, `dragon_prod_redis_data`) is NOT affected by a rollback — it persists across container restarts.

## Future extraction order (for context)

As infrastructure scales, services can be extracted in this order without re-architecting:

1. MongoDB → managed service (update `MONGODB_URI`)
2. Redis / BullMQ → managed service (update `REDIS_*`)
3. Worker → separate VPS
4. API / Web / Admin → horizontal scale
5. Search service → dedicated Meilisearch
6. Kubernetes → only when real orchestration is needed (not planned for Phase 0)
