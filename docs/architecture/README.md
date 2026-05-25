# Architecture Index — Dragon Ecosystem Phase 0

Phase 0 is complete. All slices listed below are closed and locked.

---

## Platform overview

Dragon Ecosystem is a modular-monolith NestJS backend with two Nuxt 3 frontends (public web and admin), a separate BullMQ worker, and shared internal packages. The stack runs on a single VPS under Docker Compose with nginx reverse proxy.

---

## Completed slices

| Slice | Domain                                | Doc                                                                                                                                                                                 |
| ----- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0.1   | Monorepo / Infrastructure             | [overview.md](overview.md)                                                                                                                                                          |
| 0.2   | Auth / OTP / Session                  | [auth.md](auth.md)                                                                                                                                                                  |
| 0.3   | RBAC / ABAC-ready Authorization       | [rbac.md](rbac.md)                                                                                                                                                                  |
| 0.4   | User Profile Base                     | [profile.md](profile.md)                                                                                                                                                            |
| 0.5   | Admin Platform Core                   | [admin.md](admin.md)                                                                                                                                                                |
| 0.6   | Content Engine + TipTap               | [content.md](content.md)                                                                                                                                                            |
| 0.7   | Media Library + Arvan Object Storage  | [media.md](media.md)                                                                                                                                                                |
| 0.8   | Audit / Events / Jobs / Notifications | [audit.md](audit.md) · [events-jobs.md](events-jobs.md) · [notifications.md](notifications.md)                                                                                      |
| 0.9   | Search / Analytics                    | [search.md](search.md) · [analytics.md](analytics.md)                                                                                                                               |
| 0.10  | Deployment / Monitoring / Backup      | [deployment.md](deployment.md) · [monitoring.md](monitoring.md) · [backup-restore.md](backup-restore.md)                                                                            |
| 0.11  | Security / Testing / Docs Hardening   | [security hardening](../security/security-hardening-checklist.md) · [smoke tests](../development/smoke-tests.md) · [phase 0 test strategy](../development/phase-0-test-strategy.md) |

---

## API docs

| Doc                                                               | Content                                                               |
| ----------------------------------------------------------------- | --------------------------------------------------------------------- |
| [route-index.md](../api/route-index.md)                           | All implemented routes with method, path, auth, permission, and notes |
| [auth-session.md](../api/auth-session.md)                         | Phone-first auth flow, OTP, session lifecycle                         |
| [permissions.md](../api/permissions.md)                           | RBAC permission keys, role model, route-to-permission map             |
| [contracts.md](../api/contracts.md)                               | DTO/response envelope, pagination, validation errors                  |
| [error-codes.md](../api/error-codes.md)                           | HTTP error conventions and error shapes                               |
| [profile.md](../api/profile.md)                                   | Profile and avatar API                                                |
| [content.md](../api/content.md)                                   | Content types, lifecycle, public and admin APIs                       |
| [media.md](../api/media.md)                                       | Media upload, variants, visibility, signed URLs                       |
| [audit-jobs-notifications.md](../api/audit-jobs-notifications.md) | Audit log, BullMQ jobs, notification logs                             |
| [search-analytics.md](../api/search-analytics.md)                 | Search and analytics APIs                                             |
| [system-health-backup.md](../api/system-health-backup.md)         | Health probes, backup log, manual backup run                          |

---

## ADRs

| ADR                                                | Decision                               |
| -------------------------------------------------- | -------------------------------------- |
| [0001](../adr/0001-monorepo-modular-monolith.md)   | Monorepo + modular monolith            |
| [0002](../adr/0002-phone-first-auth.md)            | Phone-first auth with OTP              |
| [0003](../adr/0003-rbac-abac-ready.md)             | RBAC with ABAC-ready foundation        |
| [0004](../adr/0004-s3-compatible-storage.md)       | S3-compatible object storage (Arvan)   |
| [0005](../adr/0005-single-vps-docker-compose.md)   | Single VPS + Docker Compose deployment |
| [0006](../adr/0006-separate-api-worker-runtime.md) | Separate API and worker runtimes       |

---

## Operations

| Doc                                                                                  | Content                  |
| ------------------------------------------------------------------------------------ | ------------------------ |
| [deploy-runbook.md](../operations/deploy-runbook.md)                                 | Production deploy steps  |
| [rollback-runbook.md](../operations/rollback-runbook.md)                             | Rollback procedure       |
| [backup-runbook.md](../operations/backup-runbook.md)                                 | Manual backup run        |
| [restore-runbook.md](../operations/restore-runbook.md)                               | Manual restore procedure |
| [smoke-test-checklist.md](../operations/smoke-test-checklist.md)                     | Post-deploy smoke checks |
| [production-readiness-checklist.md](../operations/production-readiness-checklist.md) | Pre-launch checklist     |

---

## Security

| Doc                                                                            | Content                               |
| ------------------------------------------------------------------------------ | ------------------------------------- |
| [security/README.md](../security/README.md)                                    | Security overview index               |
| [security-hardening-checklist.md](../security/security-hardening-checklist.md) | Hardening pass (Task 0.11.1)          |
| [auth-security-checklist.md](../security/auth-security-checklist.md)           | Auth / OTP security                   |
| [rbac-checklist.md](../security/rbac-checklist.md)                             | RBAC / permission guard               |
| [backup-security-checklist.md](../security/backup-security-checklist.md)       | Backup credential and artifact safety |
| [media-security-checklist.md](../security/media-security-checklist.md)         | Upload and storage security           |

---

## Phase 1+ — out of scope

The following are **not implemented** in Phase 0 and must not be treated as available:

- OAuth / social login / passkeys / 2FA
- ABAC dynamic policy engine (foundation only — scopeType/scopeId scaffolded, no evaluation engine)
- Elasticsearch / Meilisearch / OpenSearch (MongoSearchAdapter is used)
- Persian stemming / fuzzy full-text search
- Real-time notifications / WebSocket / push notifications
- Notification campaign / bulk messaging center
- Video upload / streaming / transcoding pipeline
- BI dashboards / funnels / cohorts / revenue analytics
- Kubernetes / Terraform / auto-scaling
- Automated secret rotation
- Backup encryption (planned for Phase 1, not implemented)
- Backup restore endpoint or restore UI (manual runbook only)
- Backup download API
- Phase 1 product modules (not defined here)
