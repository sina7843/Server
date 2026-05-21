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

## Out of Scope (Task 0.5.1 + 0.5.2)

- Admin dashboard metrics or charts
- Users management page
- Roles management page
- Permissions list page
- System health implementation
- Content, Media, Audit, Analytics features
- Coming-soon placeholders
- Future module shortcuts
