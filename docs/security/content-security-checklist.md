# Content Security Checklist

This checklist covers the security properties of the content persistence layer (Task 0.6.1). Verify before exposing any content endpoint.

## Slug Injection

- [x] `normalizeSlug()` rejects all unsafe URL characters (`/?#[]@!$&'()*+,;=<>{}|\^\`"`)
- [x] Slug is lowercased and validated against `/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/`
- [x] Slugs cannot start or end with a hyphen
- [x] Maximum slug length is 200 characters
- [x] `SlugPolicyError` is caught in services and re-thrown as `ConflictException` (400) — never leaks as 500

## Hard Delete Prevention

- [x] Post repository has no `deleteOne`, `findByIdAndDelete`, or `hardDelete` method
- [x] Page repository has no hard-delete method
- [x] ContentRevision repository has no hard-delete method
- [x] Soft delete via `deletedAt` field only (Posts, Pages)
- [x] Unit tests assert absence of hard-delete methods

## Revision Integrity

- [x] `ContentRevision` has no `updatedAt` field (immutable records)
- [x] `ContentRevisionService` has no `restore` method
- [x] `ContentRevisionRepository` has no `restore` method
- [x] Revision numbers are unique per resource — enforced by MongoDB unique index
- [x] Unit tests assert absence of restore methods

## Status Lifecycle

- [x] Only `draft | published | archived` are valid statuses — backed by `CONTENT_STATUSES` constant
- [x] `assertValidContentStatus` throws on any unknown status string
- [x] Status defaults to `draft` at schema level — no content is accidentally published

## Data Exposure (Future — enforce when adding controllers)

- [ ] `deletedAt` documents must be excluded from all public read endpoints
- [ ] `slugHistory` must not be exposed in public list endpoints
- [ ] `bodyJson` (raw editor state) must not be exposed in public endpoints — only `bodyHtml`
- [ ] `createdBy` / `updatedBy` user IDs must not be exposed without authorization
- [ ] Revision snapshots must never be served without admin permission

## Input Validation (Future — enforce when adding DTOs)

- [ ] All string inputs must be trimmed and length-bounded in DTO validators
- [ ] `categoryIds` and `tagIds` must be validated as existing ObjectIds before write
- [ ] SEO `canonicalUrl` must be validated as a valid HTTPS URL
- [ ] `bodyHtml` must be sanitized before storage (DOMPurify or equivalent) to prevent stored XSS

## MongoDB

- [ ] Verify unique indexes are created on first deploy: `slugNormalized` (categories, tags, pages), `(type, slugNormalized)` (posts), `(resourceType, resourceId, revisionNumber)` (revisions)
- [ ] Confirm text indexes are created for Posts and Pages for search
- [ ] Verify no unindexed queries on high-cardinality fields reach production
