# Auth Security Checklist — Slice 0.2

## Sensitive data handling

- [ ] Raw passwords are never stored.
- [ ] Password hashes are never returned in API responses.
- [ ] Raw OTP codes are never stored.
- [ ] OTP hashes are never returned in API responses.
- [ ] Raw refresh tokens are never stored.
- [ ] Refresh token hashes are never returned in API responses.
- [ ] Raw access tokens, refresh tokens, reset tokens, OTP codes, passwords, hashes, and secrets are not intentionally logged.
- [ ] Auth responses do not expose `statusReason`, internal metadata, profile fields, roles, permissions, or session internals.

## OTP security

- [ ] OTP phone/IP abuse limits are enforced for phone verification and password reset.
- [ ] OTP limit failures do not send SMS and do not reveal account existence.
- [ ] OTP request metadata is stored only as safe request metadata and is not returned to clients.

- [ ] OTP hashes use slow secure hashing.
- [ ] OTP verification enforces expiration.
- [ ] OTP verification enforces consumed state.
- [ ] OTP verification enforces max attempts.
- [ ] Wrong OTP attempts increment attempt counters.
- [ ] Consumed OTP challenges cannot be reused.
- [ ] Password reset OTP is created only for eligible active verified users.

## Password security

- [ ] Password hashing uses a strong algorithm.
- [ ] Password verification does not expose whether the account exists.
- [ ] Password reset validates the new password policy.
- [ ] Password reset updates `passwordHash` safely.
- [ ] Password reset does not auto-login the user.

## Token and session security

- [ ] Access token JTI is validated against the active session state.
- [ ] Refresh token rotation uses a single conditional atomic session update.
- [ ] Stale refresh token reuse cannot rotate a session twice.

- [ ] Access token claims are minimal.
- [ ] Access tokens do not include phone, password hash, roles, permissions, profile, or status reason.
- [ ] Refresh token hash is stored instead of the raw refresh token.
- [ ] Refresh token rotates on refresh.
- [ ] Old refresh token fails after rotation.
- [ ] Revoked sessions cannot refresh.
- [ ] Expired sessions cannot refresh.
- [ ] Logout revokes the current session.
- [ ] Logout-all revokes only the current user's sessions.
- [ ] Session list returns safe metadata only.
- [ ] Session revoke is scoped to the current user.

## User status enforcement

- [ ] `pending_verification` users cannot login effectively.
- [ ] `suspended` users cannot login effectively.
- [ ] `banned` users cannot login effectively.
- [ ] `deleted` users cannot login effectively.
- [ ] Blocked statuses cannot refresh tokens.
- [ ] Blocked statuses cannot access `/me`.
- [ ] Only active users can access current-user session management.

## Account enumeration prevention

- [ ] Register response is generic.
- [ ] Forgot-password response is generic.
- [ ] Unknown phone login failures are safe and generic.
- [ ] Password reset request does not reveal whether a phone exists.
- [ ] Phone verification errors do not expose exact account state.

## SMS safety

- [ ] SMS provider is mock-only in Slice 0.2.
- [ ] No real SMS provider credentials are committed.
- [ ] SMS provider abstraction has no vendor-specific implementation.
- [ ] Notification logs store masked recipients.
- [ ] Notification logs store recipient hashes.
- [ ] Notification logs do not store raw SMS body or raw OTP.
- [ ] SMS provider exception messages are sanitized before persistence.

## Cleanup safety

- [ ] Cleanup returns counts only.
- [ ] Pending unverified user cleanup soft-deletes eligible users.
- [ ] Active users are not cleaned by pending-user cleanup.
- [ ] Expired sessions are marked revoked with reason `expired`.
- [ ] Active sessions are not revoked by cleanup.
- [ ] OTP cleanup is TTL-aware, marks expired unconsumed challenges consumed, and does not expose `codeHash`.
- [ ] No Redis or BullMQ is introduced in Slice 0.2 cleanup.
- [ ] No cron, production scheduler, public cleanup endpoint, or worker loop is introduced in Slice 0.2 cleanup.

## Test coverage

- [ ] Registration regression tests exist.
- [ ] Phone verification regression tests exist.
- [ ] Login regression tests exist.
- [ ] Refresh rotation regression tests exist.
- [ ] Logout/logout-all regression tests exist.
- [ ] Password reset regression tests exist.
- [ ] `/me` regression tests exist.
- [ ] Session list/revoke regression tests exist.
- [ ] Cleanup safety tests exist.
- [ ] Sensitive response leakage assertions exist.

## Remaining security work for later slices

Later slices may add the following. They are not implemented in Slice 0.2:

- full RBAC/ABAC
- real SMS provider hardening
- audit viewer
- monitoring and alerting
- production secret management
- optional step-up or 2FA features
- admin security operations
- production rate limiting and abuse detection
