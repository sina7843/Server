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

---

## Task 0.6.3 — Rich Text Processing and Sanitization

### What was built

- **`RichTextValidator`** (`apps/api/src/content/rich-text/rich-text-validator.ts`) — `@Injectable()` NestJS service that validates TipTap-compatible `bodyJson` documents against an allowlist of nodes and marks. Rejects unknown node/mark types, image/embed/iframe/video nodes, and unsafe link hrefs (`javascript:`, `data:`, `vbscript:`, protocol-relative `//`). MAX_DEPTH=12, MAX_NODES=2000.

- **`HtmlSanitizer`** (`apps/api/src/content/rich-text/html-sanitizer.ts`) — `@Injectable()` NestJS service wrapping `sanitize-html` v2.x. Strips scripts/styles/event handlers, blocks unsafe URL schemes, adds `rel="noopener noreferrer"` to `_blank` links, removes `<img>/<iframe>/<object>`. Configured via allowlist of safe tags and attributes.

- **Integration** — `AdminContentPostsService` and `AdminContentPagesService` validate `bodyJson` and sanitize `bodyHtml` before calling `postService.create/update`. The DB document always has sanitized `bodyHtml`. Revision snapshots read from the saved document, so they automatically contain sanitized content.

- **Tests** — `rich-text-validator.spec.ts`, `html-sanitizer.spec.ts`, `admin-content-posts.service.spec.ts`, `admin-content-pages.service.spec.ts`, `public-post-response.spec.ts`, `public-page-response.spec.ts`

- **`packages/types` contracts** — `PublicPostDto.bodyHtml` and `PublicPageDto.bodyHtml` comments updated to mark safe to render.

- **`docs/security/content-security-checklist.md`** — release block removed, all XSS / bodyJson items checked ✓.

- **Dependency added** — `sanitize-html@2.17.4` (runtime), `@types/sanitize-html@2.16.1` (dev). Requires `esModuleInterop: true` in ts-jest override (added to `apps/api/package.json`).

### What was NOT built (intentionally out of scope)

- No TipTap frontend editor
- No admin content UI changes
- No public content frontend pages
- No media upload / media library / media picker
- No `mediaRefs` extraction (deferred until Media Library)
- No image insertion (disabled until safe Media API is available)
- No revision restore

### Verification Commands

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

pnpm lint
pnpm test
pnpm build
pnpm format:check
```

Expected: **83 test suites, 648 tests, 0 failures** (as of Task 0.6.3 completion).

### Key Invariants to Verify

| Invariant                                                   | How to verify                                                                              |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `bodyHtml` is sanitized before storage, never raw           | `admin-content-posts.service.spec.ts` — "never stores raw unsafe HTML"                     |
| Revision snapshot contains sanitized `bodyHtml`             | `admin-content-posts.service.spec.ts` — "revision snapshot has sanitized bodyHtml"         |
| `script` tags are stripped from `bodyHtml`                  | `html-sanitizer.spec.ts` — "removes script tags and their content"                         |
| `javascript:` hrefs are converted to `<span>`               | `html-sanitizer.spec.ts` — "blocks javascript: links — converts to span"                   |
| `target="_blank"` gets `rel="noopener noreferrer"`          | `html-sanitizer.spec.ts` — "adds rel noopener noreferrer when target=_blank"               |
| Unknown `bodyJson` node types are rejected                  | `rich-text-validator.spec.ts` — "rejects unknown node types"                               |
| `image` nodes in `bodyJson` are rejected                    | `rich-text-validator.spec.ts` — "rejects image nodes (no safe image policy yet)"           |
| `javascript:` link hrefs in `bodyJson` are rejected         | `rich-text-validator.spec.ts` — "rejects javascript: link href"                            |
| `PublicPostDto` does not expose `bodyJson` or `authorId`    | `public-post-response.spec.ts` — "does not expose bodyJson/authorId"                       |
| `previewPost` returns stored (already-sanitized) `bodyHtml` | `admin-content-posts.service.spec.ts` — "previewPost returns stored sanitized bodyHtml"    |
| No `restoreRevision` in admin posts service                 | `admin-content-posts.service.spec.ts` — "does not expose a restoreRevision method"         |

### Collections Created

MongoDB collections that will be created on first connection:

- `posts`
- `pages`
- `content_categories`
- `content_tags`
- `content_revisions`

Unique indexes on these collections are declared in the schemas and will be applied by Mongoose on startup.
