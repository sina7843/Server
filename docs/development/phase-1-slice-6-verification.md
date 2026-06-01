# Phase 1 / Slice 6 — Verification Guide

## Scope Summary

Slice 6 implements the full registration and participant domain for Phase 1.

| Area                                                             | Implemented | Notes                                                                             |
| ---------------------------------------------------------------- | ----------- | --------------------------------------------------------------------------------- |
| Public registration API (submit, get, update, withdraw)          | Yes         | `/api/v1/tournaments/:slug/register`, `/api/v1/tournaments/:slug/my-registration` |
| Admin registration API (list, get, approve, reject, cancel)      | Yes         | `/admin/v1/tournaments/:id/registrations`                                         |
| Admin participant API (list, get, update, remove, disqualify)    | Yes         | `/admin/v1/tournaments/:id/participants`                                          |
| Public registration UI (`/tournaments/:slug/register`)           | Yes         | Noindex, SDK-only, all states                                                     |
| Public my-registration UI (`/tournaments/:slug/my-registration`) | Yes         | Noindex, SDK-only, all states                                                     |
| Registration SDK methods                                         | Yes         | `register`, `getMyRegistration`, `updateMyRegistration`, `withdrawMyRegistration` |
| Team embedded registration                                       | Yes         | Team data embedded in `TournamentRegistration`                                    |
| Participant derived projection                                   | Yes         | Derived from approved registrations                                               |
| Public tournament detail page (`/tournaments/:slug`)             | No          | Deferred to Slice 8                                                               |
| Public participant listing page                                  | No          | Deferred to future slice                                                          |
| Public match/result/standing/bracket pages                       | No          | Out of scope Phase 1                                                              |
| Match generation/management                                      | No          | Permanently out of scope                                                          |
| Result entry / standing calculation                              | No          | Permanently out of scope                                                          |
| Bracket collection/model/editor                                  | No          | Permanently forbidden                                                             |
| Swiss / Double Elimination formats                               | No          | Permanently unsupported                                                           |
| Advanced Bracket Editor                                          | No          | Permanently out of scope                                                          |
| Independent Team/Club/Organization model                         | No          | Permanently forbidden                                                             |
| Prize / payment / shop                                           | No          | Permanently out of scope                                                          |
| Registration notifications (submitted/approved/rejected)         | No          | Deferred to Slice 11                                                              |
| Marketing/campaign/push notifications                            | No          | Permanently out of scope                                                          |
| Fake/seed registration or participant data                       | No          | Permanently forbidden                                                             |
| Admin `/tournaments/:id/operations` standalone route             | No          | Hub is on detail page                                                             |
| Admin `/tournaments/:id/preview` standalone route                | No          | Permanently forbidden                                                             |
| Public `/tournaments/:slug/matches/:matchId` route               | No          | Permanently forbidden                                                             |

---

## Registration API Summary

**Public controller:** `apps/api/src/tournaments/public-tournament-registrations.controller.ts`  
**Route prefix:** `api/v1/tournaments/:slug`  
**Auth:** Bearer token required for all registration endpoints

### Public Endpoints

| Method  | Path                                                 | Description                                |
| ------- | ---------------------------------------------------- | ------------------------------------------ |
| `POST`  | `/api/v1/tournaments/:slug/register`                 | Submit a registration (individual or team) |
| `GET`   | `/api/v1/tournaments/:slug/my-registration`          | Get authenticated user's registration      |
| `PATCH` | `/api/v1/tournaments/:slug/my-registration`          | Update team data (team registrations only) |
| `POST`  | `/api/v1/tournaments/:slug/my-registration/withdraw` | Withdraw registration                      |

**Admin controller:** `apps/api/src/admin/tournament-registrations/admin-tournament-registrations.controller.ts`  
**Route prefix:** `admin/v1/tournaments/:id/registrations`  
**Guards:** `AccessTokenGuard`, `PermissionGuard`

### Admin Registration Endpoints

| Method | Path                                                              | Permission                       | Description                      |
| ------ | ----------------------------------------------------------------- | -------------------------------- | -------------------------------- |
| `GET`  | `/admin/v1/tournaments/:id/registrations`                         | `TOURNAMENT_REGISTRATION_READ`   | List with pagination and filters |
| `GET`  | `/admin/v1/tournaments/:id/registrations/:registrationId`         | `TOURNAMENT_REGISTRATION_READ`   | Get single registration          |
| `POST` | `/admin/v1/tournaments/:id/registrations/:registrationId/approve` | `TOURNAMENT_REGISTRATION_MANAGE` | Approve a registration           |
| `POST` | `/admin/v1/tournaments/:id/registrations/:registrationId/reject`  | `TOURNAMENT_REGISTRATION_MANAGE` | Reject with optional reason      |
| `POST` | `/admin/v1/tournaments/:id/registrations/:registrationId/cancel`  | `TOURNAMENT_REGISTRATION_MANAGE` | Cancel a registration            |

**Admin participant controller:** `apps/api/src/admin/tournament-participants/admin-tournament-participants.controller.ts`  
**Route prefix:** `admin/v1/tournaments/:id/participants`

### Admin Participant Endpoints

| Method  | Path                                                                | Permission                      | Description                |
| ------- | ------------------------------------------------------------------- | ------------------------------- | -------------------------- |
| `GET`   | `/admin/v1/tournaments/:id/participants`                            | `TOURNAMENT_PARTICIPANT_READ`   | List derived participants  |
| `GET`   | `/admin/v1/tournaments/:id/participants/:registrationId`            | `TOURNAMENT_PARTICIPANT_READ`   | Get single participant     |
| `PATCH` | `/admin/v1/tournaments/:id/participants/:registrationId`            | `TOURNAMENT_PARTICIPANT_MANAGE` | Update seed / display name |
| `POST`  | `/admin/v1/tournaments/:id/participants/:registrationId/remove`     | `TOURNAMENT_PARTICIPANT_MANAGE` | Remove participant         |
| `POST`  | `/admin/v1/tournaments/:id/participants/:registrationId/disqualify` | `TOURNAMENT_PARTICIPANT_MANAGE` | Disqualify participant     |

---

## Registration Status Model

| Status       | Who Sets It     | Description                                             |
| ------------ | --------------- | ------------------------------------------------------- |
| `submitted`  | User (register) | Initial state; awaiting admin review                    |
| `approved`   | Admin           | Accepted into tournament                                |
| `rejected`   | Admin           | Rejected; blocks re-registration (conservative default) |
| `waitlisted` | Admin           | Queued; counts toward capacity                          |
| `withdrawn`  | User            | Explicitly withdrawn; re-registration allowed           |
| `cancelled`  | Admin           | Admin-cancelled; re-registration allowed                |

---

## Duplicate Registration Policy

**File:** `apps/api/src/tournament-registrations/tournament-registration-policy.ts`

One active registration per user per tournament. A new registration is blocked if the user already has a registration with status `submitted`, `approved`, `waitlisted`, or `rejected`.

```
Blocking statuses:   submitted | approved | waitlisted | rejected
Allowing statuses:   withdrawn | cancelled
```

The blocking of `rejected` is a conservative default: admin explicitly rejected the registration for a reason, so re-registration is not automatically permitted. This policy is explicit in the source and the tests.

---

## Withdrawn / Cancelled / Rejected Re-registration Policy

| Prior Status | Re-registration Allowed | Rationale                                              |
| ------------ | ----------------------- | ------------------------------------------------------ |
| `withdrawn`  | Yes                     | User explicitly withdrew; re-registration is safe      |
| `cancelled`  | Yes                     | Admin cancelled (cleanup); re-registration is safe     |
| `rejected`   | No                      | Conservative: admin rejected for a reason; block retry |

---

## Individual / Team Embedded Registration Policy

Team data is embedded inside `TournamentRegistration`. No separate Team collection exists.

**Individual registration:**

- `type: 'individual'`
- `teamName` and `members` fields are stripped (silently ignored if provided)

**Team registration:**

- `type: 'team'`
- `teamName` required (non-empty string, max 80 chars)
- `members` optional array of `{ userId, displayName, role? }`
- No phone, email, or contact data in member objects

**Participant type compatibility:**

- `individual` tournament: only individual registrations accepted
- `team` tournament: only team registrations accepted
- `both` tournament: both types accepted

---

## Team Member Privacy Policy

- No phone or email fields in `RegistrationMember` schema
- `TeamRegistrationMemberDto` contains only: `userId`, `displayName`, `role?`
- Public registration projections do not expose `userId` of team members
- `rejectedReason` is never exposed in public projections
- Internal timestamps (`participantRemovedAt`, `participantDisqualifiedAt`) are never exposed in public projections

---

## No Independent Team / Club / Organization Policy

No separate Team, Club, or Organization model exists.  
Team registration data is embedded in `TournamentRegistration`.  
No Team/Club profile pages exist.  
This is a permanent constraint for Phase 1.

---

## Participant Projection Policy and Implementation Choice

**Implementation choice:** Participants are **derived projections** from approved `TournamentRegistration` documents. No separate `TournamentParticipant` collection exists.

**Derivation rules:**

| Condition                                        | Derived Status                  |
| ------------------------------------------------ | ------------------------------- |
| `participantRemovedAt` is set                    | `removed`                       |
| `participantDisqualifiedAt` is set               | `disqualified`                  |
| `status === 'withdrawn'` AND `approvedAt` is set | `withdrawn` (was once approved) |
| `status === 'approved'`, no override             | `active`                        |

A registration is considered a "participant" if its status is `approved`, or if it was `approved` and the user later withdrew (has `approvedAt`). Submitted, rejected, waitlisted, and cancelled registrations that were never approved are not participants.

---

## Participant Status Policy

**Locked statuses (Phase 1):** `active` | `withdrawn` | `disqualified` | `removed`

`eliminated` is **not** a valid participant status and must never appear in participant code.

Remove and disqualify are explicit admin actions with dedicated service methods and endpoints. There is no generic status patch for participants.

---

## Admin Participant API Summary

The admin participant API operates as a projection layer over approved registrations. Fields updated by admin (`seed`, `participantDisplayName`, `participantRemovedAt`, `participantDisqualifiedAt`) are stored on the `TournamentRegistration` document.

No separate participant collection is created.

---

## No Admin Registration / Participant UI in Slice 6

Slice 6 does not include an admin UI for registration or participant management. Admin actions are available via API only. Admin UI is deferred to a future slice.

---

## Notification Behavior and Deferrals

Transactional notifications for registration events (submitted, approved, rejected) are **deferred to Slice 11**. The current `NotificationService` handles only auth-flow SMS and does not support registration notifications.

**In scope for Slice 6:** none (stubs only, with `// Notification stub: ... (Slice 11)` comments)

**Permanently out of scope:**

- Marketing SMS / campaign system
- Push notifications (FCM/APNS)
- In-app notification center
- Broadcast messages

---

## Audit Behavior and Sensitive-data Policy

Audit events fire for all registration state changes via `AuditService.log()` as fire-and-forget (`void`).

| Event                      | Trigger                         |
| -------------------------- | ------------------------------- |
| `REGISTRATION_SUBMITTED`   | User submits a new registration |
| `REGISTRATION_APPROVED`    | Admin approves                  |
| `REGISTRATION_REJECTED`    | Admin rejects                   |
| `REGISTRATION_WITHDRAWN`   | User withdraws                  |
| `REGISTRATION_CANCELLED`   | Admin cancels                   |
| `REGISTRATION_UPDATED`     | User updates team data          |
| `PARTICIPANT_REMOVED`      | Admin removes participant       |
| `PARTICIPANT_DISQUALIFIED` | Admin disqualifies participant  |

**Sensitive data policy:** Audit log `after` fields include only non-sensitive state. No tokens, passwords, phone numbers, or contact data are logged.

---

## Analytics Event Names

| Event                               | Source                                   | Notes               |
| ----------------------------------- | ---------------------------------------- | ------------------- |
| `tournament.registration_started`   | Frontend (user opens registration form)  | Exact name required |
| `tournament.registration_completed` | Backend (successful registration submit) | Exact name required |

**Forbidden alternatives:**

- `registration_started` — missing namespace prefix
- `registration_completed` — missing namespace prefix
- `tournament_registration_started` — underscore instead of dot namespace
- `tournament_registration_completed` — underscore instead of dot namespace
- `tournament.registrationStarted` — camelCase not allowed

---

## Public Registration Route Noindex Policy

Both public registration routes are noindex to prevent search engine indexing of user-specific pages:

| Route                                | Noindex | Rationale                 |
| ------------------------------------ | ------- | ------------------------- |
| `/tournaments/:slug/register`        | Yes     | User-specific action page |
| `/tournaments/:slug/my-registration` | Yes     | User-specific status page |

Unrelated public content pages (news, articles, guides, search, home) must **not** be noindexed. Only registration-specific pages carry the noindex tag.

---

## Route Guardrails

### Allowed Public Routes (Slice 6)

```
/tournaments/:slug/register           — noindex, auth handled inline
/tournaments/:slug/my-registration    — noindex, auth handled inline
```

### TEMPORARY Route Preconditions (remove when feature slice lands)

The following routes do not exist in Slice 6. These checks are labeled TEMPORARY in guardrail specs and must be removed when the corresponding slice adds the route.

| Route                                    | Expected in Slice | Guardrail Label |
| ---------------------------------------- | ----------------- | --------------- |
| `/tournaments/:slug`                     | Slice 8           | TEMPORARY       |
| `/tournaments/:slug/participants`        | Future            | TEMPORARY       |
| `/tournaments/:slug/matches`             | Future            | TEMPORARY       |
| `/tournaments/:slug/results`             | Future            | TEMPORARY       |
| `/tournaments/:slug/standings`           | Future            | TEMPORARY       |
| `/tournaments/:slug/bracket`             | Future            | TEMPORARY       |
| `/api/v1/tournaments/:slug/participants` | Future            | TEMPORARY       |
| `/api/v1/tournaments/:slug/matches`      | Future            | TEMPORARY       |
| `/api/v1/tournament-results`             | Future            | TEMPORARY       |
| `/api/v1/tournament-standings`           | Future            | TEMPORARY       |

### PERMANENT Forbidden Routes

These routes are permanently forbidden and must never be created.

| Route                                      | Reason                                                  |
| ------------------------------------------ | ------------------------------------------------------- |
| `GET /tournaments/:slug/matches/:matchId`  | Public match detail is permanently forbidden in Phase 1 |
| `GET /admin/v1/tournaments/:id/operations` | Hub is on detail page; standalone is forbidden          |
| `GET /admin/v1/tournaments/:id/preview`    | Permanently forbidden                                   |

---

## Out-of-Scope List (Slice 6)

- Independent Team / Club / Organization model or UI
- Team / Club profile pages or social pages
- Match generation or match management
- Result entry or result history
- Standing calculation or standing display
- Bracket projection, collection, model, or editor
- Swiss format
- Double Elimination format
- Advanced Bracket Editor
- Prize, payment, or shop features
- Streaming or live scoring
- Registration notifications (deferred to Slice 11)
- Marketing/campaign/push/in-app notifications
- Admin registration/participant UI pages
- Public tournament detail page (`/tournaments/:slug`)
- Fake or seed registration/participant data
- Production deployment

---

## Domain-Awareness Note

Phase 1 is domain-aware but not production-deployed.

**Planned public domain:** `qesb.ir`  
**Possible future domain:** `stream.ir`

All runtime and configuration code must not hardcode `localhost`, `qesb.ir`, or any fixed API origin. Docs may reference these domains as planned deployment targets.

---

## Verification Commands

Run all of the following and confirm zero failures:

```bash
# API
pnpm --filter @dragon/api lint
pnpm --filter @dragon/api typecheck
pnpm --filter @dragon/api test
pnpm --filter @dragon/api build

# Web
pnpm --filter @dragon/web lint
pnpm --filter @dragon/web typecheck
pnpm --filter @dragon/web test
pnpm --filter @dragon/web build

# SDK and Types
pnpm --filter @dragon/sdk test
pnpm --filter @dragon/types test

# Monorepo
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm format:check
```

### Slice 6 Test Files

| File                                                                               | Coverage Area                                                                                                                                                                  |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `apps/api/src/tournament-registrations/tournament-registration-policy.spec.ts`     | Duplicate/re-registration policy, capacity, admin transitions, user withdraw, participant type compatibility                                                                   |
| `apps/api/src/tournament-registrations/tournament-registration.service.spec.ts`    | Service behavior (register, update, withdraw, admin actions)                                                                                                                   |
| `apps/api/src/tournament-registrations/tournament-registration.guardrails.spec.ts` | Schema fields, Team/Club/Org guards, payment/prize/shop, member privacy, analytics event names, module structure                                                               |
| `apps/api/src/tournament-registrations/slice6-closeout.spec.ts`                    | Bracket/Swiss/DE absent, permissions centralized, analytics exact, audit actions, deferred notifications, re-registration policy documented, fake data, participant derivation |
| `apps/api/src/tournament-participants/tournament-participant.guardrails.spec.ts`   | Derived projection, no schema, locked statuses, no eliminated, remove/disqualify explicit, permissions, audit hooks, module structure                                          |
| `apps/api/src/tournament-participants/tournament-participant.service.spec.ts`      | Participant service behavior                                                                                                                                                   |
| `apps/web/features/registrations/registration-api.spec.ts`                         | SDK client factory, all 4 registration methods, auth headers, error codes, no hardcoded URLs                                                                                   |
| `apps/web/features/registrations/registration-guardrails.spec.ts`                  | Required routes exist, TEMPORARY/PERMANENT labels, noindex, SDK-only, no payment/prize/shop, no fake data, auth state handling, all UI states covered                          |
| `apps/web/features/registrations/slice6-hardening.spec.ts`                         | Content pages not noindexed, admin forbidden routes, match detail permanent ban, registration pages noindex, SDK-only, no hardcoded origins                                    |
| `apps/web/features/guardrails/phase1-guardrails.spec.ts`                           | Analytics event constants, SDK client surface, forbidden match detail method, search surface, unsupported formats                                                              |

---

## Verification Checklist

- [ ] No independent Team schema/model exists
- [ ] No independent Club schema/model exists
- [ ] No Organization registration model exists
- [ ] Team registration data is embedded in `TournamentRegistration`
- [ ] No phone/email in team member schema or public projections
- [ ] Duplicate registration policy is explicit: submitted/approved/waitlisted/rejected block
- [ ] Withdrawn re-registration is allowed (tested)
- [ ] Cancelled re-registration is allowed (tested)
- [ ] Rejected re-registration is blocked (conservative; tested)
- [ ] Capacity enforcement is implemented (countActive vs tournament.capacity)
- [ ] `registration_open` status is required to register (checked in service)
- [ ] Registration window dates are enforced if set (`registrationOpenAt`, `registrationCloseAt`)
- [ ] Participant implementation choice is documented (derived projection)
- [ ] No separate TournamentParticipant schema exists
- [ ] Participant statuses are locked: `active` | `withdrawn` | `disqualified` | `removed`
- [ ] `eliminated` is not a participant status anywhere
- [ ] Remove and disqualify are explicit service methods (no generic status patch)
- [ ] No match/result/standing/bracket implementation exists
- [ ] No bracket collection or model file exists in API src
- [ ] Tournament format enum does not include `swiss` or `double_elimination`
- [ ] No Advanced Bracket Editor model or UI
- [ ] Public registration route `/tournaments/:slug/register` exists and is noindex
- [ ] Public registration route `/tournaments/:slug/my-registration` exists and is noindex
- [ ] Unrelated content/news/articles pages are NOT noindexed
- [ ] No full tournament detail page `/tournaments/:slug` exists (TEMPORARY check)
- [ ] Permanent forbidden route `/tournaments/:slug/matches/:matchId` does not exist
- [ ] Permanent forbidden admin route `/tournaments/:id/operations` does not exist
- [ ] Permanent forbidden admin route `/tournaments/:id/preview` does not exist
- [ ] TEMPORARY route preconditions are labeled in guardrail spec files
- [ ] No fake registration data
- [ ] No fake participant data
- [ ] No direct `$fetch`/`axios`/`fetch` in registration web pages
- [ ] No raw permission strings in admin registration/participant controllers
- [ ] Analytics event name is exactly `tournament.registration_completed` (backend)
- [ ] Analytics event name is exactly `tournament.registration_started` (frontend constant)
- [ ] No alternative analytics event name spellings used
- [ ] Registration notifications deferred to Slice 11 (stub comments only)
- [ ] No marketing/campaign/push/in-app notification scope
- [ ] Audit calls are fire-and-forget (`void`)
- [ ] No hardcoded `localhost` or `qesb.ir` in registration/participant runtime code
- [ ] `docs/development/phase-1-slice-6-verification.md` exists
- [ ] All verification commands pass
