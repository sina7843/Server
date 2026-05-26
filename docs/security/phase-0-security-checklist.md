# Phase 0 Security Checklist

Final security verification for Phase 0. All items must be reviewed before Phase 1 begins.

This document references and extends the domain-specific security checklists under `docs/security/`.

---

## Related domain security docs

- [auth-security-checklist.md](auth-security-checklist.md) — Auth, OTP, session
- [rbac-checklist.md](rbac-checklist.md) — RBAC and permission guard
- [content-security-checklist.md](content-security-checklist.md) — Content lifecycle and sanitization
- [media-security-checklist.md](media-security-checklist.md) — Upload validation and storage
- [audit-security-checklist.md](audit-security-checklist.md) — Audit log and redaction
- [jobs-notifications-security-checklist.md](jobs-notifications-security-checklist.md) — Jobs and notifications
- [search-analytics-security-checklist.md](search-analytics-security-checklist.md) — Search and analytics
- [backup-security-checklist.md](backup-security-checklist.md) — Backup and restore
- [admin-security-checklist.md](admin-security-checklist.md) — Admin access control
- [profile-privacy-checklist.md](profile-privacy-checklist.md) — Profile visibility
- [security-hardening-checklist.md](security-hardening-checklist.md) — Task 0.11.1 hardening pass

---

## Auth and session

- [ ] Refresh token is set as HttpOnly cookie (`dragon_refresh`) — not in response body
- [ ] Refresh token cookie has `Secure` flag (HTTPS only)
- [ ] Refresh token cookie has `SameSite=Strict`
- [ ] Access token is NOT set as any cookie — transport via `Authorization: Bearer` header only
- [ ] Access token is NOT stored in localStorage (frontend stores in memory only)
- [ ] Access token appears in API response only in the explicit `TokenResponseDto` (login/refresh)
- [ ] Refresh token is rotated on every use — old token is invalidated
- [ ] Session revocation via `DELETE /api/v1/auth/sessions/:sessionId` works immediately
- [ ] `POST /api/v1/auth/logout-all` revokes all sessions for the user
- [ ] JWT is signed with HS256 using `AUTH_JWT_SECRET` (min 64 chars in production)
- [ ] Auth error messages are generic — no enumeration of account existence

---

## OTP

- [ ] Raw OTP code is never stored — only `codeHash` (bcrypt) is persisted in MongoDB
- [ ] Raw OTP code is never returned in any API response
- [ ] Raw OTP code is never written to audit logs, job logs, notification logs, or analytics
- [ ] OTP attempt limit is enforced (`AUTH_OTP_MAX_ATTEMPTS`, default 5)
- [ ] OTP resend cooldown is enforced (`AUTH_OTP_RESEND_COOLDOWN_SECONDS`, default 90)
- [ ] Daily per-phone OTP limit is enforced (`AUTH_OTP_DAILY_PHONE_LIMIT`, default 10)
- [ ] Daily per-IP OTP limit is enforced (`AUTH_OTP_IP_LIMIT`, default 30)
- [ ] OTP TTL is enforced — expired OTP codes are rejected (`AUTH_OTP_TTL_SECONDS`, default 300)
- [ ] Password reset token TTL is enforced (`AUTH_PASSWORD_RESET_TOKEN_TTL_SECONDS`, default 600)

---

## Authorization

- [ ] All admin routes (`/admin/v1/*`) require authentication — missing token → 401
- [ ] All admin routes with `@RequirePermission()` deny access without the named permission → 403
- [ ] `PermissionGuard` denies by default — routes without `@RequirePermission` cannot be accessed by non-super-admin
- [ ] `super_admin` is resolved via permission lookup — not a hardcoded bypass flag
- [ ] `super_admin` role cannot be assigned via the API (`isAssignable: false`)
- [ ] Users can only manage their own sessions — not other users' sessions
- [ ] Users can only read and update their own profile via `/api/v1/me/*`

---

## Public data safety

- [ ] Draft content (`status: draft`) is never returned on public content list or slug routes
- [ ] Archived content (`status: archived`) is never returned on public routes
- [ ] Soft-deleted content is never returned on public routes
- [ ] Private profiles (`isPublic: false`) return 404 on `GET /api/v1/u/:username`
- [ ] Banned/suspended accounts return 404 on public profile route
- [ ] Public search (`GET /api/v1/search/content`) returns only published content
- [ ] Public content search limit is capped at 50 — requests above cap return 400

---

## Upload and media

- [ ] MIME type is validated against an allowlist before any file processing
- [ ] File extension is validated against an allowlist (without leading dot) before storage
- [ ] Both MIME and extension must pass — file with valid MIME but wrong extension is rejected
- [ ] Upload size limit is enforced via NestJS interceptor (`MEDIA_MAX_FILE_SIZE_BYTES`)
- [ ] JSON body size limit is enforced (`1mb` via `useBodyParser`)
- [ ] Stored files use randomized object keys — not the original filename
- [ ] Private media assets are served only via signed URLs with TTL
- [ ] No public media upload endpoint exists — upload is admin-only

---

## Security headers and CORS

- [ ] `X-Content-Type-Options: nosniff` is present on all API responses
- [ ] `X-Frame-Options: DENY` is present
- [ ] `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` is present
- [ ] `Content-Security-Policy: default-src 'none'` is present
- [ ] `Referrer-Policy: no-referrer` is present
- [ ] `Permissions-Policy: camera=(), microphone=(), geolocation=()` is present
- [ ] `X-Powered-By` header is removed
- [ ] CORS allows only origins in `CORS_ALLOWED_ORIGINS` — wildcard `*` is rejected
- [ ] CORS does not use `*` with `credentials: true`
- [ ] `X-Robots-Tag: noindex,nofollow,noarchive` is set on all admin (`admin.YOUR_DOMAIN`) responses

---

## Redaction and log safety

- [ ] Audit log entries do not contain passwords, OTP codes, refresh tokens, access tokens, or raw phone numbers
- [ ] Audit redactor is case-insensitive — `Password`, `PASSWORD`, `password` all redacted
- [ ] Job payload redactor is case-insensitive — mixed-case sensitive keys are redacted
- [ ] Analytics aggregations do not contain raw OTP codes, IP addresses, or phone numbers
- [ ] Notification logs expose only `recipientMasked` (last digits) — not full phone numbers
- [ ] SMS body text is never returned in any API response or log entry

---

## Backup and restore

- [ ] Backup log entries do not contain `MONGODB_URI`, connection strings, passwords, or bucket credentials
- [ ] Backup errors are sanitized before logging (`sanitizeError` is called)
- [ ] `GET /admin/v1/system/backups/restore` returns 404 — no restore endpoint exists
- [ ] `POST /admin/v1/system/backups/restore` returns 404
- [ ] `GET /admin/v1/system/backups/download` returns 404 — no download endpoint exists
- [ ] No restore button exists in the admin UI
- [ ] `system.backup.run` permission is granted to `super_admin` only (not to `admin` role)
- [ ] Backup artifacts are stored off-server (Arvan Object Storage)
- [ ] **Backup encryption is NOT implemented in Phase 0** — risk must be accepted or encryption implemented before production

---

## Secrets and environment

- [ ] `infra/docker/.env.production` is gitignored and not committed
- [ ] No `.env.example` file contains real credentials
- [ ] No Dockerfile copies any `.env*` file (enforced by `.dockerignore`)
- [ ] `AUTH_JWT_SECRET` in production is at least 64 random characters
- [ ] `STORAGE_S3_ACCESS_KEY_ID` and `STORAGE_S3_SECRET_ACCESS_KEY` are not committed
- [ ] Health endpoint responses never include `MONGODB_URI`, Redis password, or storage credentials

---

## Known accepted risks (Phase 0)

The following risks are accepted for Phase 0 and must be addressed before or during Phase 1:

| Risk                                             | Status                                           |
| ------------------------------------------------ | ------------------------------------------------ |
| Backup archives are unencrypted                  | Accepted — encryption required before production |
| No monitoring stack (Prometheus/Grafana/Loki)    | Accepted — health endpoints + logs only          |
| MongoDB/Redis in same-VPS Docker containers      | Accepted — no managed DB service                 |
| No automated backup scheduling                   | Accepted — manual trigger only                   |
| No rate limiting on all routes (only OTP routes) | Accepted — application-level OTP limits          |
| No WAF or DDoS protection                        | Accepted — VPS-level only                        |
| Single-VPS deployment with no redundancy         | Accepted — Phase 1 to address                    |

---

## Sign-off

| Field          | Value                                  |
| -------------- | -------------------------------------- |
| Reviewed by    |                                        |
| Date           |                                        |
| Overall result | PASS / FAIL / PASS WITH ACCEPTED RISKS |
| Accepted risks |                                        |
| Open items     |                                        |
