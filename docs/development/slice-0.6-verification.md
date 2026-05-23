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

| Invariant                                                   | How to verify                                                                           |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `bodyHtml` is sanitized before storage, never raw           | `admin-content-posts.service.spec.ts` — "never stores raw unsafe HTML"                  |
| Revision snapshot contains sanitized `bodyHtml`             | `admin-content-posts.service.spec.ts` — "revision snapshot has sanitized bodyHtml"      |
| `script` tags are stripped from `bodyHtml`                  | `html-sanitizer.spec.ts` — "removes script tags and their content"                      |
| `javascript:` hrefs are converted to `<span>`               | `html-sanitizer.spec.ts` — "blocks javascript: links — converts to span"                |
| `target="_blank"` gets `rel="noopener noreferrer"`          | `html-sanitizer.spec.ts` — "adds rel noopener noreferrer when target=\_blank"           |
| Unknown `bodyJson` node types are rejected                  | `rich-text-validator.spec.ts` — "rejects unknown node types"                            |
| `image` nodes in `bodyJson` are rejected                    | `rich-text-validator.spec.ts` — "rejects image nodes (no safe image policy yet)"        |
| `javascript:` link hrefs in `bodyJson` are rejected         | `rich-text-validator.spec.ts` — "rejects javascript: link href"                         |
| `PublicPostDto` does not expose `bodyJson` or `authorId`    | `public-post-response.spec.ts` — "does not expose bodyJson/authorId"                    |
| `previewPost` returns stored (already-sanitized) `bodyHtml` | `admin-content-posts.service.spec.ts` — "previewPost returns stored sanitized bodyHtml" |
| No `restoreRevision` in admin posts service                 | `admin-content-posts.service.spec.ts` — "does not expose a restoreRevision method"      |

### Collections Created

MongoDB collections that will be created on first connection:

- `posts`
- `pages`
- `content_categories`
- `content_tags`
- `content_revisions`

Unique indexes on these collections are declared in the schemas and will be applied by Mongoose on startup.

---

## Task 0.6.4 — Admin Content Management Frontend

### What was built

- **Admin navigation** — Content nav item at `/content`, gated by `content.post.read`. No Media/Audit/Analytics navigation added.
- **`packages/types`** — Added `CONTENT_CATEGORY_READ/CREATE/UPDATE/DELETE` and `CONTENT_TAG_READ/CREATE/UPDATE/DELETE` to `DragonPermissions` (alignment with API permission keys from Task 0.6.2).
- **Feature API** — `apps/admin/features/content/admin-content.api.ts` — wraps `createAdminContentClient` for all 28 admin content operations.
- **Composable** — `apps/admin/composables/useAdminContent.ts` — module-level refs for posts, pages, categories, tags, revisions; all load/create/update/delete/lifecycle actions.
- **Shared view components** (10 total):
  - `ContentStatusBadge` — draft/published/archived badge
  - `ContentPostListView` — status filter, table, publish/archive/soft-delete with ConfirmDialog
  - `ContentPostFormView` — title, slug, excerpt, body textarea, categoryIds, tagIds, SEO fields
  - `ContentPostPreviewView` — calls preview endpoint, renders sanitized `bodyHtml`
  - `ContentPageListView` — page list with lifecycle actions
  - `ContentPageFormView` — title, slug, body textarea, SEO fields
  - `ContentPagePreviewView` — calls page preview endpoint
  - `CategoryManageView` — inline CRUD with parentId hierarchy and ConfirmDialog
  - `TagManageView` — inline CRUD with card grid and ConfirmDialog
  - `ContentRevisionListView` — revision table with expandable snapshot JSON, **no restore button**
- **Thin page files** (28 total): content hub, 5 post types × 4 routes (list/new/edit/preview), pages section × 4 routes, categories, tags, revisions
- **Admin navigation spec** updated: `ALLOWED_KEYS` includes 'content'; assertions verify content nav item and its permission.
- **Feature API spec** — `apps/admin/features/content/admin-content.api.spec.ts` — full coverage of all operations including security assertions (no restoreRevision).

### What was NOT built (intentionally out of scope)

- No TipTap editor (Task 0.6.5)
- No public content frontend pages
- No media upload, media picker, or media controls of any kind
- No revision restore (no button, no route, no method)
- No Media/Audit/Analytics navigation
- No search, analytics, comments, newsletter, localization, approval workflow, AI tooling

### Verification Commands

```bash
pnpm install

pnpm --filter @dragon/admin lint
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
pnpm test
pnpm build
pnpm format:check
```

Expected: **83 test suites (API) + 7 admin feature suites = 90 total, 0 failures** (as of Task 0.6.4 completion).

Note: `pnpm typecheck` (workspace-wide) fails on `@dragon/admin` due to pre-existing Nuxt/Vue TypeScript errors unrelated to Slice 0.6. All other packages typecheck clean.

### Key Invariants to Verify

| Invariant                             | How to verify                                                                                         |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Content nav uses `content.post.read`  | `admin-navigation.spec.ts` — "content nav item uses content.post.read permission"                     |
| Content nav hidden without permission | `admin-navigation.spec.ts` — "does not show Content nav without content.post.read permission"         |
| No Media/Audit/Analytics nav items    | `admin-navigation.spec.ts` — "does not contain Media, Audit, or Analytics nav items"                  |
| SDK has no restoreRevision method     | `admin-content.api.spec.ts` — "has no restoreRevision method"                                         |
| SDK has no restorePostRevision method | `admin-content.api.spec.ts` — "has no restorePostRevision method"                                     |
| No generic `/posts/slug/` path in SDK | `admin-content.api.spec.ts` — "no generic /posts/:slug route"                                         |
| Preview calls the preview endpoint    | `ContentPostPreviewView` — uses `previewPost()` not `getPost()`                                       |
| Revision view has no restore button   | `ContentRevisionListView` — no restore button; shows "بازیابی نسخه‌ها در این مرحله پشتیبانی نمی‌شود." |

---

## Task 0.6.5 — TipTap Editor Integration

### What was built

- **`ContentRichTextEditor.vue`** — TipTap-based rich text editor component; wrapped in `<ClientOnly>` for SSR safety; accepts `modelValue` (bodyJson), emits `update:modelValue` (bodyJson) and `html` (bodyHtml); fallback is a plain `<textarea>`
- **`ContentEditorToolbar.vue`** — limited toolbar with paragraph, H1–H3, bold, italic, underline, strike, inline code, link (with client-side URL safety validation), blockquote, bullet list, ordered list, code block, table (insert/add col/add row/delete), horizontal rule; **no media upload, no media picker, no page-builder controls**
- **TipTap extensions used** (all matching backend validator allowlist): `StarterKit`, `Underline`, `Link` (autolink off, `validate` blocks `javascript:`, `data:`, `vbscript:`, `//`), `Table`, `TableRow`, `TableCell`, `TableHeader`
- **`ContentPostFormView.vue`** updated — `bodyJson` added to reactive form state; `ContentRichTextEditor` replaces the old `<textarea>`; `buildBodyHtml()` removed; both `bodyJson` and `bodyHtml` sent on submit
- **`ContentPageFormView.vue`** updated — same pattern as posts
- **`ContentRevisionListView.vue`** updated — revision detail now shows a sanitized `bodyHtml` preview panel (rendered via `v-html`, safe because bodyHtml is backend-sanitized); raw JSON moved to a collapsible `<details>` section; **no restore button added**
- **`admin-content.api.spec.ts`** — added `bodyJson/bodyHtml flow` describe block (4 new tests); added `uploadMedia`/`mediaPicker` absence assertions

### What was NOT built (intentionally out of scope)

- No image insertion (backend validator rejects `image` nodes; no Media API exists)
- No media upload, no media picker, no fake picker, no manual `mediaId` field
- No page builder, drag/drop layout, block marketplace
- No revision restore
- No public content pages (Task 0.6.6)
- No generic `/posts/:slug` route

### Verification Commands

```bash
pnpm install

pnpm --filter @dragon/admin lint
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
pnpm test
pnpm build
pnpm format:check
```

Expected: **83 API test suites + 7 admin feature suites = 90 total, 0 failures** (as of Task 0.6.5 completion; admin feature tests now include 4 bodyJson/bodyHtml tests and 2 no-upload/no-picker assertions).

Note: `pnpm typecheck` (workspace-wide) fails on `@dragon/admin` due to pre-existing Nuxt/Vue TypeScript errors unrelated to Slice 0.6. All other packages typecheck clean.

### Key Invariants to Verify

| Invariant                                         | How to verify                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `ContentRichTextEditor` exists                    | `apps/admin/components/content/ContentRichTextEditor.vue`                                 |
| Editor uses only backend-allowed extensions       | `ContentRichTextEditor.vue` — StarterKit + Underline + Link + Table extensions only       |
| No `Image` extension in editor                    | `ContentRichTextEditor.vue` — no Image import or extension                                |
| Link validates URL client-side                    | `ContentEditorToolbar.vue` — `isSafeUrl()` blocks `javascript:`, `data:`, `//`            |
| Toolbar has no upload/picker/page-builder buttons | `ContentEditorToolbar.vue` — read the file                                                |
| Both bodyJson and bodyHtml sent on submit         | `admin-content.api.spec.ts` — "createPost sends bodyJson when provided"                   |
| SDK has no uploadMedia/mediaPicker method         | `admin-content.api.spec.ts` — "has no uploadMedia method", "has no mediaPicker method"    |
| Revision viewer shows sanitized bodyHtml          | `ContentRevisionListView.vue` — `v-html="snapshotBodyHtml(revision)"` with backend source |
| Revision restore does not exist                   | `ContentRevisionListView.vue` — no restore button; restore-notice text present            |
| No generic `/posts/:slug` route                   | `admin-content.api.spec.ts` — "no generic /posts/:slug route"                             |
| No public content pages added                     | `apps/admin/pages/` — no new top-level routes outside `/content/`                         |

---

## Task 0.6.6 — Public Content Rendering and SEO

### What was built

- **`apps/web/features/content/content-api.ts`** — `createContentApi()` factory wrapping SDK's `createContentClient`; the single integration point for all public content API calls
- **`apps/web/features/content/content-seo.ts`** — `buildContentSeoHead()` pure helper; builds `useHead` config from `ContentSeoDto`; applies title, description, OG tags, canonical link, and noindex
- **`apps/web/composables/usePublicContent.ts`** — Nuxt composable; creates the content client using `runtimeConfig.public.apiBaseUrl`; consumed by every content page
- **`apps/web/components/content/ContentHtmlRenderer.vue`** — the only `v-html` boundary in the public frontend; accepts only `string html` (server-sanitized bodyHtml); styled for rich text output
- **`apps/web/components/content/ContentStateMessage.vue`** — loading / error / empty / not-found states with `role="status"`
- **`apps/web/components/content/ContentCard.vue`** — list-item card with title link, excerpt, and formatted date
- **`apps/web/components/content/ContentList.vue`** — renders an accessible `<ul>` of `ContentCard` items
- **`apps/web/components/content/ContentArticle.vue`** — full detail view for post types; renders title, excerpt, date, and `ContentHtmlRenderer`
- **List pages** (`index.vue`): `/news`, `/articles`, `/announcements`, `/guides`, `/rules` — each calls the type-specific SDK list method via `useAsyncData`
- **Detail pages** (`[slug].vue`): `/news`, `/articles`, `/announcements`, `/guides`, `/rules`, `/pages` — each calls the type-specific SDK detail method; 404 is caught and mapped to not-found state; noindex is set on not-found/error
- **Category page** (`/categories/[slug].vue`) — fetches category by slug; shows metadata; empty state is shown truthfully (no fake content list)
- **Tag page** (`/tags/[slug].vue`) — fetches tag by slug; shows metadata; empty state is shown truthfully
- **`apps/web/features/content/content-api.spec.ts`** — 42 new tests covering all list/detail endpoints, URL encoding, absence of generic routes, SEO helper behavior (title, description, noindex, OG tags, canonical, not-found/error noindex)
- **`apps/web/package.json`** updated — test script covers all features (`jest --runInBand features`); testRegex widened; `@dragon/types` added to `moduleNameMapper`
- **`apps/web/nuxt.config.ts`** updated — workspace source aliases added for `@dragon/types` and `@dragon/sdk` (same fix as admin stabilization)

### What was NOT built (intentionally out of scope)

- No generic `/posts/[slug]` route
- No comments UI
- No related content component (no real API)
- No search feature
- No analytics tracking
- No newsletter
- No localization
- No visual page builder / block renderer
- No media upload, Media Library, or media picker
- No user-generated content
- No OG image resolution (`seo.ogImageMediaId` is in the DTO but not resolved — Media Library deferred)
- No admin UI changes
- No revision restore
- No scheduled publish, approval workflow

### Verification Commands

```bash
pnpm install

pnpm --filter @dragon/web lint
pnpm --filter @dragon/web typecheck
pnpm --filter @dragon/web test
pnpm --filter @dragon/web build

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

Expected after Task 0.6.6: **83 API suites + 7 admin feature suites + 3 web feature suites = 93 total suites, 0 failures; 648 API tests + 98 admin tests + 46 web tests = 792 total tests**.

### Key Invariants to Verify

| Invariant                                                           | How to verify                                                                    |
| ------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `/news` exists                                                      | `apps/web/pages/news/index.vue`                                                  |
| `/news/[slug]` exists                                               | `apps/web/pages/news/[slug].vue`                                                 |
| `/articles`, `/announcements`, `/guides`, `/rules` list pages exist | `apps/web/pages/{articles,announcements,guides,rules}/index.vue`                 |
| All post type detail pages exist                                    | `apps/web/pages/{news,articles,announcements,guides,rules}/[slug].vue`           |
| `/pages/[slug]` exists                                              | `apps/web/pages/pages/[slug].vue`                                                |
| `/categories/[slug]` exists                                         | `apps/web/pages/categories/[slug].vue`                                           |
| `/tags/[slug]` exists                                               | `apps/web/pages/tags/[slug].vue`                                                 |
| No `/posts/[slug]` exists                                           | `apps/web/pages/` — no `posts/` directory                                        |
| Public rendering uses bodyHtml not bodyJson                         | `content-api.spec.ts` — "post response envelope exposes bodyHtml field"          |
| bodyJson not in PublicPostDto                                       | `content-api.spec.ts` — "'bodyJson' in result.post === false"                    |
| `ContentHtmlRenderer` is the only v-html site                       | `ContentHtmlRenderer.vue` — only component with `v-html`                         |
| noindex on not-found                                                | `content-seo.spec.ts` — "not-found state results in noindex"                     |
| noindex on error                                                    | `content-seo.spec.ts` — "error state results in noindex"                         |
| noindex when seo.noIndex === true                                   | `content-seo.spec.ts` — "sets noindex robots meta when seo.noIndex is true"      |
| canonical URL emitted from DTO                                      | `content-seo.spec.ts` — "includes canonical link when canonicalUrl is provided"  |
| OG tags omitted when noindex                                        | `content-seo.spec.ts` — "omits OG tags when noIndex"                             |
| SDK has no uploadMedia/mediaPicker                                  | `content-api.spec.ts` — "has no uploadMedia method", "has no mediaPicker method" |
| No comments/search/analytics/newsletter UI                          | Pages and components have no such imports or elements                            |
| Pages use composable, not scattered fetch                           | All page files use `usePublicContent()` and `useAsyncData()`                     |

---

## Slice 0.6 Closeout Fix — bodyJson Validation and Toolbar Scope

### What was fixed

- **bodyJson validation bypass** — The condition `typeof input.bodyJson.type === 'string'` silently skipped validation when `bodyJson = {}` or `bodyJson = { unknown: "bad" }` (no `type` field). Fixed in all four paths:
  - `AdminContentPostsService.createPost` — normalize then always validate
  - `AdminContentPostsService.updatePost` — normalize, validate, propagate normalized value through `effectiveInput`
  - `AdminContentPagesService.createPage` — same pattern
  - `AdminContentPagesService.updatePage` — same pattern
- **Normalization** — `{}` (empty object) is now normalized to `{ type: "doc", content: [{ type: "paragraph" }] }` before validation. Previously it was passed through without validation.
- **`{ unknown: "bad" }` now rejected** — objects without a valid `type` string field are rejected with `BadRequestException`.
- **TipTap toolbar narrowed to Phase 0 scope** — removed underline, strike, inline code, and horizontal rule buttons from `ContentEditorToolbar.vue`; removed `Underline` extension import and usage from `ContentRichTextEditor.vue`.
- **TipTap v3 `setContent` type fix** — `commands.setContent(content, false)` → `commands.setContent(content, { emitUpdate: false })` to match TipTap v3 API.

### Tests updated

- `admin-content-posts.service.spec.ts`:
  - Renamed "accepts empty bodyJson ({}) without TipTap validation" → "normalizes empty bodyJson ({}) to valid doc and accepts it" (now asserts `postService.create` is called with normalized doc)
  - Added: "rejects bodyJson without type field" (createPost)
  - Added: "rejects bodyJson without type field on update" (updatePost)
- `admin-content-pages.service.spec.ts`:
  - Renamed "accepts empty bodyJson ({}) without validation" → "normalizes empty bodyJson ({}) to valid doc and accepts it"
  - Added: "rejects bodyJson without type field" (createPage)
  - Added: "rejects bodyJson without type field on update" (updatePage)

### Verification Commands

```bash
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

Expected: **83 API test suites, 652 API tests** (4 new tests added), 98 admin tests, all passing.

### Key Invariants

| Invariant                                           | How to verify                                                                                                 |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `{}` bodyJson normalized to empty TipTap doc        | `admin-content-posts.service.spec.ts` — "normalizes empty bodyJson ({}) to valid doc and accepts it"          |
| `{ unknown: "bad" }` rejected on post create        | `admin-content-posts.service.spec.ts` — "rejects bodyJson without type field"                                 |
| `{ unknown: "bad" }` rejected on post update        | `admin-content-posts.service.spec.ts` — "rejects bodyJson without type field on update"                       |
| `{ unknown: "bad" }` rejected on page create        | `admin-content-pages.service.spec.ts` — "rejects bodyJson without type field"                                 |
| `{ unknown: "bad" }` rejected on page update        | `admin-content-pages.service.spec.ts` — "rejects bodyJson without type field on update"                       |
| Toolbar has no underline/strike/inline-code/hr      | `ContentEditorToolbar.vue` — no `toggleUnderline`, `toggleStrike`, `toggleCode`, `setHorizontalRule` calls    |
| No Underline extension in editor                    | `ContentRichTextEditor.vue` — no `import Underline` and not in extensions array                               |

---

## Main HQ Checkpoint — Nuxt Config Regression Fix

### What was fixed

- **`apps/admin/nuxt.config.ts`**: Added `ssr: false` (restores SPA behavior); added `runtimeConfig.public` with `apiBaseUrl`, `adminUrl`, `appEnv`.
- **`apps/web/nuxt.config.ts`**: Added `runtimeConfig` with `apiInternalBaseUrl` (server-only) and `public.apiBaseUrl`, `public.siteUrl`, `public.appEnv`. `ssr: true` unchanged.
- **`apps/admin/app.vue`**: Added `useHead` with `robots: noindex,nofollow,noarchive` meta at app level.

### Verification Commands

```bash
pnpm --filter @dragon/admin typecheck   # ✓ clean
pnpm --filter @dragon/admin build       # ✓ Build complete (1.97 MB)
pnpm --filter @dragon/web typecheck     # ✓ clean
pnpm --filter @dragon/web build         # ✓ Build complete (2.52 MB)
pnpm typecheck                          # ✓ 9 tasks, all successful
pnpm build                              # ✓ 9 tasks, all successful
```

### Key Invariants

| Invariant                                              | How to verify                                                                |
| ------------------------------------------------------ | ---------------------------------------------------------------------------- |
| `apps/admin` is SPA (`ssr: false`)                     | `apps/admin/nuxt.config.ts` — `ssr: false` present                          |
| `apps/web` remains SSR (`ssr: true`)                   | `apps/web/nuxt.config.ts` — `ssr: true` present                             |
| Admin `runtimeConfig.public.apiBaseUrl` defined        | `apps/admin/nuxt.config.ts` — `runtimeConfig.public.apiBaseUrl`             |
| Web `runtimeConfig.public.apiBaseUrl` defined          | `apps/web/nuxt.config.ts` — `runtimeConfig.public.apiBaseUrl`               |
| Web `runtimeConfig.public.siteUrl` defined             | `apps/web/nuxt.config.ts` — `runtimeConfig.public.siteUrl`                  |
| Admin app-level noindex meta set                       | `apps/admin/app.vue` — `useHead` with `robots: noindex,nofollow,noarchive`  |
