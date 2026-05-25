# Environment conventions

Environment files in this repository are examples only.

Real `.env` files are local, ignored by Git, and must not be committed. Do not place real credentials, production secrets, or third-party API keys in example files.

## Slice 0.1

Local Docker infrastructure uses:

```text
infra/docker/.env.example
```

That file is local-only and is not production deployment configuration.

## Slice 0.2

Auth-related `.env.example` values are safe local examples. Application runtime wiring was added only where required by the approved Auth slice.

## Slice 0.3

RBAC seed bootstrapping may use:

```env
RBAC_BOOTSTRAP_SUPER_ADMIN_PHONE=
```

This value is optional. It is used only by the seed foundation to assign the `super_admin` role to an existing active user. It does not create a user and does not introduce a permanent request-time bypass.

## Slice 0.7

Storage environment variables added to `apps/api/.env.example`:

```env
STORAGE_PROVIDER=local|minio|arvan
STORAGE_BUCKET=
STORAGE_PUBLIC_BASE_URL=
STORAGE_SIGNED_URL_TTL_SECONDS=3600

# Local adapter (dev/fallback only)
STORAGE_LOCAL_ROOT=
STORAGE_LOCAL_PUBLIC_BASE_URL=

# S3-compatible adapter (minio or arvan)
STORAGE_S3_ENDPOINT=
STORAGE_S3_REGION=
STORAGE_S3_ACCESS_KEY_ID=
STORAGE_S3_SECRET_ACCESS_KEY=
STORAGE_S3_FORCE_PATH_STYLE=false
```

**`STORAGE_S3_ACCESS_KEY_ID` and `STORAGE_S3_SECRET_ACCESS_KEY` are secrets. They must only exist in the deployment environment, never in the repository.** The `.env.example` file has these fields empty.

For local dev using MinIO, set `STORAGE_PROVIDER=minio` and use the MinIO credentials from `infra/docker/.env.example`. For production Arvan Object Storage, set `STORAGE_PROVIDER=arvan` and provide the Arvan S3 credentials via deployment environment only.

## Slice 0.8

No new environment variables were introduced in Slice 0.8.1. The audit log subsystem persists to the existing MongoDB connection configured in Slice 0.1.

The `audit_logs` collection is created automatically by Mongoose on first write.

## Slice 0.9

No new environment variables are introduced in Slice 0.9.1. The search foundation uses `MongoSearchAdapter`, which reads directly from existing MongoDB collections (`posts`, `pages`, `users`, `media_assets`) using the connection already configured in Slice 0.1.

No external search engine (Meilisearch, Elasticsearch, OpenSearch) is configured. When a real search engine is added in a later phase, new environment variables for its host, API key, and index names will be documented here.

The `search` BullMQ queue uses the Redis connection already configured in Slice 0.8.3. No additional Redis environment variables are required.

## Slice 0.10

### Task 0.10.1 — Containerization

Production containerization environment variables are documented in `docs/architecture/deployment.md`.

Key rules:

- No `.env` file is ever copied into a Docker image. All `.env*` files are excluded by `.dockerignore`.
- All secrets (`AUTH_JWT_SECRET`, `STORAGE_S3_ACCESS_KEY_ID`, `STORAGE_S3_SECRET_ACCESS_KEY`, etc.) must be supplied at container runtime via environment variables. They must never be baked into images or committed.
- Nuxt `NUXT_PUBLIC_*` values can be overridden at container start. The SSR-only value `NUXT_API_INTERNAL_BASE_URL` must also be supplied at runtime.
- Real domain names, TLS certificates, and database credentials are not committed.

### Task 0.10.2 — Docker Compose production

Production env template: `infra/docker/.env.production.example`

Copy to `infra/docker/.env.production` (gitignored) and fill in all `CHANGE_ME` values before running the stack.

The production compose file loads the env file with `env_file: .env.production` per service. All services share one env file. MongoDB init vars (`MONGO_INITDB_*`) and the API's `MONGODB_URI` must use matching credentials — the connection string host must be `mongodb` (the compose service name, not `localhost`). Similarly, `REDIS_HOST` must be `redis` and `NUXT_API_INTERNAL_BASE_URL` must be `http://api:3000`.

### Task 0.10.4 — Backup and Restore

Backup environment variables are documented in `apps/api/.env.example`. They must be supplied at runtime only — never committed.

```env
# Backup configuration (Task 0.10.4)
BACKUP_TEMP_DIR=/tmp/dragon-backups
BACKUP_STORAGE_BUCKET_PREFIX=backups/mongodb

# Shell script uses MONGODB_URI from the main connection vars above.
# No separate BACKUP_MONGODB_URI is needed — the backup script reads MONGODB_URI.
```

Key rules:

- `BACKUP_TEMP_DIR` is a local path on the VPS. It must not be inside the Docker container image.
- `BACKUP_STORAGE_BUCKET_PREFIX` scopes backup artifacts within the Object Storage bucket. Backups must NOT share a bucket prefix with media files.
- The shell script (`infra/backup/mongo-backup.sh`) reads `MONGODB_URI`, `STORAGE_S3_ACCESS_KEY_ID`, `STORAGE_S3_SECRET_ACCESS_KEY`, and related vars from the environment. These are the same secrets already required by the API. No additional credentials are introduced.
- Backup artifacts must be encrypted before production use (GPG or cloud-native). Encryption is **not implemented** in Phase 0 — see `docs/security/backup-security-checklist.md`.

## Out of scope

Real production secret management (Vault, AWS Secrets Manager, etc.), monitoring, backup automation, and CI/CD pipeline configuration are not implemented in Phase 0.
