# Phase 1 / Slice 7 — Verification Guide

## Scope Summary

Slice 7 implements the full match, result, standings, and bracket backend for Phase 1.

| Area                                                                   | Implemented | Notes                                                               |
| ---------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------- |
| Admin match API (create, list, get, update, cancel, generate)          | Yes         | `/admin/v1/tournaments/:id/matches`                                 |
| Admin result API (record, update, void)                                | Yes         | `/admin/v1/tournaments/:id/matches/:matchId/result`                 |
| Admin standings API (get, recalculate)                                 | Yes         | `/admin/v1/tournaments/:id/standings`                               |
| Admin bracket API (get)                                                | Yes         | `/admin/v1/tournaments/:id/bracket`                                 |
| Public match list API                                                  | Yes         | `/api/v1/tournaments/:slug/matches`                                 |
| Public results list API                                                | Yes         | `/api/v1/tournaments/:slug/results`                                 |
| Public standings API                                                   | Yes         | `/api/v1/tournaments/:slug/standings`                               |
| Public bracket API                                                     | Yes         | `/api/v1/tournaments/:slug/bracket`                                 |
| SDK methods (public: getMatches, getResults, getStandings, getBracket) | Yes         | Added to `packages/sdk/src/tournaments.ts`                          |
| SDK methods (admin: matches, results, standings, bracket)              | Yes         | Separate client files; bracket via `admin.tournaments.getBracket()` |
| Match generation (round_robin, single_elimination)                     | Yes         | `tournament-match-generation.ts`                                    |
| Standings projection (round_robin, single_elimination, manual)         | Yes         | Projection-based, no collection                                     |
| Bracket projection                                                     | Yes         | Projection-based from match records, no collection                  |
| Public frontend match/result/standing/bracket pages                    | No          | Deferred to Slice 9                                                 |
| Admin frontend match/result/standing/bracket pages                     | No          | Deferred to Slice 10                                                |
| Bracket collection/model/schema                                        | No          | Permanently forbidden                                               |
| Permanent standings collection                                         | No          | Permanently forbidden — projection-based only                       |
| Swiss / Double Elimination formats                                     | No          | Permanently unsupported                                             |
| Live scoring / WebSocket scoreboard                                    | No          | Permanently out of scope                                            |
| Public match detail route                                              | No          | Permanently forbidden                                               |
| Public result detail or mutation route                                 | No          | Permanently forbidden                                               |
| Bracket editor / editable bracket state                                | No          | Permanently forbidden                                               |
| Prize / payment / shop                                                 | No          | Permanently out of scope                                            |
| Fake/seed operational data (matches, results, standings)               | No          | Permanently forbidden                                               |
| Referee or dispute workflow                                            | No          | Permanently out of scope                                            |
| Streaming or live result feed                                          | No          | Permanently out of scope                                            |

---

## Match API Summary

**Public controller:** `apps/api/src/tournament-matches/public-tournament-matches.controller.ts`  
**Route prefix:** `api/v1/tournaments/:slug`  
**Auth:** Public — no authentication required

### Public Match Endpoints

| Method | Path                                | Description                                    |
| ------ | ----------------------------------- | ---------------------------------------------- |
| `GET`  | `/api/v1/tournaments/:slug/matches` | List matches for a publicly visible tournament |

**Admin controller:** `apps/api/src/admin/tournament-matches/admin-tournament-matches.controller.ts`  
**Route prefix:** `admin/v1/tournaments/:id/matches`  
**Guards:** `AccessTokenGuard`, `PermissionGuard`

### Admin Match Endpoints

| Method  | Path                                                | Permission                | Description                |
| ------- | --------------------------------------------------- | ------------------------- | -------------------------- |
| `GET`   | `/admin/v1/tournaments/:id/matches`                 | `TOURNAMENT_MATCH_READ`   | List with pagination       |
| `GET`   | `/admin/v1/tournaments/:id/matches/:matchId`        | `TOURNAMENT_MATCH_READ`   | Get single match           |
| `POST`  | `/admin/v1/tournaments/:id/matches`                 | `TOURNAMENT_MATCH_MANAGE` | Create a match manually    |
| `POST`  | `/admin/v1/tournaments/:id/matches/generate`        | `TOURNAMENT_MATCH_MANAGE` | Auto-generate matches      |
| `PATCH` | `/admin/v1/tournaments/:id/matches/:matchId`        | `TOURNAMENT_MATCH_MANAGE` | Update match schedule/meta |
| `POST`  | `/admin/v1/tournaments/:id/matches/:matchId/cancel` | `TOURNAMENT_MATCH_MANAGE` | Cancel a match             |

---

## Match Generation Policy

**File:** `apps/api/src/tournament-matches/tournament-match-generation.ts`

| Format               | Generation Behavior                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------ |
| `round_robin`        | Generates N×(N-1)/2 matches — every participant plays every other participant exactly once |
| `single_elimination` | Generates first-round matchups; next rounds are created as matches complete                |
| `manual`             | No auto-generation; matches are created individually via admin API                         |

Generation is idempotent per round — calling generate again when matches exist is rejected.  
Swiss and Double Elimination are permanently unsupported.

### Conservative `single_elimination` Generation Policy (Phase 1)

`single_elimination` auto-generation requires a **power-of-two participant count** (2, 4, 8, 16, …).

**Why:** Result recording requires both participant slots to be filled. A non-power-of-two count
produces an incomplete first-round match (one participant, no opponent) that can never be completed.
To avoid uncompletable matches, the service rejects non-power-of-two counts with a `BadRequestException`.

**Non-power-of-two cases (e.g. 3, 5, 6):** Use manual match creation
(`POST /admin/v1/tournaments/:id/matches`) to set up each match individually.
A future slice may add bye support or advanced bracket seeding for these cases.

**`bye` match status is permanently excluded from Phase 1.** No `bye` value exists on
`TournamentMatchStatus`. Do not add it.

---

## Result API Summary

**Admin controller:** `apps/api/src/admin/tournament-results/admin-tournament-results.controller.ts`  
**Route prefix:** `admin/v1/tournaments/:id/matches/:matchId/result`  
**Guards:** `AccessTokenGuard`, `PermissionGuard`

### Admin Result Endpoints

| Method  | Path                                                     | Permission                 | Description                              |
| ------- | -------------------------------------------------------- | -------------------------- | ---------------------------------------- |
| `POST`  | `/admin/v1/tournaments/:id/matches/:matchId/result`      | `TOURNAMENT_RESULT_MANAGE` | Record a result (sets winner)            |
| `PATCH` | `/admin/v1/tournaments/:id/matches/:matchId/result`      | `TOURNAMENT_RESULT_MANAGE` | Update an existing result                |
| `POST`  | `/admin/v1/tournaments/:id/matches/:matchId/result/void` | `TOURNAMENT_RESULT_MANAGE` | Void a result (reverts match to pending) |

**Public results controller:** `apps/api/src/tournament-matches/public-tournament-results.controller.ts`  
**Route prefix:** `api/v1/tournaments/:slug`

### Public Result Endpoints

| Method | Path                                | Description                             |
| ------ | ----------------------------------- | --------------------------------------- |
| `GET`  | `/api/v1/tournaments/:slug/results` | List completed matches with winner info |

---

## Result Model Policy

Results are embedded in `TournamentMatch` documents — no separate result collection exists.

| Field         | Description                                              |
| ------------- | -------------------------------------------------------- |
| `winnerId`    | ObjectId reference to winning participant (registration) |
| `score`       | Optional structured score (format-agnostic)              |
| `completedAt` | Timestamp when result was recorded                       |
| `status`      | Match status: `pending` → `in_progress` → `completed`    |

Voiding a result reverts `status` to `pending` and clears `winnerId`, `score`, `completedAt`.

---

## Winner / Result Policy

- `winnerId` must be one of `participant1Id` or `participant2Id` of the match.
- A match must have both participant slots filled before a result can be recorded.
- Only `completed` matches contribute to standings and bracket projections.
- Voiding is an explicit admin action — no automatic undos.

---

## Standings Policy

**File:** `apps/api/src/tournament-standings/tournament-standings.service.ts`

Standings are a **read-only projection** computed on-demand from `TournamentMatch` records.  
No `TournamentStandings` collection is created or maintained.

| Format               | Points Multiplier | Ranking                            |
| -------------------- | ----------------- | ---------------------------------- |
| `round_robin`        | wins × 3          | points desc, wins desc, losses asc |
| `single_elimination` | wins × 1          | wins desc, losses asc              |
| `manual`             | N/A               | Empty standings returned           |

All participants are seeded with 0 wins/losses even if no matches have been completed.  
Sort is deterministic: ties broken by `participantId` lexicographic order.

Display names: `participantDisplayName ?? (type === 'team' ? teamName ?? 'Team' : 'Participant')`  
userId is never exposed in standings or bracket projections.

**Public endpoint:** `GET /api/v1/tournaments/:slug/standings`  
**Admin endpoints:** `GET` and `POST .../recalculate` at `/admin/v1/tournaments/:id/standings`

---

## Bracket Projection Policy

**File:** `apps/api/src/tournament-bracket/tournament-bracket.service.ts`

The bracket is a **read-only projection** computed on-demand from `TournamentMatch` records,  
grouped by round. No `TournamentBracket` collection is created.

| Format               | Round Labels                                                                             |
| -------------------- | ---------------------------------------------------------------------------------------- |
| `single_elimination` | Final (last round), Semifinal (one before last), Quarterfinal (two before last), Round N |
| `round_robin`        | `Round N` for all rounds                                                                 |
| `manual`             | `Round N` for all rounds                                                                 |

Round label logic (single elimination): `fromEnd = maxRound - round`

- `fromEnd === 0` → `"Final"`
- `fromEnd === 1` (and `maxRound >= 2`) → `"Semifinal"`
- `fromEnd === 2` (and `maxRound >= 3`) → `"Quarterfinal"`
- otherwise → `"Round N"`

Participant seed: `registration.seed ?? 0` for unseeded participants.

**Public endpoint:** `GET /api/v1/tournaments/:slug/bracket`  
**Admin endpoint:** `GET /admin/v1/tournaments/:id/bracket`

---

## No Bracket Collection / Persistence Policy

A bracket collection is **permanently forbidden** in Phase 1.

- No `tournament-bracket.schema.ts` or `bracket.schema.ts` file exists.
- No `tournament-brackets` directory exists in API src.
- The bracket service does not inject any Mongoose model.
- No bracket write endpoints exist (admin or public).
- No bracket editor, drag-drop, or manual node override methods exist.
- Bracket nodes cannot be stored independently from match records.

---

## Supported Format Policy

**Supported:** `single_elimination` | `round_robin` | `manual`

**Permanently unsupported:**

| Format               | Reason                                      |
| -------------------- | ------------------------------------------- |
| `swiss`              | Not in Phase 1 scope — permanently excluded |
| `double_elimination` | Not in Phase 1 scope — permanently excluded |

Format enum is locked in `tournament.schema.ts`. Swiss and double_elimination must never appear.

---

## Public Read API Safety Rules

| Rule                                           | Enforcement                                                   |
| ---------------------------------------------- | ------------------------------------------------------------- |
| No public match detail route                   | No `:matchId` param on public match/result controller         |
| No public result detail route                  | No `:resultId` or `:matchId` on result controller             |
| No public result mutations (POST/PATCH/DELETE) | Public result controller uses GET only                        |
| No public standings mutations                  | Public standings controller uses GET only                     |
| No public bracket mutations                    | Public bracket controller uses GET only                       |
| Publicly visible check enforced                | Tournament must pass `isPubliclyVisible` before data returned |
| No live scoring or streaming                   | No WebSocket or SSE endpoints                                 |

---

## Participant Privacy Policy

Match and result data exposes only registration ObjectIds (`participant1Id`, `participant2Id`, `winnerId`) and display names derived from registration records. No phone, email, or contact data is exposed in any public endpoint.

---

## SDK Method List

### Public SDK — `packages/sdk/src/tournaments.ts`

| Method         | HTTP Method | Path                                  |
| -------------- | ----------- | ------------------------------------- |
| `getMatches`   | `GET`       | `/api/v1/tournaments/:slug/matches`   |
| `getResults`   | `GET`       | `/api/v1/tournaments/:slug/results`   |
| `getStandings` | `GET`       | `/api/v1/tournaments/:slug/standings` |
| `getBracket`   | `GET`       | `/api/v1/tournaments/:slug/bracket`   |

Forbidden SDK methods (must never exist on public client):  
`getMatchById`, `getResultById`, `recordResult`, `updateResult`, `voidResult`, `liveScore`, `scoreEvent`

### Admin SDK

| File                                             | Methods                                                                  |
| ------------------------------------------------ | ------------------------------------------------------------------------ |
| `packages/sdk/src/admin-tournament-matches.ts`   | `list`, `create`, `generate`, `update`, `cancel`, `get`                  |
| `packages/sdk/src/admin-tournament-results.ts`   | `record`, `update`, `void`                                               |
| `packages/sdk/src/admin-tournament-standings.ts` | `get`, `recalculate`                                                     |
| `packages/sdk/src/admin-tournaments.ts`          | `getBracket` (bracket access consolidated onto `AdminTournamentsClient`) |

---

## Admin Bracket SDK Method Decision

**Decision (Slice 7 closeout):** The sole admin bracket SDK method is `admin.tournaments.getBracket(tournamentId)`.

Bracket access is a projection read on a tournament — not an independent resource with its own client factory.

**Consequences:**

- `admin-tournaments.ts` **defines** `getBracket`, making it available as `admin.tournaments.getBracket(id)`.
- `AdminTournamentsClient` **includes** a `getBracket` property.
- No separate `admin-tournament-bracket.ts` client file exists.
- No `AdminTournamentBracketClient` interface exists.
- No competing `createAdminTournamentBracketClient()` factory exists.

This decision is verified by guardrail tests in `slice7-closeout.spec.ts`.

---

## Route Guardrails

### Allowed Public API Routes (Slice 7)

```
GET /api/v1/tournaments/:slug/matches    — public match list
GET /api/v1/tournaments/:slug/results    — public results list (completed matches with winner)
GET /api/v1/tournaments/:slug/standings  — public standings projection
GET /api/v1/tournaments/:slug/bracket    — public bracket projection
```

### Allowed Admin API Routes (Slice 7)

```
GET    /admin/v1/tournaments/:id/matches                           — list matches
GET    /admin/v1/tournaments/:id/matches/:matchId                  — get match
POST   /admin/v1/tournaments/:id/matches                           — create match
POST   /admin/v1/tournaments/:id/matches/generate                  — generate matches
PATCH  /admin/v1/tournaments/:id/matches/:matchId                  — update match
POST   /admin/v1/tournaments/:id/matches/:matchId/cancel           — cancel match
POST   /admin/v1/tournaments/:id/matches/:matchId/result           — record result
PATCH  /admin/v1/tournaments/:id/matches/:matchId/result           — update result
POST   /admin/v1/tournaments/:id/matches/:matchId/result/void      — void result
GET    /admin/v1/tournaments/:id/standings                         — get standings
POST   /admin/v1/tournaments/:id/standings/recalculate             — recalculate standings
GET    /admin/v1/tournaments/:id/bracket                           — get bracket
```

### TEMPORARY Route Preconditions (remove when feature slice lands)

The following frontend pages do not exist in Slice 7. These checks are labeled TEMPORARY in guardrail specs and must be removed when the corresponding slice adds the route.

| Frontend Route                     | Expected in Slice | Guardrail Label      |
| ---------------------------------- | ----------------- | -------------------- |
| `/tournaments/:slug/matches`       | Slice 9           | TEMPORARY (Slice 9)  |
| `/tournaments/:slug/results`       | Slice 9           | TEMPORARY (Slice 9)  |
| `/tournaments/:slug/standings`     | Slice 9           | TEMPORARY (Slice 9)  |
| `/tournaments/:slug/bracket`       | Slice 9           | TEMPORARY (Slice 9)  |
| `/admin/tournaments/:id/matches`   | Slice 10          | TEMPORARY (Slice 10) |
| `/admin/tournaments/:id/results`   | Slice 10          | TEMPORARY (Slice 10) |
| `/admin/tournaments/:id/standings` | Slice 10          | TEMPORARY (Slice 10) |
| `/admin/tournaments/:id/bracket`   | Slice 10          | TEMPORARY (Slice 10) |

### PERMANENT Forbidden Routes

These routes are permanently forbidden and must never be created.

| Route                                                   | Reason                                           |
| ------------------------------------------------------- | ------------------------------------------------ |
| `GET /api/v1/tournaments/:slug/matches/:matchId`        | Public match detail permanently forbidden        |
| `GET /api/v1/tournaments/:slug/results/:resultId`       | Public result detail permanently forbidden       |
| `POST/PATCH/DELETE /api/v1/tournaments/:slug/results/*` | Public result mutations permanently forbidden    |
| `POST/PATCH/DELETE /api/v1/tournaments/:slug/standings` | Public standings mutations permanently forbidden |
| `POST/PATCH/DELETE /api/v1/tournaments/:slug/bracket`   | Public bracket mutations permanently forbidden   |
| `GET /admin/v1/tournaments/:id/operations`              | Hub is on detail page; standalone is forbidden   |
| `GET /admin/v1/tournaments/:id/preview`                 | Permanently forbidden                            |

---

## Audit Behavior

Audit events fire for all match and result state changes via `AuditService.log()` as fire-and-forget (`void`).

| Event                    | Trigger                              |
| ------------------------ | ------------------------------------ |
| `MATCH_CREATED`          | Admin creates a match manually       |
| `MATCH_UPDATED`          | Admin updates match schedule/meta    |
| `MATCH_CANCELLED`        | Admin cancels a match                |
| `MATCH_GENERATED`        | Admin generates matches for a round  |
| `RESULT_RECORDED`        | Admin records a match result         |
| `RESULT_UPDATED`         | Admin updates a recorded result      |
| `RESULT_VOIDED`          | Admin voids a result                 |
| `STANDINGS_RECALCULATED` | Admin triggers standings recalculate |

All audit calls use `void this.auditService?.log(...)` — fire-and-forget, non-blocking.

---

## Analytics Event Names

Backend Slice 7 services do not emit analytics events directly. Analytics for operational views are frontend-triggered.

**Reserved for frontend (Slice 9/10 only):**

| Event                       | Source                             | Notes               |
| --------------------------- | ---------------------------------- | ------------------- |
| `tournament.bracket_viewed` | Frontend (user views bracket page) | Exact name required |
| `tournament.match_viewed`   | Frontend (user views match page)   | Exact name required |

**Forbidden alternatives in any runtime code:**

- `bracketViewed` — camelCase not allowed
- `bracket_view` — missing `-ed` suffix
- `matchViewed` — camelCase not allowed
- `match_view` — missing `-ed` suffix

Backend runtime code must not define any of these event names.

---

## No Fake Operational Data Policy

No fake, seed, or demo operational data is permitted in any Slice 7 runtime file.

**Forbidden patterns:**

- `fake`, `FAKE`, `Dragon Cup` (demo tournament names)
- `seedData`, `SEED_DATA`
- `result-seed.ts`, `match-seed.ts`, `standings-seed.ts`, `bracket-seed.ts`

This is a permanent constraint. Runtime code must operate only on real tournament data.

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

# SDK and Types
pnpm --filter @dragon/sdk lint
pnpm --filter @dragon/sdk typecheck
pnpm --filter @dragon/sdk test
pnpm --filter @dragon/sdk build
pnpm --filter @dragon/types test

# Monorepo
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm format:check
```

### Slice 7 Test Files

| File                                                                           | Coverage Area                                                                                    |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| `apps/api/src/tournament-matches/tournament-match.service.spec.ts`             | Match service: create, list, update, cancel, generate                                            |
| `apps/api/src/tournament-matches/tournament-match-generation.spec.ts`          | Round-robin and single-elimination generation logic                                              |
| `apps/api/src/tournament-matches/tournament-result.service.spec.ts`            | Result service: record, update, void                                                             |
| `apps/api/src/tournament-matches/tournament-results-public.guardrails.spec.ts` | Public results: list-only, no detail, no mutations, result DTO shape                             |
| `apps/api/src/tournament-standings/tournament-standings.service.spec.ts`       | Standings: format policies, displayName fallback, ranking, recalculate                           |
| `apps/api/src/tournament-standings/tournament-standings.guardrails.spec.ts`    | No collection, projection-based, correct permissions, no fake data, no hardcoded origins         |
| `apps/api/src/tournament-bracket/tournament-bracket.service.spec.ts`           | Bracket: empty bracket, round grouping, SE labels, participant data                              |
| `apps/api/src/tournament-bracket/tournament-bracket.guardrails.spec.ts`        | No schema, no editable state, projection-based, correct permissions                              |
| `apps/api/src/tournament-matches/slice7-closeout.spec.ts`                      | SDK alignment, bracket no-duplication, forbidden routes, live scoring, no fake data, audit names |

---

## Verification Checklist

- [ ] Admin match list, get, create, generate, update, cancel endpoints exist and are guarded
- [ ] Admin result record, update, void endpoints exist and are guarded
- [ ] Admin standings get and recalculate endpoints exist and are guarded
- [ ] Admin bracket get endpoint exists and is guarded (GET only — no mutations)
- [ ] Public match list endpoint exists (no auth required)
- [ ] Public results list endpoint exists (no auth required, completed matches only)
- [ ] Public standings endpoint exists (no auth required)
- [ ] Public bracket endpoint exists (no auth required)
- [ ] No public match detail route (no `:matchId` on public controller)
- [ ] No public result detail route (no `:resultId` on public controller)
- [ ] No public result mutation endpoint (POST/PATCH/DELETE)
- [ ] No public standings mutation endpoint
- [ ] No public bracket mutation endpoint
- [ ] Standings are projection-based (no collection, no schema file)
- [ ] Bracket is projection-based (no collection, no schema file)
- [ ] No tournament-brackets directory in API src
- [ ] No tournament-bracket.schema.ts or bracket.schema.ts file
- [ ] Bracket service does not inject any Mongoose model
- [ ] No editable bracket methods (editBracket, overrideBracket, saveBracket)
- [ ] Admin bracket controller has only GET (no POST/PATCH/DELETE)
- [ ] Tournament format enum excludes `swiss` and `double_elimination`
- [ ] Match generation file has no Swiss or Double Elimination logic
- [ ] `single_elimination` generation rejects non-power-of-two participant counts (`BadRequestException`)
- [ ] `single_elimination` generation accepts 2, 4, 8, 16 participant counts
- [ ] No `bye` match status exists (`TournamentMatchStatus` has no `bye` value)
- [ ] Standings service has no Swiss or Double Elimination logic
- [ ] No WebSocket or live score references in any Slice 7 service
- [ ] No fake/seed operational data in any Slice 7 runtime file
- [ ] No result-seed.ts, match-seed.ts, standings-seed.ts, bracket-seed.ts files
- [ ] All admin controllers use `Permissions.*` constants (no raw strings)
- [ ] Match service emits MATCH_CREATED, MATCH_UPDATED, MATCH_CANCELLED, MATCH_GENERATED
- [ ] Result service emits RESULT_RECORDED, RESULT_UPDATED, RESULT_VOIDED
- [ ] Standings service emits STANDINGS_RECALCULATED
- [ ] All audit calls are fire-and-forget (`void this.auditService?.log`)
- [ ] No alternative analytics event name spellings in runtime code
- [ ] Public SDK has getMatches, getResults, getStandings, getBracket
- [ ] Public SDK has no getMatchById, getResultById, recordResult, updateResult, voidResult
- [ ] Admin bracket SDK is `admin.tournaments.getBracket(id)` — sole method on `AdminTournamentsClient`
- [ ] `admin-tournaments.ts` defines `getBracket` (no separate bracket client file)
- [ ] `AdminTournamentsClient` includes `getBracket` property
- [ ] `admin-tournament-bracket.ts` does not exist (removed)
- [ ] `admin-tournament-bracket-types.ts` does not exist (removed)
- [ ] No competing `createAdminTournamentBracketClient` factory exists
- [ ] No public frontend matches/results/standings/bracket pages (TEMPORARY — Slice 9)
- [ ] No admin frontend matches/results/standings/bracket pages (TEMPORARY — Slice 10)
- [ ] No standalone `/admin/tournaments/:id/operations` page
- [ ] No standalone `/admin/tournaments/:id/preview` page
- [ ] No hardcoded `localhost` or `qesb.ir` in any Slice 7 runtime file
- [ ] `docs/development/phase-1-slice-7-verification.md` exists
- [ ] All verification commands pass
