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
| No MediaAsset schema exists                              | `apps/api/src/content/` — no `media-asset.schema.ts` file                                       |
| No media upload endpoint exists                          | No `POST /admin/v1/media/upload` route — no controller                                          |
| No admin media UI exists                                 | No admin frontend media components                                                              |
| No real credentials committed                            | `apps/api/.env.example` — all S3 key/secret fields are empty                                    |
