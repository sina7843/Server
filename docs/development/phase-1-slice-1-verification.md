# Phase 1 / Slice 1 Verification

## Overview

Slice 1 establishes the shared Phase 1 foundation: contracts, RBAC permissions, analytics constants, SDK method surface, and navigation/static guardrails. No product feature UI is implemented in this slice.

---

## Task 1.1 — Contracts, Permissions, and Analytics Constants

### Packages modified

| Package                   | Files                                                                                                                                                        |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `@dragon/types`           | `src/contracts/games.ts`, `tournaments.ts`, `registrations.ts`, `participants.ts`, `matches.ts`, `standings.ts`, `bracket.ts`, `contracts/index.ts`          |
| `@dragon/types`           | `src/constants/permissions.ts`, `src/constants/analytics.ts`                                                                                                 |
| `@dragon/api` (RBAC)      | `src/rbac/registry/permission-keys.ts`, `permission-registry.ts`, `registry.types.ts`, `role-registry.ts`, `role-permission-registry.ts`, `registry.spec.ts` |
| `@dragon/api` (RBAC seed) | `src/rbac/seeds/rbac-seed.service.spec.ts`                                                                                                                   |

### TournamentStatus — 8 locked values

```
draft | published | registration_open | registration_closed |
in_progress | completed | cancelled | archived
```

No aliases (`open`, `published_open`, `registrationOpen`, `closed`).

### TournamentFormat — 3 Phase 1 values only

```
single_elimination | round_robin | manual
```

Forbidden formats (Phase 2+): `swiss`, `double_elimination`, `advanced_bracket_editor`

### TournamentRegistrationType — 2 values only

```
individual | team
```

Forbidden: `organization`, `club`, `team_entity`. No independent Team model. No independent Club model.

### Contract boundaries

- `TournamentDto` has no `prizePool`, `entryFee`, `streamUrl`, or `liveScore` fields.
- `TournamentMatchDto` has no `liveScore` or `stream` fields.
- `BracketProjectionDto` is display-only — no `editCommand`, `dragDrop`, or `editorState` fields.
- Bracket read access uses the **`tournament.match.read`** permission (no `tournament.bracket.read`).
- Standings recalculation uses the **`tournament.result.manage`** permission.

### Phase 1 DragonPermissions added

| Key                              | Value                            |
| -------------------------------- | -------------------------------- |
| `GAME_READ`                      | `game.game.read`                 |
| `GAME_CREATE`                    | `game.game.create`               |
| `GAME_UPDATE`                    | `game.game.update`               |
| `GAME_STATUS_UPDATE`             | `game.status.update`             |
| `TOURNAMENT_READ`                | `tournament.tournament.read`     |
| `TOURNAMENT_CREATE`              | `tournament.tournament.create`   |
| `TOURNAMENT_UPDATE`              | `tournament.tournament.update`   |
| `TOURNAMENT_PUBLISH`             | `tournament.tournament.publish`  |
| `TOURNAMENT_CANCEL`              | `tournament.tournament.cancel`   |
| `TOURNAMENT_ARCHIVE`             | `tournament.tournament.archive`  |
| `TOURNAMENT_REGISTRATION_READ`   | `tournament.registration.read`   |
| `TOURNAMENT_REGISTRATION_MANAGE` | `tournament.registration.manage` |
| `TOURNAMENT_PARTICIPANT_READ`    | `tournament.participant.read`    |
| `TOURNAMENT_PARTICIPANT_MANAGE`  | `tournament.participant.manage`  |
| `TOURNAMENT_MATCH_READ`          | `tournament.match.read`          |
| `TOURNAMENT_MATCH_MANAGE`        | `tournament.match.manage`        |
| `TOURNAMENT_RESULT_MANAGE`       | `tournament.result.manage`       |

**Forbidden permissions (must never be added):** `tournament.bracket.read`, `tournament.bracket.manage`

### tournament_manager role

- Added to `DragonRoleKey` union type and `BaseRoleKey` in `registry.types.ts`
- Added to `RoleRegistry` with `isSystem: true`, `isAssignable: true`
- `RolePermissionRegistryMap.tournament_manager` holds 15 permissions (all tournament/game read + manage except game create/update/status_update)
- Total seeded roles: 6 (`super_admin`, `admin`, `content_manager`, `support`, `user`, `tournament_manager`)

### Phase 1 analytics event constants

Five events added to `ANALYTICS_EVENT_TYPES`:

```
tournament.viewed
tournament.registration_started
tournament.registration_completed
tournament.bracket_viewed
tournament.match_viewed
```

Naming convention: **dot-namespaced** (`tournament.viewed`), never snake_case (`tournament_viewed`) or camelCase (`tournamentViewed`).

### Verification

```bash
pnpm --filter @dragon/types test    # 38 tests pass
pnpm --filter @dragon/api test      # 1424 tests pass (rbac-seed 6 roles)
pnpm --filter @dragon/types build
pnpm --filter @dragon/types typecheck
```

---

## Task 1.2 — SDK Method Surface and Request Builders

### Package modified: `@dragon/sdk`

### New SDK clients

| Client factory                             | Public/Admin                  | Key methods                                                                                                                         |
| ------------------------------------------ | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `createGamesClient`                        | Public `/api/v1/games`        | `list`, `getBySlug`                                                                                                                 |
| `createAdminGamesClient`                   | Admin `/admin/v1/games`       | `list`, `getById`, `create`, `update`, `updateStatus`                                                                               |
| `createTournamentsClient`                  | Public `/api/v1/tournaments`  | `list`, `getBySlug`, `getStandings`, `getBracket`, `register`, `getMyRegistration`, `withdrawRegistration`                          |
| `createAdminTournamentsClient`             | Admin `/admin/v1/tournaments` | `list`, `getById`, `create`, `update`, `publish`, `cancel`, `archive`, `openRegistration`, `closeRegistration`, `start`, `complete` |
| `createAdminTournamentRegistrationsClient` | Admin                         | `list`, `getById`, `approve`, `reject`                                                                                              |
| `createAdminTournamentParticipantsClient`  | Admin                         | `list`                                                                                                                              |
| `createAdminTournamentMatchesClient`       | Admin                         | `list`, `getById`, `updateResult`                                                                                                   |
| `createAdminTournamentStandingsClient`     | Admin                         | **`get`**, **`recalculate`** (locked names)                                                                                         |
| `createAdminTournamentBracketClient`       | Admin                         | **`get`** only (display-only, no edit methods)                                                                                      |

### Updated SDK clients

| Client                    | Change                                     |
| ------------------------- | ------------------------------------------ |
| `createSearchClient`      | Added `tournaments()` method (locked name) |
| `createAdminSearchClient` | Added `tournaments()` method (locked name) |

### Locked method names (must not be aliased)

- `search.tournaments()` — NOT `searchTournaments()`
- `admin.search.tournaments()` — NOT `searchTournaments()`
- `admin.tournamentStandings.get()` — NOT `getStandings()`
- `admin.tournamentStandings.recalculate()` — NOT `calculateStandings()`

### Domain-awareness rule

The SDK `createApiClient({ baseUrl })` takes `baseUrl` as required configuration. No client factory hardcodes any domain. Apps must supply `baseUrl` via runtime configuration.

- Planned public domain: `qesb.ir`
- Future domains (streaming, CDN, etc.) must remain configurable
- **Never hardcode** `localhost`, `qesb.ir`, `api.qesb.ir`, or any IP/port in SDK or app feature code

### Forbidden SDK methods (must not be created)

- `getMatchById` on public `TournamentsClient` (no public match detail route)
- Any bracket edit/override/dragdrop method on `AdminTournamentBracketClient`
- Any method referencing `swiss`, `double_elimination`, or `advanced_bracket_editor`
- Any method named `searchTournaments`, `getTournaments`, or `calculateStandings`
- Any Team SDK namespace or Club SDK namespace

### Verification

```bash
pnpm --filter @dragon/sdk lint
pnpm --filter @dragon/sdk typecheck
pnpm --filter @dragon/sdk test    # 142 tests pass (10 suites)
pnpm --filter @dragon/sdk build
```

---

## Task 1.3 — Navigation Guardrails, Static Checks, and Slice Docs

### Files created/modified

| File                                                       | Change                                          |
| ---------------------------------------------------------- | ----------------------------------------------- |
| `apps/admin/features/navigation/admin-navigation.spec.ts`  | Added Phase 1 nav guardrail tests               |
| `apps/admin/features/guardrails/phase1-guardrails.spec.ts` | New: file-system guardrail checks (admin + web) |
| `apps/web/features/guardrails/phase1-guardrails.spec.ts`   | New: behavioral guardrail checks                |
| `docs/development/phase-1-slice-1-verification.md`         | This file                                       |

### Navigation discipline

**Current state:** Admin nav has 12 entries (dashboard, users, roles, permissions, content, media, system-health, backups, audit, jobs, notifications, analytics). No tournament or games entries.

**Rule:** Phase 1 admin tournament/game nav items must NOT be added until the real routes and pages exist (later slices). No placeholder, no coming-soon, no disabled future nav items.

**Enforced by tests in** `admin-navigation.spec.ts`:

- `games`, `game-management` keys not in nav
- `tournaments`, `tournament-management`, `tournament-manager` keys not in nav
- No placeholder paths (`#`, `/coming-soon`, `/placeholder`, etc.)
- No coming-soon label text
- All nav items use `DragonPermissions.*` constants (no raw strings)
- No forbidden bracket permission used as nav gate

### Guardrail checks in `apps/admin/features/guardrails/phase1-guardrails.spec.ts`

| Check                                           | Scope                                             |
| ----------------------------------------------- | ------------------------------------------------- |
| No `fetch()` direct calls                       | admin + web feature/composable `.ts`/`.vue` files |
| No hardcoded `localhost` URL                    | admin + web                                       |
| No hardcoded `qesb.ir` URL                      | admin + web                                       |
| No raw `'tournament.bracket.read'` string       | admin + web                                       |
| No raw `'tournament.bracket.manage'` string     | admin + web                                       |
| No `'swiss'` format string                      | admin + web                                       |
| No `'double_elimination'` format string         | admin + web                                       |
| No `'advanced_bracket_editor'` format string    | admin + web                                       |
| No forbidden analytics event naming             | admin + web                                       |
| No admin page for `/tournaments/:id/operations` | admin pages                                       |
| No admin page for `/tournaments/:id/preview`    | admin pages                                       |
| No admin tournament pages at all                | admin pages                                       |
| No admin games pages at all                     | admin pages                                       |
| No public match detail page                     | web pages                                         |
| No public tournament pages at all               | web pages                                         |
| No public games pages at all                    | web pages                                         |
| No `coming-soon.vue` page                       | admin + web                                       |
| No `placeholder.vue` page                       | admin + web                                       |

### Guardrail checks in `apps/web/features/guardrails/phase1-guardrails.spec.ts`

| Check                                                 | Description            |
| ----------------------------------------------------- | ---------------------- |
| `createSearchApi` accepts configurable `baseUrl`      | Domain-awareness       |
| `tournaments()` path has no hardcoded origin          | `search.tournaments()` |
| `tournaments()` locked name (not `searchTournaments`) | Phase 1 contract       |
| `tournaments()` passes filters correctly              | Behavioral             |
| `getBySlug()` path has no hardcoded origin            | `TournamentsClient`    |
| No `getMatchById` on `TournamentsClient`              | Forbidden public route |
| `getBracket()` is display-only                        | No edit methods        |
| `ANALYTICS_EVENT_TYPES` contains 5 Phase 1 events     | Constants              |
| Event names use dot-notation                          | No snake_case          |
| Phase 1 formats do not include forbidden values       | Unsupported format     |
| `SearchClient` has no match detail methods            | Forbidden surface      |

### Verification

```bash
pnpm --filter @dragon/admin test   # includes navigation + guardrails specs
pnpm --filter @dragon/web test     # includes behavioral guardrails spec
```

---

## Forbidden routes (all phases)

| Route                                 | Reason                                          |
| ------------------------------------- | ----------------------------------------------- |
| `/tournaments/:id/operations`         | Forbidden admin route                           |
| `/tournaments/:id/preview`            | Forbidden admin route                           |
| `/tournaments/:slug/matches/:matchId` | Forbidden public route (no public match detail) |

---

## Full Slice 1 verification commands

```bash
# Package-level
pnpm --filter @dragon/types lint
pnpm --filter @dragon/types typecheck
pnpm --filter @dragon/types test
pnpm --filter @dragon/types build

pnpm --filter @dragon/sdk lint
pnpm --filter @dragon/sdk typecheck
pnpm --filter @dragon/sdk test
pnpm --filter @dragon/sdk build

pnpm --filter @dragon/api test

pnpm --filter @dragon/admin lint
pnpm --filter @dragon/admin typecheck
pnpm --filter @dragon/admin test

pnpm --filter @dragon/web lint
pnpm --filter @dragon/web typecheck
pnpm --filter @dragon/web test

# Monorepo-level
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm format:check
```

---

## Out of scope (Phase 1 Slice 1)

The following are NOT implemented in Slice 1 and must NOT be created prematurely:

- Game CRUD pages and API
- Tournament CRUD pages and API
- Registration flow UI
- Match/result/standing/bracket implementation
- Tournament manager admin pages
- Public tournament pages
- Homepage tournament listings
- Any prize/payment/shop/streaming integration
- Swiss, Double Elimination, or Advanced Bracket Editor formats
- Independent Team model or Club model
- Organization registration type
