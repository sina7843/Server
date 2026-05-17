# Dragon Ecosystem

Dragon Ecosystem is currently in Phase 0 foundation work.

This repository contains the monorepo foundation, minimal app shells, shared package skeletons, local-only infrastructure, environment examples, CI, base documentation, and the Slice 0.2 backend Auth / OTP / Session foundation.

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

See `docs/README.md` for project documentation and ADRs.

Auth documentation:

- `docs/architecture/auth.md`
- `docs/security/auth-security-checklist.md`
- `docs/development/slice-0.2-verification.md`

## CI

CI runs install, lint, typecheck, test, build, and format checks.

## Slice verification

- `docs/development/slice-0.1-verification.md`
- `docs/development/slice-0.2-verification.md`
