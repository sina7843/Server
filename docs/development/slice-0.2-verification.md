# Slice 0.2 Verification Checklist

## 1. Command verification

Run these commands from the repository root:

```bash
pnpm install
pnpm --filter @dragon/api lint
pnpm --filter @dragon/api typecheck
pnpm --filter @dragon/api test
pnpm --filter @dragon/api build
pnpm --filter @dragon/types lint
pnpm --filter @dragon/types typecheck
pnpm --filter @dragon/types test
pnpm --filter @dragon/types build
pnpm --filter @dragon/sdk lint
pnpm --filter @dragon/sdk typecheck
pnpm --filter @dragon/sdk test
pnpm --filter @dragon/sdk build
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm format:check
```

- [ ] All commands pass on the approved Node.js and pnpm versions.
- [ ] No warnings indicate missing package scripts.
- [ ] No test logs intentionally print raw OTPs, passwords, access tokens, refresh tokens, reset tokens, token hashes, or secrets.

## 2. Artifact verification

For changed-files artifacts, run:

```bash
unzip -t <artifact-name>.zip
sha256sum <artifact-name>.zip
unzip -l <artifact-name>.zip
```

Verify:

- [ ] `CHANGED_FILES_MANIFEST.txt` exists.
- [ ] The manifest matches the zip file list.
- [ ] Only changed files are included.
- [ ] `node_modules` is not included.
- [ ] `.git` is not included.
- [ ] `.turbo` is not included.
- [ ] `.pnpm-store` is not included.
- [ ] Build outputs are not included.
- [ ] Real `.env` files are not included.
- [ ] `.env.example` files are included only when changed by that task.

## 3. Auth endpoint verification

Expected Slice 0.2 routes:

```text
POST   /api/v1/auth/register
POST   /api/v1/auth/verify-phone
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
POST   /api/v1/auth/logout-all
POST   /api/v1/auth/password/forgot
POST   /api/v1/auth/password/verify-reset-otp
POST   /api/v1/auth/password/reset
GET    /api/v1/auth/me
GET    /api/v1/auth/sessions
DELETE /api/v1/auth/sessions/:sessionId
```

- [ ] No additional Auth endpoints exist in Slice 0.2.
- [ ] No Admin Auth endpoints exist.
- [ ] No Profile endpoint exists.

## 4. User status verification

- [ ] Registration creates or reuses a pending user.
- [ ] Phone verification activates a pending user.
- [ ] Only active users can login.
- [ ] `pending_verification` users cannot login effectively.
- [ ] `suspended` users cannot login effectively.
- [ ] `banned` users cannot login effectively.
- [ ] `deleted` users cannot login effectively.
- [ ] Blocked users cannot refresh.
- [ ] Blocked users cannot access `/me`.
- [ ] Blocked users cannot manage sessions.

## 5. OTP verification

- [ ] Phone verification OTP is created for registration.
- [ ] Password reset OTP is created only for eligible active verified users.
- [ ] Raw OTP code is never stored.
- [ ] OTP hash is not returned.
- [ ] Wrong OTP increments attempts.
- [ ] Expired OTP cannot verify.
- [ ] Consumed OTP cannot verify again.
- [ ] Max attempts prevents verification.
- [ ] OTP cleanup is TTL-aware and safe.

## 6. Login/session/refresh verification

- [ ] Active verified user can login with correct password.
- [ ] Login creates a session.
- [ ] Login stores refresh token hash only.
- [ ] Login returns access token and refresh token.
- [ ] Login response does not expose password hash or refresh token hash.
- [ ] Access token claims are minimal.
- [ ] Refresh returns a new access token and new refresh token.
- [ ] Refresh rotates the stored refresh token hash.
- [ ] Old refresh token fails after rotation.
- [ ] Expired/revoked/missing sessions are rejected safely.

## 7. Logout and session revocation verification

- [ ] Logout revokes the current session.
- [ ] Logout sets `revokedReason = logout`.
- [ ] Logout-all revokes all sessions for the current user only.
- [ ] Logout-all sets `revokedReason = logout_all`.
- [ ] Revoked sessions cannot refresh.
- [ ] Logout responses do not expose session internals.

## 8. Password reset verification

- [ ] Forgot-password response is generic for known and unknown phones.
- [ ] Forgot-password does not reveal account existence.
- [ ] Verify reset OTP returns a reset token only after valid OTP.
- [ ] Reset token is short-lived.
- [ ] Reset token is purpose-bound to `password_reset`.
- [ ] Reset password updates `passwordHash`.
- [ ] Reset password revokes all sessions for the user.
- [ ] Reset password sets revocation reason `password_reset`.
- [ ] Reset password does not auto-login.
- [ ] Reset password does not return login tokens.
- [ ] Old password no longer works after reset.
- [ ] New password works after reset.

## 9. /me verification

- [ ] `/me` succeeds for an authenticated active user.
- [ ] `/me` rejects missing token safely.
- [ ] `/me` rejects invalid or expired token safely.
- [ ] `/me` rejects blocked statuses safely.
- [ ] `/me` returns minimal identity only.
- [ ] `/me` does not return `passwordHash`.
- [ ] `/me` does not return `refreshTokenHash`.
- [ ] `/me` does not return profile.
- [ ] `/me` does not return roles or permissions.
- [ ] `/me` does not return session internals.

## 10. Session list/revoke verification

- [ ] Session list is protected by the authentication-only guard.
- [ ] Session list returns only the current user's sessions.
- [ ] Session list returns safe metadata only.
- [ ] Session list does not expose `refreshTokenHash`.
- [ ] Session list does not expose access token internals.
- [ ] Session revoke is scoped to the current user.
- [ ] User cannot revoke another user's session.
- [ ] Revoked session cannot refresh afterward.
- [ ] No Admin session management exists.

## 11. Cleanup verification

- [ ] `AuthCleanupService` exists and is registered in `AuthModule`.
- [ ] Pending unverified users older than threshold are marked deleted.
- [ ] New pending users are not cleaned.
- [ ] Pending users with `phoneVerifiedAt` are not cleaned.
- [ ] Active/suspended/banned/deleted users are not cleaned by pending cleanup.
- [ ] Expired sessions are marked revoked with reason `expired`.
- [ ] Active sessions are not revoked by cleanup.
- [ ] Already revoked sessions are not modified.
- [ ] OTP cleanup is TTL-aware and does not expose `codeHash`.
- [ ] Cleanup result returns counts only.
- [ ] No public cleanup endpoint exists.
- [ ] No scheduler, cron, BullMQ, Redis, or worker loop exists.

## 12. Sensitive data leakage verification

Confirm API responses do not expose:

- [ ] `passwordHash`
- [ ] `refreshTokenHash`
- [ ] `codeHash`
- [ ] `statusReason`
- [ ] roles
- [ ] permissions
- [ ] profile
- [ ] metadata
- [ ] raw OTP
- [ ] token hashes
- [ ] session internals

## 13. Scope exclusion verification

Confirm absence of:

- [ ] RBAC
- [ ] role assignment
- [ ] permission decorators
- [ ] Profile
- [ ] Admin dashboard
- [ ] Admin user management
- [ ] Content
- [ ] Media
- [ ] Audit viewer
- [ ] Notification center
- [ ] Search
- [ ] Analytics
- [ ] OAuth
- [ ] passwordless login
- [ ] passkeys
- [ ] full TOTP/2FA
- [ ] real SMS provider credentials
- [ ] Redis queues
- [ ] BullMQ processors
- [ ] production deployment
- [ ] backup
- [ ] monitoring
- [ ] Nuxt auth screens

## 14. Final approval checklist

- [ ] Gate A approved
- [ ] Gate B / registration-verification review approved if used
- [ ] Gate C approved
- [ ] Gate D approved if used
- [ ] Gate E approved
- [ ] All command verification is green
- [ ] All artifact verification is green
- [ ] No scope creep is present
- [ ] Slice 0.2 ready to close
