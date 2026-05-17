# Slice 0.3 Verification Checklist

## 1. Command verification

```bash
pnpm install
pnpm --filter @dragon/api lint
pnpm --filter @dragon/api typecheck
pnpm --filter @dragon/api test
pnpm --filter @dragon/api build
pnpm --filter @dragon/types lint
pnpm --filter @dragon/types typecheck
pnpm --filter @dragon/types test
pnpm --filter @dragon/types build
pnpm --filter @dragon/sdk lint
pnpm --filter @dragon/sdk typecheck
pnpm --filter @dragon/sdk test
pnpm --filter @dragon/sdk build
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm format:check
```

## 2. RBAC API verification

- [ ] RBAC admin controllers exist.
- [ ] All RBAC admin APIs are protected by `AccessTokenGuard` and `PermissionGuard`.
- [ ] Role CRUD uses deactivate behavior for delete.
- [ ] Permission API is list-only.
- [ ] Role-permission attach/detach works safely.
- [ ] User-role assignment/removal is scoped and safe.

## 3. Scope exclusions

Confirm absence of:

- Admin frontend UI
- Permission creation/update/delete API
- Full ABAC engine
- Dynamic policy builder
- Profile/Content/Media feature implementation
- Monitoring/backup/deployment changes
