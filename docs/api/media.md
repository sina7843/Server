# Media API

Media management is **admin-only**. There is no public media upload endpoint.

---

## Upload validation

Files are rejected before storage if they fail either check:

**Allowed MIME types:**
`image/jpeg`, `image/png`, `image/webp`, `image/gif`

**Allowed extensions (without leading dot):**
`jpg`, `jpeg`, `png`, `webp`, `gif`

Both checks must pass. A file with a valid MIME type but wrong extension is rejected (and vice versa).

**Max file size:** configured by `MEDIA_MAX_FILE_SIZE_BYTES` (default 10 MB in development, 50 MB in production).

Rejected uploads return `400 Bad Request` with a message identifying the rejection reason. Oversized uploads return `413 Payload Too Large`.

---

## Admin routes

All routes require `Authorization: Bearer <token>`.

### GET `/admin/v1/media` — `media.asset.read`

List media assets. Paginated.

**Query params:** `page`, `limit`, `mimeType`, `visibility`

**Response `200`:**

```json
{
  "items": [
    {
      "id": "...",
      "filename": "photo.jpg",
      "mimeType": "image/jpeg",
      "size": 204800,
      "visibility": "public",
      "url": "https://...",
      "variants": {
        "thumbnail": "https://...",
        "medium": "https://..."
      },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 20
}
```

---

### POST `/admin/v1/media/upload` — `media.asset.upload`

Upload a new media asset.

**Request:** `multipart/form-data`

| Field        | Type   | Required | Notes                           |
| ------------ | ------ | -------- | ------------------------------- |
| `file`       | binary | Yes      | Image file                      |
| `visibility` | string | No       | `public` (default) or `private` |
| `altText`    | string | No       | Accessibility alt text          |

**Response `201`:** Single media asset object (same shape as list item).

**Errors:** `400` MIME/extension not allowed · `413` file too large

---

### GET `/admin/v1/media/:id` — `media.asset.read`

Single asset detail.

**Response `200`:** Media asset object including all variant URLs.

---

### PATCH `/admin/v1/media/:id` — `media.asset.update`

Update asset metadata.

**Request body (all optional):**

```json
{
  "altText": "A descriptive caption",
  "visibility": "private"
}
```

**Response `200`:** Updated asset object.

---

### POST `/admin/v1/media/:id/regenerate-variants` — `media.asset.regenerate`

Re-runs image processing to regenerate thumbnail and other variants. Used after processing failures.

**Response `200`:** Asset object with updated variant URLs.

---

### DELETE `/admin/v1/media/:id` — `media.asset.delete`

Deletes the asset record from MongoDB and removes the file and all variants from object storage. This is irreversible.

**Response `200`:** Confirmation.

---

## Visibility and signed URLs

| Visibility | Behavior                                                                                                               |
| ---------- | ---------------------------------------------------------------------------------------------------------------------- |
| `public`   | CDN/public URL served directly from Arvan Object Storage                                                               |
| `private`  | Signed URL generated with TTL (`STORAGE_SIGNED_URL_TTL_SECONDS`, default 3600 s); URL expires and must be re-requested |

Private assets are not accessible without a valid signed URL. Signed URLs are generated at request time and should not be cached long-term by the client.

---

## Image variants

After upload, the API generates these variants via Sharp:

| Variant     | Dimensions               |
| ----------- | ------------------------ |
| `thumbnail` | 150 × 150 (crop)         |
| `medium`    | 800 × 600 (fit, no crop) |

The original file is also stored. Variant generation is synchronous in Phase 0 (not offloaded to worker queue). Failure to generate variants does not block the upload response — variants can be regenerated via the regenerate-variants endpoint.

---

## Known limitations (Phase 0)

- Images only. No video, audio, PDF, or document upload.
- No video transcoding or streaming pipeline.
- No public upload endpoint (admin-only).
- Variant set is fixed — no custom crop sizes or responsive image pipelines.
- No CDN cache invalidation on update or delete.
- No client-side resumable upload (single multipart POST only).
- Private signed URLs are generated per-request; no pre-signed URL caching layer.
