# Phase 0 Security Hardening Checklist

Invariants established in Task 0.11.1. Each item must remain true after every future change.

## CORS policy

- [ ] `CORS_ALLOWED_ORIGINS` is set to explicit origin(s) in every deployed environment
- [ ] Wildcard `*` is never present in `CORS_ALLOWED_ORIGINS` (stripped automatically by `getCorsConfig`)
- [ ] `credentials: true` is combined only with explicit origin allowlists, never with `*`
- [ ] `getCorsConfig` unit tests pass (8 tests in `cors.config.spec.ts`)

## Security headers

- [ ] `SecurityHeadersMiddleware` is applied globally before all routes
- [ ] `X-Content-Type-Options: nosniff` is present in all responses
- [ ] `X-Frame-Options: DENY` is present in all responses
- [ ] `Strict-Transport-Security` includes `max-age=31536000; includeSubDomains`
- [ ] `Content-Security-Policy` is set (at minimum `default-src 'none'` for the API)
- [ ] `Referrer-Policy: no-referrer` is present in all responses
- [ ] `Permissions-Policy` is set
- [ ] `X-Powered-By` header is removed
- [ ] `SecurityHeadersMiddleware` unit tests pass (8 tests in `security-headers.middleware.spec.ts`)

## Request body size limits

- [ ] JSON body parser limit is `1mb` (set via `app.useBodyParser('json', { limit: '1mb' })`)
- [ ] URL-encoded body parser limit is `1mb`
- [ ] Oversized payloads are rejected with HTTP 413 before reaching controllers

## Token storage policy

- [ ] Access tokens are **never** stored in `localStorage` or `sessionStorage`
- [ ] No `localStorage.setItem` / `getItem` calls referencing tokens in `apps/admin`, `apps/web`, or `packages/sdk`
- [ ] Refresh tokens are transmitted only as `HttpOnly; SameSite=Strict` cookies, never in response JSON
- [ ] `TokenResponseDto` does not include a `cookieValue` or `httpOnly` field (access tokens returned in JSON body only, consumed in memory)
- [ ] Auth controller does not call `res.cookie('accessToken', ...)` or `res.cookie('access_token', ...)`

## Redaction policy

All three redactors (`AuditRedactor`, `AnalyticsRedactor`, `JobPayloadRedactor`) must:

- [ ] Perform **case-insensitive** key matching (keys lowercased before lookup)
- [ ] Redact the following keys (and their case variants): `password`, `passwordHash`, `rawOtp`, `otp`, `code`, `codeHash`, `refreshToken`, `refreshTokenHash`, `accessToken`, `accessTokenJti`, `resetToken`, `secret`, `secrets`, `clientSecret`, `providerSecret`, `providerCredentials`, `authorization`, `cookie`, `cookies`, `smsBody`, `recipientPhoneNormalized`
- [ ] Replace redacted values with the sentinel string `[REDACTED]`
- [ ] Recurse into nested objects and arrays
- [ ] Not mutate the input object
- [ ] Not include raw OTP, password, or token values in serialized output (`JSON.stringify`)

## OTP security

- [ ] `OtpChallenge` schema stores only `codeHash` (argon2id), never `rawCode` or `code`
- [ ] OTP is verified by comparing hash — raw value is never persisted
- [ ] `OtpChallenge` documents have a TTL index; expired challenges are automatically deleted

## Pagination caps

| Endpoint                | Max `limit` |
| ----------------------- | ----------- |
| Public content search   | 50          |
| Public post listing     | 50          |
| Admin audit log listing | 100         |
| Admin media listing     | 100         |

- [ ] Requests exceeding the cap throw `BadRequestException` (strict validation, not silent capping)

## ObjectId validation

- [ ] All ObjectId inputs are validated against `/^[a-f\d]{24}$/i` before use
- [ ] Empty string, non-hex, too-short, too-long, and `null` inputs are rejected with `BadRequestException`
- [ ] `validateObjectId` from `rbac/dto/rbac-validation.ts` is used consistently in RBAC DTOs
- [ ] Public search `categoryId` and `tagId` are validated before query execution

## Permission guard

- [ ] `PermissionGuard` denies by default when no `@Permissions()` metadata is present
- [ ] `PermissionGuard` denies when `permissionKeys.length === 0`
- [ ] `PermissionGuard` throws `ForbiddenException` (not just returns false)

## Public content filtering

- [ ] `PublicPostsService` always applies `status: 'published'` and `includeDeleted: false`
- [ ] `findPublishedByTypeAndSlug` is used for single-document public access (not the unconstrained `findByTypeAndSlug`)
- [ ] Draft, archived, and deleted content is never reachable via public endpoints

## Backup credential safety

- [ ] `BackupService.sanitizeError()` is called before any `logger.error()` call
- [ ] `BackupLog` schema does not contain `connectionString` or `mongoUri` fields
- [ ] MongoDB URI is never logged directly; errors are sanitized before storage or emission
- [ ] No backup download, delete, or restore endpoints exist
- [ ] `system.backup.run` permission is restricted to `super_admin` only

## Health endpoint safety

- [ ] Health responses return only `status` values (`ok`, `degraded`, `down`, `unknown`) — never raw env var values
- [ ] `HealthService` does not reference or return `MONGODB_URI`, `REDIS_HOST`, or connection strings in responses
- [ ] `process.env` values are used only as boolean conditions (configured / not configured), never as response values

## Credential hygiene

- [ ] No `.env` files are copied into Docker images
- [ ] No real credentials are committed to the repository
- [ ] `.env.*.example` files contain only `CHANGE_ME` placeholder values
- [ ] `pnpm-lock.yaml` is not modified unless a new dependency is genuinely added
