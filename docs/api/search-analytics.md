# Search and Analytics API

---

## Search

### Implementation

Phase 0 uses `MongoSearchAdapter` — MongoDB text index queries wrapped in a service adapter. There is no Elasticsearch, Meilisearch, or OpenSearch instance.

**Known limitations of MongoSearchAdapter:**

- Basic text matching; no fuzzy search.
- No Persian/Farsi stemming or morphological analysis.
- No field boosting or relevance tuning.
- No faceted search or aggregation-based filtering beyond simple category/type filters.
- Search performance degrades at large collection sizes without further index tuning.

---

### Public search

#### GET `/api/v1/search/content` — No auth required

Searches published content across all types.

**Query params:**

| Param        | Type              | Default  | Max | Notes                                            |
| ------------ | ----------------- | -------- | --- | ------------------------------------------------ |
| `q`          | string            | required | —   | Search query                                     |
| `page`       | number            | 1        | —   | 1-based                                          |
| `limit`      | number            | 20       | 50  | Requests above 50 → 400                          |
| `type`       | string            | —        | —   | Filter by content type (`news`, `article`, etc.) |
| `categoryId` | string (ObjectId) | —        | —   | Filter by category                               |

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
      "publishedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 12,
  "page": 1,
  "limit": 20
}
```

Only `published` content is returned. Draft, archived, and soft-deleted content is excluded.

---

### Admin search

All admin search routes require `Authorization: Bearer <token>` and the relevant permission.

#### GET `/admin/v1/search/content` — `search.content.read`

Searches content across all statuses (draft, published, archived).

**Query params:** `q`, `page`, `limit`, `type`, `status`

---

#### GET `/admin/v1/search/users` — `search.user.read`

Searches users by phone, username, or display name.

**Query params:** `q`, `page`, `limit`

---

#### GET `/admin/v1/search/media` — `search.media.read`

Searches media assets by filename or alt text.

**Query params:** `q`, `page`, `limit`, `mimeType`

---

#### POST `/admin/v1/search/reindex` — `search.index.reindex`

Triggers a background reindex job. The job is enqueued in BullMQ; reindexing happens asynchronously.

**Response `201`:** Job enqueue confirmation.

---

## Analytics

Analytics are lightweight aggregations over MongoDB collections. There is no dedicated analytics database, no event streaming, and no BI tool integration.

All analytics routes require `analytics.analytics.read` permission.

---

### GET `/admin/v1/analytics/summary` — `analytics.analytics.read`

Returns overall platform summary counts.

**Response `200`:**

```json
{
  "users": { "total": 500, "active": 450, "banned": 5 },
  "content": { "published": 120, "draft": 30, "archived": 15 },
  "media": { "total": 800, "sizeBytes": 1073741824 }
}
```

---

### GET `/admin/v1/analytics/content/top` — `analytics.analytics.read`

Returns top-viewed content items. View counts are collected passively; no explicit view-tracking endpoint exists for public users.

**Response `200`:**

```json
{
  "items": [{ "id": "...", "title": "...", "type": "article", "views": 1200 }]
}
```

---

### GET `/admin/v1/analytics/auth` — `analytics.analytics.read`

Returns authentication event aggregates (login counts, failed attempts by time period).

**Response `200`:** Aggregation object (shape may vary based on time range parameters).

**Security:** IP addresses are not returned in analytics responses.

---

### GET `/admin/v1/analytics/otp` — `analytics.analytics.read`

Returns OTP delivery aggregates (sent count, failed count, by time period).

**Security invariants:**

- Raw OTP codes are never returned.
- No 6-digit numeric patterns appear in responses.
- No phone numbers appear in responses.

---

### GET `/admin/v1/analytics/media` — `analytics.analytics.read`

Returns media usage aggregates (upload counts, storage usage by MIME type).

---

## Known limitations (Phase 0)

- **Search:** Basic MongoDB text search only. No relevance scoring, no fuzzy match, no autocomplete, no spell correction, no language-aware tokenization.
- **Analytics:** Lightweight aggregation only. No funnel analysis, cohort analysis, retention metrics, revenue analytics, or conversion tracking.
- **Analytics:** No time-series database. Aggregations run against MongoDB directly; performance at scale is not optimized.
- **Analytics:** No real-time analytics dashboard or websocket feed.
- **Analytics:** No event queue or streaming pipeline (Kafka, Kinesis, etc.).
- **Search reindex:** Reindex runs in background; no progress tracking API.
