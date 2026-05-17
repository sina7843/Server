# RBAC Seed Service

`RbacSeedService` seeds RBAC data from the code-owned registry.

## Scope

The seed service can idempotently seed:

- permissions
- base roles
- role-permission mappings
- optional `super_admin` assignment to an existing active user

It does not create users, controllers, routes, guards, decorators, or admin APIs.

## Optional bootstrap super admin assignment

`RBAC_BOOTSTRAP_SUPER_ADMIN_PHONE` may be provided locally or by seed options.

Rules:

- the phone is normalized using the existing auth phone normalizer
- the user must already exist
- the user must already be active
- assignment is idempotent
- no permanent request-time bypass is introduced
- raw phone values are not logged

## No API creation

Permissions and roles are code/seed-owned in this slice. There is no permission creation API or RBAC admin API here.
