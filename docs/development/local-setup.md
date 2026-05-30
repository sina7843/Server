# Local Setup

## Install

```bash
pnpm install
```

## Start the full local development stack

```bash
pnpm dev:local
```

This single command starts local Docker infrastructure (MongoDB, Redis, MinIO) and all four application runtimes (API, Worker, Web, Admin) in parallel.

### Expected URLs

| Service           | URL                       |
| ----------------- | ------------------------- |
| Web (public)      | http://localhost:3000     |
| Admin             | http://localhost:3001     |
| API               | http://localhost:4000     |
| MinIO console     | http://localhost:9001     |
| MinIO S3 endpoint | http://localhost:9000     |
| MongoDB           | mongodb://localhost:27017 |
| Redis             | redis://localhost:6379    |

## Granular dev commands

```bash
# Start Docker services only (MongoDB, Redis, MinIO)
pnpm dev:infra

# Stop Docker services
pnpm dev:infra:down

# Start app runtimes only (assumes infra is already up)
pnpm dev:apps
```

## Environment variables

The API and Worker dev scripts load `apps/api/.env.example` and `apps/worker/.env.example` automatically via `node --env-file=.env.example`. No manual copy is needed to start the local stack.

To override any value for your machine, copy the example and edit locally (never commit the result):

```bash
cp apps/api/.env.example apps/api/.env
cp apps/worker/.env.example apps/worker/.env
```

The Docker services read from `infra/docker/.env.example` by default when using `dev:infra`.

## Project checks

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm format:check
```

## Phase 0 release gate

```bash
pnpm verify:phase0
```
