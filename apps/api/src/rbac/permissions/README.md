# RBAC Permissions

Permissions are code/seed-owned.

- Permission registry entries live under `apps/api/src/rbac/registry/`.
- `RbacSeedService` upserts permissions idempotently.
- `GET /admin/v1/permissions` lists seeded permissions.
- There is no API for creating, updating, or deleting permissions.

Run the seed after building the API:

```bash
pnpm --filter @dragon/api build
pnpm --filter @dragon/api seed:rbac
```
