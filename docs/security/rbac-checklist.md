# RBAC Security Checklist — Slice 0.3

## Authorization

- [ ] Permission resolver returns permission keys.
- [ ] `super_admin` grants all registered permission keys.
- [ ] Inactive roles are ignored.
- [ ] Expired user-role assignments are ignored.
- [ ] Users without roles are denied by default.
- [ ] `PermissionGuard` denies missing metadata and empty metadata.
- [ ] `PermissionGuard` denies missing auth context.

## API protection

- [ ] RBAC admin APIs use `AccessTokenGuard`.
- [ ] RBAC admin APIs use `PermissionGuard`.
- [ ] No permission creation API exists.
- [ ] No permission update/delete API exists.

## DTO validation

- [ ] Role key format is validated.
- [ ] ObjectId fields are validated.
- [ ] `expiresAt` is validated as a date string.
- [ ] Unknown/internal fields are rejected.

## System role protection

- [ ] Reserved base role keys cannot be created by admin API.
- [ ] `isSystem` cannot be mutated through admin API.
- [ ] System roles cannot be deactivated by admin API.
- [ ] Roles are deactivated, not hard-deleted.

## Sensitive data

- [ ] Responses do not expose password hashes.
- [ ] Responses do not expose token hashes.
- [ ] Responses do not expose session internals.
