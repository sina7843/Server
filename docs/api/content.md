# Content API

---

## Content types

The content engine supports the following post types. Each type has a separate public route prefix.

| Type           | Public route prefix     | Admin route               |
| -------------- | ----------------------- | ------------------------- |
| `news`         | `/api/v1/news`          | `/admin/v1/content/posts` |
| `article`      | `/api/v1/articles`      | `/admin/v1/content/posts` |
| `guide`        | `/api/v1/guides`        | `/admin/v1/content/posts` |
| `announcement` | `/api/v1/announcements` | `/admin/v1/content/posts` |
| `rule`         | `/api/v1/rules`         | `/admin/v1/content/posts` |

Static pages are a separate content kind (`Page`) with its own admin controller and public route at `/api/v1/pages/:slug`.

> **There is no generic `/api/v1/posts/:slug` route.** All public access is type-scoped.

---

## Content lifecycle

```
draft → published → archived
         ↓
      soft-deleted (any state)
```

| State        | Public visibility | Admin visibility   |
| ------------ | ----------------- | ------------------ |
| `draft`      | 404               | visible            |
| `published`  | 200               | visible            |
| `archived`   | 404               | visible            |
| soft-deleted | 404               | visible (filtered) |

---

## Public API

### List (GET `/:type`)

Returns paginated list of published content for the type.

**Query params:** `page`, `limit`, `categoryId`, `tagId`

**Response `200`:**

```json
{
  "items": [
    {
      "id": "...",
      "slug": "my-article",
      "title": "My Article",
      "type": "article",
      "excerpt": "...",
      "coverImageUrl": "https://...",
      "publishedAt": "2024-01-01T00:00:00.000Z",
      "category": { "id": "...", "name": "...", "slug": "..." },
      "tags": [{ "id": "...", "name": "...", "slug": "..." }]
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 20
}
```

Only `published` content is returned. Draft and archived items are excluded.

---

### Single item (GET `/:type/:slug`)

Returns full content for a published item.

**Response `200`:**

```json
{
  "id": "...",
  "slug": "my-article",
  "title": "My Article",
  "type": "article",
  "bodyHtml": "<p>...</p>",
  "bodyJson": { "type": "doc", "content": [...] },
  "excerpt": "...",
  "coverImageUrl": "https://...",
  "publishedAt": "2024-01-01T00:00:00.000Z",
  "category": { ... },
  "tags": [...]
}
```

Returns `404` if the item does not exist, is not published, or is soft-deleted.

`bodyHtml` is sanitized server-side before storage. `bodyJson` is the TipTap JSON document.

---

### Pages (GET `/api/v1/pages/:slug`)

Static pages are not type-scoped lists — only single-page lookup is public.

**Response `200`:** Same shape as single post response. `type` is `"page"`.

---

### Categories (GET `/api/v1/categories`, `/api/v1/categories/:slug`)

Returns all categories (no pagination) or a single category with basic metadata.

---

### Tags (GET `/api/v1/tags`, `/api/v1/tags/:slug`)

Returns all tags or a single tag.

---

## Admin API

All admin content routes require `Authorization: Bearer <token>` and the appropriate permission.

### Posts

| Action                      | Route                                                   | Permission             |
| --------------------------- | ------------------------------------------------------- | ---------------------- |
| List all posts (any status) | GET `/admin/v1/content/posts`                           | `content.post.read`    |
| Create post (draft)         | POST `/admin/v1/content/posts`                          | `content.post.create`  |
| Get post                    | GET `/admin/v1/content/posts/:id`                       | `content.post.read`    |
| Update post                 | PATCH `/admin/v1/content/posts/:id`                     | `content.post.update`  |
| Preview                     | POST `/admin/v1/content/posts/:id/preview`              | `content.post.read`    |
| Publish                     | POST `/admin/v1/content/posts/:id/publish`              | `content.post.publish` |
| Archive                     | POST `/admin/v1/content/posts/:id/archive`              | `content.post.archive` |
| Soft-delete                 | DELETE `/admin/v1/content/posts/:id`                    | `content.post.update`  |
| List revisions              | GET `/admin/v1/content/posts/:id/revisions`             | `content.post.read`    |
| Get revision                | GET `/admin/v1/content/posts/:id/revisions/:revisionId` | `content.post.read`    |

**Create/Update request body:**

```json
{
  "title": "My Post",
  "slug": "my-post",
  "type": "article",
  "excerpt": "...",
  "bodyJson": { "type": "doc", "content": [...] },
  "categoryId": "<id>",
  "tagIds": ["<id>"]
}
```

`bodyHtml` is generated server-side from `bodyJson` (TipTap serialization + sanitization). Clients submit `bodyJson` only.

### Pages

Same action set as posts but under `/admin/v1/content/pages` with `content.page.*` permissions.

### Categories

| Action | Route                                     | Permission                |
| ------ | ----------------------------------------- | ------------------------- |
| List   | GET `/admin/v1/content/categories`        | `content.category.read`   |
| Create | POST `/admin/v1/content/categories`       | `content.category.create` |
| Update | PATCH `/admin/v1/content/categories/:id`  | `content.category.update` |
| Delete | DELETE `/admin/v1/content/categories/:id` | `content.category.delete` |

### Tags

Same action set as categories but under `/admin/v1/content/tags` with `content.tag.*` permissions.

---

## Body sanitization

`bodyHtml` is produced by TipTap server-side rendering and then sanitized with a strict allowlist before storage. Script tags, event handlers, and external resource embeds are stripped. Clients should treat `bodyHtml` as safe for direct rendering but must not trust `bodyJson` as pre-sanitized — always render from `bodyHtml` in public views.

---

## Known limitations (Phase 0)

- No scheduled publish (publish is immediate).
- No content approval workflow / editorial chain.
- No multi-author attribution.
- No comment system.
- No view count tracking on public routes (analytics are aggregated separately).
- Revision history is stored but diff UI is not implemented in the admin frontend.
- No content import/export.
