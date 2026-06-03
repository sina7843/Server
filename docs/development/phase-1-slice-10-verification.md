# Phase 1 / Slice 10 — Verification Guide

## Scope Summary

Slice 10 implements all admin-facing operational views for a tournament: registrations,
participants, matches, results, standings, and bracket projection. All pages are admin-only,
permission-gated, and use the admin SDK exclusively. The `TournamentOperationalHub` is updated to
link to all 6 routes.

| Area                                                         | Implemented | Notes                                                              |
| ------------------------------------------------------------ | ----------- | ------------------------------------------------------------------ |
| Admin registrations page `/tournaments/:id/registrations`    | Yes         | List + approve/reject; TOURNAMENT_REGISTRATION_READ                |
| Admin participants page `/tournaments/:id/participants`      | Yes         | List + seed/remove; TOURNAMENT_PARTICIPANT_READ                    |
| Admin matches page `/tournaments/:id/matches`                | Yes         | List + create/generate/update/cancel; TOURNAMENT_MATCH_READ        |
| Admin results page `/tournaments/:id/results`                | Yes         | Record/update/void winner per match; TOURNAMENT_RESULT_MANAGE      |
| Admin standings page `/tournaments/:id/standings`            | Yes         | Read-only table + recalculate; TOURNAMENT_RESULT_MANAGE for recalc |
| Admin bracket page `/tournaments/:id/bracket`                | Yes         | Read-only backend projection; grouped rounds; no mutations         |
| `useAdminTournamentRegistrations` composable                 | Yes         | SDK-only; module-level shared state                                |
| `useAdminTournamentParticipants` composable                  | Yes         | SDK-only; module-level shared state                                |
| `useAdminTournamentMatches` composable                       | Yes         | SDK-only; module-level shared state                                |
| `useAdminTournamentResults` composable                       | Yes         | SDK-only; module-level shared state                                |
| `useAdminTournamentStandings` composable                     | Yes         | SDK-only; module-level shared state                                |
| `useAdminTournamentBracket` composable                       | Yes         | SDK-only; module-level shared state                                |
| TournamentOperationalHub navigation links to all 6 routes    | Yes         | Permission-gated per route                                         |
| Admin `/tournaments/:id/operations` standalone route         | No          | **Permanently forbidden**                                          |
| Admin `/tournaments/:id/preview` standalone route            | No          | **Permanently forbidden**                                          |
| Bracket editor / editable bracket / drag-drop                | No          | Permanently out of scope                                           |
| Separate `createAdminTournamentBracketClient` SDK factory    | No          | **Permanently forbidden** — use `createAdminTournamentsClient`     |
| Swiss / Double Elimination formats                           | No          | Permanently unsupported in Phase 1                                 |
| Live scoring / WebSocket scoreboard                          | No          | Permanently out of scope                                           |
| Client-side standings/results computation as source of truth | No          | **Permanently forbidden** — server recalculate only                |
| Fake / seed operational data in UI                           | No          | **Permanently forbidden**                                          |
| Public SDK for admin mutations                               | No          | **Permanently forbidden** — admin SDK only                         |

---

## Admin Operational Route List

All routes require admin authentication and appropriate permissions.

| Route                            | Page file                                  | Primary composable                    | Permission                     |
| -------------------------------- | ------------------------------------------ | ------------------------------------- | ------------------------------ |
| `/tournaments/:id/registrations` | `pages/tournaments/[id]/registrations.vue` | `useAdminTournamentRegistrations`     | `TOURNAMENT_REGISTRATION_READ` |
| `/tournaments/:id/participants`  | `pages/tournaments/[id]/participants.vue`  | `useAdminTournamentParticipants`      | `TOURNAMENT_PARTICIPANT_READ`  |
| `/tournaments/:id/matches`       | `pages/tournaments/[id]/matches.vue`       | `useAdminTournamentMatches`           | `TOURNAMENT_MATCH_READ`        |
| `/tournaments/:id/results`       | `pages/tournaments/[id]/results.vue`       | `useAdminTournamentMatches` + Results | `TOURNAMENT_MATCH_READ`        |
| `/tournaments/:id/standings`     | `pages/tournaments/[id]/standings.vue`     | `useAdminTournamentStandings`         | `TOURNAMENT_MATCH_READ`        |
| `/tournaments/:id/bracket`       | `pages/tournaments/[id]/bracket.vue`       | `useAdminTournamentBracket`           | `TOURNAMENT_MATCH_READ`        |

---

## Permission Policy Decisions

### Standings and Bracket read use `TOURNAMENT_MATCH_READ`

Standings and bracket are derived from match data. The backend uses the `tournament.match.read`
permission policy for both endpoints. Bracket access is explicitly noted in the SDK type comment:
"Bracket read access uses the tournament.match.read permission policy."

No separate `TOURNAMENT_BRACKET_READ` or `TOURNAMENT_STANDINGS_READ` permission constant exists in
Phase 1. Using `TOURNAMENT_MATCH_READ` for these pages is correct and intentional.

### Results page mutation uses `TOURNAMENT_RESULT_MANAGE`

The results page loads data via `TOURNAMENT_MATCH_READ` (viewing matches with result data embedded)
but gates all mutation actions (record/update/void) on `TOURNAMENT_RESULT_MANAGE`.

### Standings recalculate uses `TOURNAMENT_RESULT_MANAGE`

Recalculating standings is a server-side recompute triggered by the admin. It is gated on
`TOURNAMENT_RESULT_MANAGE` because it modifies the derived standings state.

---

## SDK Design Decisions

### Bracket uses `createAdminTournamentsClient`, not a separate bracket client

There is no `createAdminTournamentBracketClient` factory. The bracket endpoint is accessed via:

```typescript
createAdminTournamentsClient(client).getBracket(tournamentId);
```

This is intentional. Adding a separate bracket client factory would imply a bracket mutation
surface that does not exist in Phase 1. The `admin-tournament-bracket.api.ts` feature file wraps
`createAdminTournamentsClient`.

### Results page does not have a dedicated list endpoint

`TournamentMatchResultDto` is embedded in match data (via `winnerId`). The results page loads all
matches via `useAdminTournamentMatches` and uses `useAdminTournamentResults` only for mutations
(record/update/void). There is no `listResults()` SDK method.

---

## Backend Alignment Boundary

Slice 10 frontend pages consume existing backend APIs added in Slices 6–7. No new API endpoints
were added in Slice 10.

| Endpoint                                                    | Controller                             | Added in |
| ----------------------------------------------------------- | -------------------------------------- | -------- |
| `GET /admin/v1/tournaments/:id/registrations`               | `admin-tournament-registrations`       | Slice 6  |
| `PATCH /admin/v1/tournaments/:id/registrations/:id/approve` | `admin-tournament-registrations`       | Slice 6  |
| `PATCH /admin/v1/tournaments/:id/registrations/:id/reject`  | `admin-tournament-registrations`       | Slice 6  |
| `GET /admin/v1/tournaments/:id/participants`                | `admin-tournament-participants`        | Slice 6  |
| `POST /admin/v1/tournaments/:id/participants`               | `admin-tournament-participants`        | Slice 6  |
| `PATCH /admin/v1/tournaments/:id/participants/:id/seed`     | `admin-tournament-participants`        | Slice 6  |
| `DELETE /admin/v1/tournaments/:id/participants/:id`         | `admin-tournament-participants`        | Slice 6  |
| `GET /admin/v1/tournaments/:id/matches`                     | `admin-tournament-matches`             | Slice 7  |
| `POST /admin/v1/tournaments/:id/matches`                    | `admin-tournament-matches`             | Slice 7  |
| `POST /admin/v1/tournaments/:id/matches/generate`           | `admin-tournament-matches`             | Slice 7  |
| `PATCH /admin/v1/tournaments/:id/matches/:matchId`          | `admin-tournament-matches`             | Slice 7  |
| `PATCH /admin/v1/tournaments/:id/matches/:matchId/cancel`   | `admin-tournament-matches`             | Slice 7  |
| `POST /admin/v1/tournaments/:id/matches/:matchId/result`    | `admin-tournament-results`             | Slice 7  |
| `PATCH /admin/v1/tournaments/:id/matches/:matchId/result`   | `admin-tournament-results`             | Slice 7  |
| `DELETE /admin/v1/tournaments/:id/matches/:matchId/result`  | `admin-tournament-results`             | Slice 7  |
| `GET /admin/v1/tournaments/:id/standings`                   | `admin-tournament-standings`           | Slice 7  |
| `POST /admin/v1/tournaments/:id/standings/recalculate`      | `admin-tournament-standings`           | Slice 7  |
| `GET /admin/v1/tournaments/:id/bracket`                     | `admin-tournaments` (tournaments ctrl) | Slice 7  |

---

## Guardrail Changes in Slice 10

### `phase1-guardrails.spec.ts`

- **Removed** `[slice-1-precondition] no public tournament pages yet` — public tournament pages
  were implemented in Slices 8/9. This temporary check is no longer applicable.
- **Removed** `[slice-5-precondition] future operation sub-routes not implemented early` — all 6
  operational sub-routes now exist. The negative assertions were replaced with positive assertions
  in the `[slice-10] all operation sub-routes exist` describe block.
- **Added** `[slice-10] all operation sub-routes exist` — 6 positive assertions confirming each
  route page file exists.

### `admin-tournaments.api.spec.ts`

- **Narrowed** `tournament pages do not contain bracket or match UI` — renamed to
  `non-bracket tournament pages do not contain bracket UI components` and filtered out
  `bracket.vue` itself (which legitimately renders bracket data). The check was narrowed from
  the broad `/bracket/i` regex to `BracketEditor` only.

### `slice7-closeout.spec.ts` (API)

- **Removed** 4 temporary Slice-10 guards that checked for absence of admin operational pages.
  All 4 pages (matches, results, standings, bracket) now exist.

---

## Feature Files

| File                                                         | Purpose                                                     |
| ------------------------------------------------------------ | ----------------------------------------------------------- |
| `features/tournaments/admin-tournament-registrations.api.ts` | Thin wrapper: list/approve/reject via admin SDK             |
| `features/tournaments/admin-tournament-participants.api.ts`  | Thin wrapper: list/create/seed/remove via admin SDK         |
| `features/tournaments/admin-tournament-matches.api.ts`       | Thin wrapper: list/create/generate/update/cancel            |
| `features/tournaments/admin-tournament-results.api.ts`       | Thin wrapper: record/update/void via admin SDK              |
| `features/tournaments/admin-tournament-standings.api.ts`     | Thin wrapper: get/recalculate via admin SDK                 |
| `features/tournaments/admin-tournament-bracket.api.ts`       | Thin wrapper: getBracket via `createAdminTournamentsClient` |

---

## Test Coverage

| Spec file                                | What it verifies                                                                       |
| ---------------------------------------- | -------------------------------------------------------------------------------------- |
| `admin-tournament-matches.api.spec.ts`   | SDK delegation for list/create/generate/update/cancel; guardrails                      |
| `admin-tournament-results.api.spec.ts`   | SDK delegation for record/update/void; guardrails                                      |
| `admin-tournament-standings.api.spec.ts` | SDK delegation for get/recalculate; permission guardrails                              |
| `admin-tournament-bracket.api.spec.ts`   | SDK delegation via `createAdminTournamentsClient.getBracket()`; read-only policy       |
| `admin-tournament-hardening.spec.ts`     | Hub navigation, route existence, SDK-only, permissions, no fake data, scope guardrails |
| `phase1-guardrails.spec.ts`              | Cross-cutting guardrails: no direct fetch, no hardcoded domains, no raw permissions    |

---

## Permanently Out-of-Scope Items

The following items are forbidden in Phase 1 and checked by automated guardrails:

- `/tournaments/:id/operations` — standalone operations route (use hub on `/tournaments/:id`)
- `/tournaments/:id/preview` — preview route (admin detail page is the canonical view)
- `createAdminTournamentBracketClient` — no separate bracket SDK client factory
- Bracket editor, drag-drop bracket management, editable bracket nodes
- Live scoring, WebSocket-based scoreboards
- Swiss format, Double Elimination format
- Client-side standings computation as source of truth (server recalculate only)
- `public SDK` (`createTournamentsClient`) used for admin mutations
- Raw permission strings (use `DragonPermissions` constants from `@dragon/sdk`)
- Hardcoded `localhost` or `qesb.ir` as API origin in runtime code
