# Content Architecture

## Overview

The content subsystem provides persistence for Posts, Pages, Categories, Tags, and ContentRevisions. It lives entirely within `apps/api/src/content/` and is registered as `ContentModule` in `AppModule`. There are no controllers, routes, or HTTP surface in Task 0.6.1 — this is the persistence foundation only.

## Module Layout

```
apps/api/src/content/
  content.module.ts           — MongooseModule registrations, providers, exports
  slug/
    slug-policy.ts            — normalizeSlug(), SlugPolicyError (pure, no NestJS)
    slug-policy.spec.ts
  shared/
    content-status.ts         — isValidContentStatus(), assertValidContentStatus()
  posts/
    post.types.ts             — PostId, CreatePostInput, UpdatePostInput, ...
    post.schema.ts            — Mongoose schema, PostDocument, PostSchema
    post.repository.ts        — Data access (no hard delete)
    post.service.ts           — Business rules (slug policy, status lifecycle)
    post.*.spec.ts
  pages/
    page.types.ts
    page.schema.ts
    page.repository.ts
    page.service.ts
    page.*.spec.ts
  categories/
    category.types.ts
    category.schema.ts
    category.repository.ts
    category.service.ts
    category.*.spec.ts
  tags/
    tag.types.ts
    tag.schema.ts
    tag.repository.ts
    tag.service.ts
    tag.*.spec.ts
  revisions/
    content-revision.types.ts
    content-revision.schema.ts
    content-revision.repository.ts
    content-revision.service.ts
    content-revision.*.spec.ts
```

## Collections

| Collection            | Description                          |
|-----------------------|--------------------------------------|
| `posts`               | News, articles, guides, rules, etc.  |
| `pages`               | Static/standalone pages              |
| `content_categories`  | Hierarchical categories (parentId)   |
| `content_tags`        | Flat tags                            |
| `content_revisions`   | Immutable point-in-time snapshots    |

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

Throws `SlugPolicyError` (not a NestJS exception) for any violation. Services catch this and re-throw as `ConflictException`.

### Uniqueness Scoping

- **Post slugs** are unique per `(type, slugNormalized)`. The same slug may exist across different post types (e.g., `my-post` can be both a `news` and an `article`).
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

Posts and Pages support soft delete via `deletedAt?: Date`. Setting `deletedAt` logically removes the document. `findBySlug` and similar read methods filter `{ deletedAt: { $exists: false } }`.

Categories and Tags have no soft delete — they are referenced objects and are deleted by admins explicitly if unused (future task).

**Hard delete is not implemented anywhere in the content subsystem.**

## ContentRevision

Revisions are **immutable point-in-time snapshots** of any content resource.

- `timestamps: { createdAt: true, updatedAt: false }` — no `updatedAt` field.
- Revision numbers are monotonically increasing per `(resourceType, resourceId)`.
- `ContentRevisionService.snapshot()` fetches the current `latestRevisionNumber` and creates `revisionNumber + 1`.
- There is no restore endpoint and no `restore` method anywhere in the revision subsystem.

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

- `ContentSeoDto`, `ContentMediaRefDto`
- `ContentPostSummary`, `ContentPageSummary`
- `ContentCategorySummary`, `ContentTagSummary`
- `ContentRevisionSummary`
