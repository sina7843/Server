# RBAC Architecture — Slice 0.3

## Implemented backend scope

Slice 0.3 now includes:

- RBAC persistence for roles, permissions, user-role assignments, and role-permission mappings
- Code-owned permission registry
- Idempotent seed service
- Permission resolution
- `AccessTokenGuard` + `PermissionGuard` protected RBAC admin backend APIs
- Thin ABAC-ready object policy foundation

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

## Not implemented

- Admin frontend UI
- Nuxt RBAC screens
- Full ABAC engine
- Dynamic policy builder
- Profile, Content, Media, Audit, Search, Analytics features
- Production monitoring, backup, or deployment
