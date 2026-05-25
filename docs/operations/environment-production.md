# Production Environment Reference

This document describes every environment variable required for the production Docker Compose stack. All values must be supplied at container runtime — no secrets are committed to the repository.

**Template file:** `infra/docker/.env.production.example`

Copy to `infra/docker/.env.production` (gitignored) and replace every `CHANGE_ME` placeholder before starting the stack.

---

## App environment

| Variable   | Value        | Notes                             |
| ---------- | ------------ | --------------------------------- |
| `NODE_ENV` | `production` | Required by NestJS and Nuxt       |
| `APP_ENV`  | `production` | Application-level environment tag |

---

## MongoDB

| Variable                     | Example                                                                 | Notes                                                |
| ---------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------- |
| `MONGO_INITDB_ROOT_USERNAME` | `dragon_prod`                                                           | MongoDB root user created on first start             |
| `MONGO_INITDB_ROOT_PASSWORD` | `CHANGE_ME`                                                             | Use a strong random password; must match MONGODB_URI |
| `MONGO_INITDB_DATABASE`      | `dragon_prod`                                                           | Initial database name                                |
| `MONGODB_URI`                | `mongodb://dragon_prod:PASS@mongodb:27017/dragon_prod?authSource=admin` | Host must be `mongodb` (compose service name)        |

> The compose service name `mongodb` is not `localhost`. Using `localhost` will cause the API/worker to fail to connect.

---

## Redis / BullMQ

| Variable                    | Value          | Notes                         |
| --------------------------- | -------------- | ----------------------------- |
| `REDIS_HOST`                | `redis`        | Compose service name          |
| `REDIS_PORT`                | `6379`         |                               |
| `REDIS_PASSWORD`            | (empty or set) | Set if Redis is protected     |
| `REDIS_DB`                  | `0`            |                               |
| `BULLMQ_PREFIX`             | `dragon`       | Queue key prefix              |
| `BULLMQ_DEFAULT_ATTEMPTS`   | `3`            | Retry count for failed jobs   |
| `BULLMQ_DEFAULT_BACKOFF_MS` | `2000`         | Backoff delay between retries |

---

## JWT / Auth

| Variable                                | Value                      | Notes                            |
| --------------------------------------- | -------------------------- | -------------------------------- |
| `AUTH_JWT_SECRET`                       | `CHANGE_ME` (min 64 chars) | Generate: `openssl rand -hex 64` |
| `AUTH_ACCESS_TOKEN_TTL_SECONDS`         | `900`                      | 15 minutes                       |
| `AUTH_REFRESH_TOKEN_TTL_DAYS`           | `30`                       |                                  |
| `AUTH_PASSWORD_MIN_LENGTH`              | `8`                        |                                  |
| `AUTH_PASSWORD_RESET_TOKEN_TTL_SECONDS` | `600`                      | 10 minutes                       |

---

## OTP / Rate limits

| Variable                           | Default | Notes                         |
| ---------------------------------- | ------- | ----------------------------- |
| `AUTH_OTP_TTL_SECONDS`             | `300`   | OTP validity window           |
| `AUTH_OTP_MAX_ATTEMPTS`            | `5`     | Wrong-code lockout            |
| `AUTH_OTP_RESEND_COOLDOWN_SECONDS` | `90`    | Minimum gap between OTP sends |
| `AUTH_OTP_DAILY_PHONE_LIMIT`       | `10`    | Max OTPs per phone per day    |
| `AUTH_OTP_IP_LIMIT`                | `30`    | Max OTPs per IP per day       |

---

## SMS provider

| Variable       | Value       | Notes                                                    |
| -------------- | ----------- | -------------------------------------------------------- |
| `SMS_PROVIDER` | `kavenegar` | Use `mock` for staging only; mock does not send real SMS |
| `SMS_API_KEY`  | `CHANGE_ME` | Kavenegar API key; obtain from Arvan/Kavenegar console   |

---

## Arvan Object Storage (S3-compatible)

| Variable                         | Value                                       | Notes                             |
| -------------------------------- | ------------------------------------------- | --------------------------------- |
| `STORAGE_PROVIDER`               | `arvan`                                     |                                   |
| `STORAGE_BUCKET`                 | `CHANGE_ME`                                 | Bucket name                       |
| `STORAGE_PUBLIC_BASE_URL`        | `https://BUCKET.storage.c2.arvanstorage.ir` | CDN/public base URL               |
| `STORAGE_SIGNED_URL_TTL_SECONDS` | `3600`                                      | Signed URL TTL for private assets |
| `STORAGE_S3_ENDPOINT`            | `https://s3.ir-thr-at1.arvanstorage.ir`     |                                   |
| `STORAGE_S3_REGION`              | `ir-thr-at1`                                |                                   |
| `STORAGE_S3_ACCESS_KEY_ID`       | `CHANGE_ME`                                 | **Secret** — never commit         |
| `STORAGE_S3_SECRET_ACCESS_KEY`   | `CHANGE_ME`                                 | **Secret** — never commit         |
| `STORAGE_S3_FORCE_PATH_STYLE`    | `false`                                     |                                   |

---

## Media

| Variable                    | Value      | Notes                                               |
| --------------------------- | ---------- | --------------------------------------------------- |
| `MEDIA_MAX_FILE_SIZE_BYTES` | `52428800` | 50 MB; must align with nginx `client_max_body_size` |

---

## Public web (Nuxt web container)

| Variable                     | Example                   | Notes                                      |
| ---------------------------- | ------------------------- | ------------------------------------------ |
| `NUXT_API_INTERNAL_BASE_URL` | `http://api:3000`         | Server-side SSR; uses compose service name |
| `NUXT_PUBLIC_API_BASE_URL`   | `https://api.YOUR_DOMAIN` | Browser-side requests                      |
| `NUXT_PUBLIC_SITE_URL`       | `https://YOUR_DOMAIN`     |                                            |
| `NUXT_PUBLIC_APP_ENV`        | `production`              |                                            |
| `NUXT_PUBLIC_APP_NAME`       | `Dragon Web`              |                                            |

---

## Admin (Nuxt admin container)

| Variable                | Example                     | Notes |
| ----------------------- | --------------------------- | ----- |
| `NUXT_PUBLIC_ADMIN_URL` | `https://admin.YOUR_DOMAIN` |       |

---

## RBAC bootstrap

| Variable                           | Value           | Notes                                                                                 |
| ---------------------------------- | --------------- | ------------------------------------------------------------------------------------- |
| `RBAC_BOOTSTRAP_SUPER_ADMIN_PHONE` | `+989121234567` | Set once to assign super_admin role to an existing user; leave empty after first seed |

---

## Backup

| Variable                       | Value                 | Notes                                                     |
| ------------------------------ | --------------------- | --------------------------------------------------------- |
| `BACKUP_TEMP_DIR`              | `/tmp/dragon-backups` | Local VPS temp path for backup staging; must be writable  |
| `BACKUP_STORAGE_BUCKET_PREFIX` | `backups/mongodb`     | Object Storage prefix; must not overlap with media prefix |

The backup script reads `MONGODB_URI` and storage credentials from the same env vars used by the API. No separate backup credentials are required.

**Encryption:** Backup archives are not encrypted in Phase 0. Encryption must be implemented before production use.

---

## Logging

| Variable    | Value  | Notes                                               |
| ----------- | ------ | --------------------------------------------------- |
| `LOG_LEVEL` | `warn` | Options: `error`, `warn`, `log`, `debug`, `verbose` |

---

## Worker

| Variable      | Value           | Notes                      |
| ------------- | --------------- | -------------------------- |
| `WORKER_NAME` | `dragon-worker` | Worker instance identifier |

---

## CORS

| Variable               | Value                                           | Notes                                     |
| ---------------------- | ----------------------------------------------- | ----------------------------------------- |
| `CORS_ALLOWED_ORIGINS` | `https://YOUR_DOMAIN,https://admin.YOUR_DOMAIN` | Comma-separated; wildcard `*` is rejected |

---

## Secret management

- Never commit `.env.production` to the repository.
- All `*.env*` files are excluded by `.dockerignore` — no secrets are baked into Docker images.
- Rotate `AUTH_JWT_SECRET` and storage credentials by updating the env file and restarting the stack. All existing access tokens become invalid when `AUTH_JWT_SECRET` changes (refresh tokens also become invalid as they are validated against the JWT secret).
- For production secret management (Vault, AWS Secrets Manager, etc.), see Phase 1 planning. Phase 0 uses environment variable injection at container start only.

---

## Dev / prod separation

| Concern            | Development             | Production                   |
| ------------------ | ----------------------- | ---------------------------- |
| `STORAGE_PROVIDER` | `local` or `minio`      | `arvan`                      |
| `SMS_PROVIDER`     | `mock`                  | `kavenegar`                  |
| `AUTH_JWT_SECRET`  | Short placeholder       | Min 64 random chars          |
| MongoDB host       | `localhost:27017`       | `mongodb:27017` (compose)    |
| Redis host         | `localhost:6379`        | `redis:6379` (compose)       |
| Nuxt API base      | `http://localhost:3000` | `http://api:3000` (internal) |
| Log level          | `debug` or `log`        | `warn`                       |
