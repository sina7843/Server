# Phase 1 / Slice 11 — Transactional Notifications Verification

## Overview

Slice 11 aligns Phase 1 transactional notifications for approved tournament and registration lifecycle events. No marketing, campaign, push, in-app, or preference UI system is introduced. All notification delivery passes through the existing SMS abstraction layer.

---

## Transactional Notification Scope

### Implemented (default events)

| Event                  | Purpose constant         | Trigger                                                                          |
| ---------------------- | ------------------------ | -------------------------------------------------------------------------------- |
| Registration submitted | `registration.submitted` | User completes `POST /api/v1/tournaments/:slug/register`                         |
| Registration approved  | `registration.approved`  | Admin approves via `POST /admin/v1/tournaments/:id/registrations/:regId/approve` |
| Registration rejected  | `registration.rejected`  | Admin rejects via `POST /admin/v1/tournaments/:id/registrations/:regId/reject`   |
| Tournament cancelled   | `tournament.cancelled`   | Admin cancels via `POST /admin/v1/tournaments/:id/cancel`                        |

### Implemented (optional — backend events safely supported)

| Event                  | Purpose constant         | Trigger                                                                                                |
| ---------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------ |
| Registration withdrawn | `registration.withdrawn` | User withdraws via `POST /api/v1/tournaments/:slug/my-registration/withdraw`                           |
| Registration cancelled | `registration.cancelled` | Admin cancels individual registration via `POST /admin/v1/tournaments/:id/registrations/:regId/cancel` |

### Deferred / Out of scope

- Marketing SMS
- Newsletter
- Campaign notifications
- Push notifications
- In-app notification center
- Notification preferences UI
- WhatsApp / Telegram integration
- Mass broadcast
- Segmentation / personalization engine
- Audit dashboard for notifications
- Notification UI

---

## Recipient Source Policy

Recipient contact information is resolved **exclusively from trusted backend data**:

- `UserRepository.findById(userId)` → `user.phoneNormalized`
- The `userId` on each `TournamentRegistration` document comes from the authenticated JWT context at submission time (never from client-controlled body fields)

**Forbidden recipient sources (enforced by design — no code path accepts these):**

- Public route params
- Request body phone/email fields
- Query params
- Client-controlled notification payloads
- Team member `members[]` fields

---

## Provider Behavior

### Phase 1 configuration

Phase 1 has only the mock SMS provider configured (`smsProvider: 'mock'` in `auth.config.ts`). No real SMS is delivered in development or test environments.

The mock provider returns `{ provider: 'mock', status: 'sent', providerMessageId: 'mock-...' }`.

All notification attempts are logged in the notification log collection with masked/hashed recipient.

### Production prerequisites (not yet configured)

To enable real SMS delivery:

1. Configure a production SMS provider (no concrete provider is implemented yet)
2. Set `smsProvider` in `auth.config.ts` to the provider name
3. Supply provider credentials via environment variables (no hardcoded secrets)
4. Seed `NotificationTemplate` records for each purpose key (optional — static fallback messages are used until templates are seeded)

**No hardcoded credentials, sender IDs, phone numbers, or API keys exist in this codebase.**

### Local/dev adapter behavior

The mock SMS provider:

- Is visibly non-production (`providerName = 'mock'`)
- Does not claim external delivery
- Records notification attempts through the existing `NotificationLogService`
- Redacts recipient contact via `maskPhone()` / `hashToken()` before storage
- Is not used to fake production success

---

## Privacy and Redaction Policy

| Data                           | Handling                                                                                       |
| ------------------------------ | ---------------------------------------------------------------------------------------------- |
| Recipient phone                | Masked + hashed before storage; never in logs, never in audit metadata, never in API responses |
| Rejection reason               | Never included in SMS message body                                                             |
| Team member contact data       | Never passed to notification service                                                           |
| Admin notes                    | Never included in notification payloads                                                        |
| Sensitive registration details | Not in notification logs                                                                       |
| Provider errors                | Sanitized by `NotificationService.markFailed()` — sensitive words replaced                     |

---

## Notification Payload Safety

Notification log records contain only:

- `channel` (sms)
- `provider` (mock)
- `recipientMasked` (e.g. `+98***0000`)
- `recipientHash` (SHA-256 of normalized phone)
- `status` (queued → sent/failed/skipped)
- `purpose` (e.g. `registration.submitted`)
- `templateKey` (if template-driven — not yet used for tournament notifications)

No raw phone, email, team member data, rejection reason, admin notes, or credentials are stored.

---

## Implementation Architecture

### `TournamentNotificationService` (`apps/api/src/notifications/tournament-notification.service.ts`)

Domain-specific notification adapter. Injected `@Optional()` into:

- `TournamentRegistrationService` — for registration lifecycle events
- `AdminTournamentsController` — for tournament cancellation (coordinates with `TournamentRegistrationService` to enumerate notifiable registrants)

Dependencies (all `@Optional()`):

- `SmsService` — existing SMS abstraction from `AuthModule`
- `UserRepository` — trusted recipient phone resolution from `AuthModule`

Graceful degradation: if either dependency is unavailable, notifications are silently skipped. Notification failure never aborts the main business operation (all hooks are fire-and-forget via `void`).

### Module wiring

```
NotificationsModule
  ├── imports: AuthModule (provides SmsService, UserRepository)
  └── exports: NotificationService, TournamentNotificationService

TournamentRegistrationsModule
  └── imports: NotificationsModule (adds tournament notification hooks)

AdminTournamentsModule
  └── imports: NotificationsModule, TournamentRegistrationsModule
      (enables tournament-cancelled notification via registrant enumeration)
```

### Tournament-cancelled notification flow

1. Admin calls `POST /admin/v1/tournaments/:id/cancel`
2. `AdminTournamentsController.cancelTournament()` calls `TournamentService.transition(id, 'cancelled')`
3. Response is returned immediately
4. Fire-and-forget: `notifyRegistrantsOfCancellation(id)` enumerates up to 100 active registrations (submitted / approved / waitlisted), extracts `userId` values, and calls `TournamentNotificationService.notifyUsersOfTournamentCancelled(userIds)`
5. For each userId, phone is resolved from `UserRepository`, SMS is dispatched via `SmsService`

**Known limitation:** The registration repository `list()` method is capped at 100 items per call. Tournaments with more than 100 active registrations at cancellation time will not have all registrants notified in Phase 1. Cursor-based full enumeration is deferred.

---

## Configuration Prerequisites

Before real SMS delivery can occur:

- `SMS_PROVIDER` environment variable / config must point to a production provider
- Provider credentials must be supplied via environment variables (never hardcoded)
- `NotificationTemplate` records may be seeded for each purpose key to enable template-driven messages (static fallback messages are provided)

**No deployment-blocking hardcoded values exist.** Runtime config does not reference `localhost`, `qesb.ir`, or any fixed API origin.

---

## Known Limitations

1. **No real SMS delivery in Phase 1** — only mock provider is configured.
2. **Tournament-cancelled notification cap** — max 100 registrants notified per cancellation event (repository page limit).
3. **No template-driven messages** — static fallback messages used; `NotificationTemplate` records for `registration.*` / `tournament.cancelled` purposes are not yet seeded.
4. **No email channel** — only SMS is implemented; email channel support deferred.
5. **No notification delivery tracking UI** — logs are viewable via admin notification log endpoint only.
6. **No retry mechanism** — if SMS fails for a registrant, no automatic retry occurs.
7. **No notification preferences** — users cannot opt out of transactional SMS (deferred).

---

## Out-of-Scope Declarations

The following features do **not** exist and were **not** introduced in Slice 11:

- Marketing SMS
- Newsletter / campaign system
- Push notifications
- In-app notification center
- Notification preferences UI
- WhatsApp / Telegram integration
- Mass broadcast / bulk send
- Segmentation or personalization engine
- Notification audit dashboard
- Public notification routes
- Admin notification management routes

---

## Verification Commands

```bash
# API package
pnpm --filter @dragon/api lint
pnpm --filter @dragon/api typecheck
pnpm --filter @dragon/api test
pnpm --filter @dragon/api build

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

### Specific test files for Slice 11

```bash
# TournamentNotificationService unit tests
pnpm --filter @dragon/api test -- --testPathPattern="tournament-notification.service.spec"

# Registration service (existing + notification hooks)
pnpm --filter @dragon/api test -- --testPathPattern="tournament-registration.service.spec"

# Admin tournaments controller spec (existing)
pnpm --filter @dragon/api test -- --testPathPattern="admin-tournaments.controller.spec"

# Tournament analytics event guardrails (Task 11.2)
pnpm --filter @dragon/api test -- --testPathPattern="tournament-analytics.guardrails.spec"

# Phase 1 audit and operational hardening guardrails (Task 11.3)
pnpm --filter @dragon/api test -- --testPathPattern="phase1-audit-hardening.spec"
```

---

## Task 11.3 — Audit, Observability, and Phase 1 Operational Hardening

### Audit coverage summary

All required Phase 1 tournament domain audit events are aligned through the existing `AuditService` foundation.

| Domain                 | AuditAction constants                                                                                                       | Owner service                   | Status          |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------- | --------------- |
| Tournament lifecycle   | `TOURNAMENT_CREATED/UPDATED/PUBLISHED/REGISTRATION_OPENED/REGISTRATION_CLOSED/STARTED/COMPLETED/CANCELLED/ARCHIVED/DELETED` | `AdminTournamentsController`    | **Implemented** |
| Registration lifecycle | `REGISTRATION_SUBMITTED/UPDATED/WITHDRAWN/APPROVED/REJECTED/CANCELLED`                                                      | `TournamentRegistrationService` | **Implemented** |
| Participant actions    | `PARTICIPANT_REMOVED/DISQUALIFIED`                                                                                          | `TournamentParticipantService`  | **Implemented** |
| Match operations       | `MATCH_CREATED/UPDATED/CANCELLED/GENERATED`                                                                                 | `TournamentMatchService`        | **Implemented** |
| Result operations      | `RESULT_RECORDED/UPDATED/VOIDED`                                                                                            | `TournamentResultService`       | **Implemented** |
| Standings              | `STANDINGS_RECALCULATED`                                                                                                    | `TournamentStandingsService`    | **Implemented** |

### Audit limitations (Phase 1)

**`participant.updated` — not implemented (Phase 1 gap)**

`TournamentParticipantService.updateParticipant()` (seed/displayName update) has no audit hook. No `PARTICIPANT_UPDATED` AuditAction constant exists in `@dragon/types`. This is a documented Phase 1 limitation, not fake-covered. A future slice may add this constant and hook.

All other limitations are Phase 0 auth/system events unrelated to the tournament domain.

### Observability and logging safety policy

- All audit hook calls use `void this.auditService?.log()` (fire-and-forget, `@Optional()` injection)
- Audit failure never aborts the main business operation
- `AuditRedactor` redacts: `password`, `refreshToken`, `accessToken`, `secret`, `authorization`, `cookie`, `providerCredentials`, `providerSecret`, `resetToken`, `otp`, `code`, and their variants (case-insensitive)
- The redactor is applied to `before`, `after`, and `metadata` fields in every audit log write

### No sensitive logging policy

Audit payloads in tournament services must not include:

- `phone` or `phoneNormalized` (recipient contact)
- `email` (recipient contact)
- Raw `members[]` contact data (team member info)
- Admin notes in `after` objects
- Access tokens, session data, or raw cookies
- Provider credentials, SMS sender secrets, analytics secrets

Enforced by: `AuditRedactor` for token/secret fields + convention for phone/email (verified by `phase1-audit-hardening.spec.ts`).

### Direct-fetch guardrail policy

All Phase 1 web and admin app flows use Dragon SDK client wrappers (`createTournamentsClient`, `createAdminTournamentsClient`, etc.). No direct `fetch()`, `$fetch`, or `axios` calls exist in:

- `apps/web/features/` and `apps/web/composables/`
- `apps/admin/features/` and `apps/admin/composables/`

Enforced by: `apps/admin/features/guardrails/phase1-guardrails.spec.ts` (scanned on every test run).

### Fake-data guardrail policy

- No hardcoded fake MongoDB ObjectIds in backend runtime service files
- No placeholder/coming-soon pages in web or admin apps
- No fake tournament/registration/participant/match/result/standings/bracket data in runtime UI code
- Test fixtures are allowed only in `.spec.ts` files

Enforced by: `phase1-audit-hardening.spec.ts` (backend) + `phase1-guardrails.spec.ts` (admin/web UI).

### Route guardrail policy

**Pre-existing Phase 0 backend routes (not introduced by Slice 11):**

The following routes exist from Phase 0 and were not created or expanded by Slice 11. They are allowlisted in guardrail tests.

| Route                            | Controller                     | Scope                                         |
| -------------------------------- | ------------------------------ | --------------------------------------------- |
| `/admin/v1/analytics`            | `AdminAnalyticsController`     | Auth, OTP, content, media analytics (Phase 0) |
| `/admin/v1/audit-logs`           | `AdminAuditController`         | Read-only audit log list and detail (Phase 0) |
| `/admin/v1/system/notifications` | `AdminNotificationsController` | Read-only notification log viewer (Phase 0)   |

**Permanently forbidden backend routes (never in Phase 1):**

- `/api/v1/notifications` (public notifications product route)
- `/api/v1/notification-preferences`
- `/admin/v1/campaigns`
- `/api/v1/tournaments/:slug/matches/:matchId` (public match detail)
- `/admin/v1/tournaments/:id/operations`
- `/admin/v1/tournaments/:id/preview`

**Permanently forbidden frontend routes (never in Phase 1):**

- `/tournaments/:slug/matches/:matchId` (public match detail page)
- `/games` and `/games/:slug` (public games pages — admin-only)

Enforced by: `phase1-audit-hardening.spec.ts` (backend) + `phase1-guardrails.spec.ts` (admin/web).

### Domain and provider-secret guardrail policy

Runtime/config code must not hardcode:

- `localhost` as an API origin
- `qesb.ir` production domain
- Provider API keys or secrets
- SMS sender IDs or phone numbers
- Analytics secrets

Docs may mention `qesb.ir` as the planned Phase 1 public domain and `stream.ir` as a possible future domain.

Enforced by: `phase1-audit-hardening.spec.ts` + `phase1-guardrails.spec.ts`.

### Future-safe hardening policy

Permanently blocked from Phase 1 backend services:

- Live scoring endpoints or methods
- WebSocket gateways or scoreboards
- Bracket editor (edit/override/drag-drop)
- Swiss or Double Elimination format logic
- Campaign or marketing notification system
- Push notification system (`FCM`, `APNS`)
- In-app notification center
- Tournament analytics dashboard or tournament-specific admin analytics product (Phase 0 analytics at `/admin/v1/analytics` covers auth/OTP/content/media — pre-existing and not expanded by Slice 11)
- Audit dashboard, advanced search, or export product (Phase 0 read-only log viewer at `/admin/v1/audit-logs` is pre-existing and not expanded by Slice 11)

Enforced by: `phase1-audit-hardening.spec.ts` guardrails (permanent).

### No new audit product

Slice 11 does not introduce:

- Public audit log endpoints
- Admin audit dashboard, search, filter, or export UI (beyond Phase 0 read-only log viewer)
- Any new observability platform

The `AuditService` writes to an internal MongoDB collection. Admin audit log read access is provided through the pre-existing `AdminAuditController` at `admin/v1/audit-logs` (Phase 0 infrastructure, read-only list and detail). Slice 11 adds no new audit endpoints or dashboard.

## Task 11.2 — Analytics Event Integration

### Implemented events

| Event                               | Owner                                                              | Trigger                                              |
| ----------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------- |
| `tournament.viewed`                 | `PublicTournamentsController.getBySlug()`                          | `GET /api/v1/tournaments/:slug` (success only)       |
| `tournament.registration_started`   | `PublicTournamentRegistrationsController.getRegistrationContext()` | `GET /api/v1/tournaments/:slug/registration-context` |
| `tournament.registration_completed` | `TournamentRegistrationService.register()`                         | `POST /api/v1/tournaments/:slug/register`            |
| `tournament.bracket_viewed`         | `PublicTournamentBracketController.getBracket()`                   | `GET /api/v1/tournaments/:slug/bracket`              |
| `tournament.match_viewed`           | `PublicTournamentMatchesController.listMatches()`                  | `GET /api/v1/tournaments/:slug/matches`              |

### Event ownership policy

Each event has exactly one canonical backend owner. Events are never fired from multiple competing code paths or from frontend composables.

### Duplicate-fire guardrails

- All events fire from backend controllers (server-side), not frontend composables
- `tournament.viewed`, `tournament.bracket_viewed`, and `tournament.match_viewed` only fire after `isPubliclyVisible()` passes — draft/archived/deleted tournaments do not generate events
- Frontend composables (`useTournamentDetail.ts`, `useTournamentBracket.ts`, `useTournamentMatches.ts`) do not fire analytics events client-side

### Analytics payload safety

| Field             | Handling                                       |
| ----------------- | ---------------------------------------------- |
| `resourceType`    | Always `'tournament'`                          |
| `resourceId`      | Internal MongoDB ObjectId string               |
| `metadata.slug`   | Public tournament slug — no PII                |
| Phone/email       | Never included in any analytics payload        |
| Access tokens     | Never included in any analytics payload        |
| Admin-only fields | Never included in any public analytics payload |
| Credentials/keys  | Never hardcoded in any owner file              |

### Module wiring changes (Task 11.2)

```
PublicTournamentsModule
  └── imports: AnalyticsModule (added for tournament.viewed)

TournamentRegistrationsModule
  └── imports: AnalyticsModule (already present — tournament.registration_completed + registration_started)

TournamentBracketModule
  └── imports: AnalyticsModule (added for tournament.bracket_viewed)

TournamentMatchesModule
  └── imports: AnalyticsModule (added for tournament.match_viewed)
```

### Deferred / Out of scope (Task 11.2)

- Tournament analytics dashboard or tournament-specific reporting (Phase 0 `AdminAnalyticsController` at `/admin/v1/analytics` is pre-existing and covers auth/OTP/content/media — not introduced or expanded by Slice 11)
- Analytics settings or preferences UI
- Client-side analytics tracking
- Public match detail page (`tournament.match_viewed` fires from the matches list endpoint)
- Anonymization or segmentation
- Analytics export
