# Media Security Checklist

> Task 0.7.1 — Storage abstraction only. No upload endpoint, no MediaAsset schema, no admin UI.

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

## Upload Safety — Not Yet Applicable

The following items are deferred until the media upload endpoint is implemented (Task 0.7.2+):

- [ ] MIME type validation at upload boundary
- [ ] File size limit enforcement
- [ ] Virus scan integration
- [ ] Upload rate limiting
- [ ] Admin-only upload authorization
- [ ] Presigned PUT URL expiry enforcement
- [ ] Multipart upload size guard

## Planned (Not Yet Implemented)

- [ ] Direct-to-S3 presigned upload — Later
- [ ] Multipart upload — Later
- [ ] Image variant access control — Later
- [ ] CDN cache purge on delete — Later
