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

## Out of scope

Production secret management, deployment configuration, monitoring, backup, and real provider credentials are not implemented in these foundation slices.
