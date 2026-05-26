# Content Architecture

## Overview

The content subsystem provides persistence, public APIs, and admin APIs for Posts, Pages, Categories, Tags, and ContentRevisions. It lives in:

- `apps/api/src/content/` — core domain (schemas, repositories, services, public routes)
- `apps/api/src/admin/content/` — admin routes and services

> **Security release:** Slice 0.6 is eligible for content rendering security review. Task 0.6.3 is complete. `bodyHtml` is sanitized server-side before storage. Public DTOs return sanitized content only.

## Rich Text Pipeline (Task 0.6.3)

All `bodyHtml` is sanitized server-side before storage. Clients never store raw HTML.

### RichTextValidator (`content/rich-text/rich-text-validator.ts`)

Validates TipTap-compatible `bodyJson` documents before persistence. Rejects unknown nodes, unknown marks, unsafe link hrefs, and disallowed embed types.

**Allowed node types:** `doc`, `paragraph`, `heading` (levels 1–6), `text`, `bulletList`, `orderedList`, `listItem`, `blockquote`, `codeBlock`, `horizontalRule`, `hardBreak`, `image`, `table`, `tableRow`, `tableHeader`, `tableCell`

**Allowed mark types:** `bold`, `italic`, `underline`, `strike`, `code`, `link`

**Image node validation:** `image` nodes are allowed but must pass `validateImageNode()`:

- `attrs.mediaId` — required, must be a valid 24-character hex ObjectId
- `attrs.src` — if present, must be an absolute `http` or `https` URL
- `attrs.alt` — if present, must be a string ≤ 500 characters
- `attrs.alignment` — if present, must be one of `left`, `center`, `right`, `full`

**Explicitly rejected:** `embed`, `iframe`, `video`, `audio` — rejected with `BadRequestException`. Unknown node types are also rejected.

**Link href safety:** allowed: `https://`, `http://`, `mailto:`, root-relative `/`, anchor `#`. Rejected: `javascript:`, `data:`, `vbscript:`, protocol-relative `//`.

Limits: MAX_DEPTH=12, MAX_NODES=2000.

### HtmlSanitizer (`content/rich-text/html-sanitizer.ts`)

Wraps [`sanitize-html`](https://www.npmjs.com/package/sanitize-html) v2.x. Applied to `bodyHtml` at create and update time in the admin services.

- Removes `<script>`, `<style>`, `<noscript>` and strips their content (not just the tags)
- Removes all event handler attributes (`onclick`, `onerror`, `onload`, etc.)
- Converts `javascript:` and `data:` hrefs to `<span>` (belt-and-suspenders on top of scheme allowlist)
- Blocks protocol-relative `//` URLs (`allowProtocolRelative: false`)
- Allows `<img>` with constrained attributes — any `img` whose `src` is not an absolute `http`/`https` URL is converted to `<span>`; `data:` and `javascript:` srcs are stripped
- Allowed `img` attributes: `src` (absolute http/https only), `alt`, `title`, `data-media-id` (valid ObjectId), `data-alignment` (left/center/right/full), `data-caption` (max 1000 chars), `class`
- Strips `<iframe>`, `<object>`, `<embed>` entirely
- Adds `rel="noopener noreferrer"` to `target="_blank"` links
- Allowed schemes for `<a>`: `http`, `https`, `mailto` only

### Integration

Validation and sanitization happen in `AdminContentPostsService` and `AdminContentPagesService` before calling `postService.create/update`. The Mongoose document is written with already-sanitized `bodyHtml`. Revision snapshots (`toPostSnapshot`) read `post.bodyHtml` from the saved document, so revisions always contain sanitized content.

`PublicPostDto.bodyHtml` and `PublicPageDto.bodyHtml` are marked safe to render (Task 0.6.3).

**`mediaRefs` and `coverMediaId`** are persisted on the post schema and populated on every create/update:

- `coverMediaId` — a single optional `ObjectId` pointing to the post's cover image; set via the cover picker in `ContentPostFormView`.
- `mediaRefs` — an array of `PostMediaRefData` (`{ mediaId, usage, alt?, caption?, alignment? }`). Two usages are produced:
  - `usage: 'cover'` — built from `coverMediaId` when present.
  - `usage: 'inline'` — extracted automatically from `bodyJson` by `extractInlineMediaRefs()`, which walks the document tree and collects every `image` node with a valid `mediaId` ObjectId.
- `buildMediaRefs(bodyJson, coverMediaId)` combines both and deduplicates; it is called on every create and update.

**Automatic content-to-media extraction does not resolve signed URLs or validate that the referenced media assets still exist** — the Media Library manages asset lifecycle independently. Relational integrity checks between content and media are a Phase 1 concern.

## Module Layout

```
apps/api/src/content/
  content.module.ts                  — MongooseModule, providers, exports, public controllers
  slug/
    slug-policy.ts                   — normalizeSlug(), SlugPolicyError (pure, no NestJS)
    slug-policy.spec.ts
  shared/
    content-status.ts                — isValidContentStatus(), assertValidContentStatus()
  posts/
    post.schema.ts                   — Mongoose schema, PostDocument, PostSchema
    post.repository.ts               — Data access (no hard delete); list(), findPublishedByTypeAndSlug()
    post.service.ts                  — Business rules (slug policy, status lifecycle)
    post.*.spec.ts
  pages/
    page.schema.ts
    page.repository.ts               — list(), findPublishedBySlug()
    page.service.ts
    page.*.spec.ts
  categories/
    category.schema.ts               — includes deletedAt for soft delete
    category.repository.ts           — list(includeDeleted), softDelete()
    category.service.ts
    category.*.spec.ts
  tags/
    tag.schema.ts                    — includes deletedAt for soft delete
    tag.repository.ts                — list(includeDeleted), softDelete()
    tag.service.ts
    tag.*.spec.ts
  revisions/
    content-revision.schema.ts
    content-revision.repository.ts
    content-revision.service.ts      — snapshot() creates immutable revision on every change
    content-revision.*.spec.ts
  public/
    public-posts.service.ts          — listPublished(type, query), getPublished(type, slug)
    public-news.controller.ts        — GET /api/v1/news, GET /api/v1/news/:slug
    public-articles.controller.ts    — GET /api/v1/articles, GET /api/v1/articles/:slug
    public-announcements.controller.ts
    public-guides.controller.ts
    public-rules.controller.ts
    public-pages.controller.ts       — GET /api/v1/pages/:slug
    public-categories.controller.ts  — GET /api/v1/categories, GET /api/v1/categories/:slug
    public-tags.controller.ts        — GET /api/v1/tags, GET /api/v1/tags/:slug
    dto/
      public-post-response.ts
      public-page-response.ts
      public-category-response.ts
      public-tag-response.ts

apps/api/src/admin/content/
  admin-content.module.ts            — imports AuthModule, RbacModule, ContentModule
  admin-content-posts.service.ts     — CRUD + publish/archive/softDelete + revisions
  admin-content-posts.controller.ts  — POST /admin/v1/content/posts (CRUD + lifecycle)
  admin-content-pages.service.ts
  admin-content-pages.controller.ts  — POST /admin/v1/content/pages (CRUD + lifecycle)
  admin-content-categories.controller.ts — /admin/v1/content/categories
  admin-content-tags.controller.ts   — /admin/v1/content/tags
  dto/
    admin-content-query.ts
    admin-post-body.ts / admin-post-response.ts
    admin-page-body.ts  / admin-page-response.ts
    admin-category-body.ts / admin-category-response.ts
    admin-tag-body.ts  / admin-tag-response.ts
```

## Public API Routes (Task 0.6.2)

All public routes return only `status = 'published'` and `deletedAt` not set. No auth required.

| Method | Path                          | Description                  |
| ------ | ----------------------------- | ---------------------------- |
| GET    | `/api/v1/news`                | List published news          |
| GET    | `/api/v1/news/:slug`          | Get news by slug             |
| GET    | `/api/v1/articles`            | List published articles      |
| GET    | `/api/v1/articles/:slug`      | Get article by slug          |
| GET    | `/api/v1/announcements`       | List published announcements |
| GET    | `/api/v1/announcements/:slug` | Get announcement by slug     |
| GET    | `/api/v1/guides`              | List published guides        |
| GET    | `/api/v1/guides/:slug`        | Get guide by slug            |
| GET    | `/api/v1/rules`               | List published rules         |
| GET    | `/api/v1/rules/:slug`         | Get rule by slug             |
| GET    | `/api/v1/pages/:slug`         | Get page by slug             |
| GET    | `/api/v1/categories`          | List public categories       |
| GET    | `/api/v1/categories/:slug`    | Get category by slug         |
| GET    | `/api/v1/tags`                | List public tags             |
| GET    | `/api/v1/tags/:slug`          | Get tag by slug              |

**No generic `/api/v1/posts` or `/api/v1/posts/:slug` route exists.**

## Admin API Routes (Task 0.6.2)

All admin routes require `AccessTokenGuard + PermissionGuard`.

| Method | Path                                         | Permission              |
| ------ | -------------------------------------------- | ----------------------- |
| GET    | `/admin/v1/content/posts`                    | content.post.read       |
| POST   | `/admin/v1/content/posts`                    | content.post.create     |
| GET    | `/admin/v1/content/posts/:id`                | content.post.read       |
| PATCH  | `/admin/v1/content/posts/:id`                | content.post.update     |
| POST   | `/admin/v1/content/posts/:id/preview`        | content.post.read       |
| POST   | `/admin/v1/content/posts/:id/publish`        | content.post.publish    |
| POST   | `/admin/v1/content/posts/:id/archive`        | content.post.archive    |
| DELETE | `/admin/v1/content/posts/:id`                | content.post.update     |
| GET    | `/admin/v1/content/posts/:id/revisions`      | content.post.read       |
| GET    | `/admin/v1/content/posts/:id/revisions/:rid` | content.post.read       |
| GET    | `/admin/v1/content/pages`                    | content.page.read       |
| POST   | `/admin/v1/content/pages`                    | content.page.create     |
| GET    | `/admin/v1/content/pages/:id`                | content.page.read       |
| PATCH  | `/admin/v1/content/pages/:id`                | content.page.update     |
| POST   | `/admin/v1/content/pages/:id/preview`        | content.page.read       |
| POST   | `/admin/v1/content/pages/:id/publish`        | content.page.publish    |
| POST   | `/admin/v1/content/pages/:id/archive`        | content.page.archive    |
| DELETE | `/admin/v1/content/pages/:id`                | content.page.update     |
| GET    | `/admin/v1/content/pages/:id/revisions`      | content.page.read       |
| GET    | `/admin/v1/content/pages/:id/revisions/:rid` | content.page.read       |
| GET    | `/admin/v1/content/categories`               | content.category.read   |
| POST   | `/admin/v1/content/categories`               | content.category.create |
| PATCH  | `/admin/v1/content/categories/:id`           | content.category.update |
| DELETE | `/admin/v1/content/categories/:id`           | content.category.delete |
| GET    | `/admin/v1/content/tags`                     | content.tag.read        |
| POST   | `/admin/v1/content/tags`                     | content.tag.create      |
| PATCH  | `/admin/v1/content/tags/:id`                 | content.tag.update      |
| DELETE | `/admin/v1/content/tags/:id`                 | content.tag.delete      |

**Revision restore does not exist. `POST .../revisions/:rid/restore` → 404. This is documented as Later (Task TBD).**

## Collections

| Collection           | Description                         |
| -------------------- | ----------------------------------- |
| `posts`              | News, articles, guides, rules, etc. |
| `pages`              | Static/standalone pages             |
| `content_categories` | Hierarchical categories (parentId)  |
| `content_tags`       | Flat tags                           |
| `content_revisions`  | Immutable point-in-time snapshots   |

## Slug Strategy

### Normalization

`normalizeSlug(raw)` applies a strict policy:

- Trims whitespace
- Rejects unsafe chars (`/?#[]@!$&'()*+,;=<>{}|\^\`"`)
- Lowercases
- Collapses whitespace runs to a single hyphen
- Collapses multiple hyphens to one
- Validates against `/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/` (must start/end with letter or number)
- Rejects inputs exceeding 200 characters

Throws `SlugPolicyError` (not a NestJS exception) for any violation. Admin services catch this and re-throw as `ConflictException`. Public controllers map `SlugPolicyError` → `NotFoundException` (invalid slug = resource does not exist).

### Uniqueness Scoping

- **Post slugs** are unique per `(type, slugNormalized)`. The same slug may exist across different post types.
- **Page slugs** are globally unique by `slugNormalized`.
- **Category slugs** are globally unique by `slugNormalized`.
- **Tag slugs** are globally unique by `slugNormalized`.

## Status Lifecycle

Valid statuses: `draft | published | archived` (from `@dragon/types` `CONTENT_STATUSES`).

- All resources start as `draft`.
- `markPublished` sets `status = 'published'` and `publishedAt = now`.
- `markArchived` sets `status = 'archived'`.
- There is no `markDraft` — once published, a resource moves forward only.
- `isValidContentStatus` / `assertValidContentStatus` in `shared/content-status.ts` are the authoritative guards.

## Soft Delete

Posts and Pages support soft delete via `deletedAt?: Date`. Setting `deletedAt` logically removes the document.

Categories and Tags also support soft delete via `deletedAt?: Date` (added Task 0.6.2). Admin DELETE soft-deletes; public list always excludes deleted.

**Hard delete is not implemented anywhere in the content subsystem.**

## ContentRevision

Revisions are **immutable point-in-time snapshots** of any content resource.

- `timestamps: { createdAt: true, updatedAt: false }` — no `updatedAt` field.
- Revision numbers are monotonically increasing per `(resourceType, resourceId)`.
- `ContentRevisionService.snapshot()` fetches the current `latestRevisionNumber` and creates `revisionNumber + 1`.
- Revisions are created on every create, update, publish, and archive operation.
- **There is no restore endpoint and no `restore` method anywhere in the revision subsystem. This is Later.**

## Indexes

### Posts

- `{ type, slugNormalized }` UNIQUE
- `{ type, status, publishedAt }`
- `{ categoryIds }`
- `{ tagIds }`
- `{ authorId }`
- `{ createdAt }`
- `{ updatedAt }`
- Text index: `title`, `excerpt`, `bodyHtml`

### Pages

- `{ slugNormalized }` UNIQUE
- `{ status }`
- `{ createdAt }`
- Text index: `title`, `bodyHtml`

### Categories

- `{ slugNormalized }` UNIQUE

### Tags

- `{ slugNormalized }` UNIQUE

### ContentRevisions

- `{ resourceType, resourceId, revisionNumber }` UNIQUE
- `{ resourceType, resourceId, createdAt }`

## packages/types Contracts

`packages/types/src/constants/content.ts` exports:

- `CONTENT_POST_TYPES`, `ContentPostType`
- `CONTENT_STATUSES`, `ContentStatus`
- `CONTENT_MEDIA_USAGES`, `ContentMediaUsage`
- `CONTENT_MEDIA_ALIGNMENTS`, `ContentMediaAlignment`
- `CONTENT_RESOURCE_TYPES`, `ContentResourceType`

`packages/types/src/contracts/content.ts` exports:

**Public DTOs:** `PublicPostDto`, `PublicPageDto`, `PublicCategoryDto`, `PublicTagDto`

**Public responses:** `PublicPostListResponse`, `PublicPostResponse`, `PublicPageResponse`, `PublicCategoryListResponse`, `PublicCategoryResponse`, `PublicTagListResponse`, `PublicTagResponse`

**Admin DTOs:** `AdminPostSummaryDto`, `AdminPostDetailDto`, `AdminPageSummaryDto`, `AdminPageDetailDto`, `AdminCategoryDto`, `AdminTagDto`

**Admin responses:** `AdminPostListResponse`, `AdminPostResponse`, `AdminPageListResponse`, `AdminPageResponse`, `AdminCategoryListResponse`, `AdminCategoryResponse`, `AdminTagListResponse`, `AdminTagResponse`

**Revision DTOs:** `ContentRevisionSummary`, `ContentRevisionDetailDto`, `ContentRevisionListResponse`, `ContentRevisionResponse`

**Request types:** `CreatePostRequest`, `UpdatePostRequest`, `CreatePageRequest`, `UpdatePageRequest`, `CreateCategoryRequest`, `UpdateCategoryRequest`, `CreateTagRequest`, `UpdateTagRequest`, `ContentSeoInput`

**Generic:** `ContentGenericResponse`

## packages/sdk Client Methods

**Public (`createContentClient`):** `listNews`, `getNewsPost`, `listArticles`, `getArticle`, `listAnnouncements`, `getAnnouncement`, `listGuides`, `getGuide`, `listRules`, `getRule`, `getPage`, `listCategories`, `getCategory`, `listTags`, `getTag`

**Admin (`createAdminContentClient`):** `listPosts`, `createPost`, `getPost`, `updatePost`, `previewPost`, `publishPost`, `archivePost`, `softDeletePost`, `listPostRevisions`, `getPostRevision`, `listPages`, `createPage`, `getPage`, `updatePage`, `previewPage`, `publishPage`, `archivePage`, `softDeletePage`, `listPageRevisions`, `getPageRevision`, `listCategories`, `createCategory`, `updateCategory`, `deleteCategory`, `listTags`, `createTag`, `updateTag`, `deleteTag`

**No `restoreRevision` method exists in the SDK.**

## Admin Frontend (Task 0.6.4)

The admin frontend (`apps/admin`) provides a full content management UI. All pages are gated by the existing admin auth middleware stack.

### Navigation

A **Content** nav item (`/content`) is visible to users with `content.post.read` permission. No Media, Audit, or Analytics nav items exist.

### Admin Routes

| Route                            | Description                              | Permission                                 |
| -------------------------------- | ---------------------------------------- | ------------------------------------------ |
| `/content`                       | Hub page — links to all content sections | `content.post.read`                        |
| `/content/news`                  | News list                                | `content.post.read`                        |
| `/content/news/new`              | Create news                              | `content.post.create`                      |
| `/content/news/:id/edit`         | Edit news                                | `content.post.update`                      |
| `/content/news/:id/preview`      | Preview news                             | `content.post.read`                        |
| `/content/articles/*`            | Article CRUD                             | (same pattern)                             |
| `/content/announcements/*`       | Announcement CRUD                        | (same pattern)                             |
| `/content/guides/*`              | Guide CRUD                               | (same pattern)                             |
| `/content/rules/*`               | Rule CRUD                                | (same pattern)                             |
| `/content/pages`                 | Page list                                | `content.page.read`                        |
| `/content/pages/new`             | Create page                              | `content.page.create`                      |
| `/content/pages/:id/edit`        | Edit page                                | `content.page.update`                      |
| `/content/pages/:id/preview`     | Preview page                             | `content.page.read`                        |
| `/content/categories`            | Category CRUD (inline)                   | `content.category.read`                    |
| `/content/tags`                  | Tag CRUD (inline)                        | `content.tag.read`                         |
| `/content/revisions/:resourceId` | Revision history                         | `content.post.read` or `content.page.read` |

### Component Architecture

Thin page files (~15 lines each) delegate to shared view components:

- **`ContentRichTextEditor`** — TipTap-based rich text editor (Task 0.6.5); wraps the editor and toolbar; emits `bodyJson` and `bodyHtml` for the form
- **`ContentEditorToolbar`** — limited toolbar exposing only backend-allowed formatting; includes an "insert image" button that opens `MediaPickerDialog` (no direct file upload in editor, no page builder)
- **`ContentPostListView`** — status filter, paginated table, publish/archive/soft-delete actions
- **`ContentPostFormView`** — title, slug, excerpt, TipTap body editor, categoryIds, tagIds, SEO fields
- **`ContentPostPreviewView`** — calls preview endpoint, renders sanitized `bodyHtml` via `v-html`
- **`ContentPageListView`** — page list with lifecycle actions
- **`ContentPageFormView`** — title, slug, TipTap body editor, SEO fields
- **`ContentPagePreviewView`** — calls page preview endpoint
- **`CategoryManageView`** — inline CRUD with parentId hierarchy support
- **`TagManageView`** — inline CRUD with card grid display
- **`ContentRevisionListView`** — revision table with expandable snapshot HTML preview and JSON; **no restore button**
- **`ContentStatusBadge`** — draft/published/archived colored badge

### TipTap Editor (Task 0.6.5)

Posts and pages use a TipTap rich text editor for `bodyJson`/`bodyHtml` authoring. The editor is wrapped in `<ClientOnly>` to avoid SSR issues; a plain `<textarea>` is shown as the SSR fallback.

**Allowed editor extensions (matching backend validator):**

- StarterKit: paragraph, heading (1–6), bold, italic, strike, code, codeBlock, blockquote, bulletList, orderedList, listItem, horizontalRule, hardBreak
- Underline
- Link (with client-side URL safety validation: blocks `javascript:`, `data:`, `vbscript:`, `//`)
- Table, TableRow, TableCell, TableHeader
- **`MediaImage`** (`components/content/MediaImageExtension.ts`) — extends TipTap's `Image` extension with `mediaId`, `alt`, `caption`, and `alignment` attributes; `allowBase64: false`

**Inline image insertion** is supported via `MediaPickerDialog`. Clicking the toolbar "insert image" button opens the dialog, which lists assets from the Media Library API. On selection, `setImage({ src, mediaId, alt })` inserts an `image` node into the document. No file upload is performed inside the editor — images must already be present in the Media Library. No manual typed `mediaId`, no base64 data URLs, no fake picker.

**Embeds are disabled.** `embed`, `iframe`, `video`, `audio` nodes are not in the editor extensions and are rejected by the backend validator.

**bodyJson/bodyHtml submit flow:**

1. User edits content in `ContentRichTextEditor` — editor emits `update:modelValue` (bodyJson) and `html` event (bodyHtml) on every change.
2. Form holds both `form.bodyJson` (TipTap JSON) and `form.bodyHtml` (TipTap HTML output).
3. On submit, both `bodyJson` and `bodyHtml` are sent to the backend.
4. Backend validates `bodyJson` with `RichTextValidator` and sanitizes `bodyHtml` with `HtmlSanitizer`. Backend is the security boundary.

**Preview uses the backend preview endpoint** — not the frontend editor HTML directly. Preview response contains already-sanitized `bodyHtml`.

### Revision Viewer (Task 0.6.5)

The revision detail panel now shows:

1. A `bodyHtml` preview (backend-sanitized, safe to render via `v-html`) if the snapshot contains `bodyHtml`.
2. A collapsible JSON viewer showing the raw snapshot data.

**Revision restore is not supported.** No restore button exists anywhere. The revision detail view displays a notice: "بازیابی نسخه‌ها در این مرحله پشتیبانی نمی‌شود." (Revision restore is not supported at this stage.)

### Preview

Preview pages call the backend `POST .../preview` endpoint (not the GET endpoint) and render the returned `bodyHtml` using `v-html`. Content is sanitized server-side (Task 0.6.3). An admin-only notice banner is displayed above the preview.

### Permission-Aware Actions

All create/edit/delete/publish/archive buttons are hidden or disabled when the user lacks the required permission. Destructive actions show a `ConfirmDialog` with soft-delete language (never "permanently delete").

### Out-of-Scope Constraints (Admin)

The following are explicitly not implemented and must not be added to the admin frontend:

- Direct file upload inside the rich-text editor (images must be uploaded to the Media Library first, then inserted via the picker)
- Fake media picker or manual typed `mediaId` field (the picker uses the real Media Library API)
- Page builder, drag/drop layout engine, block marketplace
- Revision restore, rollback UI
- Scheduled publish, approval workflow
- Generic `/posts/:slug` or `/api/v1/posts/:slug` routes
- Search, analytics, comments, newsletter, localization, AI content tooling

## Public Web Frontend (Task 0.6.6)

`apps/web` renders public content pages using server-side rendering (Nuxt 3 SSR).

### Public Routes

| Route                   | Content type           |
| ----------------------- | ---------------------- |
| `/news`                 | News list              |
| `/news/[slug]`          | News detail            |
| `/articles`             | Article list           |
| `/articles/[slug]`      | Article detail         |
| `/announcements`        | Announcement list      |
| `/announcements/[slug]` | Announcement detail    |
| `/guides`               | Guide list             |
| `/guides/[slug]`        | Guide detail           |
| `/rules`                | Rules list             |
| `/rules/[slug]`         | Rule detail            |
| `/pages/[slug]`         | Static page            |
| `/categories/[slug]`    | Category metadata page |
| `/tags/[slug]`          | Tag metadata page      |

**No `/posts/[slug]` or generic post route exists.**

### Rendering Architecture

Public content rendering is organized in layers:

- **`apps/web/features/content/content-api.ts`** — creates the public `ContentClient` via SDK
- **`apps/web/features/content/content-seo.ts`** — `buildContentSeoHead()` builds `useHead` config from DTOs
- **`apps/web/composables/usePublicContent.ts`** — Nuxt composable that instantiates the content client
- **Pages** — call `usePublicContent()` and `useAsyncData()` for SSR data fetching
- **`ContentHtmlRenderer.vue`** — the only component that calls `v-html`; accepts only server-sanitized `bodyHtml`

No scattered direct fetch calls in page files. All API calls go through the composable.

### Components (`apps/web/components/content/`)

| Component             | Purpose                                          |
| --------------------- | ------------------------------------------------ |
| `ContentHtmlRenderer` | Renders server-sanitized `bodyHtml` via `v-html` |
| `ContentStateMessage` | Loading / error / empty / not-found states       |
| `ContentCard`         | Card item for list pages                         |
| `ContentList`         | Renders a list of `ContentCard` items            |
| `ContentArticle`      | Full detail view for post types                  |

### Rendering Source

Public content rendering **always uses sanitized `bodyHtml` from the backend** (Task 0.6.3). `bodyJson` is never used as the public rendering source. `ContentHtmlRenderer` isolates all `v-html` usage.

### SEO Behavior

- `buildContentSeoHead()` reads `seo.title`, `seo.description`, `seo.canonicalUrl`, and `seo.noIndex` from the DTO
- `noindex` is set when: `seo.noIndex === true`, content is not found (404), or an error occurs
- OG title and OG description are set only when content is indexable
- OG image is not set — `seo.ogImageMediaId` is not resolved to a public URL by the web app; the admin Media Library exists but public OG image resolution is not implemented
- Canonical URL is emitted as a `<link rel="canonical">` when present

### State Handling

| State     | Trigger                       | SEO       |
| --------- | ----------------------------- | --------- |
| loading   | `pending === true`            | —         |
| error     | `error.value !== null`        | noindex   |
| not-found | API returns 404, data is null | noindex   |
| empty     | List returns 0 items          | indexable |
| success   | Content loaded                | from DTO  |

### Out-of-Scope Constraints (Web)

The following are explicitly not implemented and must not be added to the public web:

- Generic `/posts/[slug]` route
- Comments
- Related content (no real API)
- Per-page search UI — content detail/list pages have no embedded search widget; a global `/search` route exists separately in the app
- Client-side analytics dashboard or tracking widgets on content pages — backend records `content.viewed` events via the analytics service; no frontend tracking pixel or dashboard widget is embedded in content pages
- Newsletter
- Localization
- Visual page builder / block renderer
- Media manager, file upload, or media picker in the public web — the admin Media Library exists; the public web has no media management UI
- User-generated content
- Content recommendations
- Admin UI changes
