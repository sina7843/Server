# Admin Architecture — Slice 0.5

## Overview

The Dragon admin system is a separate Nuxt 3 SPA (`apps/admin`) that talks to a dedicated admin API prefix (`/admin/v1/...`) protected by `AccessTokenGuard` + `PermissionGuard`.

## Apps

| App             | Path         | SSR      | Purpose                      |
| --------------- | ------------ | -------- | ---------------------------- |
| `@dragon/web`   | `apps/web`   | Yes      | Public-facing Dragon web app |
| `@dragon/admin` | `apps/admin` | No (SPA) | Internal admin panel         |

## Backend — Admin Prefix

All admin-specific backend routes live under `/admin/v1/...` and require both authentication and RBAC permission checks.

### Task 0.5.1 Route

```
GET /admin/v1/auth/me
```

Guards: `AccessTokenGuard` then `PermissionGuard`
Required permission: `admin.dashboard.view`
Module: `AdminAuthModule` → `AdminAuthController`

## Auth Flow

1. Admin logs in via the shared `POST /api/v1/auth/login` endpoint.
2. On success, access token is stored **in memory only** (never localStorage, never readable cookie).
3. `GET /admin/v1/auth/me` is called immediately to verify the user has the `admin.dashboard.view` permission.
4. If 403, the user is redirected to `/forbidden` and the token is discarded.
5. All subsequent authenticated admin API calls pass the token as `Authorization: Bearer <token>`.

## Security Properties

- No admin bypass: every admin route requires `AccessTokenGuard` + `PermissionGuard`.
- Access token is memory-only: cleared on page close.
- Admin app has blanket `noindex, nofollow` meta — not indexed by search engines.
- Backend responses never contain: `passwordHash`, `refreshTokenHash`, `statusReason`, raw phone, session internals.
- `super_admin` users are handled transparently by `PermissionResolverService.isSuperAdmin`.

## Modules

### `AdminAuthModule` (backend)

- Imports `AuthModule`, `RbacModule`
- Provides `AdminAuthController`

### `apps/admin` Composables

- `useAdminAuthState` — reactive in-memory state for `accessToken` and admin `identity`
- `useAdminAuth` — convenience wrapper: `isAuthenticated`, `displayName`, `logout()`
- `useAdminPermissions` — reactive permission state: `visibleNavItems`, `hasPermission()`, `setPermissions()`

### `apps/admin` Layout Shell (Task 0.5.2)

- `layouts/admin.vue` — Nuxt layout wrapping `AdminLayout`
- `layouts/default.vue` — Minimal layout for unauthenticated pages (login)
- `components/layout/AdminLayout.vue` — Sidebar + Topbar + content slot
- `components/layout/AdminSidebar.vue` — Permission-aware sidebar navigation
- `components/layout/AdminTopbar.vue` — Top bar with brand and logout
- `components/navigation/AdminNavItem.vue` — Individual nav item (display only)

### `apps/admin` State Components (Task 0.5.2)

- `components/state/LoadingState.vue`
- `components/state/EmptyState.vue`
- `components/state/ErrorState.vue`
- `components/state/ForbiddenState.vue`
- `components/state/UnauthorizedState.vue`

### `apps/admin` Middleware

- `admin-auth-required` — redirects to `/login` if no access token in state
- `admin-permission-required` — redirects to `/forbidden` if no identity in state

## SDK

`@dragon/sdk` exports:

- `AdminMeResponse` — admin identity response type (alias of `MeResponse`)
- `AdminAuthClient` interface + `createAdminAuthClient(client)` factory
- `AdminLoginRequest` type
- `DragonPermissions` — RBAC permission constants (re-exported from `@dragon/types`)
- `DragonPermissionKey`, `DragonRoleKey` — type aliases

## Permission-Aware Navigation (Task 0.5.2)

Navigation items and their required permissions:

| Item          | Key             | Path             | Permission             |
| ------------- | --------------- | ---------------- | ---------------------- |
| Dashboard     | `dashboard`     | `/dashboard`     | `admin.dashboard.view` |
| Users         | `users`         | `/users`         | `user.user.read`       |
| Roles         | `roles`         | `/roles`         | `rbac.role.read`       |
| Permissions   | `permissions`   | `/permissions`   | `rbac.permission.read` |
| System Health | `system-health` | `/system/health` | `system.health.read`   |

- Frontend permission check is UX only; backend is the authority.
- `super_admin` users see all allowed items (via `PermissionResolverService`).
- No Content, Media, Audit, Analytics, Backup, Jobs, or Notifications nav items exist.

## Pages (Task 0.5.2)

| Route        | Layout    | Auth Required | Notes                  |
| ------------ | --------- | ------------- | ---------------------- |
| `/login`     | `default` | No            | Login form             |
| `/dashboard` | `admin`   | Yes           | Shell only, no metrics |
| `/forbidden` | `default` | No            | 403 state              |
| `/not-found` | `default` | No            | 404 state              |
| `/error`     | `default` | No            | Error state            |

Future routes (`/users`, `/roles`, `/permissions`, `/system/health`) are linked from the navigation but have no page implementations yet.

## Admin Users API (Task 0.5.3)

Backend routes under `/admin/v1/users`:

| Method | Path | Permission |
|--------|------|-----------|
| `GET` | `/admin/v1/users` | `user.user.read` |
| `GET` | `/admin/v1/users/:id` | `user.user.read` |
| `PATCH` | `/admin/v1/users/:id/status` | `user.status.update` |
| `GET` | `/admin/v1/users/:id/sessions` | `user.user.read` |
| `DELETE` | `/admin/v1/users/:id/sessions/:sessionId` | `user.session.revoke` |

Responses mask phone (`***XX` format) and never expose `passwordHash`, `refreshTokenHash`, or `statusReason`.

Session revoke uses `revokeSessionForUser(sessionId, userId, 'admin_revoked')` — atomically scoped to the user, no cross-user revoke possible.

## RBAC Admin API (Task 0.5.4)

Backend routes under `/admin/v1/roles` and `/admin/v1/permissions`:

| Method | Path | Permission |
|--------|------|-----------|
| `GET` | `/admin/v1/roles` | `rbac.role.read` |
| `GET` | `/admin/v1/roles/:id` | `rbac.role.read` |
| `POST` | `/admin/v1/roles` | `rbac.role.create` |
| `PATCH` | `/admin/v1/roles/:id` | `rbac.role.update` |
| `DELETE` | `/admin/v1/roles/:id` | `rbac.role.deactivate` |
| `GET` | `/admin/v1/roles/:id/permissions` | `rbac.role.read` |
| `POST` | `/admin/v1/roles/:id/permissions` | `rbac.permission.attach` |
| `DELETE` | `/admin/v1/roles/:id/permissions/:permissionId` | `rbac.permission.detach` |
| `GET` | `/admin/v1/permissions` | `rbac.permission.read` |

System roles (`isSystem: true`) cannot be edited, deactivated, or have permissions changed — enforced by backend (`findMutableAdminRoleById`) and hidden in the UI.

## Dashboard and System API (Task 0.5.5)

| Method | Path | Permission |
|--------|------|-----------|
| `GET` | `/admin/v1/dashboard/summary` | `admin.dashboard.view` |
| `GET` | `/admin/v1/system/health` | `system.health.read` |

Dashboard summary returns real user counts (total, active, pending_verification). No fake metrics. System health returns `{ status, service, checkedAt }` only.

## Pages (Tasks 0.5.3 – 0.5.5)

| Route | Permission | Notes |
|-------|-----------|-------|
| `/users` | `user.user.read` | Paginated user list with status filter |
| `/users/:id` | `user.user.read` | User detail with sessions section |
| `/users/:id/edit` | `user.status.update` | Status update form only |
| `/roles` | `rbac.role.read` | Role list with deactivate confirm |
| `/roles/new` | `rbac.role.create` | Create role form |
| `/roles/:id` | `rbac.role.read` | Role detail + permission attach/detach |
| `/roles/:id/edit` | `rbac.role.update` | Edit role name/description |
| `/permissions` | `rbac.permission.read` | Read-only permission list with filters |
| `/dashboard` | `admin.dashboard.view` | Real user stats + system status |
| `/system` | — | Links to sub-pages |
| `/system/health` | `system.health.read` | Live health card |

## Out of Scope (all Tasks)

- Advanced analytics, charts, fake metrics
- Content, Media, Audit, Analytics admin pages
- Backup, Jobs, Notifications pages without real API
- Permission creation/update/delete UI
- Coming-soon placeholders or future module shortcuts
