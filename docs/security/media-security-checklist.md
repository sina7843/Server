# Media Security Checklist

> Tasks 0.7.1 and 0.7.2 — Storage abstraction and media upload API.

## Object Key Safety (Task 0.7.1 ✓)

- [x] Object keys are backend-generated and randomized — never derived from user-supplied file names
- [x] `generateObjectKey` uses `randomUUID()` — no sequential or predictable keys
- [x] Extension is derived from MIME type via a controlled allowlist — never from user input
- [x] Path traversal (`..`) is rejected in object keys
- [x] Backslash is rejected in object keys
- [x] Null bytes are rejected in object keys
- [x] Absolute paths (starting with `/`) are rejected in object keys
- [x] `assertSafeObjectKey` is called in every adapter operation (upload, delete, getPublicUrl, getSignedUrl)
- [x] Local adapter additionally checks that the resolved path stays inside `localRoot` (path confinement)

## Secret Handling (Task 0.7.1 ✓)

- [x] No real credentials committed to repository
- [x] `.env.example` contains placeholders only — empty values for S3 key/secret
- [x] S3 credentials come from environment variables at runtime — never hardcoded
- [x] `STORAGE_S3_SECRET_ACCESS_KEY` is not logged or exposed in any response or error message
- [x] Arvan adapter does not hardcode the Arvan endpoint — comes from `STORAGE_S3_ENDPOINT`

## Local Adapter Safety (Task 0.7.1 ✓)

- [x] Local adapter resolves all paths relative to `localRoot` using `path.resolve`
- [x] Local adapter verifies the resolved path starts with `localRoot + path.sep` before writing
- [x] Local public URL does not expose the local filesystem path (uses configured `localPublicBaseUrl`)
- [x] `fs.rm({ force: true })` is used for delete — does not throw on missing files
- [x] Local adapter is documented as dev/fallback only — not production recommendation

## S3 Adapter Safety (Task 0.7.1 ✓)

- [x] S3 client is initialized with environment-supplied credentials only
- [x] Signed URL TTL is enforced — configurable, bounded, passed to `getSignedUrl`
- [x] `STORAGE_S3_FORCE_PATH_STYLE` is configurable — required for MinIO path-style access
- [x] No real network calls in unit tests — `@aws-sdk/client-s3` is fully mocked in specs
- [x] Public URL for private objects is not included in `StoredObject.publicUrl` (conditional)

## Upload Safety (Task 0.7.2 ✓)

- [x] MIME type validated against allowlist (`image/jpeg`, `image/png`, `image/webp`, `image/gif`)
- [x] File extension validated — must match MIME type; extension-only allowlist enforced
- [x] Extension/MIME mismatch rejected (e.g. `photo.jpg` with `image/png` MIME)
- [x] File size limit enforced via multer `limits.fileSize` and `MEDIA_MAX_FILE_SIZE_BYTES`
- [x] Admin-only upload authorization — `AccessTokenGuard` + `PermissionGuard(media.asset.upload)` on upload route
- [x] Object key is backend-generated — user cannot supply an `objectKey` in the request body
- [x] `safeOriginalName` strips path separators (`/`, `\`) and `..` sequences — stored as metadata only, never used in key generation
- [x] SHA256 checksum computed server-side — no client-supplied checksum accepted
- [x] Soft delete only — hard delete not exposed; `deletedAt` is set; documents remain in DB
- [x] Private media URLs use signed URLs with configurable TTL — not permanent public links
- [x] Signed URL generation failure degrades to public URL with a warning log, not a 500

## Limitations / Known Gaps

- [ ] No virus scan / malware detection at upload boundary — deferred
- [ ] No upload rate limiting (beyond auth guards) — deferred
- [ ] No multipart upload size guard — deferred (multipart not implemented)
- [ ] MIME sniffing not used — MIME type is accepted from multipart header; extension/MIME mismatch is the primary control
- [ ] Image processing (dimension extraction, variants) — Task 0.7.3

## Planned (Not Yet Implemented)

- [ ] Direct-to-S3 presigned upload — Later
- [ ] Multipart upload — Later
- [ ] Image variant access control — Task 0.7.3
- [ ] CDN cache purge on delete — Later
