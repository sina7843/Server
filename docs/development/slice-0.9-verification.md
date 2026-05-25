# Slice 0.9 Verification Guide

## Task 0.9.1 — Search Backend Foundation

### What was built

**packages/types/src/contracts/search.ts**

- `SearchScope` union type: `'content' | 'users' | 'media'`
- `PublicContentSearchType` union type
- `SearchResultItemDto` — safe minimal result shape
- `SearchResultResponseDto` — paginated response
- `PublicContentSearchQueryDto` — public search query contract
- `AdminSearchQueryDto` — admin search query contract
- `AdminReindexRequestDto` and `AdminReindexResponseDto`

**packages/types/src/constants/permissions.ts**

- `SEARCH_CONTENT_READ: 'search.content.read'`
- `SEARCH_USER_READ: 'search.user.read'`
- `SEARCH_MEDIA_READ: 'search.media.read'`
- `SEARCH_REINDEX: 'search.reindex'`

**apps/api/src/search/**

- `search.service.ts` — abstract `SearchService` with 5 methods
- `mongo-search.adapter.ts` — `MongoSearchAdapter` implementing `SearchService`
- `public-search.controller.ts` — `GET /api/v1/search/content`
- `admin-search.controller.ts` — admin search + reindex endpoints
- `search.module.ts` — module with Mongoose models + BullMQ queue
- `dto/public-search-query.ts` — validated query parser
- `dto/admin-search-query.ts` — validated query parser
- `dto/search-response.ts` — DTO mapper

**apps/api/src/rbac/registry/**

- `permission-keys.ts` — 4 new search permissions added
- `role-permission-registry.ts` — admin gets all 4; content_manager gets content + media search

**apps/api/src/jobs/queue-registry.ts**

- `QueueNames.SEARCH: 'search'` added
- `JobNames.SEARCH_REINDEX_ALL`, `SEARCH_INDEX_CONTENT`, `SEARCH_REMOVE_CONTENT` added

**apps/api/src/jobs/jobs.module.ts**

- SEARCH queue registered

**apps/api/src/events/event-names.ts**

- `SEARCH_REINDEX_REQUESTED`, `SEARCH_INDEX_CONTENT`, `SEARCH_REMOVE_CONTENT` added

**apps/api/src/app.module.ts**

- `SearchModule` registered

**apps/worker/src/**

- `processors/search-processor.ts` — handles `search.reindex_all`, `search.index_content`, `search.remove_content` (no-ops in Phase 0)
- `queue-worker.ts` — search worker registered

**packages/sdk/src/**

- `search-types.ts` + `search.ts` — `createSearchClient()` with `searchContent()`
- `admin-search-types.ts` + `admin-search.ts` — `createAdminSearchClient()` with `searchUsers()`, `searchContent()`, `searchMedia()`, `reindex()`
- `index.ts` — all search exports added

**Docs**

- `docs/architecture/search.md` — full architecture
- `docs/security/search-analytics-security-checklist.md` — security checklist
- `docs/development/slice-0.9-verification.md` — this file
- `docs/development/environment.md` — Slice 0.9 section added

### Verification commands

```bash
pnpm install

pnpm --filter @dragon/types lint
pnpm --filter @dragon/types typecheck
pnpm --filter @dragon/types test
pnpm --filter @dragon/types build

pnpm --filter @dragon/api lint
pnpm --filter @dragon/api typecheck
pnpm --filter @dragon/api test
pnpm --filter @dragon/api build

pnpm --filter @dragon/worker lint
pnpm --filter @dragon/worker typecheck
pnpm --filter @dragon/worker test
pnpm --filter @dragon/worker build

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

### Manual verification checklist

```text
apps/api/src/search exists
SearchModule exists
SearchService abstraction (abstract class) exists
MongoSearchAdapter exists and extends SearchService
GET /api/v1/search/content exists (PublicSearchController)
GET /admin/v1/search/users exists (AdminSearchController)
GET /admin/v1/search/content exists (AdminSearchController)
GET /admin/v1/search/media exists (AdminSearchController)
POST /admin/v1/search/reindex exists (AdminSearchController)
No Meilisearch client exists
No Elasticsearch/OpenSearch exists
No analytics code added
search permissions centralized in permission-keys.ts and permissions.ts
Docs match implemented scope
```

### Security invariants

1. Public search returns only `status: 'published'` + `deletedAt: { $exists: false }` content — draft, archived, deleted content never appears publicly.
2. Public result routes are type-specific — no generic `/posts/:slug`.
3. Admin user search results use `maskPhone()` for the title — raw `phoneNormalized` is never returned.
4. Admin user search results never contain `passwordHash`, tokens, or session data.
5. Admin media search results never contain `objectKey`, `bucket`, or `storageProvider`.
6. All admin search endpoints require `AccessTokenGuard` + `PermissionGuard`.
7. All permission strings are centralized — no raw strings scattered in code.
8. No Meilisearch, Elasticsearch, or OpenSearch client exists.
9. No fake search success for missing external infrastructure.
10. Phase 0 MongoSearchAdapter reads from source collections in real-time — reindex is a no-op.

### Out of scope for Task 0.9.1

Meilisearch/Elasticsearch/OpenSearch infrastructure, advanced fuzzy search, typo tolerance, Persian stemming, NLP ranking, analytics backend, real-time search indexing platform, recommendation engine, related content suggestions, search-over-audit-logs (covered by existing audit filter API).

---

## Task 0.9.2 — Search Frontend Integration

### What was built

**apps/web — Public search page**

- `apps/web/pages/search.vue` — `/search` route with URL-backed state, debounce, pagination.
- `apps/web/composables/usePublicSearch.ts` — composable wrapping `createSearchClient`. State: loading, error, items, total, page, limit.
- `apps/web/features/search/search-api.ts` — `createSearchApi()` wrapping `createSearchClient` from SDK.
- `apps/web/components/search/SearchForm.vue` — search input + content type filter.
- `apps/web/components/search/SearchResultCard.vue` — single result card using `route` from backend.
- `apps/web/components/search/SearchResults.vue` — result list with total count.
- `apps/web/components/search/SearchStateMessage.vue` — loading / error / no-results / empty states.
- `apps/web/components/search/SearchPagination.vue` — prev/next pagination.

**apps/admin — Admin search integration**

- `apps/admin/composables/useAdminSearch.ts` — composable with `searchUsers`, `searchContent`, `searchMedia`, `reindex` methods. Separate state per resource type.
- `apps/admin/features/search/admin-search.api.ts` — `searchUsers`, `searchContent`, `searchMedia`, `reindex` wrapping `createAdminSearchClient`.
- `apps/admin/pages/users/index.vue` — search mode via `searchUsers` when q is non-empty; browse mode via `loadUsers` with status filter.
- `apps/admin/pages/media/index.vue` — search mode via `searchMedia` when q is non-empty; browse mode via `loadMedia` with type/status/mime filters.
- `apps/admin/components/content/ContentPostListView.vue` — search mode via `searchContent` when q is non-empty; browse mode via `loadPosts` with status filter.

### Verification commands

```bash
pnpm install

pnpm --filter @dragon/web lint
pnpm --filter @dragon/web typecheck
pnpm --filter @dragon/web test
pnpm --filter @dragon/web build

pnpm --filter @dragon/admin lint
pnpm --filter @dragon/admin typecheck
pnpm --filter @dragon/admin test
pnpm --filter @dragon/admin build

pnpm --filter @dragon/sdk lint
pnpm --filter @dragon/sdk typecheck
pnpm --filter @dragon/sdk test
pnpm --filter @dragon/sdk build

pnpm --filter @dragon/types lint
pnpm --filter @dragon/types typecheck
pnpm --filter @dragon/types test
pnpm --filter @dragon/types build

pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm format:check
```

### Manual verification checklist

```text
apps/web/pages/search.vue exists
apps/web/composables/usePublicSearch.ts exists
apps/web/features/search/search-api.ts exists
Search components exist under apps/web/components/search/
Public search uses SDK/composable (no direct fetch in page/components)
Search state persists in URL query (q, type, page)
Search uses debounce (350 ms)
Loading / empty / no-results / error states exist
No /posts/:slug links in search results
No frontend ranking (API order preserved)
No fake search results
No Meilisearch UI behavior
No analytics code added
Admin users search uses useAdminSearch.searchUsers via useAdminSearch composable
Admin media search uses useAdminSearch.searchMedia via useAdminSearch composable
Admin content search uses useAdminSearch.searchContent via useAdminSearch composable
No global admin search page added
No audit duplicate search added
No future module search added
Docs match implemented scope
```

### Security invariants (frontend)

1. Public `/search` result links are always type-specific (`/news/:slug`, `/articles/:slug`, etc.) — `route` field from backend is used directly.
2. No draft/archived/deleted content appears — enforced by backend; frontend never bypasses this.
3. Admin search pages check permissions on the frontend (UX guard) + backend (API guard).
4. `usePublicSearch` and `useAdminSearch` use SDK only — no hardcoded API paths in page components.
5. Admin user search results show masked phone (`title` from backend) — no raw phone numbers displayed.
6. Admin media search results show no `objectKey`, `bucket`, or `storageProvider` — these fields are not in the DTO.

### Out of scope for Task 0.9.2

Meilisearch UI behavior, Elasticsearch/OpenSearch UI, frontend ranking, advanced fuzzy search, typo tolerance, Persian stemming, NLP ranking UI, recommendation engine, related content UI, analytics, global admin command palette, audit duplicate search UI, future module search.

---

## Task 0.9.3 — Analytics Backend Foundation

### What was built

**apps/api/src/analytics/**

- `analytics-event.schema.ts` — AnalyticsEvent Mongoose schema with 4 required indexes
- `analytics-event.repository.ts` — append-only repository (create + aggregate queries only)
- `analytics-redactor.ts` — recursive sensitive-key redactor (phone, email, otp, token, password, etc.)
- `analytics.service.ts` — non-blocking `track()` method with IP hashing (SHA-256) and metadata redaction
- `analytics.types.ts` — `TrackInput` interface
- `analytics.module.ts` — module wiring, exports `AnalyticsService` and `AnalyticsEventRepository`
- `analytics.service.spec.ts` — unit tests for service, redactor, and tracking

**apps/api/src/analytics/admin/**

- `admin-analytics.controller.ts` — 5 endpoints under `/admin/v1/analytics/`
- `admin-analytics.service.ts` — real MongoDB aggregations, no fake metrics
- `admin-analytics.module.ts` — imports AnalyticsModule, AuthModule, RbacModule
- `dto/admin-analytics-query.ts` — date range + limit validation
- `dto/admin-analytics-response.ts` — DTO mapping functions

**Hook integrations (minimal, non-redesign):**

- `apps/api/src/auth/auth.service.ts` — tracks: `user.registered`, `user.logged_in`, `otp.requested`, `otp.verified`, `otp.failed`
- `apps/api/src/content/public/public-posts.service.ts` — tracks `content.viewed` + increments `viewCount`
- `apps/api/src/content/posts/post.repository.ts` — added `incrementViewCount()` ($inc)
- `apps/api/src/media/admin-media.service.ts` — tracks `media.uploaded`
- `apps/api/src/admin/content/admin-content-posts.service.ts` — tracks `content.published`

**Module updates:**

- `apps/api/src/auth/auth.module.ts` — imports AnalyticsModule
- `apps/api/src/content/content.module.ts` — imports AnalyticsModule
- `apps/api/src/media/media.module.ts` — imports AnalyticsModule
- `apps/api/src/admin/content/admin-content.module.ts` — imports AnalyticsModule
- `apps/api/src/app.module.ts` — registers AdminAnalyticsModule
- `apps/api/src/rbac/registry/role-permission-registry.ts` — adds ANALYTICS_READ to admin role

**packages/types:**

- `src/constants/analytics.ts` — `ANALYTICS_EVENT_TYPES`, `AnalyticsEventType`
- `src/contracts/analytics.ts` — all analytics DTOs

**packages/sdk:**

- `src/admin-analytics-types.ts` — `AnalyticsDateRangeParams`, `AdminAnalyticsClient`
- `src/admin-analytics.ts` — `createAdminAnalyticsClient()` with 5 methods
- `src/admin-analytics.spec.ts` — SDK tests

**Docs:**

- `docs/architecture/analytics.md` — full architecture
- `docs/security/search-analytics-security-checklist.md` — analytics section added
- `docs/development/slice-0.9-verification.md` — this file

### Verification commands

```bash
pnpm install

pnpm --filter @dragon/api lint
pnpm --filter @dragon/api typecheck
pnpm --filter @dragon/api test
pnpm --filter @dragon/api build

pnpm --filter @dragon/sdk lint
pnpm --filter @dragon/sdk typecheck
pnpm --filter @dragon/sdk test
pnpm --filter @dragon/sdk build

pnpm --filter @dragon/types lint
pnpm --filter @dragon/types typecheck
pnpm --filter @dragon/types test
pnpm --filter @dragon/types build

pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm format:check
```

### Manual verification checklist

```text
apps/api/src/analytics exists
AnalyticsEvent schema exists with 4 required indexes
AnalyticsService exists with non-blocking track()
GET /admin/v1/analytics/summary exists
GET /admin/v1/analytics/content/top exists
GET /admin/v1/analytics/auth exists
GET /admin/v1/analytics/otp exists
GET /admin/v1/analytics/media exists
analytics.read permission exists and is centralized
analytics.read added to admin role
No raw IP stored — ipHash used
No raw phone/email/OTP/token in analytics events
No frontend /analytics route added
No fake metrics exist
No BI/funnels/cohorts/revenue features exist
Docs match implemented scope
```

### Security invariants

1. `AnalyticsService.track()` is non-blocking — tracking failure never affects the caller.
2. Raw IP is never stored — `ipHash` = SHA-256(ip).
3. Sensitive metadata is recursively redacted before storage (phone, email, otp, token, password, cookie, authorization, etc.).
4. No raw phone or email in any analytics event.
5. No raw OTP, code, or verification secret in any analytics event.
6. No token, session secret, or password in any analytics event.
7. Media analytics metadata contains only `mimeType` and `visibility` — never `objectKey`, `bucket`, or `storageProvider`.
8. All admin analytics endpoints require `AccessTokenGuard` + `PermissionGuard(analytics.read)`.
9. Analytics APIs return real aggregates only — 0/empty when no data exists.
10. No fake analytics data anywhere.

### Out of scope for Task 0.9.3

Frontend analytics dashboard (Task 0.9.4), funnels, cohorts, retention, A/B testing, revenue analytics, real-time analytics, data warehouse, BI tools, WebSocket analytics, marketing analytics, external analytics platforms.
