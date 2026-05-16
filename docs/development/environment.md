# Environment conventions

Environment files in this repository are examples only. They document safe local development conventions and must not contain real secrets.

Real `.env` files are local machine files and are ignored by Git. Do not commit production credentials, provider secrets, VPS credentials, or personal access tokens.

## Scope in Slice 0.1

Slice 0.1 only adds example files and documentation. The app `.env.example` files are not wired into runtime configuration yet.

No runtime config loader, database connection, Redis connection, MinIO client, queue, secret manager, CI secret handling, or production deployment configuration is implemented in this slice.

## Local infrastructure

Local Docker infrastructure uses:

```text
infra/docker/.env.example
```

That file contains local example values for MongoDB and MinIO only. It is not a production environment file.

## App examples

The root and app-level `.env.example` files provide neutral local examples for:

```text
root
apps/api
apps/worker
apps/web
apps/admin
```

Browser-exposed Nuxt values use the `NUXT_PUBLIC_` prefix. Do not add Auth, OTP, RBAC, Admin feature, Content, Media, Search, Analytics, payment, or third-party secret variables in Slice 0.1.

## API MongoDB foundation

Starting in Slice 0.2, the API database foundation reads `MONGODB_URI` from the API runtime environment. The example value in `apps/api/.env.example` is local-only and matches the local Docker MongoDB service.

No production credentials should be committed. No database schema, migration, seed data, or feature persistence is defined by the environment examples.

## API Auth configuration foundation

Starting in Slice 0.2, the API validates local Auth, OTP, Session, Password, JWT, and SMS provider selection settings at startup.

The local examples are documented in:

```text
apps/api/.env.example
```

`AUTH_JWT_SECRET` is an example-only local development value and must be replaced in real local `.env` files. Do not commit real JWT secrets or SMS provider credentials.

`SMS_PROVIDER=mock` is the only accepted provider value in this slice. No SMS provider integration, Auth flow, OTP generation, session persistence, or JWT issuing is implemented by these environment examples.
