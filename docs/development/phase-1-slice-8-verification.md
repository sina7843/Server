# Phase 1 / Slice 8 — Verification Guide

## Scope Summary

Slice 8 implements the public-facing tournament discovery and detail experience for Phase 1.

| Area                                                            | Implemented   | Notes                                                                      |
| --------------------------------------------------------------- | ------------- | -------------------------------------------------------------------------- |
| Public tournament list API (`GET /api/v1/tournaments`)          | Yes           | Structured filter only — no text search                                    |
| Public tournament detail API (`GET /api/v1/tournaments/:slug`)  | Yes           | Public-safe fields; 404 for draft/deleted/archived                         |
| Public tournament search API (`GET /api/v1/search/tournaments`) | Yes           | Text search endpoint; q + public-safe filters; Final Alignment Fix 2       |
| SDK `tournaments.list()`                                        | Yes           | Structured list — no `q` param                                             |
| SDK `tournaments.getBySlug()`                                   | Yes           | Returns `PublicTournamentDto`                                              |
| SDK `search.tournaments()`                                      | Yes           | Text search — used when `q` present in discovery page                      |
| SDK `games.list()`                                              | Yes (Slice 3) | Used for game filter dropdown in discovery page                            |
| Discovery page `/tournaments`                                   | Yes           | Filters, search, pagination, all states                                    |
| Detail page `/tournaments/:slug`                                | Yes           | Public-safe fields, status-aware CTA, SEO metadata                         |
| `TournamentCard.vue` component                                  | Yes           | Status badge, format, CTA link, cancelled marking                          |
| `usePublicTournaments` composable                               | Yes           | Routes between `list()` and `search.tournaments()` by `q`                  |
| `useTournamentDetail` composable                                | Yes           | Wraps `createTournamentsDiscoveryApi`                                      |
| `participantType` in `PublicTournamentDto`                      | Yes           | Added in Task 8.3 for public detail rendering                              |
| Game name display on detail page                                | Yes           | Loaded on mount via `createGamesDiscoveryApi`; silently skipped on error   |
| `archivedAt` visibility hardening in `isPubliclyVisible()`      | Yes           | `archivedAt != null` always returns false regardless of status (detail)    |
| `archivedAt` exclusion in public list query                     | Yes           | Repository `list()` adds `archivedAt: { $exists: false }` by default       |
| CTA registration window awareness                               | Yes           | `registrationOpenAt`/`registrationCloseAt` checked before showing Register |
| Public frontend match/result/standing/bracket pages             | No            | Deferred to Slice 9                                                        |
| Admin frontend operational pages                                | No            | Deferred to Slice 10                                                       |
| Public match detail route `/tournaments/:slug/matches/:matchId` | No            | Permanently forbidden                                                      |
| Admin `/tournaments/:id/operations` standalone route            | No            | Permanently forbidden                                                      |
| Admin `/tournaments/:id/preview` standalone route               | No            | Permanently forbidden                                                      |
| Swiss / Double Elimination formats                              | No            | Permanently unsupported in Phase 1                                         |
| Prize / payment / shop                                          | No            | Permanently out of scope                                                   |
| Live scoring / WebSocket scoreboard                             | No            | Permanently out of scope                                                   |
| Fake/seed tournament data                                       | No            | Permanently forbidden                                                      |
| Streaming or live result feed                                   | No            | Permanently out of scope                                                   |

---

## Public Tournament API Summary

**Controller:** `apps/api/src/public-tournaments/public-tournaments.controller.ts`  
**Route prefix:** `api/v1/tournaments`  
**Auth:** Public — no authentication required

### Endpoints

| Method | Path                         | Description                                                     |
| ------ | ---------------------------- | --------------------------------------------------------------- |
| `GET`  | `/api/v1/tournaments`        | Structured public listing with filters                          |
| `GET`  | `/api/v1/tournaments/:slug`  | Public-safe detail by slug; 404 for non-public-safe tournaments |
| `GET`  | `/api/v1/search/tournaments` | Public-safe text search; accepts `q` plus same public filters   |

### Query Parameters — `GET /api/v1/tournaments`

| Parameter          | Type                             | Description                                              |
| ------------------ | -------------------------------- | -------------------------------------------------------- |
| `gameId`           | `string` (optional)              | Filter by game ID                                        |
| `status`           | `TournamentStatus`               | Public-safe status only (see Status Filter Policy below) |
| `format`           | `TournamentFormat`               | Phase 1 formats only (see Format Policy below)           |
| `registrationOpen` | `"true"` (optional)              | Filter to registration-open tournaments                  |
| `page`             | `number` (default: 1)            | Pagination                                               |
| `limit`            | `number` (default: 20, max: 100) | Pagination                                               |

**Text search is NOT accepted here.** Use `GET /api/v1/search/tournaments?q=...` instead.

### Query Parameters — `GET /api/v1/search/tournaments`

| Parameter          | Type                             | Description                                              |
| ------------------ | -------------------------------- | -------------------------------------------------------- |
| `q`                | `string` (optional, max 200)     | Title substring search (case-insensitive regex)          |
| `gameId`           | `string` (optional)              | Filter by game ID                                        |
| `status`           | `TournamentStatus`               | Public-safe status only; draft/archived silently dropped |
| `format`           | `TournamentFormat`               | Phase 1 formats only; unknown values silently dropped    |
| `registrationOpen` | `"true"` (optional)              | Filter to registration-open tournaments                  |
| `page`             | `number` (default: 1)            | Pagination                                               |
| `limit`            | `number` (default: 20, max: 100) | Pagination                                               |

Returns `TournamentListResponseDto` using the same public-safe summary projection as `GET /api/v1/tournaments`. draft, archived, deleted, and soft-archived (`archivedAt` set) tournaments are never included.

---

## Public Projection Safety Policy

The public list and detail endpoints project documents into public-safe DTOs.

### `TournamentListItemDto` (summary — list endpoint)

Included fields: `id`, `gameId`, `title`, `slug`, `format`, `status`, `capacity`, `startsAt`, `endsAt`, `registrationOpenAt`, `registrationCloseAt`, `publishedAt`, `createdAt`, `updatedAt`.

Excluded fields (never in list items): `description`, `rules`, `participantType`, `cancelledAt`, `deletedAt`, `archivedAt`, `slugNormalized`, and all admin/operational fields.

### `PublicTournamentDto` / `TournamentDetailDto` (detail endpoint)

Included fields: all `TournamentListItemDto` fields plus `description`, `rules`, `participantType` (when set), `publishedAt`.

Excluded fields: `cancelledAt`, `deletedAt`, `archivedAt`, `slugNormalized`, and all admin/operational fields.

**Operational data is never included:** no `participants`, `registrations`, `matches`, `results`, `standings`, or `bracket` in any public response.

---

## Public Status Filter Policy

The public API accepts only these statuses:

```
published
registration_open
registration_closed
in_progress
completed
cancelled
```

Silently rejected (never returned, never accepted as filter): `draft`, `archived`, and any deleted/internal state.

When no `status` filter is provided, the controller applies `PUBLIC_SAFE_STATUSES_ARRAY` as a default restriction, ensuring draft and archived tournaments are never included in unfiltered results.

When an explicit `status` filter is provided and it is not in the public-safe set, the value is silently dropped and the full `PUBLIC_SAFE_STATUSES_ARRAY` restriction is applied instead.

---

## Cancelled Visibility Policy

Cancelled tournaments **are visible publicly** for transparency. This means:

- `cancelled` is included in `PUBLIC_SAFE_STATUSES` and `PUBLIC_SAFE_STATUSES_ARRAY`.
- `GET /api/v1/tournaments` returns cancelled tournaments in unfiltered results.
- `GET /api/v1/tournaments/:slug` returns detail for a cancelled tournament (status 200, not 404).
- The `cancelledAt` timestamp is **never** included in public responses — it is an admin-only field.
- The detail page CTA for a cancelled tournament is non-actionable: it shows a plain "Cancelled" label with no register link.
- The `TournamentCard` for a cancelled tournament shows a strikethrough title, a "لغو شده" (cancelled) text label instead of a navigation link, and reduced opacity styling.

Draft, archived, and deleted tournaments are **never visible publicly** — they return 404 regardless of slug.

**`archivedAt` hardening (Task 8.4 closeout):** `archivedAt` is enforced at two layers:

1. **Detail endpoint:** `isPubliclyVisible()` checks `archivedAt != null` as an independent blocker before the status check. A tournament with any public-safe status (e.g. `published`, `registration_open`) that also has `archivedAt` set returns 404.

2. **List endpoint (Tiny Fix):** `TournamentRepository.list()` adds `archivedAt: { $exists: false }` to the MongoDB query by default (controlled by `TournamentListFilter.includeArchived`). This means the `total` count from `countDocuments` also excludes soft-archived tournaments — not just the `items` array. The public controller never passes `includeArchived`, so soft-archived tournaments are excluded from all public list results and totals. Admin queries may explicitly set `includeArchived: true`.

---

## `registrationOpen` Filter Semantics

The `registrationOpen` boolean filter is computed from real backend state — no fake counts.

**What `registrationOpen=true` means (in priority order):**

1. `status === 'registration_open'` is the primary signal — only tournaments with this status qualify.
2. If `registrationOpenAt` and `registrationCloseAt` are set on the document, the service may further restrict to the registration window.
3. Capacity-based filtering (full/not-full) is **not** applied in the public API — the public endpoint does not expose participant counts, so capacity-based cutoff is not possible without leaking count data.
4. If registration window fields are not set on a tournament that has `status === 'registration_open'`, the tournament is considered open.

**Fallback policy documentation:**  
When `registrationOpen=true` is passed and no window fields exist on the matching tournament, the registration is considered open if `status === 'registration_open'`. This is documented here because the public API does not surface participant counts and therefore cannot validate capacity-based open/full state.

The frontend discovery page passes `registrationOpen` directly to the API — it does **not** implement a client-side fake filter on top of the API results.

---

## List / Search Separation Policy

`GET /api/v1/tournaments` and `tournaments.list()` are for **structured filtering only**.

`GET /api/v1/search/tournaments` and `search.tournaments()` are for **text search**.

Rules enforced:

- `GET /api/v1/tournaments` does not accept `q`, `text`, or `search` query parameters.
- The `PublicTournamentsController` does not import `SearchService`.
- The SDK `TournamentsClient.list()` method does not accept a `q` parameter.
- `usePublicTournaments` routes to `searchApi.tournaments()` when `filter.q` is present, and to `tournamentsApi.list()` otherwise.
- The list params passed to `tournamentsApi.list()` never include `q`.
- No local/client-side fake text filtering is implemented — all filtering is server-side.

---

## Discovery Page Behavior

**Route:** `/tournaments` (`apps/web/pages/tournaments/index.vue`)  
**Composable:** `usePublicTournaments` (`apps/web/composables/usePublicTournaments.ts`)  
**API factory:** `createTournamentsDiscoveryApi`, `createTournamentSearchApi`, `createGamesDiscoveryApi` (`apps/web/features/tournaments/tournaments-api.ts`)

### Filter bar

| Filter                     | API endpoint used                               |
| -------------------------- | ----------------------------------------------- |
| Text search (`q`)          | `GET /api/v1/search/tournaments?q=...`          |
| Status dropdown            | `GET /api/v1/tournaments?status=...`            |
| Format dropdown            | `GET /api/v1/tournaments?format=...`            |
| Game dropdown              | `GET /api/v1/tournaments?gameId=...`            |
| Registration open checkbox | `GET /api/v1/tournaments?registrationOpen=true` |

Status options available in the UI: `registration_open`, `registration_closed`, `in_progress`, `published`, `completed`, `cancelled`. Draft and archived are never offered.

Format options available in the UI: `single_elimination`, `round_robin`, `manual`. Swiss and double elimination are never offered.

Games are loaded once on mount via `createGamesDiscoveryApi` (`GET /api/v1/games?limit=100`). Game filter is omitted if the games fetch fails.

Text input uses 350ms debounce (`debounceFetch`). Filter/select changes trigger immediate fetch.

URL query parameters are synced: `q`, `status`, `format`, `gameId`, `registrationOpen`, `page`.

### Page states

| State              | Trigger                                                      |
| ------------------ | ------------------------------------------------------------ |
| Loading            | Fetch in progress                                            |
| Error              | Fetch threw; shows retry button                              |
| Empty (filtered)   | `items.length === 0` with active filters; shows clear button |
| Empty (no filters) | `items.length === 0` with no filters                         |
| Results grid       | One or more items; grid of `TournamentCard` components       |
| Pagination         | `totalPages > 1`; previous/next buttons                      |

---

## Detail Page Behavior

**Route:** `/tournaments/:slug` (`apps/web/pages/tournaments/[slug].vue`)  
**Composable:** `useTournamentDetail` (`apps/web/composables/useTournamentDetail.ts`)

Data is fetched server-side via `useAsyncData` using `detail.getBySlug(slug)`. A 404 response maps to `data.value = null` (no re-throw). All other errors are re-thrown and cause the error state.

### Public-safe fields rendered

`title`, `status`, `format`, `participantType` (when set), `description` (when set), `rules` (when set), `registrationOpenAt`, `registrationCloseAt`, `startsAt`, `endsAt`, `capacity`.

### Game display policy (Task 8.4 closeout Fix 1)

The detail page shows the game name when available. It is loaded **client-side on mount** using `createGamesDiscoveryApi` (`GET /api/v1/games?limit=100`) — the same SDK factory used by the discovery page. The matching game is found by comparing `tournament.gameId` with items in the games list response. If the fetch fails or no match is found, the game name is silently omitted — it is supplementary display data.

No game name is hardcoded. No direct `fetch`, `$fetch`, or `axios` is used.

### Operational fields never rendered

`participants`, `matches`, `results`, `standings`, `bracket`, `registrations`, `cancelledAt`, `deletedAt`, `archivedAt`, `slugNormalized`.

### Not-found state

When `data.value === null` (404 or non-public-safe tournament), the page shows a safe generic message and a back link. No internal tournament state (draft/archived/deleted status) is exposed.

---

## CTA / Authentication Policy

CTA state is computed client-side in `onMounted` after hydration. Server-side render shows no CTA (auth is not available during SSR).

### Registration window policy (Task 8.4 closeout Fix 2)

When `status === 'registration_open'`, the CTA **additionally checks the registration window** before showing Register:

1. If `registrationOpenAt` is set and `now < registrationOpenAt` → window not yet open → show `registration_closed` (non-actionable).
2. If `registrationCloseAt` is set and `now >= registrationCloseAt` → window expired → show `registration_closed` (non-actionable).
3. If neither window field is set → **status-only fallback**: treat as open (documented policy because the public API does not surface capacity/count data).
4. If window is active → proceed to auth check → `register` or `view_registration`.

This means a tournament can have `status === 'registration_open'` but a CTA of `registration_closed` if the client-side time comparison shows the window has not started or has expired.

| Tournament status     | Window state            | Auth state                               | CTA shown                              |
| --------------------- | ----------------------- | ---------------------------------------- | -------------------------------------- |
| `registration_open`   | Window not yet open     | Any                                      | `registration_closed` (non-actionable) |
| `registration_open`   | Window expired          | Any                                      | `registration_closed` (non-actionable) |
| `registration_open`   | Window active or absent | Not authenticated                        | Register link → `/register`            |
| `registration_open`   | Window active or absent | Authenticated, no existing registration  | Register link → `/register`            |
| `registration_open`   | Window active or absent | Authenticated, has existing registration | View registration → `/my-registration` |
| `registration_closed` | N/A                     | Any                                      | Static text "ثبت‌نام بسته است"         |
| `in_progress`         | N/A                     | Any                                      | Static badge "در حال برگزاری"          |
| `completed`           | N/A                     | Any                                      | Static text "رقابت پایان یافته"        |
| `cancelled`           | N/A                     | Any                                      | Static text "لغو شده" (non-actionable) |
| `published`           | N/A                     | Any                                      | No CTA (`none`)                        |

The `view_registration` CTA is only shown after a successful `getMyRegistration` response (200).

**`getMyRegistration` error policy (Final Alignment Fix 3):** The catch block now distinguishes HTTP status codes using `ApiClientError.status`:

| `getMyRegistration` response | CTA shown                                        |
| ---------------------------- | ------------------------------------------------ |
| 200                          | `view_registration`                              |
| 404                          | `register` (no registration)                     |
| 401 / 403 / auth error       | `none` (neutral — do not assume no registration) |
| 5xx / network / unknown      | `none` (neutral — do not assume no registration) |

A non-404 error must **not** show the Register CTA, because the user might have an existing registration and the error is transient (expired session, network fault, server error). Showing Register in that case could cause a duplicate registration attempt.

The `cancelled` CTA never renders a clickable element — no `dr-btn-primary` class, no `/register` link.

---

## SEO / Index / Noindex Policy

| Page                                   | SEO behavior                                               |
| -------------------------------------- | ---------------------------------------------------------- |
| `/tournaments`                         | Indexable — `useHead` with title, description, og:title    |
| `/tournaments/:slug` (public-safe)     | Indexable — dynamic title/description from tournament data |
| `/tournaments/:slug` (not found/error) | `noindex,follow` — does not expose sensitive content       |
| `/tournaments/:slug/register`          | `noindex,nofollow` — permanent (Slice 6)                   |
| `/tournaments/:slug/my-registration`   | `noindex,nofollow` — permanent (Slice 6)                   |
| All unrelated public content pages     | Not affected by Slice 8 — remain indexable                 |

No `qesb.ir` or `localhost` is hardcoded in any canonical URL or runtime configuration.

The planned Phase 1 public domain is `qesb.ir`. Runtime configuration must always use `runtimeConfig.public.apiBaseUrl` and relative paths — never hardcoded origins.

---

## Analytics Event Policy

The `tournament.viewed` event must be fired when a public-safe tournament detail page is viewed.

**Exact event name:** `tournament.viewed`

**Forbidden alternatives:**

```
tournament_viewed
tournament.detail_viewed
tournament_view
```

**Integration status:** Deferred. The analytics composable is not yet implemented client-side. The exact event name is documented in `useTournamentDetail.ts` as a comment. The composable is the correct integration point when analytics is added.

The `ANALYTICS_EVENT_TYPES` constant in `@dragon/types` includes `'tournament.viewed'` as the canonical reference.

---

## SDK Usage Policy

Slice 8 pages and composables use **SDK only** — no direct `fetch`, `$fetch`, or `axios`.

Allowed SDK calls in Slice 8 web flows:

```
tournaments.list()           → GET /api/v1/tournaments
tournaments.getBySlug()      → GET /api/v1/tournaments/:slug
search.tournaments()         → GET /api/v1/search/tournaments
games.list()                 → GET /api/v1/games
```

Never used in Slice 8 list/detail pages:

```
tournaments.getParticipants()
tournaments.getMatches()
tournaments.getResults()
tournaments.getStandings()
tournaments.getBracket()
```

---

## Route Guardrails

### Slice 8 public routes (implemented)

```
GET /tournaments              — discovery page
GET /tournaments/:slug        — detail page
```

### Existing routes not changed (Slice 6)

```
GET /tournaments/:slug/register        — noindex
GET /tournaments/:slug/my-registration — noindex
```

### TEMPORARY: Slice 9 routes not yet created

The following routes are intentionally absent. Guardrail tests verify their absence and are **labeled TEMPORARY** — they must be removed when the corresponding slice adds the route.

```
/tournaments/:slug/participants   → Slice 9
/tournaments/:slug/matches        → Slice 9
/tournaments/:slug/results        → Slice 9
/tournaments/:slug/standings      → Slice 9
/tournaments/:slug/bracket        → Slice 9
```

### PERMANENT forbidden routes (never create)

```
/tournaments/:slug/matches/:matchId       — permanently forbidden (public match detail)
/admin/v1/tournaments/:id/operations      — permanently forbidden (standalone admin)
/admin/v1/tournaments/:id/preview         — permanently forbidden (standalone admin)
```

Admin operational routes (`/admin/v1/tournaments/:id/matches`, `/results`, `/standings`, `/bracket`) remain in Slice 10 scope and are already implemented at the API level.

---

## Out-of-Scope List

The following are explicitly out of scope for Slice 8 and must not be added:

```
Public participants page
Public matches page
Public results page
Public standings page
Public bracket page
Public match detail route or page
Admin tournament operations page
Admin tournament preview page
Swiss format implementation
Double Elimination format implementation
Advanced Bracket Editor
Live scoring
WebSocket scoreboard
Prize / payment / shop
Streaming / live video
Comments / community
Fake tournament data
Fake registration data
Fake match / result / standing / bracket data
Placeholder / coming-soon pages
Production deploy
```

---

## Domain-Awareness Note

Phase 1 is domain-aware but not yet production-deployed.

- **Planned public domain:** `qesb.ir`
- **Possible future domain:** `stream.ir`

Runtime and config code must use `runtimeConfig.public.apiBaseUrl` (or relative paths with baseUrl `/`). No hardcoded `localhost`, `qesb.ir`, or fixed API origin in runtime code.

Docs (including this file) may mention `qesb.ir` and `stream.ir` for planning context.

---

## Verification Commands

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

# SDK and types
pnpm --filter @dragon/sdk test
pnpm --filter @dragon/types test

# Monorepo
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm format:check
```

### Key test files for Slice 8

| File                                                                    | Scope                                       |
| ----------------------------------------------------------------------- | ------------------------------------------- |
| `apps/web/features/tournaments/slice8-guardrails.spec.ts`               | Discovery page SDK/SEO/fake-data guardrails |
| `apps/web/features/tournaments/slice8-hardening.spec.ts`                | Route, format, analytics, policy hardening  |
| `apps/web/features/tournaments/tournament-detail-guardrails.spec.ts`    | Detail page full guardrails                 |
| `apps/web/features/tournaments/tournaments-api.spec.ts`                 | API factory unit tests                      |
| `apps/api/src/public-tournaments/public-tournaments.controller.spec.ts` | Public API behavior, projection safety      |
| `apps/web/features/registrations/registration-guardrails.spec.ts`       | Registration routes noindex + forbidden     |

### Manual spot-check checklist

- [ ] `GET /api/v1/tournaments` returns only public-safe statuses (no draft/archived in response)
- [ ] `GET /api/v1/tournaments?status=draft` returns same result as no status filter (draft dropped)
- [ ] `GET /api/v1/tournaments?format=swiss` returns same result as no format filter (swiss dropped)
- [ ] `GET /api/v1/tournaments/:slug` returns 404 for a draft tournament slug
- [ ] `GET /api/v1/tournaments/:slug` returns 404 for a deleted tournament slug
- [ ] `GET /api/v1/tournaments` does not include a tournament with `archivedAt` set (Tiny Fix — list exclusion)
- [ ] `GET /api/v1/tournaments` total count does not count tournaments with `archivedAt` set (Tiny Fix — countDocuments)
- [ ] `GET /api/v1/tournaments/:slug` returns 404 for a tournament with `archivedAt` set (Task 8.4 Fix 3)
- [ ] `GET /api/v1/tournaments/:slug` returns 200 for a cancelled tournament (transparency)
- [ ] Cancelled tournament detail has no `cancelledAt` field in JSON response
- [ ] Discovery page shows loading, error, empty, and results states correctly
- [ ] Discovery page text search calls `/api/v1/search/tournaments`, not `/api/v1/tournaments`
- [ ] Detail page shows game name when game is found (Task 8.4 Fix 1)
- [ ] Detail page renders gracefully when game name is unavailable (no error shown)
- [ ] Detail page CTA shows "Register" for unauthenticated user on open tournament with active window (Task 8.4 Fix 2)
- [ ] Detail page CTA shows non-actionable state when `registrationCloseAt` has passed (Fix 2)
- [ ] Detail page CTA shows non-actionable state when `registrationOpenAt` is in the future (Fix 2)
- [ ] Detail page CTA shows "View my registration" for authenticated user with existing registration
- [ ] Detail page cancelled CTA shows plain text, no registration link
- [ ] `/tournaments/index.vue` has no noindex in page source
- [ ] `/tournaments/:slug` (public tournament) has no noindex in page source
- [ ] `/tournaments/:slug/register` has noindex in page source
- [ ] `/tournaments/:slug/my-registration` has noindex in page source
