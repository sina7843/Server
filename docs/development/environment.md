# Development Environment Reference

This document describes all environment variables used by the Dragon Ecosystem backend in local development. For production, see [environment-production.md](../operations/environment-production.md).

---

## Rules

- Real `.env` files are local, gitignored, and must not be committed.
- Example files (`.env.example`, `.env.production.example`) contain only placeholders — no real credentials.
- No `.env*` file is ever copied into a Docker image (enforced by `.dockerignore`).

---

## Local env file locations

| File                                   | Used by                                      |
| -------------------------------------- | -------------------------------------------- |
| `apps/api/.env.example`                | NestJS API (copy to `apps/api/.env`)         |
| `apps/worker/.env.example`             | BullMQ worker                                |
| `apps/web/.env.example`                | Nuxt public frontend                         |
| `apps/admin/.env.example`              | Nuxt admin frontend                          |
| `infra/docker/.env.example`            | Local Docker Compose (MongoDB, Redis, MinIO) |
| `infra/docker/.env.production.example` | Production Docker Compose template           |

---

## Core app variables (`apps/api/.env`)

### Node / app

| Variable   | Dev value     | Notes                             |
| ---------- | ------------- | --------------------------------- |
| `NODE_ENV` | `development` |                                   |
| `APP_ENV`  | `development` |                                   |
| `API_HOST` | `0.0.0.0`     |                                   |
| `PORT`     | `4000`        | Port the NestJS server listens on |

### MongoDB

| Variable      | Dev value                                                                                    | Notes                                        |
| ------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `MONGODB_URI` | `mongodb://dragon_local:dragon_local_password@localhost:27017/dragon_local?authSource=admin` | Credentials from `infra/docker/.env.example` |

### Redis / BullMQ

| Variable                    | Dev value                | Notes             |
| --------------------------- | ------------------------ | ----------------- |
| `REDIS_URL`                 | `redis://localhost:6379` | Convenience alias |
| `REDIS_HOST`                | `localhost`              |                   |
| `REDIS_PORT`                | `6379`                   |                   |
| `REDIS_PASSWORD`            | (empty)                  |                   |
| `REDIS_DB`                  | `0`                      |                   |
| `BULLMQ_DEFAULT_ATTEMPTS`   | `3`                      |                   |
| `BULLMQ_DEFAULT_BACKOFF_MS` | `2000`                   |                   |
| `BULLMQ_PREFIX`             | `dragon`                 | Queue key prefix  |

### Auth / JWT

| Variable                                | Dev value                          | Notes                                                           |
| --------------------------------------- | ---------------------------------- | --------------------------------------------------------------- |
| `AUTH_JWT_SECRET`                       | `local_dev_change_me_min_32_chars` | Placeholder only; any real deployment must use 64+ random chars |
| `AUTH_ACCESS_TOKEN_TTL_SECONDS`         | `900`                              | 15 minutes                                                      |
| `AUTH_REFRESH_TOKEN_TTL_DAYS`           | `30`                               |                                                                 |
| `AUTH_PASSWORD_MIN_LENGTH`              | `8`                                |                                                                 |
| `AUTH_PASSWORD_RESET_TOKEN_TTL_SECONDS` | `600`                              | 10 minutes                                                      |

### OTP

| Variable                           | Dev value | Notes     |
| ---------------------------------- | --------- | --------- |
| `AUTH_OTP_TTL_SECONDS`             | `300`     | 5 minutes |
| `AUTH_OTP_MAX_ATTEMPTS`            | `5`       |           |
| `AUTH_OTP_RESEND_COOLDOWN_SECONDS` | `90`      |           |
| `AUTH_OTP_DAILY_PHONE_LIMIT`       | `10`      |           |
| `AUTH_OTP_IP_LIMIT`                | `30`      |           |

### SMS provider

| Variable       | Dev value | Notes                                              |
| -------------- | --------- | -------------------------------------------------- |
| `SMS_PROVIDER` | `mock`    | `mock` logs OTP to console; does not send real SMS |

For local dev, `SMS_PROVIDER=mock` is always used. The mock provider records sent messages in memory and is injectable in tests via `createMockSmsService()`.

### Object Storage

| Variable                         | Dev value                       | Notes                              |
| -------------------------------- | ------------------------------- | ---------------------------------- |
| `STORAGE_PROVIDER`               | `local`                         | Options: `local`, `minio`, `arvan` |
| `STORAGE_BUCKET`                 | `dragon-local`                  |                                    |
| `STORAGE_PUBLIC_BASE_URL`        | `http://localhost:4000/storage` |                                    |
| `STORAGE_SIGNED_URL_TTL_SECONDS` | `3600`                          |                                    |
| `STORAGE_LOCAL_ROOT`             | `/tmp/dragon-storage`           | Local adapter path                 |
| `STORAGE_LOCAL_PUBLIC_BASE_URL`  | `http://localhost:4000/storage` |                                    |

For local dev with MinIO, set `STORAGE_PROVIDER=minio` and fill in the S3-compatible vars from `infra/docker/.env.example`. For production, use `STORAGE_PROVIDER=arvan`.

**S3-compatible vars (leave empty when using `local`):**

| Variable                       | Notes                                                         |
| ------------------------------ | ------------------------------------------------------------- |
| `STORAGE_S3_ENDPOINT`          | MinIO: `http://localhost:9000`; Arvan: see production example |
| `STORAGE_S3_REGION`            |                                                               |
| `STORAGE_S3_ACCESS_KEY_ID`     | **Secret — never commit**                                     |
| `STORAGE_S3_SECRET_ACCESS_KEY` | **Secret — never commit**                                     |
| `STORAGE_S3_FORCE_PATH_STYLE`  | `true` for MinIO, `false` for Arvan                           |

### Media

| Variable                    | Dev value  | Notes |
| --------------------------- | ---------- | ----- |
| `MEDIA_MAX_FILE_SIZE_BYTES` | `10485760` | 10 MB |

### RBAC bootstrap

| Variable                           | Value                 | Notes                                                                        |
| ---------------------------------- | --------------------- | ---------------------------------------------------------------------------- |
| `RBAC_BOOTSTRAP_SUPER_ADMIN_PHONE` | (empty or your phone) | Assigns `super_admin` role to an existing active user at seed time; optional |

### Backup

| Variable                       | Dev value             | Notes                            |
| ------------------------------ | --------------------- | -------------------------------- |
| `BACKUP_TEMP_DIR`              | `/tmp/dragon-backups` | Staging path for backup archives |
| `BACKUP_STORAGE_BUCKET_PREFIX` | `backups/mongodb`     | Object Storage prefix            |

### CORS

| Variable               | Dev value                                     | Notes                                                        |
| ---------------------- | --------------------------------------------- | ------------------------------------------------------------ |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000,http://localhost:3001` | Comma-separated; wildcard `*` is rejected by the CORS config |

---

## Docker Compose local services (`infra/docker/.env.example`)

The local compose file starts MongoDB, Redis, and MinIO for development.

| Variable                     | Notes                                               |
| ---------------------------- | --------------------------------------------------- |
| `MONGO_INITDB_ROOT_USERNAME` | Local MongoDB root user                             |
| `MONGO_INITDB_ROOT_PASSWORD` | Local placeholder password (not used in production) |
| `MONGO_INITDB_DATABASE`      | Local database name                                 |
| `MINIO_ROOT_USER`            | MinIO root user for local S3 dev                    |
| `MINIO_ROOT_PASSWORD`        | MinIO root password                                 |

---

## Frontend env files

### `apps/web/.env.example`

| Variable                     | Dev value               |
| ---------------------------- | ----------------------- |
| `NUXT_API_INTERNAL_BASE_URL` | `http://localhost:4000` |
| `NUXT_PUBLIC_API_BASE_URL`   | `http://localhost:4000` |
| `NUXT_PUBLIC_SITE_URL`       | `http://localhost:3000` |

### `apps/admin/.env.example`

| Variable                   | Dev value               |
| -------------------------- | ----------------------- |
| `NUXT_PUBLIC_API_BASE_URL` | `http://localhost:4000` |
| `NUXT_PUBLIC_ADMIN_URL`    | `http://localhost:3001` |

---

## Secret rotation (conceptual)

- **`AUTH_JWT_SECRET`:** Changing this invalidates all issued access tokens and refresh tokens immediately. All users are logged out on the next request. Plan for a maintenance window or implement graceful rotation with overlapping secrets (Phase 1).
- **Storage credentials (`STORAGE_S3_ACCESS_KEY_ID` / `STORAGE_S3_SECRET_ACCESS_KEY`):** Rotate in the Arvan console, update env file, restart containers. Signed URLs issued before rotation remain valid until their TTL expires.
- **MongoDB password:** Update `MONGO_INITDB_ROOT_PASSWORD` and `MONGODB_URI` consistently, recreate the MongoDB user, restart all services.

---

## Out of scope (Phase 0)

Real-world secret management (HashiCorp Vault, AWS Secrets Manager, GCP Secret Manager, Doppler) and automated secret rotation are Phase 1+ concerns.
