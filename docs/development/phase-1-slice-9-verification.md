# Phase 1 / Slice 9 — Verification Guide

## Scope Summary

Slice 9 implements the public-facing operational views for tournament detail: participants list,
matches list, results list, standings table, and bracket projection. All pages are **read-only**.

| Area                                                                 | Implemented   | Notes                                                             |
| -------------------------------------------------------------------- | ------------- | ----------------------------------------------------------------- |
| Public participants page `/tournaments/:slug/participants`           | Yes           | Approved/active participant projection; no userId/phone/email     |
| Public matches page `/tournaments/:slug/matches`                     | Yes           | Grouped by round; winner display; no match detail links           |
| Public results page `/tournaments/:slug/results`                     | Yes           | Flat list of completed match results with winner name resolution  |
| Public standings page `/tournaments/:slug/standings`                 | Yes           | rank/displayName/wins/losses/points table; unavailable for manual |
| Public bracket page `/tournaments/:slug/bracket`                     | Yes           | Backend projection; grouped rounds; Persian labels; read-only     |
| `useTournamentParticipants` composable                               | Yes           | SDK-only; `getParticipants()`                                     |
| `useTournamentMatches` composable                                    | Yes           | SDK-only; `getMatches()`; analytics event documented              |
| `useTournamentResults` composable                                    | Yes           | SDK-only; `getResults()`                                          |
| `useTournamentStandings` composable                                  | Yes           | SDK-only; `getStandings()`                                        |
| `useTournamentBracket` composable                                    | Yes           | SDK-only; `getBracket()`; analytics event documented              |
| Public participants API `GET /api/v1/tournaments/:slug/participants` | Yes           | Added in Slice 9.1; `isPubliclyVisible` gate; public projection   |
| Public matches API `GET /api/v1/tournaments/:slug/matches`           | Yes (Slice 7) | No change in Slice 9                                              |
| Public results API `GET /api/v1/tournaments/:slug/results`           | Yes (Slice 7) | No change in Slice 9                                              |
| Public standings API `GET /api/v1/tournaments/:slug/standings`       | Yes (Slice 7) | No change in Slice 9                                              |
| Public bracket API `GET /api/v1/tournaments/:slug/bracket`           | Yes (Slice 7) | No change in Slice 9                                              |
| Public match detail route `/tournaments/:slug/matches/:matchId`      | No            | **Permanently forbidden**                                         |
| Public result detail route `/tournaments/:slug/results/:resultId`    | No            | **Permanently forbidden**                                         |
| Admin operational frontend pages                                     | No            | Deferred to Slice 10                                              |
| Admin `/tournaments/:id/operations` standalone route                 | No            | **Permanently forbidden**                                         |
| Admin `/tournaments/:id/preview` standalone route                    | No            | **Permanently forbidden**                                         |
| Swiss / Double Elimination formats                                   | No            | Permanently unsupported in Phase 1                                |
| Bracket editor / editable bracket / drag-drop                        | No            | Permanently out of scope                                          |
| Live scoring / WebSocket scoreboard                                  | No            | Permanently out of scope                                          |
| Referee / dispute workflow                                           | No            | Permanently out of scope                                          |
| Prize / payment / shop                                               | No            | Permanently out of scope                                          |
| Streaming / live video                                               | No            | Permanently out of scope                                          |
| Fake / seed operational data                                         | No            | **Permanently forbidden**                                         |

---

## Operational Public Route List

All routes are read-only. No mutations. No auth required.

| Route                             | Page file                                   | SDK method              |
| --------------------------------- | ------------------------------------------- | ----------------------- |
| `/tournaments/:slug/participants` | `pages/tournaments/[slug]/participants.vue` | `getParticipants(slug)` |
| `/tournaments/:slug/matches`      | `pages/tournaments/[slug]/matches.vue`      | `getMatches(slug)`      |
| `/tournaments/:slug/results`      | `pages/tournaments/[slug]/results.vue`      | `getResults(slug)`      |
| `/tournaments/:slug/standings`    | `pages/tournaments/[slug]/standings.vue`    | `getStandings(slug)`    |
| `/tournaments/:slug/bracket`      | `pages/tournaments/[slug]/bracket.vue`      | `getBracket(slug)`      |

---

## Backend Alignment Boundary

The following backend APIs were added or were already present and are used by Slice 9 pages:

| Endpoint                                     | Controller                                     | Added in  |
| -------------------------------------------- | ---------------------------------------------- | --------- |
| `GET /api/v1/tournaments/:slug/participants` | `public-tournament-participants.controller.ts` | Slice 9.1 |
| `GET /api/v1/tournaments/:slug/matches`      | `public-tournament-matches.controller.ts`      | Slice 7   |
| `GET /api/v1/tournaments/:slug/results`      | `public-tournament-results.controller.ts`      | Slice 7   |
| `GET /api/v1/tournaments/:slug/standings`    | `public-tournament-standings.controller.ts`    | Slice 7   |
| `GET /api/v1/tournaments/:slug/bracket`      | `public-tournament-bracket.controller.ts`      | Slice 7   |

All public operational endpoints:

- Require no authentication
- Apply `isPubliclyVisible()` gate (404 for draft/cancelled/archived/deleted)
- Return only public-safe projections
- Are read-only (`@Get` only — no `@Post`, `@Patch`, `@Put`, `@Delete`)

Allowed backend changes in Slice 9:

- Minor projection/type fixes for existing public operational read APIs
- Tests for public-safe response behavior if touched

Not allowed in Slice 9:

- New match generation behavior
- Result mutation behavior
- Standings recalculation behavior
- Bracket persistence
- Public match detail API
- Public result detail API
- Admin operation APIs beyond existing Slice 7/10 boundaries

---

## Read-Only Policy

All Slice 9 pages are strictly read-only. No mutation actions appear in the UI.

Forbidden UI/actions across all pages:

- Registration approval / reject / cancel
- Participant remove / disqualify
- Match create / update / cancel
- Result record / update / void
- Standings recalculate
- Bracket edit / drag / drop
- Live scoring controls
- Admin controls

---

## Public Participant Privacy Policy

Public participant pages expose only the approved/active participant projection
(`TournamentParticipantPublicDto`). The following fields are never exposed:

- `phone`
- `email`
- `userId` (internal user account ID)
- `rejectedReason`
- `participantRemovedAt` / `participantDisqualifiedAt`
- `adminNotes`
- Team member contact data
- Internal registration fields

Participants come from `getParticipants(slug)` on the public SDK — the approved/active
participant projection computed server-side from approved registrations.

Participants are never derived from arbitrary registration data in the frontend.

---

## Match List Policy

The matches page (`/tournaments/:slug/matches`) renders matches grouped by round.

Rules:

- Matches are grouped by `match.round` and sorted ascending
- Each match card shows: match number, status badge, participant names, winner badge
- Participant names are resolved via `getParticipants()` co-fetched alongside matches
- No match card links to a detail page
- No match detail page exists (`/tournaments/:slug/matches/:matchId` — permanently forbidden)
- Scores are not shown on the matches list (scores are on the results page)

---

## Result Projection Policy

The results page (`/tournaments/:slug/results`) renders a flat list of completed match results.

Rules:

- Results come from `getResults(slug)` — the `TournamentMatchResultDto` list
- Winner names are resolved client-side via co-fetched participants (`getParticipants()`)
- Scores (`participant1Score`, `participant2Score`) are displayed where present
- No result detail page exists (`/tournaments/:slug/results/:resultId` — permanently forbidden)
- No result mutation UI (no score edit, no winner override)

---

## Standings Display / Unavailable Policy

The standings page (`/tournaments/:slug/standings`) renders the computed standings table.

Rules:

- Standings come from `getStandings(slug)` — the `TournamentStandingsDto`
- The table shows: rank, displayName, wins, losses, points
- `displayName` is resolved server-side — no client-side name lookup needed
- For `manual` format, the server returns an empty `standings` array and the page shows
  an honest "standings unavailable for this format" message (not a fake empty table)
- No recalculation button or trigger
- No standings mutation UI

---

## Bracket Rendering Policy

The bracket page (`/tournaments/:slug/bracket`) renders the backend bracket projection.

Rules:

- Bracket data comes from `getBracket(slug)` — the `TournamentBracketDto` (`BracketProjectionDto`)
- The bracket is grouped by `BracketRoundDto.round`, sorted ascending
- Round labels come from the backend (`Final`, `Semifinal`, `Quarterfinal`, `Round N`)
  and are mapped to Persian equivalents on the frontend (فینال, نیمه‌نهایی, ربع‌نهایی, دور N)
- Each match node shows: match number, status badge, participants with seed, winner badge
- The bracket is display-only — no editable bracket, no drag/drop, no live scoring
- The "bracket unavailable" state is shown honestly when there are no rounds (no matches yet)
- The bracket is projected from match data server-side — no independent bracket collection/model

---

## No Public Match Detail Policy

`/tournaments/:slug/matches/:matchId` is **permanently forbidden** in Phase 1.

This means:

- No `pages/tournaments/[slug]/matches/[matchId].vue` file
- No `pages/tournaments/[slug]/matches/[id].vue` file
- No `GET /api/v1/tournaments/:slug/matches/:matchId` API endpoint
- No public SDK method for fetching a single match by ID
- No clickable match detail links in any operational page
- Match cards/rows on the matches page are display-only

---

## No Public Result Detail Policy

`/tournaments/:slug/results/:resultId` is **permanently forbidden** in Phase 1.

This means:

- No `pages/tournaments/[slug]/results/[resultId].vue` file
- No `GET /api/v1/tournaments/:slug/results/:resultId` API endpoint
- No public SDK method for fetching a single result by match/result ID
- No clickable result detail links in any operational page

---

## No Mutation Policy

All Slice 9 pages are read-only. No mutation actions exist.

Forbidden in all public operational pages:

- No `@Post`, `@Patch`, `@Put`, `@Delete` patterns
- No mutation SDK methods called from page composables
- No mutation form/button UI in templates
- No admin SDK usage

---

## Empty / Unavailable State Policy

Empty and unavailable states must be honest and API-backed. No fake or placeholder data.

| Page         | Empty state message                                  | Condition                             |
| ------------ | ---------------------------------------------------- | ------------------------------------- |
| participants | "هنوز شرکت‌کننده‌ای ثبت نشده است."                   | `participants.length === 0`           |
| matches      | "هنوز مسابقه‌ای تولید نشده است."                     | `matches.length === 0`                |
| results      | "هنوز نتیجه‌ای ثبت نشده است."                        | `results.length === 0`                |
| standings    | "جدول رده‌بندی برای این فرمت تورنمنت در دسترس نیست." | `format === 'manual'`                 |
| standings    | "هنوز رده‌بندی ثبت نشده است."                        | `standings.length === 0` (non-manual) |
| bracket      | "براکت تا زمان ایجاد مسابقات در دسترس نیست."         | `rounds.length === 0`                 |

---

## Shared Compact Tournament Context Policy

Every operational page renders a compact tournament context at the top.

Allowed:

- Title as back-link to `/tournaments/:slug`
- Status badge
- Simple nav among the 5 operational tabs (participants / matches / results / standings / bracket)

Not allowed:

- Full detail content duplication
- Registration form or CTA
- Admin controls
- Placeholder future modules
- Coming-soon sections

---

## SEO / Index / Noindex Policy

| Route                                | Indexable   | Notes                                               |
| ------------------------------------ | ----------- | --------------------------------------------------- |
| `/tournaments`                       | Yes         | Discovery page                                      |
| `/tournaments/:slug`                 | Yes         | Public-safe tournament detail                       |
| `/tournaments/:slug/participants`    | Yes         | When tournament is public-safe                      |
| `/tournaments/:slug/matches`         | Yes         | When tournament is public-safe                      |
| `/tournaments/:slug/results`         | Yes         | When tournament is public-safe                      |
| `/tournaments/:slug/standings`       | Yes         | When tournament is public-safe                      |
| `/tournaments/:slug/bracket`         | Yes         | When tournament is public-safe                      |
| `/tournaments/:slug/register`        | **noindex** | Registration form — never indexed                   |
| `/tournaments/:slug/my-registration` | **noindex** | User-specific — never indexed                       |
| Not-found / non-public-safe pages    | **noindex** | All operational pages apply `noindex,follow` on 404 |

Rules:

- No static blanket `noindex,nofollow` on operational pages
- `noindex,follow` applied only when `notFound` is true
- No hardcoded `qesb.ir` canonical or runtime URL in any page

---

## Analytics Event Policy

Exact event names (from `ANALYTICS_EVENT_TYPES` in `@dragon/types`):

| Event name                  | Where                  | Status                                |
| --------------------------- | ---------------------- | ------------------------------------- |
| `tournament.match_viewed`   | `useTournamentMatches` | Documented; full integration deferred |
| `tournament.bracket_viewed` | `useTournamentBracket` | Documented; full integration deferred |

Forbidden alternative names:

- `match_viewed`, `tournament_match_viewed`, `tournament.matches_viewed`, `tournament.matchListViewed`
- `bracket_viewed`, `tournament_bracket_viewed`, `tournament.bracketViewed`

Analytics must not depend on fake data.
Analytics must not include sensitive participant data.
Full analytics client-side integration is deferred beyond Slice 9.

---

## SDK Usage Policy

Allowed public operational SDK methods for Slice 9 pages:

```typescript
tournaments.getParticipants(slug); // → TournamentParticipantListResponseDto
tournaments.getMatches(slug); // → { items: PublicTournamentMatchDto[] }
tournaments.getResults(slug); // → readonly TournamentMatchResultDto[]
tournaments.getStandings(slug); // → TournamentStandingsDto
tournaments.getBracket(slug); // → TournamentBracketDto
```

Forbidden:

- Admin SDK (`createAdminTournamentsClient`)
- Direct `fetch()` / `$fetch()` / `axios`
- Public mutation SDK methods
- Public match detail SDK method
- Public result detail SDK method
- Live scoring / WebSocket SDK
- Bracket editor SDK

All composables use `createTournamentsDiscoveryApi({ baseUrl })` with runtime config.
No hardcoded API origin.

---

## Route Guardrails

### Allowed Slice 9 public operational routes

```text
/tournaments/:slug/participants
/tournaments/:slug/matches
/tournaments/:slug/results
/tournaments/:slug/standings
/tournaments/:slug/bracket
```

### Already allowed (previous slices)

```text
/tournaments
/tournaments/:slug
/tournaments/:slug/register
/tournaments/:slug/my-registration
```

### Permanently forbidden public routes

```text
/tournaments/:slug/matches/:matchId   ← permanent
/tournaments/:slug/results/:resultId  ← permanent
```

### Permanently forbidden admin standalone routes

```text
/admin/tournaments/:id/operations   ← permanent
/admin/tournaments/:id/preview      ← permanent
```

### Future Slice 10 admin operation routes (not yet implemented, not permanently blocked)

```text
/admin/tournaments/:id/matches
/admin/tournaments/:id/results
/admin/tournaments/:id/standings
/admin/tournaments/:id/bracket
```

These routes belong to Slice 10. They are not permanently blocked — remove the
TEMPORARY checks in `slice9-hardening.spec.ts` when Slice 10 adds them.

---

## Previous Temporary Guardrail Updates

The following temporary guardrail checks were present in earlier slices and have been
updated as Slice 9 routes landed:

| File                                   | Change                                                                         |
| -------------------------------------- | ------------------------------------------------------------------------------ |
| `slice9-guardrails.spec.ts`            | Added results/standings/bracket existence checks as routes landed              |
| `slice8-hardening.spec.ts`             | Removed TEMPORARY checks for results/standings/bracket (now exist)             |
| `tournament-detail-guardrails.spec.ts` | Removed deferred-pages checks for results/standings/bracket                    |
| `registration-guardrails.spec.ts`      | Removed TEMPORARY checks for results/standings/bracket                         |
| `homepage-hardening.spec.ts`           | Emptied `SLICE2_PRECONDITION_PATTERNS` (all operational pages now implemented) |
| `slice7-closeout.spec.ts` (API)        | Removed TEMPORARY frontend page checks; removed unused `WEB_PAGES` constant    |

---

## Out-of-Scope List

The following are explicitly out of scope for Slice 9 and Phase 1:

```text
Public match detail page (/tournaments/:slug/matches/:matchId)
Public result detail page
Admin operational pages (Slice 10)
Bracket editor / editable bracket / drag-drop
Live scoring / WebSocket scoreboard
Referee / dispute workflow
Swiss format UI
Double Elimination UI
Advanced Bracket Editor UI
Prize / payment / shop
Streaming / live video
Comments / community features
Fake or placeholder operational data
Production deployment
```

---

## Domain-Awareness Note

Phase 1 planned public domain: **qesb.ir**

Runtime/config code must not hardcode `localhost`, `qesb.ir`, or any fixed API origin.
Composables use `runtimeConfig.public?.apiBaseUrl` for the base URL.

A possible future domain is `stream.ir`. No code references this domain.

---

## Verification Commands

Run the following to verify Slice 9:

```bash
# Web app
pnpm --filter @dragon/web lint
pnpm --filter @dragon/web typecheck
pnpm --filter @dragon/web test
pnpm --filter @dragon/web build

# API
pnpm --filter @dragon/api lint
pnpm --filter @dragon/api typecheck
pnpm --filter @dragon/api test

# SDK and types
pnpm --filter @dragon/sdk test
pnpm --filter @dragon/types test

# Workspace-wide
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm format:check
```

### Slice 9 specific test files

```text
apps/web/features/tournaments/slice9-guardrails.spec.ts          (participants, matches)
apps/web/features/tournaments/slice9-results-standings-guardrails.spec.ts  (results, standings)
apps/web/features/tournaments/slice9-bracket-guardrails.spec.ts  (bracket)
apps/web/features/tournaments/slice9-hardening.spec.ts           (cross-cutting hardening)
```
