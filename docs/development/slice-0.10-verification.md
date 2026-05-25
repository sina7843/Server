# Slice 0.10 Verification

## Slice 0.10.1 — Production Containerization and Reverse Proxy

### Files created

```
.dockerignore
apps/api/Dockerfile
apps/worker/Dockerfile
apps/web/Dockerfile
apps/admin/Dockerfile
infra/nginx-or-caddy/nginx.conf
infra/nginx-or-caddy/README.md
docs/architecture/deployment.md
docs/development/slice-0.10-verification.md   ← this file
docs/development/environment.md               ← updated
docs/operations/README.md                     ← updated
```

### Build verification commands

Run all commands from the repo root.

**1. TypeScript builds (no Docker required)**

```bash
pnpm --filter @dragon/api build
pnpm --filter @dragon/worker build
```

Expected: exits 0, no TypeScript errors, `apps/api/dist/` and `apps/worker/dist/` created.

**2. Nuxt builds (no Docker required)**

```bash
pnpm --filter @dragon/web build
pnpm --filter @dragon/admin build
```

Expected: exits 0, `.output/` created in each app directory.

**3. Docker builds (requires Docker daemon)**

```bash
docker build -f apps/api/Dockerfile    -t dragon-api    .
docker build -f apps/worker/Dockerfile -t dragon-worker  .
docker build -f apps/web/Dockerfile    -t dragon-web     .
docker build -f apps/admin/Dockerfile  -t dragon-admin   .
```

Expected: all four images build without error. No secrets appear in build output.

**4. Nginx config syntax check (requires Docker)**

```bash
docker run --rm -v "$(pwd)/infra/nginx-or-caddy/nginx.conf:/etc/nginx/nginx.conf:ro" \
  nginx:alpine nginx -t
```

Expected: `syntax is ok` and `test is successful`.

**5. Lint and typecheck**

```bash
pnpm --filter @dragon/api lint
pnpm --filter @dragon/api typecheck
pnpm --filter @dragon/worker lint
pnpm --filter @dragon/worker typecheck
```

**6. Format check**

```bash
pnpm format:check
```

Expected: exits 0 (no Prettier violations).

### Security checklist

- [ ] No `.env` file is copied in any Dockerfile (`COPY .env` does not appear anywhere)
- [ ] No secret is hardcoded in any Dockerfile (`JWT_SECRET`, `MONGODB_URI`, `REDIS_*`, `STORAGE_S3_*` do not appear in Dockerfiles)
- [ ] No production domain appears in `nginx.conf` (only `YOUR_DOMAIN`, `YOUR_API_DOMAIN`, `YOUR_ADMIN_DOMAIN` placeholders)
- [ ] No TLS certificate or private key is committed (all `ssl_certificate` directives reference placeholder paths)
- [ ] `.dockerignore` excludes `.env`, `.env.*`, `node_modules`, `dist`, `.output`
- [ ] All runtime images run as non-root `appuser`
- [ ] MongoDB (27017) and Redis (6379) have no upstream block in `nginx.conf`
- [ ] `X-Robots-Tag: noindex,nofollow,noarchive` present in admin server block only
- [ ] `client_max_body_size 50m` present in API server block only (default `1m` elsewhere)

### Docker image smoke test (optional, requires running containers)

```bash
# API — should respond on port 3000
docker run --rm -e MONGODB_URI=mongodb://host.docker.internal:27017/dragon \
  -e REDIS_HOST=host.docker.internal -e REDIS_PORT=6379 \
  -e JWT_SECRET=test -e JWT_REFRESH_SECRET=test \
  -e STORAGE_PROVIDER=local \
  -p 3000:3000 dragon-api

# Web — should respond on port 3001
docker run --rm \
  -e NUXT_PUBLIC_API_BASE_URL=http://localhost:3000 \
  -e NUXT_API_INTERNAL_BASE_URL=http://host.docker.internal:3000 \
  -e NUXT_PUBLIC_SITE_URL=http://localhost:3001 \
  -p 3001:3001 dragon-web

# Admin — should respond on port 3002
docker run --rm \
  -e NUXT_PUBLIC_API_BASE_URL=http://localhost:3000 \
  -e NUXT_PUBLIC_ADMIN_URL=http://localhost:3002 \
  -p 3002:3002 dragon-admin
```

### Out of scope (covered in later tasks)

- Docker Compose production stack (Slice 0.10.2)
- Health check endpoints (Slice 0.10.3)
- Structured JSON logging (Slice 0.10.3)
- Database backup scripts (Slice 0.10.4)

---

## Slice 0.10.2 — Docker Compose Production Stack

### Files created / modified

```
infra/docker/docker-compose.prod.yml          ← new
infra/docker/.env.production.example          ← new
infra/nginx-or-caddy/nginx.conf               ← updated: upstream service names
docs/operations/deploy-runbook.md             ← new
docs/operations/smoke-test-checklist.md       ← new
docs/architecture/deployment.md               ← updated: Compose topology
docs/development/environment.md               ← updated: Task 0.10.2 env section
docs/development/slice-0.10-verification.md   ← this file
README.md                                     ← updated: deploy-runbook + checklist links
```

### Required verification commands

```bash
# 1. Validate compose YAML structure (no Docker daemon needed)
docker compose -f infra/docker/docker-compose.prod.yml config

# 2. Validate with example env file
docker compose -f infra/docker/docker-compose.prod.yml \
  --env-file infra/docker/.env.production.example config

# 3. Lint, typecheck, build, format
pnpm install
pnpm lint
pnpm typecheck
pnpm build
pnpm format:check
```

### Security checklist

- [ ] `docker-compose.prod.yml` has no hardcoded secrets or real credentials
- [ ] `mongodb` service has no `ports:` mapping (no public exposure)
- [ ] `redis` service has no `ports:` mapping (no public exposure)
- [ ] Only `reverse-proxy` has `ports: ["80:80", "443:443"]`
- [ ] `env_file: .env.production` (not example) is used — gitignored
- [ ] `.env.production.example` contains only `CHANGE_ME` placeholder values
- [ ] `MONGODB_URI` in example uses host `mongodb` (compose service name, not `localhost`)
- [ ] `REDIS_HOST` in example is `redis` (compose service name)
- [ ] `NUXT_API_INTERNAL_BASE_URL` in example is `http://api:3000`
- [ ] nginx.conf upstreams use service names (`api:3000`, `web:3001`, `admin:3002`)
- [ ] Admin `X-Robots-Tag: noindex,nofollow,noarchive` remains in nginx.conf
- [ ] `client_max_body_size 50m` remains on API server block in nginx.conf
- [ ] MongoDB volume `dragon_prod_mongodb_data` is defined
- [ ] Redis volume `dragon_prod_redis_data` is defined with AOF persistence
- [ ] Healthchecks exist for all 7 services
- [ ] `restart: always` policy on all 7 services
- [ ] Docs state backup is not implemented in this task
- [ ] Docs state health/logging hardening is Task 0.10.3

### Out of scope (covered in later tasks)

- Dedicated `/health` endpoints (Slice 0.10.3)
- Structured JSON logging (Slice 0.10.3)
- Database backup scripts (Slice 0.10.4)
- Automated CI/CD pipeline

---

## Slice 0.10.3 — Health Endpoints, Logging, and Operational Baseline

### Files created / modified

```
packages/types/src/contracts/health-types.ts          ← new
packages/types/src/contracts/index.ts                 ← updated: health-types export
packages/sdk/src/system-health-types.ts               ← new
packages/sdk/src/system-health.ts                     ← new
packages/sdk/src/index.ts                             ← updated: system-health exports
apps/api/src/health/health.service.ts                 ← new
apps/api/src/health/health.service.spec.ts            ← new
apps/api/src/health/health.controller.ts              ← new
apps/api/src/health/health.controller.spec.ts         ← new
apps/api/src/health/health.module.ts                  ← new
apps/api/src/common/middleware/request-id.middleware.ts  ← new
apps/api/src/common/interceptors/logging.interceptor.ts  ← new
apps/api/src/admin/system/admin-system.controller.ts  ← updated: real HealthService
apps/api/src/admin/system/admin-system.module.ts      ← updated: imports HealthModule
apps/api/src/app.module.ts                            ← updated: HealthModule + middleware
apps/api/src/main.ts                                  ← updated: global LoggingInterceptor
infra/docker/docker-compose.prod.yml                  ← updated: log rotation + /health/live
docs/architecture/monitoring.md                       ← new
docs/development/slice-0.10-verification.md           ← this file
docs/operations/smoke-test-checklist.md               ← updated: /health/live step
README.md                                             ← updated: monitoring.md link
```

### Deviation from task allowed-file list

`apps/api/src/app.module.ts` was updated (not in the original Slice 0.10.2 allowed list) to:

1. Import `HealthModule` — required to register `HealthEndpointsController` and `HealthService`
2. Implement `NestModule.configure()` — required to apply `RequestIdMiddleware` globally

This is an intentional, necessary deviation. The alternatives (middleware registration via `main.ts` or a separate bootstrap module) are less idiomatic and NestJS recommends `NestModule.configure()` in the root `AppModule`.

### Verification commands

```bash
# 1. Lint and typecheck
pnpm --filter @dragon/api lint
pnpm --filter @dragon/api typecheck

# 2. Run tests
pnpm --filter @dragon/api test

# 3. Build
pnpm --filter @dragon/api build
pnpm --filter @dragon/types build
pnpm --filter @dragon/sdk build

# 4. Format check
pnpm format:check
```

### Health endpoint smoke test (requires running API)

```bash
# Liveness — always 200
curl -s http://localhost:3000/health/live | jq .
# Expected: { "status": "ok", "service": "api", "timestamp": "..." }

# Readiness — 200 when deps up, 503 when down
curl -o /dev/null -w "%{http_code}" http://localhost:3000/health/ready
# Expected: 200 (with MongoDB and Redis running)

# Dependencies — always 200 with full dep map
curl -s http://localhost:3000/health/dependencies | jq .
# Expected: { "status": "ok"|"degraded", "dependencies": { mongodb, redis, storage, sms } }

# requestId propagation
curl -I http://localhost:3000/health/live | grep x-request-id
# Expected: x-request-id: <uuid>
```

### Security checklist

- [ ] `/health/live`, `/health/ready`, `/health/dependencies` — no auth required, no credentials in response
- [ ] `storage` and `sms` dependency check — reports only config presence, never env var values
- [ ] `mongodb` health check — uses `ping` command, no connection string in response
- [ ] `redis` health check — uses queue client `ping`, no credentials in response
- [ ] `LoggingInterceptor` — logs only method, url, status, ms, requestId — never request/response bodies or tokens
- [ ] `RequestIdMiddleware` — generates UUID if no header; echoes back via `x-request-id` response header
- [ ] `AdminSystemController.getHealth()` — maps health status to `AdminSystemHealthResponse`, no raw dep details exposed
- [ ] Log rotation — all 7 services have `max-size: 10m, max-file: 3`
- [ ] API healthcheck in compose uses `/health/live` (not TCP check)

### Out of scope (covered in later tasks)

- Database backup scripts (Task 0.10.4)
- External metrics / Prometheus endpoint
- Distributed tracing (OpenTelemetry)
- Alerting rules
