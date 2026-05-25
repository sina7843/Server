# Search & Analytics Security Checklist

## Public Content Search

- [ ] Public search endpoint (`GET /api/v1/search/content`) requires no authentication.
- [ ] Public results contain only `status: 'published'` content — draft filter is mandatory.
- [ ] Public results exclude archived content — `status: 'published'` filter is mandatory.
- [ ] Public results exclude soft-deleted content — `deletedAt: { $exists: false }` filter is mandatory.
- [ ] Public result `route` values are type-specific: `/news/:slug`, `/articles/:slug`, `/announcements/:slug`, `/guides/:slug`, `/rules/:slug`, `/pages/:slug`. No generic `/posts/:slug`.
- [ ] Public result items do not include `status` field (published-only results need no status disclosure).
- [ ] Public result items do not include `bodyHtml`, `bodyJson`, or SEO internal metadata.
- [ ] `categoryId` and `tagId` are validated as MongoDB ObjectIds — invalid values return 400.
- [ ] `q` is capped at 200 characters.
- [ ] `limit` is capped at 50.

## Admin Search APIs

- [ ] All admin search endpoints (`/admin/v1/search/*`) require `AccessTokenGuard`.
- [ ] All admin search endpoints require `PermissionGuard` with the appropriate permission.
- [ ] `GET /admin/v1/search/users` requires `search.user.read`.
- [ ] `GET /admin/v1/search/content` requires `search.content.read`.
- [ ] `GET /admin/v1/search/media` requires `search.media.read`.
- [ ] `POST /admin/v1/search/reindex` requires `search.reindex`.
- [ ] No raw permission strings are scattered in code — all use `Permissions.*` from the registry.

## Admin User Search Safety

- [ ] Admin user search results never contain `passwordHash`.
- [ ] Admin user search results never contain `refreshToken`, `refreshTokenHash`, `accessToken`, or `accessTokenJti`.
- [ ] Admin user search results never contain session data.
- [ ] Admin user result `title` is `maskPhone(phoneNormalized)` — raw `phoneNormalized` is never returned.
- [ ] Soft-deleted users are excluded (`deletedAt: { $exists: false }` filter).

## Admin Media Search Safety

- [ ] Admin media results never contain `objectKey`.
- [ ] Admin media results never contain `bucket`.
- [ ] Admin media results never contain `storageProvider`.
- [ ] Admin media results never expose local filesystem paths or private storage URLs.
- [ ] Soft-deleted media assets are excluded.

## Admin Content Search Safety

- [ ] Admin content results contain `status` for operational visibility, but no `bodyHtml` or `bodyJson`.
- [ ] Admin content results do not contain `passwordHash` or any credential field.
- [ ] Soft-deleted content is excluded by default.

## Permissions Registry

- [ ] `search.content.read` is centralized in `permission-keys.ts` and `packages/types/src/constants/permissions.ts`.
- [ ] `search.user.read` is centralized.
- [ ] `search.media.read` is centralized.
- [ ] `search.reindex` is centralized.
- [ ] `admin` role has all four search permissions.
- [ ] `content_manager` role has `search.content.read` and `search.media.read` only.
- [ ] `super_admin` inherits all permissions including search permissions.

## Reindex Safety

- [ ] Reindex endpoint is permission-protected (`search.reindex`).
- [ ] Reindex response is truthful — Phase 0 states no external index exists.
- [ ] No Meilisearch, Elasticsearch, or OpenSearch client is instantiated.
- [ ] No fake search success for missing external infrastructure.
- [ ] Search jobs are no-ops in Phase 0 — they complete without error and without side effects.

## Input Validation

- [ ] `q` parameter is trimmed and capped at 200 characters on both public and admin endpoints.
- [ ] `page` must be a positive integer.
- [ ] `limit` is between 1 and 50.
- [ ] `type` for public search must be one of the allowed content types.
- [ ] `categoryId` and `tagId` must be valid MongoDB ObjectIds.
- [ ] `scope` in reindex body is validated against the `SearchScope` union.

## Out of Scope (Slice 0.9.1)

- [ ] No analytics endpoint exists.
- [ ] No real-time search indexing exists.
- [ ] No Meilisearch / Elasticsearch / OpenSearch client exists.
- [ ] No fuzzy search or typo tolerance exists.
- [ ] No Persian stemming or NLP ranking exists.
- [ ] No recommendation engine or related content endpoint exists.
- [ ] No frontend public search page exists.
- [ ] No admin search UI exists.
- [ ] No search-over-audit-logs endpoint exists (covered by existing audit filter API).
