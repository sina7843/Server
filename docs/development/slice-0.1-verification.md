# Slice 0.1 Verification Checklist

This checklist verifies that Slice 0.1 is complete and remains limited to monorepo and infrastructure foundation work.

## 1. Command verification

Run the local project checks:

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm format:check
```

Run the local infrastructure validation commands:

```bash
docker compose -f infra/docker/docker-compose.local.yml --env-file infra/docker/.env.example config
docker compose -f infra/docker/docker-compose.local.yml --env-file infra/docker/.env.example up -d
docker compose -f infra/docker/docker-compose.local.yml --env-file infra/docker/.env.example ps
docker compose -f infra/docker/docker-compose.local.yml --env-file infra/docker/.env.example down
```

Script alternatives:

```bash
infra/scripts/local-up.sh
infra/scripts/local-down.sh
```

- [ ] `pnpm install --frozen-lockfile` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm typecheck` passes
- [ ] `pnpm test` passes
- [ ] `pnpm build` passes
- [ ] `pnpm format:check` passes
- [ ] Docker Compose config validates
- [ ] Local Docker Compose services start
- [ ] Local Docker Compose services can be listed
- [ ] Local Docker Compose services stop cleanly

## 2. Monorepo and workspace verification

- [ ] Root `package.json` is private
- [ ] `pnpm-workspace.yaml` includes `apps/*`
- [ ] `pnpm-workspace.yaml` includes `packages/*`
- [ ] `turbo.json` defines `lint`, `typecheck`, `test`, and `build`
- [ ] Root scripts delegate to Turbo for `lint`, `typecheck`, `test`, and `build`
- [ ] Root `format:check` exists
- [ ] Package naming uses the `@dragon` scope where applicable
- [ ] No workspace package is missing standard Turbo tasks

## 3. App shell verification

- [ ] `apps/api` exists
- [ ] `apps/api` only exposes a static/minimal `/health` route
- [ ] `/health` does not check MongoDB
- [ ] `/health` does not check Redis
- [ ] `/health` does not check MinIO
- [ ] `apps/worker` exists
- [ ] `apps/worker` has no BullMQ dependency
- [ ] `apps/worker` has no Redis queue implementation
- [ ] `apps/worker` has no job processor implementation
- [ ] `apps/web` exists
- [ ] `apps/web` remains SSR-capable
- [ ] `apps/admin` exists
- [ ] `apps/admin` has `ssr: false`
- [ ] `apps/web` and `apps/admin` are separate apps
- [ ] No real UI screens exist

## 4. Shared package verification

- [ ] `packages/config` contains shared tooling config only
- [ ] `packages/types` contains neutral contracts/constants only
- [ ] `packages/utils` contains generic utilities only
- [ ] `packages/sdk` contains a generic client foundation only
- [ ] `packages/sdk` has no endpoint-specific methods
- [ ] `packages/sdk` has no health client
- [ ] `packages/sdk` has no auth client
- [ ] `packages/sdk` has no content client
- [ ] `packages/sdk` has no admin client
- [ ] `packages/sdk` has no media client
- [ ] `packages/ui` contains only a neutral placeholder component
- [ ] `packages/ui` has no API calls
- [ ] `packages/ui` is not a design system implementation yet

## 5. Local infrastructure verification

- [ ] Docker Compose setup is local-only
- [ ] Only MongoDB, Redis, and MinIO services exist
- [ ] No API container exists
- [ ] No worker container exists
- [ ] No web container exists
- [ ] No admin container exists
- [ ] No production Compose file exists
- [ ] No MongoDB init schema exists
- [ ] No MinIO bucket bootstrap exists

## 6. Environment and secret safety verification

- [ ] Root `.env.example` exists
- [ ] `apps/api/.env.example` exists
- [ ] `apps/worker/.env.example` exists
- [ ] `apps/web/.env.example` exists
- [ ] `apps/admin/.env.example` exists
- [ ] Real `.env` files are ignored
- [ ] `.env.example` files contain example values only
- [ ] No production credentials exist
- [ ] No secret is committed
- [ ] No runtime env integration was added beyond examples

## 7. CI verification

- [ ] GitHub Actions CI exists
- [ ] CI uses pnpm
- [ ] CI uses frozen lockfile install
- [ ] CI runs lint
- [ ] CI runs typecheck
- [ ] CI runs test
- [ ] CI runs build
- [ ] CI runs format:check
- [ ] CI does not deploy
- [ ] CI does not build or push Docker images
- [ ] CI does not require production secrets
- [ ] CI does not start Docker services

## 8. Documentation and ADR verification

- [ ] `docs/README.md` exists
- [ ] Architecture overview exists
- [ ] Local setup docs exist
- [ ] Environment docs exist
- [ ] Operations placeholder exists
- [ ] Security placeholder exists
- [ ] Six ADR placeholders exist
- [ ] ADRs record locked decisions only
- [ ] Auth ADR does not implement Auth, OTP, sessions, or user schema
- [ ] RBAC ADR does not implement roles, permissions, policies, guards, or UI
- [ ] Storage ADR does not implement media, bucket bootstrap, upload flow, or storage client
- [ ] Deployment ADR does not implement production deployment, SSL, backup, or monitoring

## 9. Scope exclusion verification

Confirm the following are absent from Slice 0.1:

- [ ] Auth
- [ ] OTP
- [ ] SMS
- [ ] RBAC
- [ ] Profile
- [ ] Admin dashboard
- [ ] Admin feature
- [ ] Content
- [ ] Media
- [ ] Audit
- [ ] Notification
- [ ] Search
- [ ] Analytics
- [ ] MongoDB schema
- [ ] Mongoose model
- [ ] Redis queue
- [ ] BullMQ job processor
- [ ] MinIO storage client
- [ ] Production deployment
- [ ] Backup implementation
- [ ] Monitoring implementation
- [ ] Real product UI screens
- [ ] Mock product data

## 10. Final approval checklist

- [ ] Gate A approved
- [ ] Gate B approved
- [ ] Gate C approved
- [ ] Gate D approved
- [ ] Gate E approved
- [ ] Slice 0.1 ready to close
