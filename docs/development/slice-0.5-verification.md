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

## Task 0.5.3 — Admin users management

### Backend

- [x] `GET /admin/v1/users` requires `user.user.read`.
- [x] `GET /admin/v1/users/:id` requires `user.user.read`.
- [x] `PATCH /admin/v1/users/:id/status` requires `user.status.update`.
- [x] `GET /admin/v1/users/:id/sessions` requires `user.user.read`.
- [x] `DELETE /admin/v1/users/:id/sessions/:sessionId` requires `user.session.revoke`.
- [x] Phone masked (`***XX`) in all responses.
- [x] `passwordHash`, `refreshTokenHash`, `statusReason` not returned.
- [x] Session revoke scoped to user; cross-user revoke not possible.
- [x] Unit tests exist for `AdminUsersController`.

### SDK

- [x] `AdminUsersClient` interface exported from `@dragon/sdk`.
- [x] `createAdminUsersClient()` factory exported from `@dragon/sdk`.
- [x] SDK spec covers all 6 methods.

### Frontend

- [x] `useAdminUsers` composable exists (module-level reactive state).
- [x] `/users` page: paginated list, status filter, permission guard.
- [x] `/users/:id` page: user detail, sessions list, session revoke.
- [x] `/users/:id/edit` page: status update form only.
- [x] `UserStatusBadge`, `UserListItem`, `SessionListItem`, `ConfirmDialog` components exist.

---

## Task 0.5.4 — Admin roles and permissions management UI

### Backend

- [x] `GET /admin/v1/roles/:id/permissions` added (permission: `rbac.role.read`).
- [x] System roles reject mutation with `ConflictException`.
- [x] No permission create/update/delete endpoints.

### SDK

- [x] `AdminRbacClient` interface with 9 methods exported from `@dragon/sdk`.
- [x] `createAdminRbacClient()` factory exported from `@dragon/sdk`.
- [x] SDK spec verifies no `createPermission`, `updatePermission`, `deletePermission` methods.

### Frontend

- [x] `useAdminRoles` composable exists.
- [x] `/roles` page: role list with deactivate confirm.
- [x] `/roles/new` page: create role form.
- [x] `/roles/:id` page: role detail, permission attach/detach.
- [x] `/roles/:id/edit` page: edit name/description (key is read-only).
- [x] `/permissions` page: read-only list with module/resource filters.
- [x] `SystemRoleBadge`, `RoleListItem`, `RolePermissionItem`, `PermissionListItem` components.
- [x] System roles hide edit/deactivate/attach-detach actions in UI.

---

## Task 0.5.5 — Admin dashboard and system foundation pages

### Backend

- [x] `GET /admin/v1/dashboard/summary` requires `admin.dashboard.view`.
- [x] Dashboard summary returns real user counts (total, active, pending).
- [x] No fake or hardcoded metrics.
- [x] `GET /admin/v1/system/health` requires `system.health.read`.
- [x] System health returns `{ status, service, checkedAt }` only.
- [x] `AdminDashboardModule` and `AdminSystemModule` registered in `AppModule`.
- [x] Unit tests exist for both controllers.

### SDK

- [x] `AdminDashboardClient` interface + `createAdminDashboardClient()` exported from `@dragon/sdk`.
- [x] `AdminSystemClient` interface + `createAdminSystemClient()` exported from `@dragon/sdk`.
- [x] SDK specs cover both clients.

### Frontend

- [x] `useAdminDashboard` composable exists.
- [x] `useAdminSystem` composable exists.
- [x] `/dashboard` page: real user stats, system status badge, loading/error/forbidden states.
- [x] `/system` page: nav links to health (no fakes, no jobs/backups/notifications).
- [x] `/system/health` page: real health card, loading/error/forbidden states.
- [x] Permission checked before API call in `onMounted`.

### Security

- [x] No fake metrics.
- [x] No coming-soon cards.
- [x] No future module shortcuts.
- [x] No Content/Media/Audit/Analytics/Backup/Jobs/Notifications pages.

---

## Scope exclusions (all tasks)

- [x] No fake dashboard data or charts.
- [x] No Content/Media/Audit/Analytics features.
- [x] No Backup/Jobs/Notifications pages without real API.
- [x] No permission creation/update/delete UI.
- [x] No coming-soon routes or future module shortcuts.
