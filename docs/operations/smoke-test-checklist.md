# Smoke Test Checklist — Production Deploy

Run this checklist after every deploy (`docker compose up -d`) before declaring the deployment healthy.

## 1. Container health

```bash
docker compose -f infra/docker/docker-compose.prod.yml ps
```

Expected: all 7 containers show `running` status. Services with healthchecks show `(healthy)` within 2–3 minutes of start.

| Service               | Expected state    |
| --------------------- | ----------------- |
| `dragon-prod-proxy`   | running (healthy) |
| `dragon-prod-api`     | running (healthy) |
| `dragon-prod-worker`  | running (healthy) |
| `dragon-prod-web`     | running           |
| `dragon-prod-admin`   | running           |
| `dragon-prod-mongodb` | running (healthy) |
| `dragon-prod-redis`   | running (healthy) |

## 2. No error logs at startup

```bash
docker compose -f infra/docker/docker-compose.prod.yml logs --tail=100 api
docker compose -f infra/docker/docker-compose.prod.yml logs --tail=100 worker
docker compose -f infra/docker/docker-compose.prod.yml logs --tail=100 web
docker compose -f infra/docker/docker-compose.prod.yml logs --tail=100 admin
```

Expected: no `Error`, `FATAL`, `MongoError`, `Redis connection`, or `ECONNREFUSED` in the recent lines.

## 3. Nginx is serving

```bash
# HTTP redirect
curl -I http://YOUR_DOMAIN
# Expected: HTTP/1.1 301

# HTTPS (requires valid TLS)
curl -I https://YOUR_DOMAIN
# Expected: HTTP/1.1 200 (or 301/302 from Nuxt)
```

## 4. Public web responds

```bash
curl -s -o /dev/null -w "%{http_code}" https://YOUR_DOMAIN/
# Expected: 200
```

## 5. API responds

```bash
# Liveness probe — always 200 if API is up
curl -s "https://api.YOUR_DOMAIN/health/live"
# Expected: { "status": "ok", "service": "api", "timestamp": "..." }

# Readiness probe — 200 means MongoDB and Redis are reachable
curl -o /dev/null -w "%{http_code}" "https://api.YOUR_DOMAIN/health/ready"
# Expected: 200

# Full dependency status
curl -s "https://api.YOUR_DOMAIN/health/dependencies" | jq .
# Expected: { "status": "ok"|"degraded", "dependencies": { ... } }

# requestId header echoed back
curl -I "https://api.YOUR_DOMAIN/health/live" | grep x-request-id
# Expected: x-request-id: <uuid>

# Check search endpoint (public, no auth)
curl -s "https://api.YOUR_DOMAIN/api/v1/search/content?q=test"
# Expected: JSON with { data, meta } structure
```

## 6. Admin responds

```bash
curl -s -o /dev/null -w "%{http_code}" https://admin.YOUR_DOMAIN/
# Expected: 200

# Verify X-Robots-Tag header is present on admin
curl -sI https://admin.YOUR_DOMAIN/ | grep -i x-robots-tag
# Expected: X-Robots-Tag: noindex,nofollow,noarchive
```

## 7. Security: MongoDB and Redis are not publicly reachable

```bash
# From the VPS or local machine — these must time out or refuse:
nc -zv YOUR_VPS_IP 27017   # Expected: Connection refused or timeout
nc -zv YOUR_VPS_IP 6379    # Expected: Connection refused or timeout
```

## 8. Security: Internal ports are not publicly exposed

```bash
# Application ports must not be reachable from outside (only via nginx):
nc -zv YOUR_VPS_IP 3000   # Expected: Connection refused
nc -zv YOUR_VPS_IP 3001   # Expected: Connection refused
nc -zv YOUR_VPS_IP 3002   # Expected: Connection refused
```

## 9. Admin noindex header

Confirm search engines cannot index admin:

```bash
curl -sI https://admin.YOUR_DOMAIN/ | grep -i "x-robots-tag"
# Expected: noindex,nofollow,noarchive
```

## 10. Auth flow (manual)

- [ ] Open `https://YOUR_DOMAIN` in a browser — public web loads
- [ ] Open `https://admin.YOUR_DOMAIN` in a browser — admin login page loads
- [ ] Attempt login with a known test account — OTP is received (if SMS provider is live)

## 11. Volumes are persistent

```bash
docker compose -f infra/docker/docker-compose.prod.yml exec redis redis-cli info persistence | grep aof_enabled
# Expected: aof_enabled:1

docker volume ls | grep dragon_prod
# Expected: dragon_prod_mongodb_data and dragon_prod_redis_data listed
```

## 12. Worker is processing jobs

```bash
docker compose -f infra/docker/docker-compose.prod.yml logs --tail=20 worker
# Expected: no error logs; may show BullMQ worker startup messages
```

## 13. Structured logs are emitting

```bash
docker compose -f infra/docker/docker-compose.prod.yml logs --tail=20 api | grep '"method"'
# Expected: JSON objects like {"requestId":"...","method":"GET","url":"/health/live","status":200,"ms":4}
```

## 14. Admin system health and backups

```bash
# Verify admin loads
curl -s -o /dev/null -w "%{http_code}" https://admin.YOUR_DOMAIN/system/health
# Expected: 200

curl -s -o /dev/null -w "%{http_code}" https://admin.YOUR_DOMAIN/system/backups
# Expected: 200
```

- [ ] Admin `/system/health` page loads and shows dependency panels (MongoDB, Redis, Storage, SMS)
- [ ] Admin `/system/backups` page loads and shows latest backup status (if Object Storage configured)
- [ ] No credentials or connection strings are visible on health or backup pages

## 15. Backup status (if Object Storage is configured)

```bash
ACCESS_TOKEN="your-super-admin-jwt"
curl -s "https://api.YOUR_DOMAIN/admin/v1/system/backups/latest" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" | jq '{status, startedAt, completedAt}'
```

- [ ] Latest backup exists with `status: "completed"` (indicates a successful off-server artifact)
- [ ] `GET /admin/v1/system/backups` returns a list without exposing credentials or connection strings

Skip the backup check if Object Storage is not yet configured — backups are not completed when running with `STORAGE_PROVIDER=local`.

---

## 0. Automated smoke suite (run before manual checks)

Before starting the manual checklist, run the automated smoke suite from the repo. These tests
require no running server and complete in under 15 seconds.

```bash
# From repo root
pnpm smoke
```

Expected: **8 suites, 80 tests, 0 failures.**

The automated suite covers:

- Health endpoint response shapes and no-secrets invariant
- Backup API permission gates and no-restore-endpoint invariant
- Public search published-only routing
- Admin search/analytics/audit/jobs/notifications permission gates
- Media MIME/extension allowlist validation
- No raw OTP, password, token, or phone number in any API response

If the automated suite fails, do not proceed with the manual deploy checklist until it is fixed.
