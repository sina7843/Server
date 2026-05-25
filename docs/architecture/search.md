# Search Architecture

## Status

Backend foundation implemented in Slice 0.9.1.
Public `/search` page implemented in Slice 0.9.2.
Admin search integrated into users/content/media list pages in Slice 0.9.2.
No analytics. No Meilisearch. No advanced fuzzy search. No Persian stemming.

## Overview

The search subsystem provides a replaceable abstraction (`SearchService`) over a Phase 0 MongoDB-based implementation (`MongoSearchAdapter`). The adapter reads directly from source collections at query time — no external search index is maintained.

The shape is Meilisearch-ready: switching to a real search engine in a later phase requires only replacing `MongoSearchAdapter` with a new adapter while keeping all controllers, DTOs, permissions, and SDK methods intact.

## Components

### SearchService (Abstract)

Located at `apps/api/src/search/search.service.ts`.

```ts
abstract class SearchService {
  searchPublicContent(query: ParsedPublicContentSearchQuery): Promise<SearchResult>;
  searchAdminContent(query: ParsedAdminSearchQuery): Promise<SearchResult>;
  searchAdminUsers(query: ParsedAdminSearchQuery): Promise<SearchResult>;
  searchAdminMedia(query: ParsedAdminSearchQuery): Promise<SearchResult>;
  reindex(scope?: SearchScope): Promise<void>;
}
```

`SearchModule` binds `SearchService` to `MongoSearchAdapter` via a `useExisting` provider. Future phases replace the adapter without changing consumers.

### MongoSearchAdapter

Located at `apps/api/src/search/mongo-search.adapter.ts`.

Phase 0 implementation. Reads from Mongoose models injected directly. No external index.

**Public content search:**

- Queries `posts` with `{ status: 'published', deletedAt: { $exists: false } }`
- Queries `pages` with `{ status: 'published', deletedAt: { $exists: false } }`
- Uses MongoDB text indexes (already exist on both collections: `title`, `excerpt`, `bodyHtml`)
- Merges results in-memory, sorts by `createdAt` descending, paginates (cap: 500 docs per collection)
- Route map: `news → /news/:slug`, `article → /articles/:slug`, `announcement → /announcements/:slug`, `guide → /guides/:slug`, `rule → /rules/:slug`, `page → /pages/:slug`

**Admin content search:**

- Same as public but without `status` filter — includes draft and archived
- Returns `status` field in result items

**Admin user search:**

- Queries `users` by `phoneNormalized` regex (partial match, case-insensitive)
- Returns `title` as `maskPhone(phoneNormalized)` — never raw phone
- Excludes soft-deleted users

**Admin media search:**

- Queries `media_assets` by `originalName`, `alt`, `caption` regex
- Returns `title` = `originalName`, `status`, timestamps
- Never returns `objectKey`, `bucket`, or `storageProvider`

**Reindex:**

- No-op in Phase 0. MongoSearchAdapter reads from source in real-time; no index to rebuild.
- When replaced with an external adapter, `reindex()` will trigger a full or scoped rebuild.

### SearchModule

```
apps/api/src/search/
├── search.service.ts             # Abstract SearchService
├── mongo-search.adapter.ts       # MongoSearchAdapter
├── search.module.ts              # Module wiring
├── public-search.controller.ts   # GET /api/v1/search/content
├── admin-search.controller.ts    # Admin search + reindex endpoints
└── dto/
    ├── public-search-query.ts    # Public query parser + validation
    ├── admin-search-query.ts     # Admin query parser + validation
    └── search-response.ts        # DTO mapper
```

## Public API

```
GET /api/v1/search/content
```

No authentication required. Returns published, non-deleted content only.

**Query parameters:**

| Parameter    | Type                                             | Default | Notes                      |
| ------------ | ------------------------------------------------ | ------- | -------------------------- |
| `q`          | string                                           | —       | Search text, max 200 chars |
| `type`       | `news\|article\|announcement\|guide\|rule\|page` | —       | Filter by content type     |
| `categoryId` | ObjectId string                                  | —       | Filter posts by category   |
| `tagId`      | ObjectId string                                  | —       | Filter posts by tag        |
| `page`       | integer ≥ 1                                      | 1       |                            |
| `limit`      | integer 1–50                                     | 20      |                            |

**Security invariants:**

- Draft content never appears in results (`status: 'published'` filter is mandatory)
- Archived content never appears (`status: 'published'` filter)
- Soft-deleted content never appears (`deletedAt: { $exists: false }` filter is mandatory)
- No authentication required — only safe, published data is returned
- Route is type-specific — no generic `/posts/:slug`

## Admin APIs

All admin endpoints require `AccessTokenGuard` + `PermissionGuard`.

```
GET  /admin/v1/search/users       — permission: search.user.read
GET  /admin/v1/search/content     — permission: search.content.read
GET  /admin/v1/search/media       — permission: search.media.read
POST /admin/v1/search/reindex     — permission: search.index.reindex
```

**Query parameters (all admin search):**

| Parameter | Type         | Default | Notes         |
| --------- | ------------ | ------- | ------------- |
| `q`       | string       | —       | Max 200 chars |
| `page`    | integer ≥ 1  | 1       |               |
| `limit`   | integer 1–50 | 20      |               |

**Reindex body:**

```json
{ "scope": "content" | "users" | "media" }
```

`scope` is optional. Omitting it means reindex all.

**Security invariants:**

- Admin user results never contain `passwordHash`, `refreshToken`, `accessToken`, or session data
- Admin user `title` is `maskPhone(phoneNormalized)` — never raw phone
- Admin media results never contain `objectKey`, `bucket`, or `storageProvider`
- Admin content results contain `status` (allows seeing drafts) but no body HTML or JSON
- All admin endpoints require `AccessTokenGuard` + `PermissionGuard`
- No raw permission strings scattered in code — all use `Permissions.*` from the registry

## Permissions

Four new permission constants added to the centralized registry:

| Constant              | Value                  | Roles                  |
| --------------------- | ---------------------- | ---------------------- |
| `SEARCH_CONTENT_READ` | `search.content.read`  | admin, content_manager |
| `SEARCH_USER_READ`    | `search.user.read`     | admin                  |
| `SEARCH_MEDIA_READ`   | `search.media.read`    | admin, content_manager |
| `SEARCH_REINDEX`      | `search.index.reindex` | admin                  |

Permissions are registered in:

- `apps/api/src/rbac/registry/permission-keys.ts`
- `apps/api/src/rbac/registry/role-permission-registry.ts`
- `packages/types/src/constants/permissions.ts`

## Reindex Job Foundation

Queue: `search` (BullMQ)

Job names:

- `search.reindex_all` — triggered by `POST /admin/v1/search/reindex`
- `search.index_content` — foundation for future content index update events
- `search.remove_content` — foundation for future content removal events

Worker processor: `apps/worker/src/processors/search-processor.ts`

All jobs are no-ops in Phase 0. The queue is registered to allow safe enqueue without infrastructure failure.

Event names added to `EventNames`:

- `search.reindex_requested`
- `search.index_content`
- `search.remove_content`

## packages/types Contracts

```ts
SearchScope = 'content' | 'users' | 'media';
PublicContentSearchType = 'news' | 'article' | 'announcement' | 'guide' | 'rule' | 'page';
SearchResultItemDto;
SearchResultResponseDto;
PublicContentSearchQueryDto;
AdminSearchQueryDto;
AdminReindexRequestDto;
AdminReindexResponseDto;
```

No Mongoose/DB entity types are exported.

## packages/sdk

```ts
createSearchClient(client).searchContent(params);
// GET /api/v1/search/content

createAdminSearchClient(client).searchUsers(params);
// GET /admin/v1/search/users

createAdminSearchClient(client).searchContent(params);
// GET /admin/v1/search/content

createAdminSearchClient(client).searchMedia(params);
// GET /admin/v1/search/media

createAdminSearchClient(client).reindex(input);
// POST /admin/v1/search/reindex
```

SDK has no Meilisearch-specific method, no analytics method, no WebSocket/realtime method.

## Phase 0 Limitations

- **Search quality**: Basic text index (`$text`) for posts/pages; regex for users/media. No fuzzy matching, typo tolerance, Persian stemming, or ranking.
- **Cross-collection pagination**: Public search merges posts and pages in-memory (cap: 500 per collection). Accurate per-collection totals are summed. Not suitable for collections of millions of documents.
- **Reindex**: No-op — Mongo adapter reads from source in real-time. When a real search engine is added, reindex will trigger a full rebuild.
- **No Persian/Farsi stemming**: Not implemented and not promised.
- **No advanced ranking**: Not implemented.
- **No frontend ranking**: Not implemented. API result order is preserved in the frontend.
- **No fake results**: All results come from real API calls. No placeholder or mock data in production.

## Frontend (Slice 0.9.2)

### Public Search Page

Route: `/search` (apps/web)

- Search text input with debounce (350 ms).
- Content type filter: all, news, article, announcement, guide, rule, page.
- URL query persistence: `q`, `type`, `page` synced to URL query string via `router.replace`.
- States: loading, error, no-results (query set, zero items), empty (no query, no items).
- Results link to type-specific routes only — never `/posts/:slug`.
- Pagination with prev/next controls.
- No frontend ranking: API result order is preserved.
- No fake results.

**Files:**

```
apps/web/pages/search.vue
apps/web/composables/usePublicSearch.ts
apps/web/features/search/search-api.ts
apps/web/components/search/SearchForm.vue
apps/web/components/search/SearchResultCard.vue
apps/web/components/search/SearchResults.vue
apps/web/components/search/SearchStateMessage.vue
apps/web/components/search/SearchPagination.vue
```

`usePublicSearch` wraps `createSearchApi` (which wraps `createSearchClient` from the SDK). State is local to each composable call. No direct fetch calls in pages or components.

### Admin Search Integration

Integrated into existing admin list areas (apps/admin):

| Area                 | Integration                                                                                  |
| -------------------- | -------------------------------------------------------------------------------------------- |
| Users (`/users`)     | Search mode via `searchUsers` (masked phone); browse mode via `loadUsers` with status filter |
| Media (`/media`)     | Search mode via `searchMedia`; browse mode via `loadMedia` with type/status/mime filters     |
| Content (post lists) | Search mode via `searchContent`; browse mode via `loadPosts` with status filter              |

**Behavior:** When search input is non-empty → search mode (uses admin search API, shows search results). When input is cleared → browse mode (uses existing list API with filters).

**Files:**

```
apps/admin/composables/useAdminSearch.ts
apps/admin/features/search/admin-search.api.ts
```

Admin search respects existing permission guards. No raw permission strings. No frontend ranking. No fake results. No global admin search page. No audit duplicate search. No future module search.

## Out of Scope (Slice 0.9.1 + 0.9.2)

- Meilisearch / Elasticsearch / OpenSearch infrastructure
- Advanced fuzzy search / typo tolerance
- Persian stemming / NLP ranking
- Analytics backend
- Real-time search indexing
- Recommendation engine
- Related content suggestions
- Search-over-audit-logs (covered by existing audit filter API)
- Global admin command palette
