# Operations

## Status

Production containerization foundation implemented in Slice 0.10.1.
Docker Compose production stack: Slice 0.10.2.
Health checks and structured logging: Slice 0.10.3.
Backups: Slice 0.10.4.

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

## Out of scope (Phase 0)

- Automated TLS certificate renewal
- Database backup and restore
- Log aggregation (ELK, Loki, etc.)
- Metrics and alerting (Prometheus / Grafana)
- Zero-downtime rolling deploys
- Kubernetes / Terraform / Ansible
- CI/CD pipeline
- Managed database service
