# Security

Phase 0 implements the following security controls. This is a live reference, not a placeholder.

---

## Authentication

- Phone-first auth with password-based login and OTP-based phone verification.
- Passwords hashed with **argon2id** before storage. Raw passwords never persisted or logged.
- Access tokens are short-lived JWTs (default 15 min, signed with `AUTH_JWT_SECRET`).
- Refresh tokens are opaque UUIDs stored hashed (argon2id) in MongoDB, transported as **HttpOnly cookies** (`dragon_refresh`; `SameSite=Strict`; `Secure` in production). They never appear in JSON responses.
- Refresh token rotation: every `/refresh` call issues a new token and immediately invalidates the previous one.
- Sessions are stored server-side; invalidating a session blocks the corresponding refresh token instantly.

## CSRF Protection

- State-changing cookie-authenticated endpoints (`/api/v1/auth/refresh`) are protected by `CsrfOriginGuard`.
- The guard validates the `Origin` header (or `Referer` as fallback) against the `CORS_ALLOWED_ORIGINS` allowlist.
- Requests with no `Origin` header are permitted (server-to-server / API clients using Bearer tokens are unaffected).
- If `CORS_ALLOWED_ORIGINS` is not set (local dev / unit tests), the guard passes all requests.

## RBAC

- Permissions are named constants registered in `PermissionRegistry`.
- `PermissionGuard` enforces permissions on all admin routes.
- Role assignments are stored in MongoDB. Roles and permissions are seeded via `seed:rbac`.

## OTP Rate Limits

| Limit               | Default | Env variable                       |
| ------------------- | ------- | ---------------------------------- |
| OTP resend cooldown | 90 s    | `AUTH_OTP_RESEND_COOLDOWN_SECONDS` |
| Max OTP attempts    | 5       | `AUTH_OTP_MAX_ATTEMPTS`            |
| Daily OTP per phone | 10      | `AUTH_OTP_DAILY_PHONE_LIMIT`       |
| Daily OTP per IP    | 30      | `AUTH_OTP_IP_LIMIT`                |

Raw OTP codes are never stored — only the bcrypt hash (`codeHash`) is persisted.

## Secret Redaction

`AuditRedactor` strips all sensitive keys before audit log persistence. Redacted keys (case-insensitive, any depth): `password`, `passwordHash`, `rawOtp`, `otp`, `code`, `codeHash`, `refreshToken`, `refreshTokenHash`, `accessToken`, `accessTokenJti`, `resetToken`, `secret`, `clientSecret`, `authorization`, `cookie`, `cookies`, and others. Full list in `docs/architecture/audit.md`.

## API Input Validation

- All request bodies are validated through explicit DTO parsers with known-key allowlists.
- Unknown or forbidden fields are rejected with `400 Bad Request` before any service call.
- MongoDB ObjectIds are validated as 24-character hex strings at the DTO layer.
- Sort fields and filter values are validated against explicit allowlists.

## Sensitive Field Policy

The following fields must never appear in any API response, log payload, or error body:

- Raw OTP codes
- Password or passwordHash
- Refresh token values (JSON body — cookie transport only)
- JWT signing secrets
- Phone numbers in audit/notification payloads (masked forms only)
- Storage connection strings, bucket credentials, or internal paths

## CORS

The API allows only origins in `CORS_ALLOWED_ORIGINS` (comma-separated). Wildcard `*` is never combined with `credentials: true`.

## Secrets and Environment

`.env` files must remain local and are git-ignored. `.env.example` files contain only placeholder values. No real secrets are ever committed.

---

## Not Implemented in Phase 0

- OAuth / social login
- Passkey / WebAuthn
- TOTP / 2FA
- Email-based auth (phone-only)
- Account deletion (Phase 1)
