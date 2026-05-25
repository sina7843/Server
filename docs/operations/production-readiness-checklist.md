# Production Readiness Checklist — Phase 0

Run this checklist before declaring the Dragon platform ready for production traffic. All items must pass.

## 1. Environment and secrets

- [ ] `infra/docker/.env.production` exists on the VPS (copied from `.env.production.example`, never committed)
- [ ] All `CHANGE_ME` placeholder values have been replaced with real values
- [ ] `MONGO_INITDB_ROOT_PASSWORD` is at least 32 characters and randomly generated
- [ ] `AUTH_JWT_SECRET` is at least 64 characters and randomly generated (`openssl rand -hex 64`)
- [ ] `STORAGE_S3_ACCESS_KEY_ID` and `STORAGE_S3_SECRET_ACCESS_KEY` are set and valid
- [ ] No real secret appears in any committed file (`.env.example`, `nginx.conf`, Dockerfiles, docs)
- [ ] `.env.production` is absent from the repository (`git check-ignore infra/docker/.env.production`)

## 2. Infrastructure

- [ ] Docker Engine is installed on the VPS (`docker --version`)
- [ ] Docker Compose v2 is installed (`docker compose version`)
- [ ] VPS disk has sufficient space for MongoDB data, Redis AOF, and backup staging (`df -h`)
- [ ] VPS has outbound access to Arvan Object Storage HTTPS endpoint
- [ ] VPS hostname is configured for the production domain

## 3. TLS and reverse proxy

- [ ] TLS certificates are provisioned for all three domains (web, API, admin)
- [ ] Certificate paths in `infra/nginx-or-caddy/nginx.conf` match provisioned certificate locations
- [ ] Nginx config syntax validates: `nginx -t`
- [ ] HTTP redirects to HTTPS for all domains
- [ ] `X-Robots-Tag: noindex,nofollow,noarchive` is present on the admin server block only
- [ ] `client_max_body_size 50m` is present on the API server block

## 4. Docker stack

- [ ] All 7 containers start and reach `running` state
- [ ] API and MongoDB and Redis containers show `(healthy)` within 3 minutes of start
- [ ] No container exits or restarts repeatedly (`docker compose ps`)
- [ ] `restart: always` policy is set for all 7 services (check `docker-compose.prod.yml`)
- [ ] Log rotation is configured for all services (`max-size: 10m, max-file: 3`)

## 5. Health endpoints

```bash
curl -s "https://api.YOUR_DOMAIN/health/live"
# Expected: { "status": "ok", "service": "api" }

curl -o /dev/null -w "%{http_code}" "https://api.YOUR_DOMAIN/health/ready"
# Expected: 200

curl -s "https://api.YOUR_DOMAIN/health/dependencies" | jq .
# Expected: mongodb.status = "ok", redis.status = "ok"
```

- [ ] `/health/live` returns `{ "status": "ok" }`
- [ ] `/health/ready` returns 200
- [ ] `/health/dependencies` shows MongoDB and Redis as `ok`
- [ ] `x-request-id` header is present in all API responses

## 6. Database and storage

- [ ] MongoDB authentication is enabled (`MONGO_INITDB_ROOT_USERNAME` and `PASSWORD` are set)
- [ ] MongoDB port 27017 is NOT reachable from the public internet
- [ ] Redis port 6379 is NOT reachable from the public internet
- [ ] Redis AOF persistence is enabled (`aof_enabled:1` in `redis-cli info persistence`)
- [ ] MongoDB and Redis data volumes are named and persistent
- [ ] Arvan Object Storage bucket exists and is accessible with the configured credentials
- [ ] Object Storage bucket has no public write access
- [ ] Object Storage bucket has no public listing enabled

## 7. Auth and RBAC

- [ ] RBAC seed has been run once: `docker compose exec api node dist/rbac/seeds/run-rbac-seed.js`
- [ ] At least one `super_admin` user exists and can log in to the admin
- [ ] OTP delivery is working (test login with a real phone number if SMS provider is live)
- [ ] Session expiry is set to a safe value (`AUTH_REFRESH_TOKEN_TTL_DAYS` ≤ 30)

## 8. Backup

- [ ] Object Storage is configured for a non-local provider (`STORAGE_PROVIDER=arvan`)
- [ ] `BACKUP_TEMP_DIR` exists and is writable on the VPS
- [ ] `BACKUP_STORAGE_BUCKET_PREFIX` is set and does not overlap with media files
- [ ] A test backup has been triggered and completed successfully: `POST /admin/v1/system/backups/run`
- [ ] The backup artifact is visible in Object Storage
- [ ] Restore runbook (`docs/operations/restore-runbook.md`) has been reviewed
- [ ] **Backup encryption is NOT implemented in Phase 0** — accept this risk before enabling production backups, or implement GPG encryption per `docs/security/backup-security-checklist.md`

## 9. Monitoring limitations (accepted)

- [ ] No Prometheus / Grafana / Loki monitoring stack is deployed (out of scope for Phase 0)
- [ ] Health endpoints (`/health/*`) provide basic operational visibility
- [ ] Admin `/system/health` page shows dependency status
- [ ] Log rotation limits disk growth (10 MB / 3 files per service)
- [ ] VPS memory and disk are manually monitored until Phase 1 monitoring is in place

## 10. Security hardening

- [ ] No `/.git` or source code path is accessible via nginx
- [ ] Admin is not indexed by search engines (`X-Robots-Tag: noindex,nofollow,noarchive`)
- [ ] No environment variable with a secret value appears in API response bodies or logs
- [ ] `LoggingInterceptor` logs only method, URL, status, latency, and `requestId` — never bodies or tokens
- [ ] Backup logs do not contain connection strings, passwords, or file paths

## 11. Smoke tests

Run the full smoke test checklist at `docs/operations/smoke-test-checklist.md` and confirm all items pass.

- [ ] Smoke test checklist: all items pass

## 12. Rollback plan

- [ ] Previous Docker image or Git commit is identified and ready to restore
- [ ] Rollback runbook (`docs/operations/rollback-runbook.md`) has been reviewed
- [ ] Team members know who to contact during an incident

## 13. Documentation and sign-off

- [ ] Deploy runbook reviewed: `docs/operations/deploy-runbook.md`
- [ ] Backup runbook reviewed: `docs/operations/backup-runbook.md`
- [ ] Restore runbook reviewed: `docs/operations/restore-runbook.md` (manual-only, no restore endpoint exists)
- [ ] Rollback runbook reviewed: `docs/operations/rollback-runbook.md`

| Field                  | Value       |
| ---------------------- | ----------- |
| Deployment prepared by |             |
| Reviewed by            |             |
| Date                   |             |
| Overall result         | PASS / FAIL |
| Notes                  |             |
