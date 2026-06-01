# Phase 1 / Slice 5 — Verification Guide

## Scope Summary

Slice 5 implements the admin tournament management API and UI.
The tournament domain backend (schema, service, repository, lifecycle policy) was established in Slice 4.
Slice 5 wires it to HTTP endpoints and an admin interface.

No public tournament routes are exposed in Slice 5. No registration, participant, match, result, standings, or bracket features are implemented.

| Area                                                  | Implemented | Notes                                                              |
| ----------------------------------------------------- | ----------- | ------------------------------------------------------------------ |
| Admin tournament REST API (13 endpoints)              | Yes         | `/admin/v1/tournaments` prefix                                     |
| Admin tournament list page (`/tournaments`)           | Yes         | Status + format filters, pagination                                |
| Admin tournament create page (`/tournaments/new`)     | Yes         | Full form with game selector                                       |
| Admin tournament detail/hub page (`/tournaments/:id`) | Yes         | Operational hub with lifecycle actions                             |
| Admin tournament edit page (`/tournaments/:id/edit`)  | Yes         | Non-lifecycle fields only                                          |
| Lifecycle action endpoints (7 explicit endpoints)     | Yes         | publish, open/close-registration, start, complete, cancel, archive |
| Tournament nav item in admin sidebar                  | Yes         | Gated by `TOURNAMENT_READ` permission                              |
| `TournamentsModule` wired into `AppModule`            | Yes         | Required for Slice 5                                               |
| `AdminTournamentsModule` wired into `AppModule`       | Yes         | Required for Slice 5                                               |
| Public tournament listing/detail pages                | No          | Deferred to Slice 8                                                |
| Registration backend/frontend                         | No          | Out of scope for Phase 1 Slice 5                                   |
| Participant management                                | No          | Out of scope for Phase 1 Slice 5                                   |
| Match generation/management                           | No          | Out of scope for Phase 1 Slice 5                                   |
| Result entry                                          | No          | Out of scope for Phase 1 Slice 5                                   |
| Standing calculation                                  | No          | Out of scope for Phase 1 Slice 5                                   |
| Bracket projection/collection/editor                  | No          | Permanently forbidden in Slice 5                                   |
| `/tournaments/:id/operations` standalone route        | No          | Hub is embedded on detail page                                     |
| `/tournaments/:id/preview` standalone route           | No          | Permanently forbidden                                              |
| Swiss / Double Elimination formats                    | No          | Permanently unsupported                                            |
| Advanced Bracket Editor                               | No          | Permanently out of scope                                           |
| Prize / payment / shop                                | No          | Permanently out of scope                                           |
| Streaming / live scoring                              | No          | Permanently out of scope                                           |
| Fake/seed tournament data                             | No          | Permanently forbidden                                              |

---

## Admin Tournament API Summary

**File:** `apps/api/src/admin/tournaments/admin-tournaments.controller.ts`  
**Route prefix:** `admin/v1/tournaments`  
**Guards:** `AccessTokenGuard`, `PermissionGuard`  
**Auth:** Bearer token required

### Endpoints

| Method   | Path                                           | Permission           | Description                         |
| -------- | ---------------------------------------------- | -------------------- | ----------------------------------- |
| `GET`    | `/admin/v1/tournaments`                        | `TOURNAMENT_READ`    | List with filters and pagination    |
| `POST`   | `/admin/v1/tournaments`                        | `TOURNAMENT_CREATE`  | Create a new tournament             |
| `GET`    | `/admin/v1/tournaments/:id`                    | `TOURNAMENT_READ`    | Get a single tournament             |
| `PATCH`  | `/admin/v1/tournaments/:id`                    | `TOURNAMENT_UPDATE`  | Update non-lifecycle fields         |
| `DELETE` | `/admin/v1/tournaments/:id`                    | `TOURNAMENT_ARCHIVE` | Soft-delete a tournament            |
| `POST`   | `/admin/v1/tournaments/:id/publish`            | `TOURNAMENT_PUBLISH` | Transition to `published`           |
| `POST`   | `/admin/v1/tournaments/:id/open-registration`  | `TOURNAMENT_PUBLISH` | Transition to `registration_open`   |
| `POST`   | `/admin/v1/tournaments/:id/close-registration` | `TOURNAMENT_PUBLISH` | Transition to `registration_closed` |
| `POST`   | `/admin/v1/tournaments/:id/start`              | `TOURNAMENT_PUBLISH` | Transition to `in_progress`         |
| `POST`   | `/admin/v1/tournaments/:id/complete`           | `TOURNAMENT_PUBLISH` | Transition to `completed`           |
| `POST`   | `/admin/v1/tournaments/:id/cancel`             | `TOURNAMENT_CANCEL`  | Transition to `cancelled`           |
| `POST`   | `/admin/v1/tournaments/:id/archive`            | `TOURNAMENT_ARCHIVE` | Transition to `archived`            |

### Query Parameters (GET list)

| Parameter          | Type             | Description                  |
| ------------------ | ---------------- | ---------------------------- |
| `gameId`           | string           | Filter by game               |
| `status`           | TournamentStatus | Filter by status             |
| `format`           | TournamentFormat | Filter by format             |
| `registrationOpen` | boolean          | Filter by open registration  |
| `page`             | number           | Page number (default: 1)     |
| `limit`            | number           | Items per page (default: 20) |

---

## Admin Tournament UI Route Summary

| Route                   | File                               | Permission Gate     | Description                     |
| ----------------------- | ---------------------------------- | ------------------- | ------------------------------- |
| `/tournaments`          | `pages/tournaments/index.vue`      | `TOURNAMENT_READ`   | List with status/format filters |
| `/tournaments/new`      | `pages/tournaments/new.vue`        | `TOURNAMENT_CREATE` | Create form                     |
| `/tournaments/:id`      | `pages/tournaments/[id]/index.vue` | `TOURNAMENT_READ`   | Detail + operational hub        |
| `/tournaments/:id/edit` | `pages/tournaments/[id]/edit.vue`  | `TOURNAMENT_UPDATE` | Edit form                       |

---

## Operational Hub Boundary

`TournamentOperationalHub` is embedded on the detail page (`/tournaments/:id`).

- Displays: title, status badge, format badge, capacity, all detail fields
- Lifecycle buttons: rendered by `TournamentLifecycleActionButtons` based on current status
- Edit link: visible to `TOURNAMENT_UPDATE` permission holders
- Delete button: visible to `TOURNAMENT_ARCHIVE` permission holders
- Confirm dialogs: cancel and archive actions require confirmation
- No standalone `/tournaments/:id/operations` route exists

---

## Lifecycle Action Policy

Tournament lifecycle follows a strict state machine enforced by `tournament-policy.ts`.

### Status flow

```
draft → published → registration_open → registration_closed → in_progress → completed
                                                                          → cancelled (from most states)
completed/cancelled → archived (terminal)
archived (terminal — no further transitions)
```

### Lifecycle action mapping

| Action            | From                                                                  | To                  | Endpoint                       |
| ----------------- | --------------------------------------------------------------------- | ------------------- | ------------------------------ |
| publish           | draft                                                                 | published           | `POST /:id/publish`            |
| openRegistration  | published                                                             | registration_open   | `POST /:id/open-registration`  |
| closeRegistration | registration_open                                                     | registration_closed | `POST /:id/close-registration` |
| start             | registration_closed                                                   | in_progress         | `POST /:id/start`              |
| complete          | in_progress                                                           | completed           | `POST /:id/complete`           |
| cancel            | draft, published, registration_open, registration_closed, in_progress | cancelled           | `POST /:id/cancel`             |
| archive           | completed, cancelled                                                  | archived            | `POST /:id/archive`            |

---

## Generic PATCH Restrictions (Lifecycle Bypass Prevention)

`PATCH /admin/v1/tournaments/:id` cannot set:

- `status` — use lifecycle endpoints
- `publishedAt` — set automatically by publish transition
- `cancelledAt` — set automatically by cancel transition
- `archivedAt` — set automatically by archive transition
- `deletedAt` — set by soft-delete (`DELETE` endpoint)

Any attempt to include these fields in a PATCH body returns `400 Bad Request`:

```
Field "status" is not allowed. Use the lifecycle endpoints to manage tournament status.
```

**Implementation:** `apps/api/src/admin/tournaments/dto/admin-tournament-body.ts` — `LIFECYCLE_BLOCKED_FIELDS` set checked in `parseAdminUpdateTournamentBody` before any field processing.

---

## Permission Mapping

| Permission key       | Value                           | Used for                                            |
| -------------------- | ------------------------------- | --------------------------------------------------- |
| `TOURNAMENT_READ`    | `tournament.tournament.read`    | List, get, nav item                                 |
| `TOURNAMENT_CREATE`  | `tournament.tournament.create`  | Create form                                         |
| `TOURNAMENT_UPDATE`  | `tournament.tournament.update`  | Edit form, edit button                              |
| `TOURNAMENT_PUBLISH` | `tournament.tournament.publish` | Lifecycle: publish, open/close reg, start, complete |
| `TOURNAMENT_CANCEL`  | `tournament.tournament.cancel`  | Lifecycle: cancel                                   |
| `TOURNAMENT_ARCHIVE` | `tournament.tournament.archive` | Lifecycle: archive; also delete/soft-delete         |

All permissions use `DragonPermissions` constants from `@dragon/sdk`. No raw permission strings are used in runtime code.

---

## Delete / Archive Behavior

**Delete (soft-delete):** `DELETE /admin/v1/tournaments/:id`

- Sets `deletedAt` timestamp on the document
- Does NOT hard-delete
- Requires `TOURNAMENT_ARCHIVE` permission
- Emits audit log with `TOURNAMENT_DELETED` action and `warning` severity
- Deleted tournaments are excluded from all list/get queries

**Archive:** `POST /admin/v1/tournaments/:id/archive`

- Transitions status from `completed` or `cancelled` → `archived`
- Sets `archivedAt` timestamp
- Archived is a terminal state — no further transitions are allowed
- Requires `TOURNAMENT_ARCHIVE` permission

---

## Audit Behavior

| Action              | AuditAction constant             | Severity |
| ------------------- | -------------------------------- | -------- |
| Create              | `TOURNAMENT_CREATED`             | info     |
| Update              | `TOURNAMENT_UPDATED`             | info     |
| Publish             | `TOURNAMENT_PUBLISHED`           | info     |
| Registration opened | `TOURNAMENT_REGISTRATION_OPENED` | info     |
| Registration closed | `TOURNAMENT_REGISTRATION_CLOSED` | info     |
| Start               | `TOURNAMENT_STARTED`             | info     |
| Complete            | `TOURNAMENT_COMPLETED`           | info     |
| Cancel              | `TOURNAMENT_CANCELLED`           | warning  |
| Archive             | `TOURNAMENT_ARCHIVED`            | info     |
| Delete              | `TOURNAMENT_DELETED`             | warning  |

Audit is fire-and-forget (`void this.auditService?.log(...)`). `AuditService` is injected as `@Optional()` — missing audit service does not break operations.

---

## Forbidden Standalone Operation Routes

These routes do not exist and must not be created in Slice 5:

| Route                         | Reason                                     |
| ----------------------------- | ------------------------------------------ |
| `/tournaments/:id/operations` | Hub is embedded on detail page             |
| `/tournaments/:id/preview`    | No public preview; detail page IS the view |

---

## Out-of-Scope Future Operation Routes

These routes are legal in future slices but are not implemented in Slice 5:

| Route                            | Future slice                                     |
| -------------------------------- | ------------------------------------------------ |
| `/tournaments/:id/registrations` | Registration management slice                    |
| `/tournaments/:id/participants`  | Participant management slice                     |
| `/tournaments/:id/matches`       | Match management slice                           |
| `/tournaments/:id/results`       | Result entry slice                               |
| `/tournaments/:id/standings`     | Standings slice                                  |
| `/tournaments/:id/bracket`       | Bracket slice (single_elimination / round_robin) |

Do not permanently block these routes in tests. Mark assertions as temporary slice preconditions.

---

## Public Tournament Routes — Not Part of Slice 5

No public tournament routes are implemented in Slice 5. Public tournament discovery, detail, and participation flows are deferred.

Planned public domain: `qesb.ir` (not hardcoded in runtime config).

---

## No Fake Tournament Data Policy

No fake, seed, or placeholder tournament data exists in any source file.

Tournament data always comes from real API calls via SDK client wrappers.

This applies to:

- Admin pages (`pages/tournaments/**`)
- Admin components (`components/tournaments/**`)
- Feature API (`features/tournaments/**`)
- Composables (`composables/useAdminTournaments.ts`)
- API controller (`admin-tournaments.controller.ts`)
- Repository and service (`tournament.repository.ts`, `tournament.service.ts`)

---

## Domain-Awareness Policy

Runtime and config code does not hardcode any of:

- `localhost` as an API origin
- `qesb.ir` as an API origin
- Any fixed deployment URL

The admin app uses a runtime-injected API base URL via `useAdminApiClient()`. The API client is initialized from environment config (`NUXT_PUBLIC_API_BASE_URL` or equivalent), not from a hardcoded string.

Docs may reference `qesb.ir` as the planned Phase 1 public domain and `stream.ir` as a possible future domain. These references are documentation-only.

---

## Verification Commands

Run all of the following and confirm they exit 0:

```bash
pnpm --filter @dragon/api lint
pnpm --filter @dragon/api typecheck
pnpm --filter @dragon/api test
pnpm --filter @dragon/api build

pnpm --filter @dragon/admin lint
pnpm --filter @dragon/admin typecheck
pnpm --filter @dragon/admin test
pnpm --filter @dragon/admin build

pnpm --filter @dragon/sdk test
pnpm --filter @dragon/types test

pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm format:check
```

---

## Known Limitations

- `participantType` is stored in the MongoDB document but is not included in `TournamentDto` (the shared contract type). The field is present in the schema as an internal field. Feature API input types define it explicitly with `as any` cast at the SDK boundary.
- The admin tournament list returns `TournamentListItemDto[]` (public summary shape), not full `AdminTournamentDto[]`. This is by design — the full DTO is available on the detail endpoint.
- Lifecycle timestamps (`publishedAt`, `cancelledAt`, `archivedAt`) are visible on the detail page (via `TournamentOperationalHub`) but cannot be edited by admins.
- Delete requires `TOURNAMENT_ARCHIVE` permission (no separate delete permission exists in the current permission set).
