# Deploy Runbook — Single Arvan VPS

## Status

This runbook covers Task 0.10.2 deployment (Docker Compose production stack).
Health check hardening is Task 0.10.3.
Backup is Task 0.10.4 — not implemented yet.

## Target environment

Single Arvan VPS running Ubuntu 22.04 (or equivalent).
Object Storage: external Arvan Object Storage (S3-compatible) — not a VPS service.
No managed database. MongoDB and Redis run as Docker containers on the same VPS.

## Prerequisites

On the VPS, install once:

```bash
# Docker Engine (not Docker Desktop)
curl -fsSL https://get.docker.com | sh
usermod -aG docker $USER   # then log out and back in

# Confirm
docker --version
docker compose version
```

## First-time deployment

### 1. Clone the repository

```bash
git clone https://YOUR_GIT_REPO /opt/dragon
cd /opt/dragon
```

### 2. Configure environment

```bash
cp infra/docker/.env.production.example infra/docker/.env.production
nano infra/docker/.env.production   # fill in all CHANGE_ME values
```

Mandatory changes:

| Variable                       | What to set                             |
| ------------------------------ | --------------------------------------- |
| `MONGO_INITDB_ROOT_PASSWORD`   | Random password (min 32 chars)          |
| `MONGODB_URI`                  | Same credentials, host = `mongodb`      |
| `AUTH_JWT_SECRET`              | `openssl rand -hex 64`                  |
| `STORAGE_S3_ACCESS_KEY_ID`     | Arvan Object Storage key                |
| `STORAGE_S3_SECRET_ACCESS_KEY` | Arvan Object Storage secret             |
| `STORAGE_BUCKET`               | Your Arvan bucket name                  |
| `STORAGE_PUBLIC_BASE_URL`      | Public CDN URL for your bucket          |
| `NUXT_PUBLIC_API_BASE_URL`     | `https://api.YOUR_DOMAIN`               |
| `NUXT_PUBLIC_SITE_URL`         | `https://YOUR_DOMAIN`                   |
| `NUXT_PUBLIC_ADMIN_URL`        | `https://admin.YOUR_DOMAIN`             |
| `NUXT_API_INTERNAL_BASE_URL`   | `http://api:3000` (Docker service name) |

### 3. Configure the Nginx reverse proxy

Update the domain placeholders in `infra/nginx-or-caddy/nginx.conf`:

```bash
# Replace YOUR_DOMAIN, YOUR_API_DOMAIN, YOUR_ADMIN_DOMAIN with real values.
nano infra/nginx-or-caddy/nginx.conf
```

### 4. Provision TLS certificates

```bash
# Install certbot
apt-get install -y certbot

# Obtain certificates (stop any existing port-80 process first)
certbot certonly --standalone \
  -d YOUR_DOMAIN \
  -d www.YOUR_DOMAIN \
  -d api.YOUR_DOMAIN \
  -d admin.YOUR_DOMAIN

# Create directories referenced by nginx.conf
mkdir -p /etc/ssl/YOUR_DOMAIN /etc/ssl/api.YOUR_DOMAIN /etc/ssl/admin.YOUR_DOMAIN

# Copy (or symlink) certificates
cp /etc/letsencrypt/live/YOUR_DOMAIN/fullchain.pem /etc/ssl/YOUR_DOMAIN/
cp /etc/letsencrypt/live/YOUR_DOMAIN/privkey.pem   /etc/ssl/YOUR_DOMAIN/
# Repeat for api and admin domains
```

Update `ssl_certificate` and `ssl_certificate_key` paths in `nginx.conf` to match.

### 5. Validate configuration

```bash
# Validate compose YAML (no Docker network/volume operations)
docker compose -f infra/docker/docker-compose.prod.yml \
  --env-file infra/docker/.env.production config

# Validate nginx config syntax
docker run --rm \
  -v "$(pwd)/infra/nginx-or-caddy/nginx.conf:/etc/nginx/nginx.conf:ro" \
  nginx:1.27-alpine nginx -t
```

Both must exit 0 before proceeding.

### 6. Build images

```bash
docker compose -f infra/docker/docker-compose.prod.yml build
```

This runs the multi-stage builds for api, worker, web, and admin. Takes several minutes on first run.

### 7. Start the stack

```bash
docker compose -f infra/docker/docker-compose.prod.yml up -d
```

### 8. Verify startup

```bash
# Watch service health
docker compose -f infra/docker/docker-compose.prod.yml ps
docker compose -f infra/docker/docker-compose.prod.yml logs --tail=50 -f

# All services should reach state: running (healthy) or running
```

See `docs/operations/smoke-test-checklist.md` for the full post-deploy checklist.

## Updating to a new version

```bash
cd /opt/dragon
git pull

# Rebuild changed images
docker compose -f infra/docker/docker-compose.prod.yml build

# Rolling restart (minimal downtime — nginx buffers requests during restart)
docker compose -f infra/docker/docker-compose.prod.yml up -d
```

## Rollback

If the new version is broken:

```bash
# Roll back to the previous Git commit
git checkout HEAD~1

# Rebuild and restart
docker compose -f infra/docker/docker-compose.prod.yml build
docker compose -f infra/docker/docker-compose.prod.yml up -d
```

For MongoDB schema changes, data migration or rollback is a manual step (documented separately when needed).

## Stopping the stack

```bash
docker compose -f infra/docker/docker-compose.prod.yml down
```

Data volumes (`dragon_prod_mongodb_data`, `dragon_prod_redis_data`) are preserved. To delete them (destructive):

```bash
docker compose -f infra/docker/docker-compose.prod.yml down -v
```

## Useful commands

```bash
# Tail logs for a single service
docker compose -f infra/docker/docker-compose.prod.yml logs -f api

# Open a shell in the API container
docker compose -f infra/docker/docker-compose.prod.yml exec api sh

# Run RBAC seed (once, after first deploy)
docker compose -f infra/docker/docker-compose.prod.yml exec api node dist/rbac/seeds/run-rbac-seed.js

# Check MongoDB (interactive)
docker compose -f infra/docker/docker-compose.prod.yml exec mongodb mongosh \
  -u dragon_prod -p YOUR_PASSWORD dragon_prod

# Check Redis
docker compose -f infra/docker/docker-compose.prod.yml exec redis redis-cli ping
```

## Future extraction order

As load grows, services can be extracted in this order without re-architecting the application:

1. **MongoDB** — move to a managed MongoDB service (Atlas, Arvan, etc.) — update `MONGODB_URI`
2. **Redis / BullMQ** — move to a managed Redis (Upstash, Arvan, etc.) — update `REDIS_*`
3. **Worker** — move to a separate VPS; point at the same MongoDB and Redis
4. **API / Web / Admin** — scale horizontally behind a load balancer
5. **Search service** — add Meilisearch as a separate service; replace `MongoSearchAdapter`
6. **Kubernetes** — only if real orchestration need arises (not planned for Phase 0)

## Not implemented in this task

- Backup and restore — see Task 0.10.4
- Health check endpoints — see Task 0.10.3
- Structured JSON logging — see Task 0.10.3
- TLS certificate auto-renewal (set up certbot cron manually)
- Automated CI/CD deployment — out of scope for Phase 0
