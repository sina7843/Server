# Auth Architecture — Slice 0.2

## Scope

Slice 0.2 implements the Dragon Ecosystem Auth / OTP / Session foundation inside the API app. It covers phone-first account registration, phone verification with SMS OTP, password login, refresh token rotation, logout/logout-all, password reset with OTP, a minimal authenticated `/me` endpoint, current-user session list/revoke, and a callable cleanup foundation.

The slice is intentionally backend-focused. It does not include UI screens, admin workflows, RBAC, Profile, real SMS provider integration, queues, production scheduling, or production deployment.

## Implemented capabilities

Slice 0.2 includes these API Auth capabilities:

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/verify-phone`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/logout-all`
- `POST /api/v1/auth/password/forgot`
- `POST /api/v1/auth/password/verify-reset-otp`
- `POST /api/v1/auth/password/reset`
- `GET /api/v1/auth/me`
- `GET /api/v1/auth/sessions`
- `DELETE /api/v1/auth/sessions/:sessionId`

It also includes persistence foundations for users, sessions, OTP challenges, notification logs, and cleanup operations.

## Primary identity

The primary identity for Slice 0.2 is the phone number. Phone numbers are normalized before lookup and persistence.

Email exists only as an optional secondary field on the user persistence model. Email is not a primary Auth feature in Slice 0.2, and no email-based login or email reset flow is implemented.

## User lifecycle

Registration creates or reuses a pending verification user. A pending user becomes active only after successful phone verification.

The supported user statuses are:

- `pending_verification`
- `active`
- `suspended`
- `banned`
- `deleted`

Only active, phone-verified users can login, refresh tokens, access `/me`, and manage their own sessions. Blocked or deleted statuses are rejected safely without exposing sensitive account state.

## OTP lifecycle

OTP challenges support these purposes:

- `phone_verification`
- `password_reset`
- `sensitive_action`
- `admin_step_up`

Slice 0.2 implements phone verification and password reset usage only. Sensitive action and admin step-up values exist structurally but no flow is implemented for them.

OTP codes are never stored raw. OTP verification enforces expiration, consumed state, and max attempts. OTP creation for phone verification and password reset enforces the configured per-phone and per-IP abuse limits. Auth request metadata such as IP, user agent, and request id is stored on OTP challenges when available. Expired OTP records are TTL-aware, and cleanup behavior remains conservative.

## Session and refresh token model

Login creates a session and returns a `TokenResponseDto` in the JSON body (`accessToken`, `tokenType`, `expiresIn`). The refresh token is **not** in the JSON body — it is set as an `HttpOnly` cookie (`dragon_refresh`; `SameSite=Strict`; `Secure` in production). Only the refresh token hash is stored in MongoDB.

Refresh reads the `dragon_refresh` cookie (no request body required) and rotates the refresh token using a conditional atomic update that requires the submitted refresh-token hash to still match the session. The old refresh token stops working immediately after rotation, and stale or replayed refresh tokens cannot rotate twice. A new `dragon_refresh` cookie is set in the rotation response. Access token claims remain minimal and do not include phone, password hashes, roles, permissions, profile data, or status reasons.

Logout and logout-all clear the `dragon_refresh` cookie.

## Password reset flow

Password reset uses SMS OTP. Forgot-password responses are generic to reduce account enumeration risk.

After a valid password reset OTP is verified, the API issues a short-lived reset token. Resetting the password updates the password hash and revokes all sessions for that user. The reset flow does not auto-login the user and does not return login tokens.

## Authentication guard

Slice 0.2 includes an authentication-only access token guard. The guard verifies a bearer access token, checks the minimal claims, validates the token JTI against the active session state, loads the current user, enforces active status, and attaches a minimal auth context to the request.

The guard is not an RBAC guard. It does not check roles, permissions, or policy rules, and it does not attach a full user document or profile data to the request.

## Session management

Current users can list their own sessions and revoke one of their own sessions by id. Session responses expose safe metadata only.

Session list/revoke is user-owned session management only. There is no admin session management in Slice 0.2.

## Cleanup foundation

Slice 0.2 includes a callable cleanup foundation for:

- pending unverified users older than the default or caller-provided threshold
- expired unconsumed OTP challenges are marked consumed while the TTL index remains responsible for eventual removal
- expired unrevoked sessions are marked revoked with reason `expired`

The cleanup foundation is registered in `AuthModule` and exposes a callable `runAuthCleanup` method. It has no public endpoint, scheduler, cron, BullMQ queue, Redis queue, worker loop, monitoring stack, or production automation in this slice.

## Security boundaries

Slice 0.2 keeps these boundaries:

- raw OTP codes are not stored
- raw passwords are not stored
- raw refresh tokens are not stored
- the refresh token is transported as an HttpOnly cookie only — never in the JSON response body
- sensitive response bodies avoid password hashes, token hashes, roles, permissions, profile data, and session internals
- SMS is sent only through the provider abstraction
- the current provider is mock-only
- notification logs store masked and hashed recipient data, not raw recipient values
- cleanup returns counts only
- refresh rotation uses an atomic conditional session update
- access token JTI is validated against the active session

## Not implemented in Slice 0.2

The following are not implemented in Slice 0.2:

- RBAC or ABAC enforcement
- role assignment
- permission model
- permission decorators
- Profile or UserProfile
- Admin dashboard
- admin user management
- admin session management
- Content
- Media
- Audit viewer
- Notification center
- Search
- Analytics
- OAuth
- passwordless OTP login
- passkeys
- full TOTP/2FA enrollment
- real SMS provider integration
- Redis queues
- BullMQ processors
- worker scheduling
- production deployment
- backup
- monitoring
- Nuxt auth screens
