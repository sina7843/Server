# Dragon Local Docker Infrastructure

This Docker Compose setup is local-only.

It starts MongoDB, Redis, and MinIO for local development. It does not start the API, worker, web, or admin apps.

This setup does not represent production deployment and does not include production credentials, app containers, database schemas, init scripts, queues, monitoring, or backup implementation.

From the repository root:

```bash
infra/scripts/local-up.sh
infra/scripts/local-down.sh
```

Equivalent Docker Compose commands:

```bash
docker compose -f infra/docker/docker-compose.local.yml --env-file infra/docker/.env.example up -d
docker compose -f infra/docker/docker-compose.local.yml --env-file infra/docker/.env.example down
```
