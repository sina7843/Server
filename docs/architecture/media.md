# Media Architecture — Slice 0.7

## Status

Task 0.7.1 — Storage abstraction and providers — **Complete**
Task 0.7.2 — MediaAsset persistence and secure upload APIs — **Complete**
Task 0.7.3 — Image processing and variants — **Complete**

Not yet implemented (Later tasks):

- Admin media UI / media picker
- Content cover integration / TipTap inline image
- Direct-to-S3 presigned upload
- Multipart upload
- Video processing / transcoding
- CDN optimization / cache invalidation

---

## Storage Layer (Task 0.7.1)

### Provider model

| Provider | Purpose               | Production ready     |
| -------- | --------------------- | -------------------- |
| `arvan`  | Arvan Object Storage  | Yes (Phase 0 target) |
| `minio`  | MinIO (S3-compatible) | Local dev only       |
| `local`  | Local filesystem      | Dev/fallback only    |

**Arvan Object Storage** (S3-compatible API, `ir-thr-at1` region) is the production-ready direction for Phase 0.

**MinIO** is the local development substitute — same S3-compatible API, runs in Docker.

**Local disk** is a dev/fallback adapter only. Do not use in production.

### StorageService interface

```ts
interface StorageService {
  upload(input: StorageUploadInput): Promise<StoredObject>;
  delete(objectKey: string): Promise<void>;
  getPublicUrl(objectKey: string): string;
  getSignedUrl(objectKey: string, options?: SignedUrlOptions): Promise<string>;
}
```

### StoredObject contract

```ts
interface StoredObject {
  provider: 'local' | 'minio' | 'arvan';
  bucket: string;
  objectKey: string;
  mimeType?: string;
  sizeBytes?: number;
  etag?: string;
  checksum?: string;
  publicUrl?: string;
}
```

### StorageUploadInput contract

```ts
interface StorageUploadInput {
  objectKey: string;
  body: Buffer | Uint8Array | NodeJS.ReadableStream;
  mimeType: string;
  sizeBytes?: number;
  metadata?: Record<string, string>;
  visibility?: 'public' | 'private';
}
```

### Adapter hierarchy

```
StorageService (interface)
├── LocalStorageAdapter          — dev/fallback only
├── S3BaseAdapter (abstract)     — shared S3 logic
│   ├── MinioStorageAdapter      — local dev
│   └── ArvanS3StorageAdapter    — production
```

Both MinIO and Arvan adapters share `S3BaseAdapter` which uses AWS SDK v3 (`@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`).

### Object key generation

Object keys are **backend-generated and randomized** — never derived from original file names.

Format:

```
media/original/<yyyy>/<mm>/<uuid-hex>[.<ext>]
media/variants/<yyyy>/<mm>/<uuid-hex>-<suffix>[.<ext>]
```

Rules enforced:

- No user-controlled path segments
- No path traversal (`..`, backslash, null byte, absolute paths)
- Extension derived from MIME type via allowlist — never from user input
- Uses `randomUUID()` for collision resistance

### StorageModule

`StorageModule` is defined at `apps/api/src/storage/storage.module.ts` and is imported into `AppModule` via `MediaModule`.

### Configuration

Environment variables (see `apps/api/.env.example`):

| Variable                         | Required for | Default (local)                 |
| -------------------------------- | ------------ | ------------------------------- |
| `STORAGE_PROVIDER`               | all          | —                               |
| `STORAGE_BUCKET`                 | all          | —                               |
| `STORAGE_PUBLIC_BASE_URL`        | all          | —                               |
| `STORAGE_SIGNED_URL_TTL_SECONDS` | all          | 3600                            |
| `STORAGE_LOCAL_ROOT`             | local        | `/tmp/dragon-storage`           |
| `STORAGE_LOCAL_PUBLIC_BASE_URL`  | local        | `http://localhost:3000/storage` |
| `STORAGE_S3_ENDPOINT`            | minio, arvan | —                               |
| `STORAGE_S3_REGION`              | minio, arvan | —                               |
| `STORAGE_S3_ACCESS_KEY_ID`       | minio, arvan | —                               |
| `STORAGE_S3_SECRET_ACCESS_KEY`   | minio, arvan | —                               |
| `STORAGE_S3_FORCE_PATH_STYLE`    | minio        | `false`                         |

**Secrets (`STORAGE_S3_ACCESS_KEY_ID`, `STORAGE_S3_SECRET_ACCESS_KEY`) must only exist in the deployment environment. Never commit real credentials.**

---

---

## Media API (Task 0.7.2)

### Endpoints

| Method   | Path                     | Permission           | Description                   |
| -------- | ------------------------ | -------------------- | ----------------------------- |
| `GET`    | `/admin/v1/media`        | `media.asset.read`   | List assets (paginated)       |
| `POST`   | `/admin/v1/media/upload` | `media.asset.upload` | Upload a new asset            |
| `GET`    | `/admin/v1/media/:id`    | `media.asset.read`   | Get single asset by ID        |
| `PATCH`  | `/admin/v1/media/:id`    | `media.asset.update` | Update visibility/alt/caption |
| `DELETE` | `/admin/v1/media/:id`    | `media.asset.delete` | Soft delete                   |

All routes require a valid access token and the listed permission.

### Upload constraints

- Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`, `image/gif`
- Extension must match MIME type (jpeg/jpg both accepted for `image/jpeg`)
- Maximum file size: configurable via `MEDIA_MAX_FILE_SIZE_BYTES` (default 10 MB)
- Object key is backend-generated (randomized) — never derived from filename
- SHA256 checksum computed from uploaded buffer and stored

### MediaAsset schema

Fields: `originalName`, `fileName`, `mimeType`, `extension`, `sizeBytes`, `storageProvider`, `bucket`, `objectKey`, `visibility`, `variants[]`, `width?`, `height?`, `alt?`, `caption?`, `uploadedBy`, `status`, `checksum?`, `deletedAt?`, timestamps.

- **Soft delete only** — `deletedAt` is set; document stays in DB
- **`variants[]`** — array of `{ type, objectKey, width?, height?, sizeBytes?, mimeType? }`; original variant stored at upload time
- **Status lifecycle**: `processing → ready | failed` — non-GIF uploads start as `processing`, become `ready` after variant generation (or `failed` if processing throws). GIFs go directly to `ready`.

### URL resolution

- Public assets: `storageService.getPublicUrl(objectKey)`
- Private assets: `storageService.getSignedUrl(objectKey)` (falls back to public URL on error, with warning log)

### SDK

`createAdminMediaClient(client)` in `@dragon/sdk` provides:

```ts
client.listMedia(params?)
client.uploadMedia(params)         // FormData, browser-compatible (Blob | Uint8Array)
client.getMedia(id)
client.updateMedia(id, input)
client.regenerateVariants(id)      // POST :id/regenerate-variants
client.deleteMedia(id)
```

---

---

## Image Processing (Task 0.7.3)

### Variant generation

Thumbnail (max 320px) and medium (max 1280px) variants are generated synchronously during upload using `sharp`:

- **GIF**: no variants generated; status set to `ready` immediately.
- **Other images**: status starts as `processing`; variants are generated and uploaded; status becomes `ready` or `failed`.

Only generates a variant if the original is larger than the target dimension (e.g. a 200px image gets no thumbnail).

Variant object keys use the format `media/variants/<type>/<yyyy>/<mm>/<uuid>.<ext>`.

### `POST /admin/v1/media/:id/regenerate-variants`

Requires `media.asset.regenerate` permission. Downloads the original from storage, re-runs the processing pipeline, replaces existing non-original variants, and updates the asset record. GIFs return immediately without processing.

### `StorageService.download`

Added `download(objectKey: string): Promise<Buffer>` to the `StorageService` interface:

- `LocalStorageAdapter`: reads from disk.
- `S3BaseAdapter`: uses `GetObjectCommand` + `transformToByteArray()`.

---

## Later — Not Yet Implemented

- **Direct-to-S3 presigned upload**: client uploads directly to S3; backend issues a short-lived presigned PUT URL. Deferred.
- **Multipart upload**: for large files. Deferred.
- **Admin media UI / media picker**: Deferred.
- **Video processing / transcoding**: Out of scope.
