# Phase 1 / Slice 4 — Verification Guide

## Scope Summary

Slice 4 implements the internal Tournament persistence layer, lifecycle policy, validation
helpers, and projection helpers. No external routes are exposed. `TournamentsModule` is
deliberately **not** registered in `AppModule` — the admin CRUD controller arrives in Slice 5.

| Area                                      | Implemented | Notes                                          |
| ----------------------------------------- | ----------- | ---------------------------------------------- |
| `TournamentSchema` (Mongoose)             | Yes         | Collection `tournaments`, timestamps, indexes  |
| `TournamentRepository`                    | Yes         | CRUD + soft-delete, filter list                |
| `TournamentService`                       | Yes         | create, update, transition, softDelete         |
| `TournamentsModule`                       | Yes         | Exports `TournamentService`; no controllers    |
| `tournament-policy.ts` (lifecycle)        | Yes         | 8 statuses, 3 formats, transition map          |
| `tournament-validation.ts` (field guards) | Yes         | title, gameId, format, status, capacity, dates |
| `tournament-projection.ts` (DTOs)         | Yes         | public summary, public detail, admin DTO       |
| Admin tournament CRUD controller          | No          | Deferred to Slice 5                            |
| Public tournament controller              | No          | Deferred to Slice 8                            |
| `TournamentsModule` in `AppModule`        | No          | Deferred to Slice 5                            |
| Bracket collection / bracket model        | No          | Permanently out of scope for Slice 4           |
| Registration / participants / matches     | No          | Out of scope for Phase 1 Slice 4               |
| Prize / payment / shop / streaming        | No          | Permanently forbidden                          |
| Fake / seed tournament data               | No          | Permanently forbidden                          |

---

## Tournament Domain Model

**File:** `apps/api/src/tournaments/tournament.schema.ts`  
**Collection:** `tournaments`  
**Mongoose options:** `{ collection: 'tournaments', timestamps: true }`

### Fields

| Field                 | Type                        | Required | Default        | Notes                          |
| --------------------- | --------------------------- | -------- | -------------- | ------------------------------ |
| `title`               | `string`                    | Yes      | —              | trimmed                        |
| `slug`                | `string`                    | Yes      | —              | trimmed; human-readable        |
| `slugNormalized`      | `string`                    | Yes      | —              | lowercase; unique index        |
| `description`         | `string`                    | No       | —              | trimmed                        |
| `gameId`              | `string`                    | Yes      | —              | relation to `games` collection |
| `format`              | `TournamentFormat`          | Yes      | —              | enum: 3 Phase 1 formats        |
| `status`              | `TournamentStatus`          | Yes      | `'draft'`      | enum: 8 Phase 1 statuses       |
| `participantType`     | `TournamentParticipantType` | Yes      | `'individual'` | internal; not in public DTOs   |
| `capacity`            | `number`                    | Yes      | —              | min: 0                         |
| `registrationOpenAt`  | `Date`                      | No       | —              |                                |
| `registrationCloseAt` | `Date`                      | No       | —              |                                |
| `startsAt`            | `Date`                      | No       | —              |                                |
| `endsAt`              | `Date`                      | No       | —              |                                |
| `rules`               | `string`                    | No       | —              | trimmed                        |
| `publishedAt`         | `Date`                      | No       | —              | set on first → `published`     |
| `cancelledAt`         | `Date`                      | No       | —              | set on → `cancelled`           |
| `deletedAt`           | `Date`                      | No       | —              | set by soft-delete             |
| `createdAt`           | `Date`                      | Auto     | —              | mongoose timestamps            |
| `updatedAt`           | `Date`                      | Auto     | —              | mongoose timestamps            |

### Indexes

| Field            | Type       | Options        |
| ---------------- | ---------- | -------------- |
| `slugNormalized` | Ascending  | `unique: true` |
| `gameId`         | Ascending  | —              |
| `status`         | Ascending  | —              |
| `format`         | Ascending  | —              |
| `deletedAt`      | Ascending  | —              |
| `createdAt`      | Descending | —              |

---

## Repository & Service Foundation

**Files:** `tournament.repository.ts`, `tournament.service.ts`

### Repository methods

| Method         | Description                                                              |
| -------------- | ------------------------------------------------------------------------ |
| `findById`     | Find by ObjectId or string id; filters soft-deleted                      |
| `findBySlug`   | Find by `slugNormalized`; filters soft-deleted                           |
| `existsBySlug` | Check slug uniqueness; excludes current id on update                     |
| `list`         | Paginated filter list — gameId, status, format, regOpen                  |
| `create`       | Insert with defaults: `status: 'draft'`, `participantType: 'individual'` |
| `update`       | `findOneAndUpdate` with `$set`, returns new doc                          |
| `softDelete`   | Sets `deletedAt: new Date()` — never removes the document                |

### Service methods

| Method       | Description                                                            |
| ------------ | ---------------------------------------------------------------------- |
| `findById`   | Delegates to repository                                                |
| `list`       | Delegates to repository                                                |
| `create`     | Validates gameId active, dates, slug uniqueness; delegates to repo     |
| `update`     | Conditionally validates gameId, dates, slug; delegates to repo         |
| `transition` | Validates from→to edge, sets lifecycle timestamps, persists new status |
| `softDelete` | Delegates to repo; throws `NotFoundException` if not found             |

### `transition` lifecycle-managed timestamps

| Transition to | Timestamp set                      |
| ------------- | ---------------------------------- |
| `published`   | `publishedAt` (first publish only) |
| `cancelled`   | `cancelledAt`                      |
| Any other     | No extra timestamp                 |

Audit emission for lifecycle transitions is deferred to **Slice 5** when the admin
controller owns the external action.

---

## Status Policy

**File:** `apps/api/src/tournaments/tournament-policy.ts`

### Locked Phase 1 statuses (exactly 8)

`draft`, `published`, `registration_open`, `registration_closed`, `in_progress`, `completed`,
`cancelled`, `archived`

Aliases `open`, `closed`, `active`, `inactive`, `published_open` are **not** in the allowlist
and will be rejected by `isValidTournamentStatus`.

### Lifecycle transition map

| From                  | Allowed `to` values                  |
| --------------------- | ------------------------------------ |
| `draft`               | `published`, `cancelled`, `archived` |
| `published`           | `registration_open`, `cancelled`     |
| `registration_open`   | `registration_closed`, `cancelled`   |
| `registration_closed` | `in_progress`, `cancelled`           |
| `in_progress`         | `completed`, `cancelled`             |
| `completed`           | `archived`                           |
| `cancelled`           | `archived`                           |
| `archived`            | _(none)_ — terminal state            |

`assertTransition(from, to)` throws `UnprocessableEntityException` for any edge not in the
table above.

---

## Format Allowlist

**File:** `apps/api/src/tournaments/tournament-policy.ts`

### Supported Phase 1 formats (exactly 3)

| Format               | Notes                |
| -------------------- | -------------------- |
| `single_elimination` | Supported in Phase 1 |
| `round_robin`        | Supported in Phase 1 |
| `manual`             | Supported in Phase 1 |

### Permanently unsupported formats

| Format                    | Reason                                      |
| ------------------------- | ------------------------------------------- |
| `swiss`                   | Not in Phase 1 scope; rejected by validator |
| `double_elimination`      | Not in Phase 1 scope; rejected by validator |
| `advanced_bracket_editor` | Not in Phase 1 scope; rejected by validator |

`assertTournamentFormat` throws `UnprocessableEntityException` for any value outside the
3-item allowlist. The policy source contains no pairing logic, bracket scaffolding, or
route handlers for these formats.

---

## Validation Helpers

**File:** `apps/api/src/tournaments/tournament-validation.ts`

| Helper                     | Throws                         | Rule                                          |
| -------------------------- | ------------------------------ | --------------------------------------------- |
| `assertTournamentTitle`    | `BadRequestException`          | Non-null, non-empty, non-whitespace string    |
| `assertTournamentGameId`   | `BadRequestException`          | Non-null, non-empty string                    |
| `assertTournamentFormat`   | `UnprocessableEntityException` | Must be in Phase 1 format allowlist           |
| `assertTournamentStatus`   | `UnprocessableEntityException` | Must be in locked 8-status set                |
| `assertTournamentCapacity` | `BadRequestException`          | Positive integer ≥ 1; rejects floats, strings |
| `assertRegistrationWindow` | `UnprocessableEntityException` | `closeAt` must be strictly after `openAt`     |
| `assertTournamentSchedule` | `UnprocessableEntityException` | `endsAt` must be strictly after `startsAt`    |

Date-window validators pass when either or both dates are absent.

---

## Projection Rules

**File:** `apps/api/src/tournaments/tournament-projection.ts`

### `isPubliclyVisible`

Returns `true` only when:

- `doc.deletedAt == null` **and**
- `doc.status` ∈ `{ published, registration_open, registration_closed, in_progress, completed }`

`draft`, `archived`, and `cancelled` are hidden from public consumers. Cancelled public
behavior (whether to surface cancelled tournaments) is a **Slice 8 decision** — excluded
here by default.

### `toPublicTournamentSummary` → `TournamentSummaryDto`

Includes: `id`, `gameId`, `title`, `slug`, `format`, `status`, `capacity`, `startsAt?`,
`publishedAt?`

Excludes: `cancelledAt`, `deletedAt`, `slugNormalized`, `participantType`, `description`,
`rules`, `createdAt`, `updatedAt`, dates other than `startsAt`/`publishedAt`

### `toPublicTournamentDetail` → `TournamentDetailDto`

Includes: `id`, `gameId`, `title`, `slug`, `format`, `status`, `capacity`, `description?`,
`registrationOpenAt?`, `registrationCloseAt?`, `startsAt?`, `endsAt?`, `rules?`,
`publishedAt?`, `createdAt`, `updatedAt`

Excludes: `cancelledAt`, `deletedAt`, `slugNormalized`, `participantType`

### `toAdminTournamentDto` → `TournamentDto`

Same as detail + adds `cancelledAt?`

Excludes: `deletedAt`, `slugNormalized`, `participantType`

---

## `gameId` Relation Validation

`TournamentService` validates the referenced game on `create` and on `update` when `gameId`
is provided:

1. Game must exist (`GameService.findById` returns non-null)
2. Game `status` must be `'active'`

Missing or inactive game → `UnprocessableEntityException`.

`GameService` is injected via `GamesModule`, which is imported in `TournamentsModule`.

---

## No Bracket Collection Policy

A separate `brackets` MongoDB collection and `BracketSchema` are **permanently out of scope**
for Slice 4. Guardrail tests in `tournament.guardrails.spec.ts` verify:

- No `bracket.schema.ts` or `tournament-bracket.schema.ts` file exists
- No bracket references in schema, module, service, or repository source

This guardrail is **permanent** — it should never be removed even when bracket UI is added
in a future slice, because that slice will use a different collection design decision.

---

## External API Boundary

| Layer                      | Slice   | Status  |
| -------------------------- | ------- | ------- |
| Admin tournament routes    | Slice 5 | Not yet |
| `TournamentsModule` in App | Slice 5 | Not yet |
| Public tournament routes   | Slice 8 | Not yet |
| Public tournament filters  | Slice 8 | Not yet |

`TournamentsModule` intentionally has no `controllers:` array — the service is only
exported for future controller injection.

---

## Domain-Awareness Policy

Runtime TypeScript files in the tournaments domain must not hardcode any API origin.
All origins are config-driven via environment variables.

| Runtime file               | `localhost` | `qesb.ir` |
| -------------------------- | ----------- | --------- |
| `tournament.schema.ts`     | Absent      | Absent    |
| `tournament-policy.ts`     | Absent      | Absent    |
| `tournament-validation.ts` | Absent      | Absent    |
| `tournament-projection.ts` | Absent      | Absent    |
| `tournament.service.ts`    | Absent      | Absent    |
| `tournament.repository.ts` | Absent      | Absent    |

---

## Out of Scope in Slice 4

The following are **not implemented** and must not be added without a corresponding task:

- Registration, participant, match, standings, or results sub-resources
- Bracket collection, bracket schema, or bracket model
- Prize, payment, shop, or streaming fields
- Admin CRUD HTTP routes or decorators
- Public HTTP routes or decorators
- Tournament admin pages in `apps/admin`
- Tournament public pages in `apps/web`
- Fake or seed tournament data
- `swiss`, `double_elimination`, or `advanced_bracket_editor` format logic

---

## Spec Coverage

| File                            | Tests | Covers                                                              |
| ------------------------------- | ----- | ------------------------------------------------------------------- |
| `tournament-policy.spec.ts`     | 68    | Status allowlist, format allowlist, transitions, validation helpers |
| `tournament-projection.spec.ts` | 30    | isPubliclyVisible, public/admin projections, scope guardrails       |
| `tournament.service.spec.ts`    | 43    | create, update, transition, softDelete, gameId validation           |
| `tournament.guardrails.spec.ts` | 40    | Schema fields, indexes, permanent guardrails, slice-4-preconditions |

---

## Verification Commands

```bash
# API — lint, typecheck, test, build
pnpm --filter @dragon/api lint
pnpm --filter @dragon/api typecheck
pnpm --filter @dragon/api test
pnpm --filter @dragon/api build

# Types
pnpm --filter @dragon/types test

# SDK
pnpm --filter @dragon/sdk test

# Monorepo format check
pnpm format:check
```

### Run only tournament specs

```bash
pnpm --filter @dragon/api test -- --testPathPattern="tournament"
```

### Expected output

All tournament spec files pass. `TournamentsModule` does not appear in `AppModule` imports.
No bracket, match, prize, payment, or shop identifiers appear in any tournament source file.
