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

## 2. Required RBAC fixes

- [ ] PermissionResolver returns permission keys, not permission ids.
- [ ] `super_admin` grants all registered permission keys.
- [ ] RBAC controllers resolve `AccessTokenGuard` dependencies through `AuthModule`.
- [ ] DTO validation is real and tested.
- [ ] System roles are protected.
- [ ] Reserved base role keys cannot be created through API.
- [ ] Placeholder tests are replaced with meaningful tests.

## 3. RBAC API verification

- [ ] Super admin can access protected RBAC APIs.
- [ ] User without permission is forbidden.
- [ ] Missing auth is unauthorized.
- [ ] `GET /admin/v1/permissions` is protected.
- [ ] `POST /admin/v1/permissions` does not exist.
- [ ] System role cannot be deactivated.
- [ ] Role assignment validates assignable role.

## 4. Scope exclusions

Confirm absence of:

- Admin frontend UI
- Permission creation/update/delete API
- Full ABAC engine
- Dynamic policy language
- Profile/Content/Media features
- Production deployment
