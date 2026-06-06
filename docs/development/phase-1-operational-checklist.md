# Phase 1 — Operational Checklist

**Scope:** This document is a release-readiness reference for Phase 1 of the Dragon tournament platform. Phase 1 is a Production Slice: launchable within a controlled scope, complete within its locked feature boundary, and not extended by unimplemented future capabilities.

Do not add features to Phase 1 after this checklist is finalized. Extension belongs in a named future slice.

---

## Public Capabilities

| Capability                                       | Status         |
| ------------------------------------------------ | -------------- |
| Browse published tournaments (list)              | Implemented    |
| View tournament detail by slug                   | Implemented    |
| View registration context (form pre-flight)      | Implemented    |
| Submit individual or team registration           | Implemented    |
| View own registration status                     | Implemented    |
| Update own team registration (team name/members) | Implemented    |
| Withdraw own registration                        | Implemented    |
| View tournament bracket                          | Implemented    |
| View tournament matches (list)                   | Implemented    |
| View tournament standings                        | Implemented    |
| View tournament results                          | Implemented    |
| Authentication (login, refresh, logout)          | Implemented    |
| Public games pages                               | Not in Phase 1 |
| Public match detail page                         | Not in Phase 1 |
| Notification preferences UI                      | Not in Phase 1 |

---

## Admin Capabilities

| Capability                                                  | Status                              |
| ----------------------------------------------------------- | ----------------------------------- |
| Create, edit, delete tournaments                            | Implemented                         |
| Publish, cancel, archive tournaments                        | Implemented                         |
| Open/close registration window                              | Implemented                         |
| List and view registrations                                 | Implemented                         |
| Approve, reject, cancel individual registrations            | Implemented                         |
| Manage participants (list, remove, disqualify)              | Implemented                         |
| Manage matches (list, create, update, cancel, generate)     | Implemented                         |
| Record, update, void results                                | Implemented                         |
| Recalculate standings                                       | Implemented                         |
| View bracket                                                | Implemented                         |
| View audit logs                                             | Implemented                         |
| Manage games                                                | Implemented                         |
| Admin analytics viewer (Phase 0: auth, OTP, content, media) | Pre-existing Phase 0 infrastructure |
| Tournament analytics dashboard                              | Not in Phase 1                      |
| Audit log viewer — list and detail                          | Pre-existing Phase 0 infrastructure |
| Audit dashboard / advanced search / export                  | Not in Phase 1                      |
| Notification log viewer (/system/notifications)             | Pre-existing Phase 0 infrastructure |
| Notification management / campaign routes                   | Not in Phase 1                      |
| Tournament preview route                                    | Not in Phase 1                      |
| Tournament operations route                                 | Not in Phase 1                      |

---

## Transactional Notification Checklist

### Default events (fired on all qualifying actions)

| Event                  | Purpose constant         | Implemented | Tested |
| ---------------------- | ------------------------ | ----------- | ------ |
| Registration submitted | `registration.submitted` | Yes         | Yes    |
| Registration approved  | `registration.approved`  | Yes         | Yes    |
| Registration rejected  | `registration.rejected`  | Yes         | Yes    |
| Tournament cancelled   | `tournament.cancelled`   | Yes         | Yes    |

### Optional events (safely supported — backend fires, not gated)

| Event                  | Purpose constant         | Implemented | Tested |
| ---------------------- | ------------------------ | ----------- | ------ |
| Registration withdrawn | `registration.withdrawn` | Yes         | Yes    |
| Registration cancelled | `registration.cancelled` | Yes         | Yes    |

### Notification infrastructure

- [ ] SMS provider configured for production (`SMS_PROVIDER` env var)
- [x] Mock provider active for development and test environments
- [x] Recipient phone resolved from `UserRepository.findById()` only — never from request body or params
- [x] Notification log records recipient as masked + hashed — no raw phone stored
- [x] Notification failure never aborts the triggering business operation
- [x] No marketing, campaign, push, or in-app notification system exists

### Known notification limitations

1. No real SMS delivery in Phase 1 — mock provider only; no production SMS provider is configured.
2. Tournament-cancelled notification cap: at most 100 active registrants notified per cancellation event (repository page limit — cursor enumeration deferred).
3. No notification template records seeded — static fallback messages used.
4. No email channel — SMS only.
5. No retry mechanism — if SMS fails for a registrant, no automatic retry occurs.
6. No notification preferences — users cannot opt out of transactional SMS.

---

## Analytics Event Map

All 5 Phase 1 analytics events have exactly one canonical backend owner. Events fire from backend controllers/services only — not from frontend composables.

| Event                               | Canonical Owner                                                    | Trigger                                              | Tested |
| ----------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------- | ------ |
| `tournament.viewed`                 | `PublicTournamentsController.getBySlug()`                          | `GET /api/v1/tournaments/:slug` (success, visible)   | Yes    |
| `tournament.registration_started`   | `PublicTournamentRegistrationsController.getRegistrationContext()` | `GET /api/v1/tournaments/:slug/registration-context` | Yes    |
| `tournament.registration_completed` | `TournamentRegistrationService.register()`                         | `POST /api/v1/tournaments/:slug/register`            | Yes    |
| `tournament.bracket_viewed`         | `PublicTournamentBracketController.getBracket()`                   | `GET /api/v1/tournaments/:slug/bracket`              | Yes    |
| `tournament.match_viewed`           | `PublicTournamentMatchesController.listMatches()`                  | `GET /api/v1/tournaments/:slug/matches`              | Yes    |

### Analytics guardrails

- [x] Each event fires from exactly one owner — no competing code paths
- [x] `tournament.viewed`, `tournament.bracket_viewed`, `tournament.match_viewed` only fire after `isPubliclyVisible()` passes — draft/archived/deleted tournaments do not generate events
- [x] Frontend composables (`useTournamentDetail.ts`, `useTournamentBracket.ts`, `useTournamentMatches.ts`) do not fire analytics events client-side
- [x] No phone, email, access tokens, or admin-only fields in any analytics payload
- [x] No Slice 11 tournament analytics dashboard, new admin analytics routes, or analytics export introduced (Phase 0 `AdminAnalyticsController` at `/admin/v1/analytics` is pre-existing infrastructure covering auth/OTP/content/media — not introduced or expanded by Slice 11)

---

## Audit and Observability Checklist

### Tournament domain audit coverage

| Domain                 | AuditAction constants                                                                                            | Status      |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------- | ----------- |
| Tournament lifecycle   | `CREATED/UPDATED/PUBLISHED/REGISTRATION_OPENED/REGISTRATION_CLOSED/STARTED/COMPLETED/CANCELLED/ARCHIVED/DELETED` | Implemented |
| Registration lifecycle | `SUBMITTED/UPDATED/WITHDRAWN/APPROVED/REJECTED/CANCELLED`                                                        | Implemented |
| Participant actions    | `REMOVED/DISQUALIFIED`                                                                                           | Implemented |
| Match operations       | `CREATED/UPDATED/CANCELLED/GENERATED`                                                                            | Implemented |
| Result operations      | `RECORDED/UPDATED/VOIDED`                                                                                        | Implemented |
| Standings              | `RECALCULATED`                                                                                                   | Implemented |

### Known audit gap

`participant.updated` — not implemented (Phase 1 gap). `TournamentParticipantService.updateParticipant()` (seed/displayName update) has no audit hook. No `PARTICIPANT_UPDATED` AuditAction constant exists in `@dragon/types`. Documented limitation; not fake-covered by an empty hook. A future slice may add this constant and hook.

### Audit infrastructure

- [x] All audit hook calls use `void this.auditService?.log()` — fire-and-forget, never abort business operation
- [x] `AuditService` is `@Optional()` in all services — graceful degradation if unavailable
- [x] `AuditRedactor` applied to `before`, `after`, and `metadata` in every write
- [x] Redactor covers: `password`, `refreshToken`, `accessToken`, `secret`, `authorization`, `cookie`, `providerCredentials`, `providerSecret`, `resetToken`, `otp`, `code`, and variants (case-insensitive)
- [x] No phone/email/raw PII in audit `after` objects for registration or participant services
- [x] No new public audit log endpoints
- [x] No new admin audit dashboard, advanced search, or export UI introduced by Slice 11 (Phase 0 `AdminAuditController` at `/admin/v1/audit-logs` provides read-only log access — not a dashboard, not expanded by Slice 11)

---

## Security and Privacy Checklist

### Recipient contact data

- [x] Recipient phone resolved exclusively from `UserRepository.findById(userId)` — never from request body, params, or query
- [x] `userId` on each `TournamentRegistration` comes from authenticated JWT context — never from client body
- [x] Phone masked and hashed before storage in notification logs
- [x] Raw phone never in logs, never in audit metadata, never in API responses
- [x] Team member contact data never passed to notification service

### Notification payload safety

- [x] Rejection reason never included in SMS message body
- [x] Admin notes never included in notification payloads
- [x] Provider errors sanitized by `NotificationService.markFailed()` — sensitive words replaced before storage
- [x] No SMS sender ID or phone number hardcoded in codebase

### Analytics payload safety

- [x] No phone or email in any analytics payload
- [x] No access tokens or session data in any analytics payload
- [x] No admin-only fields in any public analytics payload
- [x] No credentials or API keys hardcoded in any analytics owner file

### Audit payload safety

- [x] No `phone` or `phoneNormalized` in audit `after` objects
- [x] No `email` in audit `after` objects
- [x] No raw `members[]` contact data in audit payloads
- [x] No access tokens, session data, or raw cookies in audit payloads
- [x] No provider credentials, SMS sender secrets, or analytics secrets in audit metadata

---

## Domain and Configuration Checklist

- [x] No `localhost` hardcoded as an API origin in runtime or config code
- [x] No `qesb.ir` hardcoded as an API origin in runtime or config code
- [x] No provider API keys or secrets hardcoded in any source file
- [x] No SMS sender IDs or phone numbers hardcoded in any source file
- [x] No analytics secrets hardcoded in any source file
- [x] All baseUrl values come from runtime configuration (`runtimeConfig`, environment variables)
- [x] Admin and web apps use Dragon SDK client wrappers — no direct `fetch()`, `$fetch`, or `axios` in features or composables

> Note: `qesb.ir` is the planned Phase 1 public domain. `stream.ir` is a possible future domain. Both may appear in documentation only — never in runtime or config source.

---

## Provider Configuration Prerequisites

Before real SMS delivery can occur in production:

1. Configure a production SMS provider — no concrete provider is implemented yet; only `MockSmsProvider` exists
2. Set `SMS_PROVIDER` environment variable / config to the provider name
3. Supply provider credentials via environment variables — never hardcode them
4. Optionally seed `NotificationTemplate` records for each purpose key to enable template-driven messages — static fallback messages are used until templates are seeded

**No deployment-blocking hardcoded values exist. No credentials are present in this codebase.**

---

## Environment and Configuration Prerequisites

| Prerequisite                   | Status               |
| ------------------------------ | -------------------- |
| MongoDB connection string      | Via env var          |
| JWT secret / refresh secret    | Via env var          |
| SMS provider name              | Mock (Phase 1 only)  |
| SMS provider credentials       | Not configured       |
| Analytics provider credentials | Via env var (if any) |
| API base URL (web/admin)       | Via runtime config   |

---

## No Fake Runtime Data Checklist

- [x] No hardcoded fake MongoDB ObjectIds in any backend runtime service file
- [x] No placeholder or coming-soon pages in web or admin app
- [x] No fake tournament, registration, participant, match, result, standings, or bracket data in runtime UI code
- [x] Test fixtures are allowed only in `.spec.ts` files — not in runtime source

---

## No Direct Fetch Checklist

- [x] No `fetch(` (standalone) in `apps/web/features/` or `apps/web/composables/`
- [x] No `fetch(` (standalone) in `apps/admin/features/` or `apps/admin/composables/`
- [x] All API calls go through Dragon SDK client wrappers (`createTournamentsClient`, `createAdminTournamentsClient`, etc.)

---

## Forbidden Route Checklist

### Pre-existing Phase 0 backend routes (not introduced by Slice 11)

The following routes exist as pre-existing Phase 0 infrastructure. Slice 11 did not create or expand them.

| Route                            | Controller                     | Scope                               |
| -------------------------------- | ------------------------------ | ----------------------------------- |
| `/admin/v1/analytics`            | `AdminAnalyticsController`     | Auth, OTP, content, media analytics |
| `/admin/v1/audit-logs`           | `AdminAuditController`         | Read-only audit log list and detail |
| `/admin/v1/system/notifications` | `AdminNotificationsController` | Read-only notification log viewer   |

### Permanently forbidden backend routes (never in Phase 1)

| Route                                        | Present | Expected |
| -------------------------------------------- | ------- | -------- |
| `/api/v1/notifications`                      | No      | Absent   |
| `/api/v1/notification-preferences`           | No      | Absent   |
| `/admin/v1/campaigns`                        | No      | Absent   |
| `/api/v1/tournaments/:slug/matches/:matchId` | No      | Absent   |
| `/admin/v1/tournaments/:id/operations`       | No      | Absent   |
| `/admin/v1/tournaments/:id/preview`          | No      | Absent   |

### Permanently forbidden frontend routes (never in Phase 1)

| Route                                 | Present | Expected |
| ------------------------------------- | ------- | -------- |
| `/tournaments/:slug/matches/:matchId` | No      | Absent   |
| `/games` and `/games/:slug` (public)  | No      | Absent   |

---

## Out-of-Scope Capabilities

The following capabilities do not exist and were not introduced in Phase 1:

- Marketing SMS
- Newsletter or campaign notification system
- Push notifications (FCM, APNS)
- In-app notification center
- Notification preferences UI
- WhatsApp or Telegram integration
- Mass broadcast or bulk send
- Segmentation or personalization engine
- Notification audit dashboard
- Tournament analytics dashboard or tournament-specific admin analytics reporting
- Audit dashboard, advanced search, filter, or export (beyond Phase 0 read-only log viewer)
- Public audit log endpoints
- Live scoring endpoints or WebSocket gateways
- Bracket editor (edit, override, drag-drop)
- Swiss format support
- Double Elimination format support
- Public match detail page
- Public games pages

---

## Known Limitations

| #   | Area                        | Limitation                                                                                                     |
| --- | --------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 1   | SMS delivery                | No real SMS delivery — mock provider only; no production SMS provider is configured                            |
| 2   | Tournament-cancelled notify | At most 100 active registrants notified per cancellation (repository page limit — cursor enumeration deferred) |
| 3   | Notification templates      | Static fallback messages used; `NotificationTemplate` records for purpose keys not yet seeded                  |
| 4   | Email channel               | Not implemented — SMS only                                                                                     |
| 5   | Notification retry          | No automatic retry on SMS failure                                                                              |
| 6   | Notification preferences    | Users cannot opt out of transactional SMS                                                                      |
| 7   | Participant audit           | `participant.updated` has no audit hook; no `PARTICIPANT_UPDATED` AuditAction constant                         |
| 8   | Notification delivery UI    | Logs viewable via admin notification log endpoint only — no dashboard                                          |

---

## Verification Commands

```bash
# API package
pnpm --filter @dragon/api lint
pnpm --filter @dragon/api typecheck
pnpm --filter @dragon/api test
pnpm --filter @dragon/api build

# Web package
pnpm --filter @dragon/web lint
pnpm --filter @dragon/web typecheck
pnpm --filter @dragon/web test
pnpm --filter @dragon/web build

# Admin package
pnpm --filter @dragon/admin lint
pnpm --filter @dragon/admin typecheck
pnpm --filter @dragon/admin test
pnpm --filter @dragon/admin build

# Types + SDK packages
pnpm --filter @dragon/types test
pnpm --filter @dragon/sdk test

# Monorepo root
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm format:check
```

### Specific test files for Phase 1 / Slice 11

```bash
# Task 11.1 — Transactional notifications
pnpm --filter @dragon/api test -- --testPathPattern="tournament-notification.service.spec"

# Task 11.2 — Analytics event integration
pnpm --filter @dragon/api test -- --testPathPattern="tournament-analytics.guardrails.spec"

# Task 11.3 — Audit and Phase 1 operational hardening (backend)
pnpm --filter @dragon/api test -- --testPathPattern="phase1-audit-hardening.spec"

# Task 11.4 — Doc-verification and Slice 11 checklist (admin guardrails)
pnpm --filter @dragon/admin test -- --testPathPattern="phase1-guardrails.spec"
```

---

## Release Readiness Decision Template

Before declaring Phase 1 ready for production deployment, confirm all of the following:

### Must-pass (blocking)

- [ ] All API tests pass (`pnpm --filter @dragon/api test`)
- [ ] All web tests pass (excluding pre-existing Slice 9 boundary failures)
- [ ] All admin tests pass
- [ ] All types and SDK tests pass
- [ ] API lint clean (`pnpm --filter @dragon/api lint`)
- [ ] API typecheck clean (`pnpm --filter @dragon/api typecheck`)
- [ ] API build succeeds (`pnpm --filter @dragon/api build`)
- [ ] Web build succeeds (`pnpm --filter @dragon/web build`)
- [ ] Admin build succeeds (`pnpm --filter @dragon/admin build`)
- [ ] format:check passes (`pnpm format:check`)

### Must-confirm (operational)

- [ ] Production SMS provider credentials supplied via environment variables (not hardcoded)
- [ ] MongoDB connection string set in production environment
- [ ] JWT secret and refresh secret set in production environment
- [ ] API base URL configured in web and admin runtime config
- [ ] No hardcoded `localhost` or `qesb.ir` in any deployed artifact

### Must-confirm (scope integrity)

- [ ] No new backend routes added beyond those listed in this checklist
- [ ] No new frontend pages added beyond those listed in this checklist
- [ ] No tournament analytics dashboard deployed (Phase 0 admin analytics/audit-logs/notifications infrastructure is pre-existing and acceptable)
- [ ] No marketing or campaign notification system deployed
- [ ] All known limitations documented above are accepted for this deployment
