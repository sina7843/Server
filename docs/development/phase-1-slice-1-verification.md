# Phase 1 / Slice 1 Verification Guide

This document describes the locked contracts, SDK method names, permissions, and endpoint
paths for Phase 1 / Slice 1 of the Dragon Ecosystem.

## Permissions

Phase 1 uses the `tournament.game.*` namespace for game management — **not** `game.game.*`.

| Constant                                   | Value                    |
| ------------------------------------------ | ------------------------ |
| `DragonPermissions.TOURNAMENT_GAME_READ`   | `tournament.game.read`   |
| `DragonPermissions.TOURNAMENT_GAME_MANAGE` | `tournament.game.manage` |

Removed (do not use):

- ~~`game.game.read`~~
- ~~`game.game.create`~~
- ~~`game.game.update`~~
- ~~`game.status.update`~~

## SDK Method Names (locked)

### Public SDK

| Client              | Method                         | Notes                                                                  |
| ------------------- | ------------------------------ | ---------------------------------------------------------------------- |
| `GamesClient`       | `list()`                       | Returns `GamePublicListResponseDto` (public-safe, no admin fields)     |
| `TournamentsClient` | `list()`                       | No `q` filter — use `search.tournaments()` for text search             |
| `TournamentsClient` | `withdrawMyRegistration(slug)` | POST — not `withdrawRegistration`                                      |
| `TournamentsClient` | `getParticipants(slug)`        | Returns `TournamentParticipantListResponseDto` (public, not admin DTO) |
| `TournamentsClient` | `getMatches(slug)`             | Returns `TournamentMatchListResponseDto` (public, not admin DTO)       |
| `TournamentsClient` | `getBracket(slug)`             | Returns `TournamentBracketDto`                                         |
| `EsportsClient`     | `getHome()`                    | GET `/api/v1/esports/home`                                             |
| `SearchClient`      | `tournaments(q, ...)`          | Text search with `q` — route: `/api/v1/search/tournaments`             |

### Admin SDK

| Client                               | Method                                 | Notes                                              |
| ------------------------------------ | -------------------------------------- | -------------------------------------------------- |
| `AdminGamesClient`                   | `get(id)`                              | Not `getById`                                      |
| `AdminTournamentsClient`             | `get(id)`                              | Not `getById`                                      |
| `AdminTournamentRegistrationsClient` | `get(tournamentId, registrationId)`    | Not `getById`                                      |
| `AdminTournamentResultsClient`       | `update(tournamentId, matchId, input)` | Not `updateResult`                                 |
| `AdminTournamentResultsClient`       | `void(tournamentId, matchId)`          | POST to `.../result/void` — not DELETE             |
| `AdminTournamentStandingsClient`     | `get(tournamentId)`                    | Not `getStandings`                                 |
| `AdminTournamentStandingsClient`     | `recalculate(tournamentId)`            | Not `calculateStandings`                           |
| `AdminTournamentParticipantsClient`  | `remove(tournamentId, participantId)`  | POST to `.../participants/:id/remove` — not DELETE |

## Public Contract Type Names

Use the locked public-facing aliases:

| Alias                       | Resolves to                            |
| --------------------------- | -------------------------------------- |
| `GamePublicDto`             | `PublicGameDto`                        |
| `GamePublicListResponseDto` | Public list with `GamePublicDto` items |
| `TournamentSummaryDto`      | `TournamentListItemDto`                |
| `TournamentDetailDto`       | `PublicTournamentDto`                  |
| `TournamentBracketDto`      | `BracketProjectionDto`                 |

## Endpoint Paths

### Public Esports

```
GET /api/v1/esports/home
```

Response: `EsportsHomeDto`

```typescript
{
  featuredPosts: PublicPostDto[];
  latestNews: PublicPostDto[];
  activeTournaments: TournamentListItemDto[];
  upcomingTournaments: TournamentListItemDto[];
  topContent: PublicPostDto[];
}
```

### Admin Participant Paths

```
POST  /admin/v1/tournaments/:id/participants/:participantId/remove
POST  /admin/v1/tournaments/:id/participants/:participantId/disqualify
PATCH /admin/v1/tournaments/:id/participants/:participantId
```

### Admin Match Result Paths

```
POST  /admin/v1/tournaments/:id/matches/:matchId/result       (record)
PATCH /admin/v1/tournaments/:id/matches/:matchId/result       (update)
POST  /admin/v1/tournaments/:id/matches/:matchId/result/void  (void)
```

## RegistrationStatus (locked)

Valid values: `submitted | approved | rejected | waitlisted | withdrawn | cancelled`

Removed: ~~`pending`~~ (use `submitted`), ~~`disqualified`~~ (belongs in `ParticipantStatus`)

## TournamentParticipantType vs TournamentRegistrationType

| Type                         | Values                       |
| ---------------------------- | ---------------------------- |
| `TournamentParticipantType`  | `individual \| team \| both` |
| `TournamentRegistrationType` | `individual \| team`         |

`TournamentParticipantType` describes what kind of participants a tournament accepts (can be `both`).
`TournamentRegistrationType` describes how a specific registration is submitted (always one type).

## Guardrail Notes

Guardrail tests include two categories:

**Permanently forbidden routes (Phase 1 — never implement):**

- `/tournaments/:id/operations`
- `/tournaments/:id/preview`
- `/tournaments/:slug/matches/:matchId` (public match **detail** — forbidden forever)

**Legal future routes (NOT forbidden — do not block these):**

- `/tournaments/:slug/matches` (public match **list** — legal in a future slice)
- `/games`, `/tournaments`, `/tournaments/:id`, `/tournaments/:slug` (public pages)
- Admin games and tournaments pages
- Admin games and tournaments navigation items

**Temporarily absent routes (marked `[slice-1-precondition]` — remove check when implementing):**

- Public tournament and games pages
- Admin tournament and games pages
- Admin games and tournaments nav items

When you implement a new page or nav item, find the `[slice-1-precondition]` test that
forbids it and remove or update it as part of that slice.

**Admin navigation permanently forbidden:**
shop, payment, academy, streaming, boardgame, marketplace, coming-soon/placeholder labels
