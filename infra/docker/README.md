# Dragon Docker Infrastructure

## Local development

Compose file: `infra/docker/docker-compose.local.yml`

Starts MongoDB, Redis, and MinIO for local development only. Does **not** start the API, worker, web, or admin application containers.

### Local port contract

| Service       | Port  |
| ------------- | ----- |
| Web (public)  | 3000  |
| Admin         | 3001  |
| API           | 4000  |
| MongoDB       | 27017 |
| Redis         | 6379  |
| MinIO S3      | 9000  |
| MinIO console | 9001  |

From the repository root:

```bash
infra/scripts/local-up.sh
infra/scripts/local-down.sh
```

Equivalent Docker Compose commands:

```bash
docker compose -f infra/docker/docker-compose.local.yml --env-file infra/docker/.env.example up -d
docker compose -f infra/docker/docker-compose.local.yml --env-file infra/docker/.env.example down
```

Local MinIO credentials are in `.env.example` (placeholder values, safe to commit).

## Production — single Arvan VPS

Compose file: `infra/docker/docker-compose.prod.yml`

Starts all seven services behind an Nginx reverse proxy:

| Service         | Description                                      |
| --------------- | ------------------------------------------------ |
| `reverse-proxy` | Nginx 1.27 — public TLS termination, port 80/443 |
| `api`           | NestJS REST API, port 3000 (internal)            |
| `worker`        | BullMQ job worker, no HTTP port                  |
| `web`           | Nuxt 3 SSR public web, port 3001 (internal)      |
| `admin`         | Nuxt 3 SPA admin UI, port 3002 (internal)        |
| `mongodb`       | MongoDB 7, internal only — no public port        |
| `redis`         | Redis 7, internal only — no public port          |

Object Storage (Arvan S3-compatible) is external — not a Docker service.

### Environment file

```bash
# Copy the example and fill in all CHANGE_ME values:
cp infra/docker/.env.production.example infra/docker/.env.production
nano infra/docker/.env.production
```

`.env.production` is gitignored. Never commit it. No real credential appears in any committed file.

### Start the stack

```bash
docker compose -f infra/docker/docker-compose.prod.yml \
  --env-file infra/docker/.env.production up -d
```

### Verify startup

```bash
docker compose -f infra/docker/docker-compose.prod.yml ps
# All 7 services should reach state: running or running (healthy)
```

Full first-time setup: `docs/operations/deploy-runbook.md`

### Key rules

- MongoDB and Redis are on the internal `dragon_net` bridge network — no public host ports.
- All secrets are injected via environment variables at runtime. No secret appears in any Dockerfile or committed config.
- Application images are built from the repo root (`docker compose build`). See `docs/operations/deploy-runbook.md` for the build commands.
- Backup execution (admin API `POST /admin/v1/system/backups/run`) runs **inside the `api` container** using `mongodump` installed in the container image. The VPS host does not need `mongodump` for API-triggered backups.
- Manual shell backups (`infra/backup/mongo-backup.sh`) run on the **VPS host** and require host-level `mongodump` and AWS CLI.
