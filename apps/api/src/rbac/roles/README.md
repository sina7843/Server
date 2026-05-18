# RBAC Roles

Roles are persisted by the RBAC foundation.

## System roles

Base system roles are code/seed-owned. Admin APIs cannot:

- create a role using a reserved base role key
- update a system role unsafely
- deactivate a system role
- attach permissions to a system role
- detach permissions from a system role

System role permission mappings are managed only by the RBAC seed system.

## Custom roles

Custom non-system roles can be created and managed through protected RBAC admin
backend APIs. Permission mappings for custom active non-system roles can be
attached and detached by admin APIs.
