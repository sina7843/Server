# Operations

## Status

Slice 0.10 is complete. All operational foundations for Phase 0 are implemented:

| Task   | Scope                                                                                                                       |
| ------ | --------------------------------------------------------------------------------------------------------------------------- |
| 0.10.1 | Production containerization — Dockerfiles, `.dockerignore`, Nginx reverse proxy                                             |
| 0.10.2 | Docker Compose production stack — all 7 services, volumes, healthchecks                                                     |
| 0.10.3 | Health endpoints (`/health/live`, `/health/ready`, `/health/dependencies`), structured JSON logging, request-id propagation |
| 0.10.4 | Backup foundation — MongoDB dump, Object Storage upload, admin backup API, audit hooks                                      |
| 0.10.5 | Admin system health UI (dependency panels), admin backups UI, navigation permissions                                        |

Backup restore is **manual and runbook-driven only**. No restore endpoint or restore UI exists by design.

## Runbooks

| Document                                                               | Purpose                                                            |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------ |
| [deploy-runbook.md](deploy-runbook.md)                                 | First-time and update deploy on a single Arvan VPS                 |
| [rollback-runbook.md](rollback-runbook.md)                             | Roll back code to a previous commit/image after a failed deploy    |
| [backup-runbook.md](backup-runbook.md)                                 | Trigger and verify MongoDB backups via admin API or shell script   |
| [restore-runbook.md](restore-runbook.md)                               | Restore MongoDB from a backup artifact (manual, approval-required) |
| [restore-verification-checklist.md](restore-verification-checklist.md) | Post-restore verification steps                                    |

## Checklists

| Document                                                               | Purpose                                         |
| ---------------------------------------------------------------------- | ----------------------------------------------- |
| [smoke-test-checklist.md](smoke-test-checklist.md)                     | Post-deploy smoke test — run after every deploy |
| [production-readiness-checklist.md](production-readiness-checklist.md) | Pre-launch sign-off checklist                   |

## Deployment architecture

See `docs/architecture/deployment.md` for the full architecture — service topology, port assignments, environment variable reference, Nginx routing, and security invariants.

## Building images

Run from the repo root (build context must be the workspace root for pnpm workspace resolution):

```bash
docker build -f apps/api/Dockerfile    -t dragon-api    .
docker build -f apps/worker/Dockerfile -t dragon-worker  .
docker build -f apps/web/Dockerfile    -t dragon-web     .
docker build -f apps/admin/Dockerfile  -t dragon-admin   .
```

## Nginx config

Config is at `infra/nginx-or-caddy/nginx.conf`. It contains placeholder domains and TLS paths. Before deploying:

1. Replace `YOUR_DOMAIN`, `YOUR_API_DOMAIN`, `YOUR_ADMIN_DOMAIN` with real values.
2. Provision TLS certificates (Let's Encrypt or Arvan CDN) and update the `ssl_certificate` paths.
3. Validate the config: `nginx -t`.

Do not commit real domain names, TLS keys, or credentials.

## Secrets

All secrets are supplied to containers at runtime via environment variables. No secret appears in any Dockerfile, Nginx config, or committed `.env` file. See `docs/development/environment.md` for the full list of variables.

## Backup and restore

Backups require `STORAGE_PROVIDER` to be set to a non-local provider (e.g., `arvan`). Backups are only marked completed when the archive is successfully uploaded to Object Storage. Backups with `STORAGE_PROVIDER=local` are rejected — no recoverable artifact exists locally.

Restore is manual-only. There is no restore endpoint, restore button, or restore UI. Follow `docs/operations/restore-runbook.md`.

## Out of scope (Phase 0)

- Backup encryption at rest (required before production — see `docs/security/backup-security-checklist.md`)
- Automated TLS certificate renewal
- Log aggregation (ELK, Loki, etc.)
- Metrics and alerting (Prometheus / Grafana)
- Zero-downtime rolling deploys
- Kubernetes / Terraform / Ansible
- CI/CD pipeline
- Managed database service
