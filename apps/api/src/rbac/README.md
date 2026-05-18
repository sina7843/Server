# RBAC Module

The RBAC module contains the Slice 0.3 authorization foundation.

Implemented backend scope:

- Role, Permission, UserRole, and RolePermission persistence
- code-owned permission and role registries
- idempotent RBAC seed service
- `seed:rbac` runner after API build
- permission resolution and `PermissionGuard`
- RBAC admin backend APIs protected by `AccessTokenGuard` and `PermissionGuard`
- thin ABAC-ready object policy foundation

## Seed command

```bash
pnpm --filter @dragon/api build
pnpm --filter @dragon/api seed:rbac
```

The seed runner prints only counts and skipped reason keys.

## System role boundaries

System roles are seed/code-owned. Admin APIs cannot update or deactivate system
roles and cannot attach or detach permissions from system roles. Custom
non-system role permission mappings remain manageable through RBAC admin APIs.

## Not implemented

- Admin frontend UI
- permission creation API
- full ABAC engine
- dynamic policy language
- Profile, Content, Media, Audit, Search, or Analytics features
