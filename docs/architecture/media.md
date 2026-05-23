# Media Architecture — Slice 0.7

## Status

Task 0.7.1 — Storage abstraction and providers — **Complete**

Not yet implemented (Later tasks):

- MediaAsset schema and persistence
- Media upload endpoint (`POST /admin/v1/media/upload`)
- Admin media UI / media picker
- Image variant generation
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

`StorageModule` is defined at `apps/api/src/storage/storage.module.ts` but is **not imported into `AppModule`** until a media upload endpoint exists (Task 0.7.2+).

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

## Later — Not Yet Implemented

- **Direct-to-S3 presigned upload**: client uploads directly to S3; backend issues a short-lived presigned PUT URL. Not implemented — deferred.
- **Multipart upload**: for large files. Not implemented — deferred.
- **MediaAsset schema**: MongoDB document tracking uploaded assets. Not implemented — Task 0.7.2+.
- **Media upload endpoint**: `POST /admin/v1/media/upload`. Not implemented — Task 0.7.2+.
- **Image variants**: thumbnail, webp conversion. Not implemented — deferred.
- **Admin media UI / media picker**: Not implemented — deferred.
