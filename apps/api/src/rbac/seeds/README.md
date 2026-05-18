# RBAC Seed Service

`RbacSeedService` seeds RBAC data from the code-owned registry.

## Scope

The seed service can idempotently seed:

- permissions
- base roles
- role-permission mappings
- optional `super_admin` assignment to an existing active user

It does not create users, frontend UI, permission creation APIs, or a permanent
request-time bypass.

## Running the seed

Build the API before running the seed command:

```bash
pnpm --filter @dragon/api build
pnpm --filter @dragon/api seed:rbac
```

The `seed:rbac` script executes:

```bash
node dist/rbac/seeds/run-rbac-seed.js
```

The runner creates a Nest application context, resolves `RbacSeedService`, runs
`runRbacSeed()`, prints a safe count-only summary, closes the context, and exits
with `0` on success or `1` on failure.

## Optional bootstrap super admin assignment

`RBAC_BOOTSTRAP_SUPER_ADMIN_PHONE` may be provided locally or by seed options.

Rules:

- the phone is normalized using the existing auth phone normalizer
- the user must already exist
- the user must already be active
- assignment is idempotent
- no permanent request-time bypass is introduced
- raw phone values are not printed by the seed runner

## Admin APIs and seed ownership

RBAC admin backend APIs exist for role management, permission listing, custom
role-permission mapping, and user-role assignment.

Permissions remain code/seed-owned. There is no permission creation, update, or
delete API.

System role permission mappings are seed/code-owned. Admin APIs may manage
permission mappings only for custom non-system roles.
