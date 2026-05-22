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
- `ContentModule`: registers all schemas, providers, exports — no controllers
- `AppModule`: imports `ContentModule`

### What was NOT built (intentionally deferred)

- No HTTP controllers or routes
- No SDK client methods
- No admin frontend pages
- No media upload / file storage
- No TipTap editor integration
- No restore endpoint for revisions

### Verification Commands

```bash
# Build types package
pnpm --filter @dragon/types build

# Build API (TypeScript compilation check)
pnpm --filter @dragon/api build

# Run all API tests
pnpm --filter @dragon/api test
```

Expected output: `77 test suites, 538 tests, 0 failures` (as of Task 0.6.1 completion).

### Key Invariants to Verify

| Invariant | How to verify |
|---|---|
| Post slug uniqueness is per (type, slugNormalized) | `post.service.spec.ts` — "post slug uniqueness is scoped by type" |
| Page slug uniqueness is global | `page.service.spec.ts` — "page slug uniqueness is global" |
| No hard delete on Posts/Pages | `post.repository.spec.ts`, `page.repository.spec.ts` — "does not expose a hard-delete method" |
| No restore on ContentRevision | `content-revision.service.spec.ts` — "does not expose a restore method" |
| Revision numbers increment per resource | `content-revision.service.spec.ts` — "increments revisionNumber per resource" |
| Slugs with leading/trailing hyphens are rejected | `slug-policy.spec.ts` — "rejects slugs that start/end with a hyphen after normalization" |
| ContentRevision has no updatedAt | `content-revision.schema.spec.ts` — "does not include updatedAt (immutable revisions)" |
| ContentModule has no controllers | `content.module.spec.ts` — "ContentModule has no controllers array" |

### Collections Created

MongoDB collections that will be created on first connection:

- `posts`
- `pages`
- `content_categories`
- `content_tags`
- `content_revisions`

Unique indexes on these collections are declared in the schemas and will be applied by Mongoose on startup.
