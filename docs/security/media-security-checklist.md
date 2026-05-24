# Media Security Checklist

> Tasks 0.7.1–0.7.8 — Storage abstraction, media upload API, image processing, admin media UI, avatar integration, security closeout, and content integration.

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

## Route and UI Permission Safety (Tasks 0.7.4 and 0.7.7 ✓)

- [x] Admin media pages (`/media`, `/media/upload`, `/media/:id`) protected with `['admin-auth-required', 'admin-permission-required']` route middleware and `requiredPermission` meta
- [x] `MediaPickerDialog` upload tab hidden (not just disabled) when user lacks `MEDIA_ASSET_UPLOAD` permission — enforced via `useAdminPermissions()` composable
- [x] No manual `mediaId` input in any UI — media assets are always selected via `MediaPickerDialog` or uploaded through the standard upload flow

## Image Node and mediaRefs Safety (Tasks 0.7.7 and 0.7.8 ✓)

- [x] TipTap `image` nodes require a valid `mediaId` (24-char hex ObjectId) — backend rich-text validator rejects image nodes without a valid `mediaId`
- [x] Image `src` in TipTap bodyJson must be http/https — validator rejects javascript:, data:, and relative URLs
- [x] `<img>` tags in bodyHtml are allowed only with safe src (http/https); unsafe srcs (javascript:, data:, relative) are converted to `<span>` by the HTML sanitizer
- [x] `data-media-id` on `<img>` is preserved only when it is a valid 24-char hex ObjectId — invalid values are stripped by the sanitizer
- [x] `data-alignment` on `<img>` is preserved only when it matches the allowlist (left/center/right/full) — invalid values are stripped
- [x] `data-caption` on `<img>` is preserved only when within 1000-character limit — longer values are stripped
- [x] `mediaRefs` array is computed from coverMediaId (usage=cover) and inline image nodes (usage=inline) on every create and update — deduplicated by `mediaId+usage`
- [x] `coverMediaId` is validated as a 24-char hex ObjectId on both create and update DTO parsing — invalid values return 400, not 500

## Avatar Security (Task 0.7.5 and 0.7.6 ✓)

- [x] Avatar upload path goes through `MediaUploadPipeline` — same validation, storage, and variant generation as admin media upload
- [x] `avatarMediaId` cannot be set via `PATCH /api/v1/me/profile` — field is forbidden and rejected with 400
- [x] Private avatar media does not leak public URL — `resolveAvatarUrls` returns `undefined` for private assets

## Image Content Verification (Task 0.7.6 ✓)

- [x] `validateImageContent()` verifies file bytes using `sharp` before storage — rejects fake images (e.g. text file with `.jpg` extension)
- [x] Private media signed URL failure does not fall back to public URL — returns `''` with a warning log

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
