# Password Reset Frontend — Design

**Date:** 2026-06-17
**Status:** Approved (design)

## Summary

The backend SMS-OTP password reset flow is already built and wired end-to-end for all
accounts (regular users and admins — admins are just users with RBAC roles). The gap is
frontend: neither Nuxt app exposes a forgot-password UI. This work adds a 3-step
forgot-password page to both `apps/web` (users) and `apps/admin` (admins), wiring the
existing API endpoints. **No backend changes.**

### Existing backend (reference, not changed)

Endpoints in [auth.controller.ts](../../../apps/api/src/auth/auth.controller.ts), backed by
[password-reset.service.ts](../../../apps/api/src/auth/password-reset/password-reset.service.ts):

| Step | Endpoint | Request | Response |
|------|----------|---------|----------|
| Request | `POST /api/v1/auth/password/forgot` | `{ phone }` | generic 200 (no account enumeration) |
| Verify | `POST /api/v1/auth/password/verify-reset-otp` | `{ phone, code }` | `{ resetToken }` (short-lived HMAC JWT) |
| Reset | `POST /api/v1/auth/password/reset` | `{ resetToken, newPassword }` | generic 200 (server revokes all sessions) |

Same OTP engine as signup `verify-phone` (rate limits, resend cooldown, attempt caps, audit
logs). `resetPassword` updates the hash, resets failed-login state, and revokes all sessions
(`revokeAllForUser(..., 'password_reset')`).

## Architecture

Approach: **single multi-step page per app** (route `/forgot-password`), 3 internal steps
driven by a `step` ref. Mirrors the structurally-identical existing
[register.vue](../../../apps/web/pages/register.vue) (register → verify-OTP) flow: one route,
one component, state held in `ref`s — no cross-page token passing. Rejected alternatives:
separate routes per step (must carry `phone` + `resetToken` across navigations, breaks on
refresh) and a login-page modal (inconsistent with full-page register, cramped for 3 steps).

### Files

**Web (users)**
- **New** `apps/web/pages/forgot-password.vue` — 3-step page; clone register.vue structure and
  `.login-*` / `.reg-*` scoped styles. RTL Persian copy, design tokens. `definePageMeta({ ssr: false })` like register.
- **Edit** `apps/web/features/auth/auth-api.ts` — add `webForgotPassword`, `webVerifyResetOtp`,
  `webResetPassword`. Follow the existing `webRegister` / `webVerifyPhone` shape: direct
  `client.request` (the SDK has no reset methods), Persian error messages mapped from
  `ApiClientError` status.
- **Edit** `apps/web/pages/login.vue` — add "رمز عبور را فراموش کرده‌اید؟" link to
  `/forgot-password` (preserving any `redirect` query, matching `loginUrl` pattern in register.vue).

**Admin**
- **New** `apps/admin/pages/forgot-password.vue` — same 3-step flow; use `.dr-input` / `.dr-btn`
  classes and the same login layout/structure as [login.vue](../../../apps/admin/pages/login.vue).
- **Edit** `apps/admin/features/auth/admin-auth.api.ts` — add `adminForgotPassword`,
  `adminVerifyResetOtp`, `adminResetPassword`, mirroring `adminLogin` error-mapping style.
- **Edit** `apps/admin/pages/login.vue` — add forgot-password link.

**Both:** confirm `/forgot-password` is reachable unauthenticated. Middleware in each app is
route-applied (named: web `auth-required.ts`, admin `admin-auth-required.ts`), not global —
login/register are public without declaring middleware, so the new route is public by default.
Verify during implementation.

## Data flow (one component, three steps)

```
step='phone' :  forgot(phone)                 -> advance to 'otp'  (always; server response is generic)
step='otp'   :  verifyResetOtp(phone, code)   -> store resetToken ref -> advance to 'reset'
step='reset' :  resetPassword(resetToken, newPw) -> navigate to /login with success notice
```

- Client validation mirrors register: new password ≥ 8 chars, confirm-password must match
  (validate before calling `resetPassword`).
- "Change phone" back button on the OTP step (returns to `step='phone'`), matching register.
- Resend-OTP control: **out of scope** (parity with register, which has none). Server enforces
  resend cooldown regardless.

## Error handling

| Call | Status | Behavior |
|------|--------|----------|
| forgot | any | Always advance to OTP step. Generic server response prevents account enumeration; UI must not branch on existence. |
| verifyResetOtp | 400 | "کد تأیید اشتباه یا منقضی شده است." Stay on OTP step. |
| resetPassword | 401 | Token bad/expired: show message, bounce back to `step='phone'`. |
| resetPassword | 400 | Weak password: "رمز عبور معتبر نیست." Stay on reset step. |
| any | network/other | Generic retry message ("خطا … لطفاً دوباره تلاش کنید."). |

## Testing

- **Admin API unit tests:** extend the
  [admin-auth.api.spec.ts](../../../apps/admin/features/auth/admin-auth.api.spec.ts) pattern —
  for each new function mock the client and assert request path, body, and `ApiClientError`
  status→message mapping (incl. 401 token-expired and 400 paths).
- **Web API unit tests:** add a spec for the three `web*` functions if web test infra exists
  (verify in plan; admin has `jest.config.cjs`). If web has no runner, unit-test the wrappers
  with the same mock-client approach once a runner is confirmed, else rely on manual + admin coverage.
- **Manual:** full 3-step run in both apps against the dev API — happy path, wrong OTP, expired
  token bounce, weak password, password-mismatch client validation.

## Out of scope

- Backend changes (already shipped).
- Email-based reset, admin-initiated reset, admin-set temp passwords.
- Resend-OTP UI control.
