# Dragon Ecosystem

Dragon Ecosystem is currently in Phase 0 / Slice 0.1 foundation work.

This repository contains the monorepo foundation, minimal app shells, shared package skeletons, local-only infrastructure, environment examples, CI, and base documentation. No product feature is implemented yet.

## Workspace

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm format:check
```

## Local infrastructure

```bash
infra/scripts/local-up.sh
infra/scripts/local-down.sh
```

The local infrastructure starts MongoDB, Redis, and MinIO only. It does not start API, worker, web, or admin apps and does not represent production deployment.

## Environment conventions

See `docs/development/environment.md` for environment example file conventions.

## Documentation

See `docs/README.md` for Slice 0.1 documentation and ADR placeholders.

## CI

CI runs install, lint, typecheck, test, build, and format checks.

## Slice 0.1 verification

See `docs/development/slice-0.1-verification.md` for the final Slice 0.1 verification checklist.
