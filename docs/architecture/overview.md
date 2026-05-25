# Architecture Overview — Phase 0 Complete

Phase 0 is complete and locked. This document reflects the full Phase 0 implementation.

See [README.md](README.md) for the full architecture index.

---

## Apps

- `apps/api` — NestJS API. Implements Auth, RBAC, User Profile, Content Engine, Media Library, Search, Analytics, Audit Log, Jobs, Notifications, Health, and Backup APIs.
- `apps/worker` — BullMQ worker runtime. Processes background jobs (notifications, media processing, backup, search reindex).
- `apps/web` — Nuxt 3 public-facing frontend. SSR-capable with type-scoped content routes.
- `apps/admin` — Nuxt 3 admin frontend. Separate subdomain. Requires authentication and permission-based route access.

---

## Packages

- `packages/config` — Shared tooling configuration: TypeScript, ESLint, Prettier, Tailwind.
- `packages/types` — Shared contracts: health DTOs, content types, pagination types.
- `packages/utils` — Generic framework-agnostic utilities.
- `packages/sdk` — API client foundation (no endpoint-specific methods in Phase 0).
- `packages/ui` — Vue component package (placeholder components only in Phase 0).

---

## Infrastructure

- `infra/docker` — Docker Compose stacks (local dev and production).
- `infra/nginx` — Nginx reverse proxy configuration (HTTP→HTTPS redirect, API/web/admin routing).
- `infra/backup` — MongoDB backup shell script.

---

## Phase 0 boundaries

**Implemented:**

- Phone-first OTP auth with password reset and session management
- Flat RBAC with ABAC-ready foundation (scopeType/scopeId scaffolded)
- User profiles (own and public)
- Content engine: posts (news/article/guide/announcement/rule), pages, categories, tags — full lifecycle
- Media library: upload, variants (Sharp), Arvan Object Storage, signed URLs
- Audit log (append-only), BullMQ jobs, notification logs
- Basic search (MongoSearchAdapter), lightweight analytics
- Health probes (live/ready/dependencies), BackupLog, manual backup via `mongodump`
- Docker Compose production stack with nginx, TLS, structured logging
- Security hardening: CORS allowlist, security headers, body limits, case-insensitive redactors
- Smoke test suite (80 tests, no real services required)

**Not implemented in Phase 0:**

- OAuth / social login / passkeys / 2FA
- ABAC dynamic policy engine (foundation only)
- Elasticsearch / Meilisearch (MongoSearchAdapter only)
- Persian stemming / fuzzy search
- Real-time notifications / WebSocket / push
- Notification campaign / bulk messaging
- Video upload / streaming / transcoding
- BI dashboards / funnels / cohorts
- Kubernetes / Terraform / auto-scaling
- Backup encryption
- Backup restore endpoint (manual runbook only)
- Backup download API
- Phase 1 product modules
