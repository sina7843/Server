# Local Setup

These commands describe the current Slice 0.1 development checks only.

## Install

```bash
pnpm install
```

## Project checks

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm format:check
```

## Local infrastructure

Local infrastructure was added for MongoDB, Redis, and MinIO only.

```bash
infra/scripts/local-up.sh
infra/scripts/local-down.sh
```

Equivalent Docker Compose commands may also be used from the repository root.

## Boundaries

These docs do not describe feature usage or production deployment. Product features and production operations are out of scope for Slice 0.1.
