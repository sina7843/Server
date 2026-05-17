# RBAC Registry

This directory contains the code-owned RBAC registry for Slice 0.3.

## Scope

The registry defines:

- permission keys
- permission metadata
- base roles
- role-permission mappings

Permissions are owned by code and seeded idempotently. They must not be created from request input or admin API calls in this slice.

## Adding a permission later

A future permission must be added in one place:

1. `permission-keys.ts`
2. `permission-registry.ts`
3. role mappings in `role-permission-registry.ts` when appropriate

The permission key must follow:

```text
module.resource.action
```

No guard, decorator, admin API, UI, or ABAC policy engine is implemented here.
