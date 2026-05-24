# Slice 0.8 Verification Guide

## Task 0.8.1 — AuditLog Foundation and Integration

### What was built

**packages/types**

- `AuditActorType` union type: `'user' | 'admin' | 'system' | 'job'`
- `AuditSeverity` union type: `'info' | 'warning' | 'critical'`
- `AUDIT_RESOURCE_TYPES` constant map (12 resource types)
- `AuditAction` constant object (40+ namespaced action strings)
- `AuditLogDto` and `AuditLogListItemDto` contract interfaces

**apps/api/src/audit/**

- `audit-log.schema.ts` — Mongoose schema, append-only (`updatedAt` suppressed), 5 indexes
- `audit-log.repository.ts` — `create()` and `findById()` only; no update/delete
- `audit-redactor.ts` — recursive secret redaction, no mutation
- `audit.service.ts` — best-effort writer, catches all errors
- `audit.module.ts` — leaf module, safe to import anywhere

**Integration hooks added to:**

- `auth.service.ts` — login success/failure, logout, logout-all
- `profile.service.ts` — profile updated
- `avatar.service.ts` — avatar set, upload-and-set, delete
- `role.service.ts` — role created/updated/deactivated (admin)
- `user-role.service.ts` — role assigned/removed
- `role-permission.service.ts` — permission attached/detached
- `admin-content-posts.service.ts` — post created/updated/published/archived/soft-deleted
- `admin-media.service.ts` — media uploaded/deleted, variants regenerated

**Modules updated to import AuditModule:**

- `auth.module.ts`
- `profile.module.ts`
- `rbac.module.ts`
- `admin-content.module.ts`
- `media.module.ts`

### Verification commands

```bash
# Types package
pnpm --filter @dragon/types lint
pnpm --filter @dragon/types typecheck
pnpm --filter @dragon/types test
pnpm --filter @dragon/types build

# API
pnpm --filter @dragon/api lint
pnpm --filter @dragon/api typecheck
pnpm --filter @dragon/api test
pnpm --filter @dragon/api build

# Root
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm format:check
```

### Expected test counts

After Task 0.8.1, the `@dragon/api` test suite should include:

- `audit-log.schema.spec.ts` — schema field and index tests
- `audit-log.repository.spec.ts` — create/findById, no update/delete
- `audit-redactor.spec.ts` — ~25 tests covering key coverage, nesting, arrays, non-mutation
- `audit.service.spec.ts` — ~20 tests covering write, redaction, best-effort failure

### Security invariants

1. No secret key (`password`, `otp`, `refreshToken`, `accessToken`, etc.) ever appears in a persisted audit log.
2. AuditService.log() never throws. A failing write produces a structured error log only.
3. AuditLogRepository has no update or delete methods.
4. `audit_logs` documents have no `updatedAt` field.

### Out of scope for Task 0.8.1

Admin audit viewer API (`GET /admin/v1/audit-logs`, `GET /admin/v1/audit-logs/:id`) — planned for Task 0.8.2.
