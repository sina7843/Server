# Slice 0.7 Verification

## Task 0.7.1 — Storage Abstraction and Providers

### What was built

- **`packages/types/src/constants/media.ts`** — `STORAGE_PROVIDERS`, `StorageProvider`, `StorageVisibility`
- **`packages/types/src/contracts/media.ts`** — `StoredObject`, `StorageUploadInput`, `SignedUrlOptions`
- **`apps/api/src/storage/storage.service.ts`** — `StorageService` interface, `STORAGE_SERVICE` injection token
- **`apps/api/src/storage/storage-object-key.ts`** — `generateObjectKey`, `assertSafeObjectKey`, `extensionFromMimeType`, `normalizeSafeExtension`
- **`apps/api/src/config/storage.config.ts`** — `getStorageConfig`, `StorageConfig`, `LocalStorageConfig`, `S3CompatibleStorageConfig`, `STORAGE_CONFIG`
- **`apps/api/src/storage/local/local-storage.adapter.ts`** — `LocalStorageAdapter` (upload, delete, getPublicUrl, getSignedUrl, path confinement)
- **`apps/api/src/storage/s3/s3-base.adapter.ts`** — `S3BaseAdapter` (shared S3-compatible implementation using AWS SDK v3)
- **`apps/api/src/storage/s3/minio-storage.adapter.ts`** — `MinioStorageAdapter`
- **`apps/api/src/storage/s3/arvan-s3-storage.adapter.ts`** — `ArvanS3StorageAdapter`
- **`apps/api/src/storage/storage.module.ts`** — `StorageModule` (not imported in AppModule yet — no upload endpoint)
- **Dependencies added**: `@aws-sdk/client-s3@3.799.0`, `@aws-sdk/s3-request-presigner@3.799.0`
- **`apps/api/.env.example`** — updated with storage env vars (placeholders only)
- **`infra/docker/.env.example`** — updated with `MINIO_DEFAULT_BUCKETS`

### What was NOT built (intentionally out of scope)

- No MediaAsset schema
- No media upload endpoint (`POST /admin/v1/media/upload`)
- No admin media API
- No admin media UI
- No media picker
- No image variant generation
- No content cover integration
- No TipTap inline image integration
- No avatar integration
- No direct-to-S3 presigned upload
- No multipart upload
- No video processing
- No CDN optimization
- `StorageModule` is not imported into `AppModule` — deferred to Task 0.7.2

### Verification Commands

```bash
pnpm install

pnpm --filter @dragon/types lint
pnpm --filter @dragon/types typecheck
pnpm --filter @dragon/types test
pnpm --filter @dragon/types build

pnpm --filter @dragon/api lint
pnpm --filter @dragon/api typecheck
pnpm --filter @dragon/api test
pnpm --filter @dragon/api build

pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm format:check
```

Expected: **87 API test suites, 713 API tests, 0 failures** (61 new storage tests added).

### Key Invariants to Verify

| Invariant                                                | How to verify                                                                                   |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `StorageService` interface exists                        | `apps/api/src/storage/storage.service.ts`                                                       |
| `StoredObject` contract exists                           | `packages/types/src/contracts/media.ts`                                                         |
| `StorageUploadInput` contract exists                     | `packages/types/src/contracts/media.ts`                                                         |
| `SignedUrlOptions` contract exists                       | `packages/types/src/contracts/media.ts`                                                         |
| `LocalStorageAdapter` uploads to safe local path         | `local-storage.adapter.spec.ts` — "writes the file to a path inside localRoot"                  |
| `LocalStorageAdapter` rejects path traversal             | `local-storage.adapter.spec.ts` — "rejects object keys with path traversal"                     |
| `LocalStorageAdapter` delete works safely                | `local-storage.adapter.spec.ts` — "removes an existing file" / "does not throw for nonexistent" |
| `LocalStorageAdapter` public URL is deterministic        | `local-storage.adapter.spec.ts` — "is deterministic for the same objectKey"                     |
| `LocalStorageAdapter` does not expose local path in URL  | `local-storage.adapter.spec.ts` — "does not expose the local filesystem path"                   |
| `MinioStorageAdapter` uses S3-compatible config          | `s3-storage.adapter.spec.ts` — "uses S3-compatible config shape"                                |
| `ArvanS3StorageAdapter` uses S3-compatible config        | `s3-storage.adapter.spec.ts` — "uses S3-compatible config shape (no hardcoded endpoint)"        |
| `ArvanS3StorageAdapter` does not hardcode credentials    | `s3-storage.adapter.spec.ts` — "does not hardcode credentials (uses config values)"             |
| `getSignedUrl` respects TTL input                        | `s3-storage.adapter.spec.ts` — "getSignedUrl exists and respects TTL input"                     |
| No real network calls in S3 tests                        | `s3-storage.adapter.spec.ts` — `@aws-sdk/client-s3` fully mocked                                |
| `generateObjectKey` returns randomized safe keys         | `storage-object-key.spec.ts` — "produces different keys on each call"                           |
| `generateObjectKey` does not use original filename       | `storage-object-key.spec.ts` — "does not contain the original file name"                        |
| `generateObjectKey` rejects path traversal               | `storage-object-key.spec.ts` — "rejects namespaces with path traversal"                         |
| env validation accepts valid local config                | `storage.config.spec.ts` — "accepts valid local config"                                         |
| env validation rejects missing required config for minio | `storage.config.spec.ts` — "rejects missing STORAGE_S3_ENDPOINT for minio"                      |
| env validation rejects missing required config for arvan | `storage.config.spec.ts` — "rejects missing STORAGE_S3_ENDPOINT for arvan"                      |
| No real credentials committed                            | `apps/api/.env.example` — all S3 key/secret fields are empty                                    |

---

## Task 0.7.2 — MediaAsset Persistence and Secure Upload APIs

### What was built

- **`packages/types/src/constants/media.ts`** — expanded: `MEDIA_ASSET_STATUSES`, `MEDIA_VARIANT_TYPES`, `MEDIA_VISIBILITIES`, `MEDIA_STORAGE_PROVIDERS`, `ALLOWED_MEDIA_MIME_TYPES`, `ALLOWED_MEDIA_EXTENSIONS`, `MIME_TO_EXTENSION_MAP`
- **`packages/types/src/contracts/media.ts`** — expanded: `AdminMediaAssetDto`, `AdminMediaVariantDto`, `AdminMediaListResponseDto`, `AdminMediaUploadResponseDto`, `UpdateMediaAssetDto`
- **`apps/api/src/media/media-asset.schema.ts`** — Mongoose schema with all locked fields, soft-delete, 6 indexes
- **`apps/api/src/media/media-asset.types.ts`** — `CreateMediaAssetInput`, `MediaAssetListFilter`, `UpdateMediaAssetMetadataInput`, `MediaAssetId`
- **`apps/api/src/media/media-asset.repository.ts`** — CRUD + list with pagination and filter
- **`apps/api/src/media/media-asset.service.ts`** — `create`, `findById`, `list`, `updateMetadata`, `softDelete`
- **`apps/api/src/media/media-upload.config.ts`** — `validateUploadedFile`, `getMaxFileSizeBytes`, `isAllowedMimeType`
- **`apps/api/src/media/admin-media.service.ts`** — upload pipeline, list, get, update, delete
- **`apps/api/src/media/admin-media.controller.ts`** — 5 admin routes under `AccessTokenGuard + PermissionGuard`
- **`apps/api/src/media/dto/admin-media-body.ts`** — `parseUploadMetadata`, `parseUpdateMediaBody`
- **`apps/api/src/media/dto/admin-media-query.ts`** — `parseAdminMediaListQuery`
- **`apps/api/src/media/dto/admin-media-response.ts`** — `toAdminMediaAssetDto`, `toAdminMediaListResponse`, `toAdminMediaUploadResponse`
- **`apps/api/src/media/media.module.ts`** — `MediaModule` (imports `StorageModule`)
- **`apps/api/src/app.module.ts`** — `MediaModule` imported
- **`apps/api/tsconfig.json`** — added `"multer"` to `types` array
- **`packages/sdk/src/admin-media-types.ts`** — `AdminMediaListParams`, `AdminMediaUploadParams`, `AdminMediaClient` (uses `Uint8Array` not `Buffer`)
- **`packages/sdk/src/admin-media.ts`** — `createAdminMediaClient` with 5 methods
- **`packages/sdk/src/index.ts`** — exports for `admin-media-types` and `admin-media`
- **`apps/api/.env.example`** — added `MEDIA_MAX_FILE_SIZE_BYTES`
- **`@types/multer`** installed as dev dependency in `@dragon/api`

### What was NOT built (intentionally out of scope)

- No image variant generation (Task 0.7.3)
- No `POST /admin/v1/media/:id/regenerate-variants` endpoint
- No direct-to-S3 presigned upload
- No multipart upload
- No admin media UI / media picker
- No video support
- No content cover or TipTap inline image integration

### Verification Commands

```bash
pnpm --filter @dragon/types build
pnpm --filter @dragon/api lint
pnpm --filter @dragon/api typecheck
pnpm --filter @dragon/api test
pnpm --filter @dragon/sdk typecheck
pnpm --filter @dragon/sdk test
pnpm --filter @dragon/sdk build
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm format:check
```

Expected: **90 API test suites, 763 API tests, 0 failures**.

### Key Invariants to Verify

| Invariant                                                        | How to verify                                                                            |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Upload rejects unsupported MIME type                             | `media-upload.config.spec.ts` — "rejects unsupported MIME type (video/mp4)"              |
| Upload rejects dangerous extension                               | `media-upload.config.spec.ts` — "rejects dangerous extension (.exe)"                    |
| Upload rejects extension/MIME mismatch                           | `media-upload.config.spec.ts` — "rejects extension/MIME mismatch"                       |
| Upload rejects oversized file                                    | `media-upload.config.spec.ts` — "rejects oversized files"                               |
| `safeOriginalName` strips `..` and path separators              | `media-upload.config.spec.ts` — "sanitizes safeOriginalName to not contain path separators" |
| Object key is randomized (not derived from filename)             | `admin-media.service.spec.ts` — "uses a randomized objectKey"                           |
| User cannot supply `objectKey` via body                          | `admin-media.service.spec.ts` — "does not accept user-controlled objectKey from body"   |
| SHA256 checksum is computed server-side                          | `admin-media.service.spec.ts` — "computes a SHA256 checksum"                            |
| Original variant metadata is stored                              | `admin-media.service.spec.ts` — "stores original variant metadata"                      |
| Soft delete sets `deletedAt` without hard-deleting the document  | `media-asset.schema.spec.ts` — schema field checks                                      |
| `MediaModule` is registered in `AppModule`                       | `apps/api/src/app.module.ts`                                                             |
| SDK `uploadMedia` uses `FormData` (browser-compatible)           | `admin-media.spec.ts` — "builds POST /admin/v1/media/upload with FormData body"         |
| SDK does not expose regenerate-variants or direct-S3 methods     | `admin-media.spec.ts` — "does not expose a regenerate variants method"                  |
| No real credentials committed                                    | `apps/api/.env.example` — all S3 key/secret fields empty                                |
