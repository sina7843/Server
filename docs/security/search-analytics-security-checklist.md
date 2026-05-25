# Search & Analytics Security Checklist

## Public Content Search

- [ ] Public search endpoint (`GET /api/v1/search/content`) requires no authentication.
- [ ] Public results contain only `status: 'published'` content — draft filter is mandatory.
- [ ] Public results exclude archived content — `status: 'published'` filter is mandatory.
- [ ] Public results exclude soft-deleted content — `deletedAt: { $exists: false }` filter is mandatory.
- [ ] Public result `route` values are type-specific: `/news/:slug`, `/articles/:slug`, `/announcements/:slug`, `/guides/:slug`, `/rules/:slug`, `/pages/:slug`. No generic `/posts/:slug`.
- [ ] Public result items do not include `status` field (published-only results need no status disclosure).
- [ ] Public result items do not include `bodyHtml`, `bodyJson`, or SEO internal metadata.
- [ ] `categoryId` and `tagId` are validated as MongoDB ObjectIds — invalid values return 400.
- [ ] `q` is capped at 200 characters.
- [ ] `limit` is capped at 50.

## Admin Search APIs

- [ ] All admin search endpoints (`/admin/v1/search/*`) require `AccessTokenGuard`.
- [ ] All admin search endpoints require `PermissionGuard` with the appropriate permission.
- [ ] `GET /admin/v1/search/users` requires `search.user.read`.
- [ ] `GET /admin/v1/search/content` requires `search.content.read`.
- [ ] `GET /admin/v1/search/media` requires `search.media.read`.
- [ ] `POST /admin/v1/search/reindex` requires `search.reindex`.
- [ ] No raw permission strings are scattered in code — all use `Permissions.*` from the registry.

## Admin User Search Safety

- [ ] Admin user search results never contain `passwordHash`.
- [ ] Admin user search results never contain `refreshToken`, `refreshTokenHash`, `accessToken`, or `accessTokenJti`.
- [ ] Admin user search results never contain session data.
- [ ] Admin user result `title` is `maskPhone(phoneNormalized)` — raw `phoneNormalized` is never returned.
- [ ] Soft-deleted users are excluded (`deletedAt: { $exists: false }` filter).

## Admin Media Search Safety

- [ ] Admin media results never contain `objectKey`.
- [ ] Admin media results never contain `bucket`.
- [ ] Admin media results never contain `storageProvider`.
- [ ] Admin media results never expose local filesystem paths or private storage URLs.
- [ ] Soft-deleted media assets are excluded.

## Admin Content Search Safety

- [ ] Admin content results contain `status` for operational visibility, but no `bodyHtml` or `bodyJson`.
- [ ] Admin content results do not contain `passwordHash` or any credential field.
- [ ] Soft-deleted content is excluded by default.

## Permissions Registry

- [ ] `search.content.read` is centralized in `permission-keys.ts` and `packages/types/src/constants/permissions.ts`.
- [ ] `search.user.read` is centralized.
- [ ] `search.media.read` is centralized.
- [ ] `search.reindex` is centralized.
- [ ] `admin` role has all four search permissions.
- [ ] `content_manager` role has `search.content.read` and `search.media.read` only.
- [ ] `super_admin` inherits all permissions including search permissions.

## Reindex Safety

- [ ] Reindex endpoint is permission-protected (`search.reindex`).
- [ ] Reindex response is truthful — Phase 0 states no external index exists.
- [ ] No Meilisearch, Elasticsearch, or OpenSearch client is instantiated.
- [ ] No fake search success for missing external infrastructure.
- [ ] Search jobs are no-ops in Phase 0 — they complete without error and without side effects.

## Input Validation

- [ ] `q` parameter is trimmed and capped at 200 characters on both public and admin endpoints.
- [ ] `page` must be a positive integer.
- [ ] `limit` is between 1 and 50.
- [ ] `type` for public search must be one of the allowed content types.
- [ ] `categoryId` and `tagId` must be valid MongoDB ObjectIds.
- [ ] `scope` in reindex body is validated against the `SearchScope` union.

## Frontend Search Safety (Slice 0.9.2)

- [ ] Public `/search` page never links to `/posts/:slug` — all links are type-specific routes from backend `route` field.
- [ ] Public search results are API-backed only — no fake or hardcoded results.
- [ ] Admin search results in list pages are API-backed only — no fake data.
- [ ] No frontend ranking is applied — API result order is preserved.
- [ ] `usePublicSearch` composable uses SDK (`createSearchClient`) — no direct fetch calls scattered in pages/components.
- [ ] `useAdminSearch` composable uses SDK (`createAdminSearchClient`) — no direct fetch calls.
- [ ] Admin search pages respect existing permission checks (`PermissionGuard` on backend, `hasPermission` on frontend for UX).
- [ ] No raw permission strings in route meta or navigation — all use `DragonPermissions.*`.
- [ ] No global admin search page added.
- [ ] No audit duplicate search added (covered by existing audit filter UI).

## Analytics Backend Safety (Slice 0.9.3)

- [ ] `AnalyticsEvent` schema exists with required indexes.
- [ ] Analytics event writes are append-only — no update or delete operations on analytics events.
- [ ] `AnalyticsService.track()` is non-blocking and best-effort — failure does not propagate to the caller.
- [ ] Raw IP is never stored — only `ipHash` (SHA-256) if IP is provided.
- [ ] Sensitive metadata is recursively redacted before storage — `AnalyticsRedactor` removes password, otp, code, token, phone, email, recipient, secret, authorization, cookie, and related keys.
- [ ] No raw phone or email in analytics events or metadata.
- [ ] No raw OTP or verification code in analytics events or metadata.
- [ ] No token, password, or session secret in analytics events or metadata.
- [ ] Media analytics metadata never contains `objectKey`, `bucket`, or `storageProvider`.
- [ ] All admin analytics APIs require `AccessTokenGuard` + `PermissionGuard(analytics.read)`.
- [ ] `analytics.read` permission is centralized in `permission-keys.ts` and `packages/types/src/constants/permissions.ts`.
- [ ] Admin role has `analytics.read` permission.
- [ ] Analytics APIs return only real aggregate data — no fake or placeholder counts.
- [ ] Analytics APIs return 0/empty when no events exist — not fake sample data.
- [ ] No frontend analytics dashboard exists yet (Task 0.9.4).
- [ ] No real-time analytics / WebSocket dashboard exists.
- [ ] No funnels, cohorts, retention, A/B testing, or revenue analytics exist.
- [ ] No external analytics platform (Mixpanel, Amplitude, GA) is integrated.

## Analytics Frontend Safety (Slice 0.9.4)

- [ ] `/analytics` route requires `AccessTokenGuard` (middleware: `admin-auth-required`).
- [ ] `/analytics` route requires `analytics.read` permission (middleware: `admin-permission-required`).
- [ ] `ForbiddenState` is shown in-page when `hasPermission(ANALYTICS_READ)` is false.
- [ ] Dashboard uses `useAnalytics` composable — no direct fetch calls in page or components.
- [ ] `useAnalytics` uses `admin-analytics.api` feature — no hardcoded API paths.
- [ ] `admin-analytics.api` uses SDK `createAdminAnalyticsClient` — no raw fetch in feature layer.
- [ ] Analytics nav item uses `DragonPermissions.ANALYTICS_READ` — no raw permission string.
- [ ] No raw IP displayed in dashboard.
- [ ] No raw phone or email displayed in dashboard.
- [ ] No OTP, token, password, or session secret displayed in dashboard.
- [ ] Top content table shows `title`, `type`, `views` only — no `objectKey`, `bucket`, `storageProvider`.
- [ ] Zero counts are displayed as real data, not suppressed or replaced with "N/A".
- [ ] Partial endpoint failure: failing section shows `ErrorState` with retry, not fake data.
- [ ] `loadAll` uses `Promise.allSettled` — one failing section does not block others.
- [ ] No fake metrics, no generated sample data, no fake trend percentages.
- [ ] No BI/funnels/cohorts/retention/A-B testing UI exists.
- [ ] No revenue or marketing analytics UI exists.
- [ ] No real-time dashboard or WebSocket behavior exists.
- [ ] No fake charts or chart libraries added.
- [ ] No future-module analytics (tournament, shop, academy, streaming, boardgame) added.

## Out of Scope (Slice 0.9.1 + 0.9.2 + 0.9.3 + 0.9.4)

- [ ] No real-time search indexing exists.
- [ ] No Meilisearch / Elasticsearch / OpenSearch client exists.
- [ ] No fuzzy search or typo tolerance exists.
- [ ] No Persian stemming or NLP ranking exists.
- [ ] No recommendation engine or related content endpoint exists.
- [ ] No search-over-audit-logs endpoint exists (covered by existing audit filter API).
- [ ] No global admin command palette exists.
- [ ] No funnels / cohorts / retention / A-B / revenue analytics.
- [ ] No data warehouse or BI tooling.
