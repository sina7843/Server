# Admin Security Checklist — Slice 0.5

## Auth token handling

- [x] Access token is stored in-memory only (module-level `ref`, cleared on page close).
- [x] No access token stored in `localStorage`.
- [x] No access token stored in readable cookies.
- [x] Refresh token is not used in admin SPA — full login is required on page reload.

## Backend endpoint protection

- [x] `GET /admin/v1/auth/me` requires `AccessTokenGuard`.
- [x] `GET /admin/v1/auth/me` requires `PermissionGuard`.
- [x] `GET /admin/v1/auth/me` requires `admin.dashboard.view` permission.
- [x] No admin bypass exists (no `@Public()` or equivalent on admin routes).
- [x] `super_admin` users pass via `PermissionResolverService.isSuperAdmin` (not a hardcoded bypass).

## Response safety

- [x] `GET /admin/v1/auth/me` response does not contain `passwordHash`.
- [x] `GET /admin/v1/auth/me` response does not contain `refreshTokenHash`.
- [x] `GET /admin/v1/auth/me` response does not contain `statusReason`.
- [x] `GET /admin/v1/auth/me` response does not contain raw phone number.
- [x] `GET /admin/v1/auth/me` response does not contain session internals.
- [x] `GET /admin/v1/auth/me` response does not contain roles or permissions arrays.

## Frontend route protection

- [x] `admin-auth-required` middleware redirects unauthenticated users to `/login`.
- [x] `admin-permission-required` middleware redirects users without identity to `/forbidden`.
- [x] Login page redirects to the original target after successful auth.

## Navigation safety

- [x] Navigation items are permission-filtered (UX only; backend is authority).
- [x] No Content, Media, Audit, Analytics nav items exist.
- [x] No Backup, Jobs, Notifications nav items exist.
- [x] No future module shortcuts or coming-soon placeholders exist.
- [x] Permission constants are imported from `DragonPermissions`, no scattered string literals.

## SEO and indexing

- [x] Admin app has global `noindex, nofollow` meta in `nuxt.config.ts`.
- [x] `forbidden`, `not-found`, and `error` pages have per-page `noindex` meta.
- [x] Dashboard page uses admin layout (no additional noindex needed — global applies).

## SDK usage

- [x] `apps/admin` uses `@dragon/sdk` for all admin API calls.
- [x] Admin API endpoint paths are not duplicated in frontend feature code.

## Out of scope

- [x] No admin dashboard metrics or fake data.
- [x] No users management implementation.
- [x] No roles management implementation.
- [x] No permissions list implementation.
- [x] No system health implementation.
- [x] No Content/Media/Audit/Analytics features.
