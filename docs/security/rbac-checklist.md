# RBAC Security Checklist — Slice 0.3

## Route protection

- [ ] RBAC admin APIs use `AccessTokenGuard`.
- [ ] RBAC admin APIs use `PermissionGuard`.
- [ ] Required permissions use centralized constants.
- [ ] No test/dev bypass exists.

## Permission safety

- [ ] Permissions are code/seed-owned.
- [ ] `POST /admin/v1/permissions` does not exist.
- [ ] `PATCH /admin/v1/permissions/:id` does not exist.
- [ ] `DELETE /admin/v1/permissions/:id` does not exist.

## Role safety

- [ ] Role key is immutable through API.
- [ ] `isSystem` is not accepted from role create/update bodies.
- [ ] Role delete deactivates roles and does not hard-delete.
- [ ] Inactive roles do not grant permissions.

## User-role safety

- [ ] Assignments require existing user and active assignable role.
- [ ] `scopeType` and `scopeId` are stored only.
- [ ] Remove user role is scoped to target user.
- [ ] Responses do not expose full user documents.

## Sensitive data

- [ ] Responses do not expose password hashes.
- [ ] Responses do not expose token hashes.
- [ ] Responses do not expose session internals.
