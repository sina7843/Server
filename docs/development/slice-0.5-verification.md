# Slice 0.5 — Verification Checklist

## Commands

```bash
pnpm install

pnpm --filter @dragon/sdk typecheck
pnpm --filter @dragon/sdk test
pnpm --filter @dragon/sdk build

pnpm --filter @dragon/api lint
pnpm --filter @dragon/api typecheck
pnpm --filter @dragon/api test
pnpm --filter @dragon/api build

pnpm --filter @dragon/admin lint
pnpm --filter @dragon/admin typecheck
pnpm --filter @dragon/admin test
pnpm --filter @dragon/admin build

pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm format:check
```

---

## Task 0.5.1 — Admin auth, access checks, guards, route protection

### Backend

- [x] `AdminAuthModule` imports `AuthModule` and `RbacModule`.
- [x] `AdminAuthModule` is registered in `AppModule`.
- [x] `GET /admin/v1/auth/me` requires `AccessTokenGuard`.
- [x] `GET /admin/v1/auth/me` requires `PermissionGuard` with `admin.dashboard.view`.
- [x] Response does not expose sensitive fields.
- [x] Unit tests exist for `AdminAuthController`.

### SDK

- [x] `AdminMeResponse` type exported from `@dragon/sdk`.
- [x] `AdminAuthClient` interface exported from `@dragon/sdk`.
- [x] `createAdminAuthClient()` factory exported from `@dragon/sdk`.
- [x] `AdminLoginRequest` type exported from `@dragon/sdk`.

### Frontend

- [x] `apps/admin` depends on `@dragon/sdk`.
- [x] `useAdminAuthState` stores access token in memory only.
- [x] `admin-auth-required` middleware redirects to `/login`.
- [x] `admin-permission-required` middleware redirects to `/forbidden`.
- [x] `pages/login.vue` has phone + password form, loading and error states.
- [x] `pages/forbidden.vue`, `pages/not-found.vue`, `pages/error.vue` exist.
- [x] Admin app has global `noindex, nofollow` meta.
- [x] Admin API endpoint paths are not duplicated outside `@dragon/sdk`.

---

## Task 0.5.2 — Admin shell and permission-aware navigation

### Layout shell

- [x] `AdminLayout.vue` exists (sidebar + topbar + content slot).
- [x] `AdminSidebar.vue` exists (permission-aware nav).
- [x] `AdminTopbar.vue` exists (brand + logout).
- [x] `AdminNavItem.vue` exists (display-only nav item).
- [x] `layouts/admin.vue` Nuxt layout exists.
- [x] `layouts/default.vue` Nuxt layout exists (for login/state pages).
- [x] `app.vue` uses `NuxtLayout`.
- [x] Desktop-first layout with responsive baseline.
- [x] RTL/Persian-friendly structure (logical CSS properties, `direction: rtl`).

### State components

- [x] `LoadingState.vue` exists.
- [x] `EmptyState.vue` exists.
- [x] `ErrorState.vue` exists.
- [x] `ForbiddenState.vue` exists.
- [x] `UnauthorizedState.vue` exists.

### Permission-aware navigation

- [x] `admin-navigation.ts` defines `ADMIN_NAV_ITEMS` with exactly 5 allowed items.
- [x] Navigation uses `DragonPermissions` constants (no scattered string literals).
- [x] `filterNavByPermissions()` exists and is pure/testable.
- [x] `useAdminPermissions` composable exposes `visibleNavItems` and `hasPermission`.
- [x] `useAdminAuth` composable exposes `isAuthenticated`, `displayName`, `logout`.

### Navigation test coverage

- [x] Dashboard shows only with `admin.dashboard.view`.
- [x] Users shows only with `user.user.read`.
- [x] Roles shows only with `rbac.role.read`.
- [x] Permissions shows only with `rbac.permission.read`.
- [x] System Health shows only with `system.health.read`.
- [x] `super_admin` / effective-all sees all allowed nav items.
- [x] No Content, Media, Audit, Analytics nav items exist.
- [x] No Backup, Jobs, Notifications nav items exist.
- [x] No future module nav items exist.

### Pages

- [x] `/dashboard` shell page exists (no metrics, no fake cards, no charts).
- [x] Dashboard uses `admin` layout and `admin-auth-required` middleware.
- [x] `/forbidden` page uses `ForbiddenState` component.
- [x] `/not-found` page uses default layout with noindex.
- [x] `/error` page uses `ErrorState` component.

### Security

- [x] Admin noindex remains globally configured in `nuxt.config.ts`.
- [x] State pages have per-page `noindex` meta.
- [x] No fake dashboard metrics.
- [x] No future module placeholders.

## Scope exclusions

- [x] No users management page implementation.
- [x] No roles management page implementation.
- [x] No permissions list implementation.
- [x] No system health implementation.
- [x] No Content/Media/Audit/Analytics features.
- [x] No Backup/Jobs/Notifications nav items.
- [x] No coming-soon routes.
- [x] No fake dashboard data or charts.
