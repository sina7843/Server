# RBAC Architecture — Slice 0.3

Slice 0.3 includes backend RBAC APIs protected by `AccessTokenGuard` and
`PermissionGuard`.

## Authorization behavior

- Permission resolution returns permission keys, not permission ids.
- Active `super_admin` grants all registered permission keys from `PermissionKeys`.
- Inactive roles are ignored.
- Expired user-role assignments are ignored by active assignment queries.
- Users without active roles resolve to no permissions.

## Seed runner

The API package provides a runnable RBAC seed command:

```bash
pnpm --filter @dragon/api build
pnpm --filter @dragon/api seed:rbac
```

The script runs `node dist/rbac/seeds/run-rbac-seed.js`, creates a Nest
application context, invokes `RbacSeedService.runRbacSeed()`, prints a safe
summary containing counts and skipped reason keys only, and closes the context.

`RBAC_BOOTSTRAP_SUPER_ADMIN_PHONE` may assign `super_admin` only to an existing
active user. The runner does not create users and does not print raw phone
values.

## Admin backend APIs

Implemented backend routes:

- `GET /admin/v1/roles`
- `POST /admin/v1/roles`
- `GET /admin/v1/roles/:id`
- `PATCH /admin/v1/roles/:id`
- `DELETE /admin/v1/roles/:id`
- `GET /admin/v1/permissions`
- `POST /admin/v1/roles/:id/permissions`
- `DELETE /admin/v1/roles/:id/permissions/:permissionId`
- `POST /admin/v1/users/:id/roles`
- `DELETE /admin/v1/users/:id/roles/:userRoleId`

Permissions remain code/seed-owned. Permission creation, update, and delete APIs
do not exist.

## System role protection

System roles and their permission mappings are seed/code-owned.

Admin APIs cannot:

- create roles with reserved base role keys
- mutate `isSystem`
- update system roles unsafely
- deactivate system roles
- attach permissions to system roles
- detach permissions from system roles

Admin APIs can manage permission mappings for custom active non-system roles.

## Not implemented

- Admin frontend UI
- Permission builder UI
- Full ABAC engine
- Dynamic policy language
- Profile/Content/Media features
- Production deployment
