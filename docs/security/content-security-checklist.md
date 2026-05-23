# Content Security Checklist

> **Slice 0.6 is eligible for content rendering security review.** Task 0.6.3 is complete. `bodyHtml` is sanitized server-side before storage. Public DTOs return sanitized content only. Image insertion remains disabled until a safe Media API is available.

This checklist covers the security properties of the content subsystem. Tasks 0.6.1 and 0.6.2 cover persistence and API surface. Task 0.6.3 covers sanitization.

## XSS / bodyHtml (Task 0.6.3 ✓)

- [x] `bodyHtml` is sanitized server-side using `sanitize-html` before storage — no raw client HTML is ever stored
- [x] Sanitization removes `<script>`, `<style>`, event handler attributes (`onclick`, `onerror`, etc.), and unsafe tags
- [x] `javascript:` and `data:` URL links are blocked (converted to `<span>`)
- [x] Protocol-relative URLs `//` are blocked
- [x] Only approved HTML tags are allowed (paragraphs, headings, lists, blockquote, table, code, links)
- [x] `img` tags are rejected (no safe Media API yet — documented as Later)
- [x] `iframe`/`embed`/`object` tags are rejected
- [x] `target="_blank"` links are supplemented with `rel="noopener noreferrer"`
- [x] TipTap `bodyJson` is validated against an allowlist of nodes and marks on create/update
- [x] Unknown node types are rejected with `BadRequestException`
- [x] Unknown mark types are rejected with `BadRequestException`
- [x] `image` nodes in `bodyJson` are rejected (image insertion disabled until Media API)
- [x] `embed`/`iframe`/`video` nodes are rejected
- [x] Link `href` values in `bodyJson` are validated — `javascript:`, `data:`, `vbscript:`, `//` all rejected
- [x] `PublicPostDto.bodyHtml` comment updated — marked safe to render
- [x] Revision snapshots store sanitized `bodyHtml` (sanitized before `postService.create/update` is called)
- [x] `mediaRefs` extraction not implemented — deferred until Media Library is available

## TipTap Editor Security (Task 0.6.5 ✓)

- [x] TipTap editor extensions match exactly the backend-allowed node/mark allowlist — no extra nodes
- [x] Image insertion is disabled — no `Image` extension; backend rejects `image` nodes
- [x] No media upload button, no media picker, no fake picker in toolbar
- [x] Link extension validates URLs client-side before applying — blocks `javascript:`, `data:`, `vbscript:`, `//`
- [x] Backend remains the security boundary — `bodyHtml` from TipTap is re-sanitized server-side on every save
- [x] `bodyJson` from TipTap is validated server-side by `RichTextValidator` on every save
- [x] Preview uses backend `POST .../preview` endpoint — not raw frontend HTML
- [x] No embed, iframe, video, audio extension in editor
- [x] Revision viewer renders only backend-sanitized `bodyHtml` from snapshot — never raw user input
- [x] No revision restore UI exists — read-only viewer only
- [x] Editor is wrapped in `<ClientOnly>` — no SSR execution of browser-only TipTap code

## Slug Injection (Task 0.6.1 ✓)

- [x] `normalizeSlug()` rejects all unsafe URL characters (`/?#[]@!$&'()*+,;=<>{}|\^\`"`)
- [x] Slug is lowercased and validated against `/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/`
- [x] Slugs cannot start or end with a hyphen
- [x] Maximum slug length is 200 characters
- [x] `SlugPolicyError` is caught in services and re-thrown as `ConflictException` (400) — never leaks as 500

## Hard Delete Prevention (Task 0.6.1 ✓)

- [x] Post repository has no `deleteOne`, `findByIdAndDelete`, or `hardDelete` method
- [x] Page repository has no hard-delete method
- [x] ContentRevision repository has no hard-delete method
- [x] Category repository has no hard-delete method (soft delete via `deletedAt` added Task 0.6.2)
- [x] Tag repository has no hard-delete method (soft delete via `deletedAt` added Task 0.6.2)
- [x] Soft delete via `deletedAt` field only
- [x] Unit tests assert absence of hard-delete methods

## Revision Integrity (Task 0.6.1 ✓)

- [x] `ContentRevision` has no `updatedAt` field (immutable records)
- [x] `ContentRevisionService` has no `restore` method
- [x] `ContentRevisionRepository` has no `restore` method
- [x] No `POST .../revisions/:id/restore` route exists — returns 404
- [x] No `restoreRevision` method in `packages/sdk`
- [x] Revision numbers are unique per resource — enforced by MongoDB unique index
- [x] Unit tests assert absence of restore methods
- [x] Revisions are created on every create, update, publish, archive

## Status Lifecycle (Task 0.6.1 ✓)

- [x] Only `draft | published | archived` are valid statuses — backed by `CONTENT_STATUSES` constant
- [x] `assertValidContentStatus` throws on any unknown status string
- [x] Status defaults to `draft` at schema level — no content is accidentally published
- [x] Public routes filter `status = 'published'` and `deletedAt $exists false`

## Data Exposure (Task 0.6.2 ✓)

- [x] `deletedAt` documents are excluded from all public read endpoints
- [x] `slugHistory` is not exposed in public list endpoints (not in `PublicPostDto`)
- [x] `bodyJson` (raw editor state) is not exposed in public endpoints — only `bodyHtml`
- [x] `authorId` / `createdBy` user IDs are not in public DTOs
- [x] Revision snapshots are only served on admin routes with `content.post.read` / `content.page.read` permissions
- [x] No generic `/api/v1/posts` or `/api/v1/posts/:slug` route exists

## Input Validation (Task 0.6.2 ✓ — partial)

- [x] Admin DTOs use allowlists — unknown fields are rejected, internal fields cannot be injected
- [x] Post type is validated against `CONTENT_POST_TYPES` constant
- [x] Status is validated against `CONTENT_STATUSES` constant
- [x] ObjectId validation via `validateObjectId()` on all `:id` params
- [ ] `categoryIds` and `tagIds` are NOT yet validated as existing ObjectIds (future task)
- [ ] SEO `canonicalUrl` is NOT yet validated as HTTPS URL (future task)
- [x] `bodyHtml` is sanitized server-side by `HtmlSanitizer` (Task 0.6.3 ✓)

## MongoDB

- [ ] Verify unique indexes are created on first deploy: `slugNormalized` (categories, tags, pages), `(type, slugNormalized)` (posts), `(resourceType, resourceId, revisionNumber)` (revisions)
- [ ] Confirm text indexes are created for Posts and Pages for search
- [ ] Verify no unindexed queries on high-cardinality fields reach production
