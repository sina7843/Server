# Deployment Architecture

## Status

Production containerization foundation implemented in Slice 0.10.1.
Docker Compose production stack implemented in Slice 0.10.2.
Health checks and structured logging: Slice 0.10.3.
Backups: Slice 0.10.4.

No Kubernetes. No Terraform. No Ansible. No CI/CD pipeline. No Prometheus/Grafana. No managed database.

## Overview

Single Arvan VPS running four application containers behind an Nginx reverse proxy. MongoDB and Redis also run as Docker containers on the same VPS, on an internal Docker network with no public ports.

Storage is handled by Arvan Object Storage (S3-compatible) — no local disk for media.

## Docker Compose Production Stack

Compose file: `infra/docker/docker-compose.prod.yml`

```
public internet
        ↓
reverse-proxy :80/:443  (nginx:1.27-alpine)
        ↓ dragon_net (internal)
 api :3000              (dragon-api — NestJS)
 web :3001              (dragon-web — Nuxt SSR)
 admin :3002            (dragon-admin — Nuxt ssr:false)
        ↓ dragon_net
 mongodb                (mongo:7, volume: dragon_prod_mongodb_data)
 redis                  (redis:7-alpine, AOF, volume: dragon_prod_redis_data)
        ↓ dragon_net
 worker                 (dragon-worker — BullMQ, no HTTP port)
```

Rules:

- Only `reverse-proxy` exposes public host ports (`80`, `443`).
- `mongodb` and `redis` have no public host ports.
- All services share the single `dragon_net` bridge network.
- `api` and `worker` depend on MongoDB and Redis health before starting.
- `reverse-proxy` depends on `api` health before accepting traffic.
- All application services use `env_file: .env.production` (not committed).
- Redis uses AOF persistence (`--appendonly yes --appendfsync everysec`) for BullMQ job durability.

## Env file

Template: `infra/docker/.env.production.example`
Actual (not committed): `infra/docker/.env.production`

Copy the example, fill in all `CHANGE_ME` values. See the file for the complete variable list.

## Startup commands

```bash
# Validate compose + env
docker compose -f infra/docker/docker-compose.prod.yml \
  --env-file infra/docker/.env.production config

# Build images (first time or after code changes)
docker compose -f infra/docker/docker-compose.prod.yml build

# Start all services
docker compose -f infra/docker/docker-compose.prod.yml up -d

# Check status
docker compose -f infra/docker/docker-compose.prod.yml ps
```

Full step-by-step setup: `docs/operations/deploy-runbook.md`
Post-deploy verification: `docs/operations/smoke-test-checklist.md`

## Service Topology

| Container       | Image           | Port    | Description                          |
| --------------- | --------------- | ------- | ------------------------------------ |
| `dragon-api`    | `dragon-api`    | 3000    | NestJS REST API                      |
| `dragon-worker` | `dragon-worker` | —       | BullMQ job worker (no HTTP port)     |
| `dragon-web`    | `dragon-web`    | 3001    | Nuxt 3 public web (SSR, `ssr: true`) |
| `dragon-admin`  | `dragon-admin`  | 3002    | Nuxt 3 admin UI (`ssr: false`)       |
| Nginx           | `nginx:alpine`  | 80, 443 | Reverse proxy / TLS termination      |

MongoDB and Redis are not proxied through Nginx. They are internal services accessible only within the Docker network.

## Dockerfile Locations

All Dockerfiles are built from the **repo root** as the build context:

```
docker build -f apps/api/Dockerfile    -t dragon-api    .
docker build -f apps/worker/Dockerfile -t dragon-worker  .
docker build -f apps/web/Dockerfile    -t dragon-web     .
docker build -f apps/admin/Dockerfile  -t dragon-admin   .
```

### API (`apps/api/Dockerfile`)

Three-stage build:

1. **Builder** (`node:20-alpine`) — installs native build tools (python3, make, g++ for argon2/sharp), installs all workspace deps via pnpm, runs `tsc -p tsconfig.build.json`, then runs `pnpm --filter @dragon/api deploy --prod /deploy` to produce a clean production directory with prod-only node_modules. `dist/` is copied explicitly because pnpm deploy respects `.gitignore`.
2. **mongo-tools** (`mongo:7`) — intermediate stage that provides the `mongodump` binary. Only the binary is copied to the runtime; the full Mongo image is not included in the final layer.
3. **Runtime** (`node:20-slim`, Debian Bookworm) — non-root user `appuser`, copies `/deploy` and `mongodump` (from the mongo-tools stage), exposes port 3000, starts with `node dist/main.js`. `node:20-slim` is used instead of Alpine for glibc compatibility with the mongodump binary.

`mongodump` inside the container is verified at build time with `RUN mongodump --version`. The admin API backup endpoint (`POST /admin/v1/system/backups/run`) uses this container-local binary — no host-level `mongodump` is required for API-triggered backups. Manual shell backups (`infra/backup/mongo-backup.sh`) run on the VPS host and require `mongodump` installed there separately.

To verify inside a running container:

```bash
docker compose exec api mongodump --version
```

### Worker (`apps/worker/Dockerfile`)

Same pattern as API. Worker uses `tsc -p tsconfig.json` for its build. No HTTP port is exposed — the worker connects outbound to Redis and MongoDB.

### Web (`apps/web/Dockerfile`)

Multi-stage build:

1. **Builder** — pnpm install + `nuxt build` → produces `apps/web/.output/` (self-contained Nitro bundle).
2. **Runtime** — copies only `.output/` (no node_modules needed). Non-root user `appuser`. Exposes port 3001. Starts with `node server/index.mjs`.

Runtime config values are supplied at container start via `NUXT_PUBLIC_*` environment variables. `NUXT_API_INTERNAL_BASE_URL` (SSR-only, server-side only) must be supplied at runtime and is never baked into the image.

### Admin (`apps/admin/Dockerfile`)

Same pattern as Web. `ssr: false` — Nitro serves pre-rendered static assets; no SSR at request time. Exposes port 3002.

## Nginx Reverse Proxy

Config: `infra/nginx-or-caddy/nginx.conf`

Subdomain-based routing:

| Domain              | Upstream            | Notes                                 |
| ------------------- | ------------------- | ------------------------------------- |
| `YOUR_DOMAIN`       | `dragon_web:3001`   | Public web; indexable                 |
| `YOUR_API_DOMAIN`   | `dragon_api:3000`   | REST API; `client_max_body_size 50m`  |
| `YOUR_ADMIN_DOMAIN` | `dragon_admin:3002` | Admin UI; `X-Robots-Tag: noindex,...` |

All HTTP is redirected to HTTPS. TLS is terminated at Nginx (Let's Encrypt or Arvan CDN).

Security headers applied to all HTTPS blocks: `Strict-Transport-Security` (2 years + preload), `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`.

The admin server block additionally sends `X-Robots-Tag: noindex,nofollow,noarchive` on every response.

## Environment Variables

Environment variables are supplied to containers at runtime only — never baked into images.

### API (`dragon-api`)

| Variable                           | Required | Notes                                        |
| ---------------------------------- | -------- | -------------------------------------------- |
| `MONGODB_URI`                      | yes      | MongoDB connection string                    |
| `REDIS_HOST`                       | yes      | Redis hostname                               |
| `REDIS_PORT`                       | yes      | Redis port (default 6379)                    |
| `JWT_SECRET`                       | yes      | JWT signing secret — keep in secrets manager |
| `JWT_EXPIRES_IN`                   | no       | Default: `15m`                               |
| `JWT_REFRESH_SECRET`               | yes      | Refresh token signing secret                 |
| `JWT_REFRESH_EXPIRES_IN`           | no       | Default: `7d`                                |
| `OTP_EXPIRES_IN_SECONDS`           | no       | OTP TTL                                      |
| `STORAGE_PROVIDER`                 | yes      | `local` \| `minio` \| `arvan`                |
| `STORAGE_BUCKET`                   | yes      | Bucket name                                  |
| `STORAGE_PUBLIC_BASE_URL`          | yes      | Public CDN/storage base URL                  |
| `STORAGE_S3_ENDPOINT`              | yes (S3) | Arvan / MinIO S3 endpoint                    |
| `STORAGE_S3_REGION`                | yes (S3) | Region string                                |
| `STORAGE_S3_ACCESS_KEY_ID`         | yes (S3) | Secret — supply via secrets manager only     |
| `STORAGE_S3_SECRET_ACCESS_KEY`     | yes (S3) | Secret — supply via secrets manager only     |
| `BULLMQ_PREFIX`                    | no       | Queue key prefix; default `dragon`           |
| `RBAC_BOOTSTRAP_SUPER_ADMIN_PHONE` | no       | Seed only; not used at request time          |

### Worker (`dragon-worker`)

| Variable        | Required | Notes                            |
| --------------- | -------- | -------------------------------- |
| `MONGODB_URI`   | yes      | MongoDB connection string        |
| `REDIS_HOST`    | yes      | Redis hostname                   |
| `REDIS_PORT`    | yes      | Redis port                       |
| `BULLMQ_PREFIX` | no       | Must match API; default `dragon` |

### Web (`dragon-web`)

| Variable                     | Required | Notes                                          |
| ---------------------------- | -------- | ---------------------------------------------- |
| `NUXT_API_INTERNAL_BASE_URL` | yes      | Internal API URL for SSR requests (not public) |
| `NUXT_PUBLIC_API_BASE_URL`   | yes      | Public API base URL (client-side)              |
| `NUXT_PUBLIC_SITE_URL`       | yes      | Canonical site URL                             |
| `NUXT_PUBLIC_APP_ENV`        | no       | `production` \| `staging`                      |

### Admin (`dragon-admin`)

| Variable                   | Required | Notes                     |
| -------------------------- | -------- | ------------------------- |
| `NUXT_PUBLIC_API_BASE_URL` | yes      | Public API base URL       |
| `NUXT_PUBLIC_ADMIN_URL`    | yes      | Admin app URL             |
| `NUXT_PUBLIC_APP_ENV`      | no       | `production` \| `staging` |

## Security Invariants

- `.env` files are never copied into images (`.dockerignore` excludes all `.env*`).
- No secrets are hardcoded in any Dockerfile or Nginx config.
- No production credentials exist in this repository.
- No TLS certificates are committed; the Nginx config has placeholder paths only. `nginx -t` requires real certificate files to exist at the configured paths — it validates both syntax and file existence. Run `nginx -t` only after provisioning TLS certs and updating the paths in `nginx.conf`. For pre-deploy syntax-only testing, mount dummy self-signed certs (see `docs/development/slice-0.10-verification.md` step 4).
- Real domain names are not committed; all `server_name` directives use `YOUR_DOMAIN` placeholders.
- Images run as non-root user `appuser` in all application containers.
- MongoDB and Redis are not reachable through the Nginx proxy.

## Phase 0 Limitations

- **No health check endpoints.** Added in Slice 0.10.3.
- **No structured logging.** Added in Slice 0.10.3.
- **No Docker Compose production stack.** Added in Slice 0.10.2.
- **No backup scripts.** Added in Slice 0.10.4.
- **No CI/CD pipeline.** Out of scope for Phase 0.
- **No Kubernetes / Terraform / Ansible.** Out of scope for Phase 0.
- **No Prometheus / Grafana.** Out of scope for Phase 0.
- **No managed database.** MongoDB and Redis are self-hosted on the same VPS in Phase 0.

## Out of Scope (Slice 0.10.1)

- Docker Compose production configuration
- Automated TLS certificate renewal
- Database backup and restore
- Log aggregation
- Metrics and alerting
- Zero-downtime rolling deploys
- Multi-region or CDN configuration
