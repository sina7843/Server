# Auth / Session — API Reference

Phase 0 uses **phone-first authentication** with OTP-based verification and password-based login.

---

## Auth flow overview

```
register(phone) → OTP sent via SMS
verify-phone(phone, code) → account activated
login(phone, password) → accessToken (Bearer) + refreshToken (HttpOnly cookie)
         ↓
  [use API with Bearer accessToken]
         ↓
refresh(refreshToken) → rotated accessToken + refreshToken
         ↓
logout() → session revoked
```

---

## Registration and phone verification

### POST `/api/v1/auth/register`

Registers a new account and triggers OTP delivery to the phone number.

**Request body:**

```json
{ "phone": "+989121234567", "password": "..." }
```

- Phone must be E.164 format.
- Password is required at registration; minimum length governed by `AUTH_PASSWORD_MIN_LENGTH` (default 8).
- If the phone is already registered and active, registration is rejected.

**Response `200`:** `AuthGenericResponseDto`

```json
{ "success": true, "message": "OTP sent" }
```

**Errors:** `400` invalid phone format · `429` rate limit exceeded (daily per-phone limit, IP limit)

---

### POST `/api/v1/auth/verify-phone`

Submits the OTP received by SMS to verify the phone and activate the account.

**Request body:**

```json
{ "phone": "+989121234567", "code": "123456" }
```

**Response `200`:** `AuthGenericResponseDto`

```json
{ "success": true, "message": "Phone verified" }
```

**Errors:** `400` wrong code or expired OTP · `429` too many attempts

---

## Login

### POST `/api/v1/auth/login`

Returns tokens for a verified, active account.

**Request body:**

```json
{ "phone": "+989121234567", "password": "..." }
```

**Response `200`:** `TokenResponseDto`

```json
{
  "accessToken": "<jwt>",
  "expiresIn": 900,
  "tokenType": "Bearer"
}
```

The refresh token is set as an **HttpOnly cookie** (`dragon_refresh`). It is NOT in the JSON body.

**Errors:** `400` wrong password or invalid input · `401` account not found or inactive · `403` account banned/suspended

---

### POST `/api/v1/auth/refresh`

Rotates the access token and refresh token. Both tokens are invalidated and replaced.

**Request:** No body required. The `dragon_refresh` HttpOnly cookie is read automatically by the browser (or must be sent as a `Cookie` header by non-browser clients).

**Response `200`:** `TokenResponseDto` (same shape as login). A new `dragon_refresh` cookie is set.

**Errors:** `401` token invalid, expired, or session revoked

---

## Session management

### GET `/api/v1/auth/sessions` — Bearer required

Lists all active sessions for the authenticated user.

**Response `200`:** `AuthSessionsResponseDto`

```json
{
  "sessions": [
    {
      "id": "<sessionId>",
      "userAgent": "...",
      "ip": "...",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "lastUsedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### DELETE `/api/v1/auth/sessions/:sessionId` — Bearer required

Revokes a specific session. The user can only revoke their own sessions.

**Response `200`:** `AuthGenericResponseDto`

---

### POST `/api/v1/auth/logout` — Bearer required

Revokes the current session only.

**Request body:** `{}` (empty)

**Response `200`:** `AuthGenericResponseDto`

---

### POST `/api/v1/auth/logout-all` — Bearer required

Revokes all sessions for the authenticated user.

**Request body:** `{}` (empty)

**Response `200`:** `AuthGenericResponseDto`

---

## Current identity

### GET `/api/v1/auth/me` — Bearer required

Returns the authenticated user's identity.

**Response `200`:** `MeResponseDto`

```json
{
  "userId": "<id>",
  "phone": "+989121234567",
  "status": "active",
  "roles": ["user"]
}
```

---

## Password reset flow

### POST `/api/v1/auth/password/forgot`

Sends a password-reset OTP to the phone.

**Request body:** `{ "phone": "+989121234567" }`

**Response `200`:** `AuthGenericResponseDto` (same message regardless of whether phone exists — generic to prevent enumeration)

**Rate limits:** same daily per-phone and per-IP OTP limits as registration.

---

### POST `/api/v1/auth/password/verify-reset-otp`

Verifies the reset OTP and returns a short-lived reset token.

**Request body:** `{ "phone": "+989121234567", "code": "123456" }`

**Response `200`:** `VerifyResetOtpResponseDto`

```json
{ "resetToken": "<short-lived-token>" }
```

The reset token TTL is configured by `AUTH_PASSWORD_RESET_TOKEN_TTL_SECONDS` (default 600 s).

---

### POST `/api/v1/auth/password/reset`

Sets a new password. Consumes and invalidates the reset token.

**Request body:** `{ "resetToken": "<token>", "newPassword": "<new>" }`

**Response `200`:** `AuthGenericResponseDto`

---

## Access token lifecycle

| Property     | Value                                                         |
| ------------ | ------------------------------------------------------------- |
| Format       | JWT (HS256), signed with `AUTH_JWT_SECRET`                    |
| TTL          | `AUTH_ACCESS_TOKEN_TTL_SECONDS` (default 900 s = 15 min)      |
| Transport    | `Authorization: Bearer <token>` header                        |
| Storage rule | **Must not be stored in localStorage** — store in memory only |

---

## Refresh token lifecycle

| Property     | Value                                                                  |
| ------------ | ---------------------------------------------------------------------- |
| Format       | Opaque token (UUID), stored hashed in MongoDB                          |
| TTL          | `AUTH_REFRESH_TOKEN_TTL_DAYS` (default 30 days)                        |
| Transport    | HttpOnly cookie (`dragon_refresh`; SameSite=Strict; Secure)            |
| Storage rule | **HttpOnly only** — not readable by JavaScript                         |
| Rotation     | Every refresh call issues a new token and invalidates the previous one |

---

## Rate limits and abuse protection

| Limit               | Default | Env variable                       |
| ------------------- | ------- | ---------------------------------- |
| OTP resend cooldown | 90 s    | `AUTH_OTP_RESEND_COOLDOWN_SECONDS` |
| Max OTP attempts    | 5       | `AUTH_OTP_MAX_ATTEMPTS`            |
| Daily OTP per phone | 10      | `AUTH_OTP_DAILY_PHONE_LIMIT`       |
| Daily OTP per IP    | 30      | `AUTH_OTP_IP_LIMIT`                |
| Password min length | 8       | `AUTH_PASSWORD_MIN_LENGTH`         |

---

## Security invariants

- OTP raw codes are never stored — only `codeHash` (bcrypt) is persisted.
- OTP codes, passwords, and tokens never appear in API responses or audit log payloads.
- Error messages are generic: `401 Unauthorized` or `400 Bad Request` with non-enumerable messages.
- Sessions are stored server-side; invalidating a session immediately blocks the refresh token.
- `x-request-id` header is echoed on all responses (assigned by the API if not supplied).

---

## Not implemented in Phase 0

- OAuth / social login (Google, GitHub, etc.)
- Passkey / WebAuthn
- TOTP / 2FA
- Email-based auth (phone-only)
- Account deletion (Phase 1)
