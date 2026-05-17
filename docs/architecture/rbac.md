# RBAC Architecture — Slice 0.3

Slice 0.3 includes backend RBAC APIs protected by `AccessTokenGuard` and
`PermissionGuard`.

## Fixed authorization behavior

- Permission resolution returns permission keys, not permission ids.
- Active `super_admin` grants all registered permission keys.
- Inactive roles are ignored.
- Expired user-role assignments are ignored by active assignment queries.
- Users without active roles resolve to no permissions.

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

Base system role keys are reserved. Admin APIs must not create duplicate reserved
roles, mutate `isSystem`, or deactivate system roles.

## Not implemented

- Admin frontend UI
- Permission builder UI
- Full ABAC engine
- Dynamic policy language
- Profile/Content/Media features
