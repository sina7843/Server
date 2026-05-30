# Local Production-Like Verification

This document describes how to run the full local stack in a production-like configuration for manual verification before a release.

## Prerequisites

- Docker and Docker Compose installed
- Node.js 20 and pnpm installed
- `.env` file configured (see [local-setup.md](local-setup.md))

## Start the full stack

```bash
pnpm dev:local
```

This starts:

1. **Infrastructure** — MongoDB (27017), Redis (6379), MinIO S3 (9000), MinIO console (9001)
2. **API** — NestJS, TypeScript watch + Node.js `--watch` restart
3. **Worker** — BullMQ worker, TypeScript watch + Node.js `--watch` restart
4. **Web** — Nuxt public site (http://localhost:3000)
5. **Admin** — Nuxt admin panel (http://localhost:3001)

## Verify services are healthy

After `pnpm dev:local`, check the API health endpoint:

```bash
curl http://localhost:4000/api/v1/health
```

Check Docker services:

```bash
docker compose -f infra/docker/docker-compose.local.yml --env-file infra/docker/.env.example ps
```

## Stop infrastructure

```bash
pnpm dev:infra:down
```

## Run automated verification

```bash
pnpm verify:phase0
```

All 15 checks must pass before a Phase 0 release.

## Run smoke tests only

```bash
pnpm smoke
```

## Notes

- The API and Worker watch `dist/main.js` — they will not start until the first TypeScript build completes. This is expected; `wait-on` handles the wait automatically.
- Web and Admin bind to `0.0.0.0` so they are reachable from the host when running inside WSL or a VM.
- Log output is color-coded per process: blue=API build, cyan=API serve, magenta=Worker build, green=Web, yellow=Admin.
