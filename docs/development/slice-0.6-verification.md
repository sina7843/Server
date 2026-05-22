# Slice 0.6 Verification

## Task 0.6.1 — Content Persistence Foundation

### What was built

- `packages/types`: content constants (`CONTENT_POST_TYPES`, `CONTENT_STATUSES`, `CONTENT_RESOURCE_TYPES`, etc.) and DTO contracts (`ContentPostSummary`, `ContentPageSummary`, etc.)
- `apps/api/src/content/slug/slug-policy.ts`: `normalizeSlug()`, `SlugPolicyError`
- `apps/api/src/content/shared/content-status.ts`: `isValidContentStatus()`, `assertValidContentStatus()`
- Post: schema, repository, service (soft delete, slug-per-type uniqueness, publish/archive lifecycle)
- Page: schema, repository, service (soft delete, global slug uniqueness, publish/archive lifecycle)
- Category: schema, repository, service (global slug uniqueness, sortOrder)
- Tag: schema, repository, service (global slug uniqueness)
- ContentRevision: schema, repository, service (immutable snapshots, auto-incrementing revision numbers per resource)
- `ContentModule`: registers all schemas, providers, exports
- `AppModule`: imports `ContentModule`

### What was NOT built (intentionally deferred)

- No HTTP controllers or routes
- No SDK client methods
- No admin frontend pages
- No media upload / file storage
- No TipTap editor integration
- No restore endpoint for revisions

---

## Task 0.6.2 — Content Services and Public/Admin APIs

> **RELEASE BLOCK:** Task 0.6.2 exposes public content APIs but Slice 0.6 is **not release-ready**. `bodyHtml` is not sanitized. Do not render content in production until Task 0.6.3 completes sanitization.

### What was built

- **Public API routes** (no auth, published-only):
  - `GET /api/v1/news`, `GET /api/v1/news/:slug`
  - `GET /api/v1/articles`, `GET /api/v1/articles/:slug`
  - `GET /api/v1/announcements`, `GET /api/v1/announcements/:slug`
  - `GET /api/v1/guides`, `GET /api/v1/guides/:slug`
  - `GET /api/v1/rules`, `GET /api/v1/rules/:slug`
  - `GET /api/v1/pages/:slug`
  - `GET /api/v1/categories`, `GET /api/v1/categories/:slug`
  - `GET /api/v1/tags`, `GET /api/v1/tags/:slug`
  - **No generic `/api/v1/posts` or `/api/v1/posts/:slug` route**
- **`PublicPostsService`**: `listPublished(type, query)`, `getPublished(type, rawSlug)` — enforces published-only filter, normalizes slug
- **Admin API routes** (`AccessTokenGuard + PermissionGuard`):
  - Posts CRUD + lifecycle (publish, archive, soft delete, preview)
  - Pages CRUD + lifecycle
  - Categories CRUD (soft delete)
  - Tags CRUD (soft delete)
  - Post/page revision list and detail
  - **No restore route** (`POST .../revisions/:id/restore` → 404)
- **`AdminContentModule`**: imports AuthModule, RbacModule, ContentModule
- **Permissions added**: `content.category.*`, `content.tag.*` (read/create/update/delete)
- **Category/Tag soft delete**: `deletedAt` field added, admin DELETE soft-deletes only
- **`packages/types`**: complete public/admin DTO types and request types
- **`packages/sdk`**: `createContentClient()` and `createAdminContentClient()` — no restore method
- **Integration tests**: `test/content-public.e2e-spec.ts`, `test/content-admin.e2e-spec.ts`

### What was NOT built (intentionally out of scope)

- No TipTap editor UI
- No admin frontend content pages
- No public frontend content pages
- No media upload
- No revision restore (documented as Later)
- No search / analytics / comments
- No `bodyHtml` sanitization (Task 0.6.3)

### Verification Commands

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

pnpm --filter @dragon/sdk lint
pnpm --filter @dragon/sdk typecheck
pnpm --filter @dragon/sdk test
pnpm --filter @dragon/sdk build

pnpm lint
pnpm test
pnpm build
pnpm format:check
```

Expected: `77 test suites, 538 tests, 0 failures` (as of Task 0.6.2 completion).

Note: `pnpm typecheck` (workspace-wide) fails on `@dragon/admin` due to **pre-existing** Nuxt/Vue TypeScript errors unrelated to Slice 0.6. All other packages (`@dragon/api`, `@dragon/types`, `@dragon/sdk`) typecheck clean.

### Key Invariants to Verify

| Invariant                                                 | How to verify                                                                                              |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Post slug uniqueness is per (type, slugNormalized)        | `post.service.spec.ts` — "post slug uniqueness is scoped by type"                                          |
| Page slug uniqueness is global                            | `page.service.spec.ts` — "page slug uniqueness is global"                                                  |
| No hard delete on Posts/Pages/Categories/Tags             | `*.repository.spec.ts` — "does not expose a hard-delete method"                                            |
| No restore on ContentRevision                             | `content-revision.service.spec.ts` — "does not expose a restore method"                                    |
| Revision numbers increment per resource                   | `content-revision.service.spec.ts` — "increments revisionNumber per resource"                              |
| Public APIs return only published non-deleted content     | `test/content-public.e2e-spec.ts` — verifies type-scoping, status filter                                   |
| No generic /posts route exists                            | `test/content-public.e2e-spec.ts` — "GET /api/v1/posts returns 404"                                        |
| Admin APIs return revisions                               | `test/content-admin.e2e-spec.ts` — revision list/detail returns correct structure                          |
| Restore endpoint returns 404                              | `test/content-admin.e2e-spec.ts` — "No restore endpoint" suite                                             |
| Categories list includes all (admin) vs active-only (pub) | `test/content-admin.e2e-spec.ts` calls `list(true)`; `test/content-public.e2e-spec.ts` calls `list(false)` |
| ContentModule registers 8 public controllers              | `content.module.spec.ts` — "registers all 8 public controllers"                                            |
| SDK has no restoreRevision method                         | Read `packages/sdk/src/admin-content.ts` — no `restore` method in interface or implementation              |

### Collections Created

MongoDB collections that will be created on first connection:

- `posts`
- `pages`
- `content_categories`
- `content_tags`
- `content_revisions`

Unique indexes on these collections are declared in the schemas and will be applied by Mongoose on startup.
