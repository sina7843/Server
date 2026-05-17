# Environment conventions

Environment files in this repository are examples only.

Real `.env` files are local, ignored by Git, and must not be committed. Do not place real credentials, production secrets, or third-party API keys in example files.

## Slice 0.1

Local Docker infrastructure uses:

```text
infra/docker/.env.example
```

That file is local-only and is not production deployment configuration.

## Slice 0.2

Auth-related `.env.example` values are safe local examples. Application runtime wiring was added only where required by the approved Auth slice.

## Slice 0.3

RBAC seed bootstrapping may use:

```env
RBAC_BOOTSTRAP_SUPER_ADMIN_PHONE=
```

This value is optional. It is used only by the seed foundation to assign the `super_admin` role to an existing active user. It does not create a user and does not introduce a permanent request-time bypass.

## Out of scope

Production secret management, deployment configuration, monitoring, backup, and real provider credentials are not implemented in these foundation slices.
