# Phase 1 / Slice 3 — Verification Guide

## Scope Summary

Slice 3 implements the admin games management UI backed by the locked SDK. It is
hardening-only from a public surface perspective — no new public routes, no new product
sections, no TournamentModule.

| Area                                               | Implemented | Notes                                  |
| -------------------------------------------------- | ----------- | -------------------------------------- |
| `GET /admin/v1/games` (list)                       | Yes         | SDK: `admin.games.list()`              |
| `GET /admin/v1/games/:id` (get)                    | Yes         | SDK: `admin.games.get(id)`             |
| `POST /admin/v1/games` (create)                    | Yes         | SDK: `admin.games.create(input)`       |
| `PATCH /admin/v1/games/:id` (update)               | Yes         | SDK: `admin.games.update(id, input)`   |
| `DELETE /admin/v1/games/:id` (soft-delete)         | Yes         | SDK: `admin.games.delete(id)`          |
| Admin UI: `/games` (list with filter + pagination) | Yes         | Permission: `tournament.game.read`     |
| Admin UI: `/games/new` (create form)               | Yes         | Permission: `tournament.game.manage`   |
| Admin UI: `/games/:id/edit` (edit form)            | Yes         | Permission: `tournament.game.manage`   |
| Delete confirmation dialog                         | Yes         | Destructive mode, soft-delete contract |
| Loading / empty / error / forbidden states         | Yes         | All states handled in every page       |
| Games navigation item                              | Yes         | Shown with `tournament.game.read`      |
| Public `/games` route                              | No          | Permanently forbidden — admin only     |
| Public `/games/:slug` route                        | No          | Permanently forbidden — admin only     |
| TournamentModule                                   | No          | Not in Slice 3                         |
| Tournament CRUD                                    | No          | Not in Slice 3                         |

---

## Admin SDK: `admin.games.*`

**Package:** `packages/sdk`
**Client:** `AdminGamesClient`
**Factory:** `createAdminGamesClient(apiClient)`

### Locked SDK methods

| Method              | HTTP                         | Returns               |
| ------------------- | ---------------------------- | --------------------- |
| `list(params?)`     | `GET /admin/v1/games`        | `GameListResponseDto` |
| `get(id)`           | `GET /admin/v1/games/:id`    | `GameDto`             |
| `create(input)`     | `POST /admin/v1/games`       | `GameDto`             |
| `update(id, input)` | `PATCH /admin/v1/games/:id`  | `GameDto`             |
| `delete(id)`        | `DELETE /admin/v1/games/:id` | `void`                |

### Query params for `list()`

| Param    | Type                                   | Description         |
| -------- | -------------------------------------- | ------------------- |
| `status` | `'active' \| 'inactive' \| 'archived'` | Filter by status    |
| `page`   | `number`                               | 1-based page number |
| `limit`  | `number`                               | Items per page      |

### SDK surface guardrail

`AdminGamesClient` exposes **exactly** these five methods. The following aliases and
extensions are prohibited:

- No `updateStatus` (use `update(id, { status })`)
- No `getById` alias (locked name is `get`)
- No `getBySlug` (not a public-facing admin operation)

---

## Admin UI Routes

All routes use Nuxt file-based routing without an `/admin` prefix.

| File                                   | Route             | Required permission      |
| -------------------------------------- | ----------------- | ------------------------ |
| `apps/admin/pages/games/index.vue`     | `/games`          | `tournament.game.read`   |
| `apps/admin/pages/games/new.vue`       | `/games/new`      | `tournament.game.manage` |
| `apps/admin/pages/games/[id]/edit.vue` | `/games/:id/edit` | `tournament.game.manage` |

### Middleware chain

All games pages use:

```
middleware: ['admin-auth-required', 'admin-permission-required']
```

### Permissions

| Constant                                   | Value                    | Grants                       |
| ------------------------------------------ | ------------------------ | ---------------------------- |
| `DragonPermissions.TOURNAMENT_GAME_READ`   | `tournament.game.read`   | View games list and detail   |
| `DragonPermissions.TOURNAMENT_GAME_MANAGE` | `tournament.game.manage` | Create, update, delete games |

Permissions are always referenced via `DragonPermissions` constants from `@dragon/sdk`.
Raw strings (`'tournament.game.read'`) are forbidden in page files.

---

## Components

| Component                                         | Props / Emits                                                                                |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `apps/admin/components/games/GameForm.vue`        | Props: `initial`, `editMode`, `actionLoading`, `actionError`, `submitLabel`; Emits: `submit` |
| `apps/admin/components/games/GameListTable.vue`   | Props: `games`, `canManage`; Emits: `edit`, `delete`                                         |
| `apps/admin/components/games/GameStatusBadge.vue` | Props: `status: GameStatus`                                                                  |

### GameForm slug rules

- Slug is required on create; disabled (read-only) on edit.
- Pattern: `/^[a-z0-9][a-z0-9-]*$/` — lowercase letters, digits, hyphens; must start with letter or digit.
- Max length: 128 characters.

### Delete contract (soft-delete)

`DELETE /admin/v1/games/:id` soft-deletes the record (`deletedAt` is set). Subsequent
`GET /admin/v1/games/:id` and `PATCH /admin/v1/games/:id` return `null` for soft-deleted
records. The UI redirects to `/games` after a successful delete and removes the entry from
the list.

---

## Composable: `useAdminGames`

**File:** `apps/admin/composables/useAdminGames.ts`

### State exposed

| Ref             | Type                 | Description                        |
| --------------- | -------------------- | ---------------------------------- |
| `games`         | `readonly GameDto[]` | Current page of games              |
| `gamesTotal`    | `number`             | Total matching games               |
| `gamesPage`     | `number`             | Current page number                |
| `gamesLoading`  | `boolean`            | List fetch in progress             |
| `gamesError`    | `string \| null`     | List fetch error message           |
| `game`          | `GameDto \| null`    | Single loaded game                 |
| `gameLoading`   | `boolean`            | Single fetch in progress           |
| `gameError`     | `string \| null`     | Single fetch error message         |
| `actionLoading` | `boolean`            | Create/update/delete in progress   |
| `actionError`   | `string \| null`     | Action error message               |
| `actionSuccess` | `boolean`            | Last action completed successfully |

### Methods

| Method                  | Returns                    | Description                        |
| ----------------------- | -------------------------- | ---------------------------------- |
| `loadGames(params?)`    | `Promise<void>`            | Load games list                    |
| `loadGame(id)`          | `Promise<void>`            | Load single game                   |
| `createGame(input)`     | `Promise<GameDto \| null>` | Create and return game             |
| `updateGame(id, input)` | `Promise<GameDto \| null>` | Update and return game             |
| `deleteGame(id)`        | `Promise<boolean>`         | Soft-delete, returns success       |
| `clearActionState()`    | `void`                     | Reset action loading/error/success |

---

## Navigation

Games nav item was added to `apps/admin/features/navigation/admin-navigation.ts`:

```typescript
{
  key: 'games',
  label: 'بازی‌ها',
  labelEn: 'Games',
  path: '/games',
  permission: DragonPermissions.TOURNAMENT_GAME_READ,
}
```

The nav item is visible only when the user has `tournament.game.read`. Admin users without
this permission do not see the Games link.

---

## Type Import Rules

| Type                  | Correct import source | Wrong source        |
| --------------------- | --------------------- | ------------------- |
| `GameDto`             | `@dragon/types`       | ~~`@dragon/sdk`~~   |
| `GameStatus`          | `@dragon/types`       | ~~`@dragon/sdk`~~   |
| `GameListResponseDto` | `@dragon/types`       | ~~`@dragon/sdk`~~   |
| `GamesListParams`     | `@dragon/sdk`         | ~~`@dragon/types`~~ |
| `DragonPermissions`   | `@dragon/sdk`         | ~~`@dragon/types`~~ |
| `AdminGamesClient`    | `@dragon/sdk`         | ~~`@dragon/types`~~ |

`GameDto`, `GameStatus`, and `GameListResponseDto` live in `@dragon/types` and are **not**
re-exported by `@dragon/sdk`.

---

## Domain-Awareness Policy

**Planned Phase 1 public domain:** `qesb.ir`  
**Future domains (possible):** `stream.ir` and others

Runtime and config code must not hardcode any domain. All origins are config-driven.

| Config key                   | Source | Purpose                  |
| ---------------------------- | ------ | ------------------------ |
| `NUXT_PUBLIC_API_BASE_URL`   | `.env` | API origin for SDK calls |
| `NUXT_PUBLIC_ADMIN_API_BASE` | `.env` | Admin API origin         |

Docs may mention `qesb.ir` as the planned public domain. Runtime TypeScript and Vue code
must not hardcode it.

---

## Public Games Route Policy

Public `/games` and `/games/:slug` routes are **permanently forbidden** in Phase 1. Games
management is an admin-only operation.

| Route                | Status                                             |
| -------------------- | -------------------------------------------------- |
| `/games` (admin)     | Admin only — `tournament.game.read` required       |
| `/games/new`         | Admin only — `tournament.game.manage` required     |
| `/games/:id/edit`    | Admin only — `tournament.game.manage` required     |
| `/games` (web)       | Permanently forbidden — no public game browser     |
| `/games/:slug` (web) | Permanently forbidden — no public game detail page |

---

## Static Guardrails

### Admin guardrails (`apps/admin/features/guardrails/phase1-guardrails.spec.ts`)

| Check                                            | Type                 | Notes                                 |
| ------------------------------------------------ | -------------------- | ------------------------------------- |
| No direct `fetch()` in admin source files        | Permanent            |                                       |
| No hardcoded `localhost` URL in admin files      | Permanent            |                                       |
| No hardcoded `qesb.ir` URL in admin files        | Permanent            |                                       |
| No raw `tournament.bracket.*` permission strings | Permanent            |                                       |
| No unsupported tournament formats                | Permanent            | (`swiss`, `double_elimination`, etc.) |
| No forbidden analytics naming conventions        | Permanent            |                                       |
| No admin `/tournaments/:id/operations` page      | Permanent            |                                       |
| No admin `/tournaments/:id/preview` page         | Permanent            |                                       |
| No admin tournament pages yet                    | Slice-3-precondition | Remove when tournament admin added    |
| Admin games pages exist                          | Positive assertion   | Added in Task 3.2                     |
| No public tournament pages                       | Slice-1-precondition | Remove when tournament pages added    |
| No public games pages                            | **Permanent**        | Public games are forever forbidden    |
| No `coming-soon.vue` / `placeholder.vue`         | Permanent            |                                       |
| No coming-soon markers in admin page files       | Permanent            |                                       |

### Admin games API spec (`apps/admin/features/games/admin-games.api.spec.ts`)

| Check                                                      | Notes                          |
| ---------------------------------------------------------- | ------------------------------ |
| `list()` calls `GET /admin/v1/games`                       | With and without query params  |
| `get()` calls `GET /admin/v1/games/:id`                    | Throws `ApiClientError` on 404 |
| `create()` calls `POST /admin/v1/games`                    |                                |
| `update()` calls `PATCH /admin/v1/games/:id`               |                                |
| `delete()` calls `DELETE /admin/v1/games/:id`              |                                |
| SDK surface is exactly `list, get, create, update, delete` | No extra methods               |
| Route files exist: `index.vue`, `new.vue`, `[id]/edit.vue` |                                |
| No direct `fetch()` in games files                         |                                |
| No fake game data in games files                           |                                |
| No hardcoded `localhost` / `qesb.ir` in games files        |                                |
| No raw permission strings in games pages                   |                                |

### Admin navigation spec (`apps/admin/features/navigation/admin-navigation.spec.ts`)

| Check                                                  | Notes                              |
| ------------------------------------------------------ | ---------------------------------- |
| `ALLOWED_KEYS` matches nav items exactly (13 items)    |                                    |
| Games nav item exists with correct path and permission | Added in Task 3.2                  |
| Games nav shown with `tournament.game.read`            |                                    |
| Games nav hidden without `tournament.game.read`        |                                    |
| No tournament nav items yet (slice-3-precondition)     | Remove when tournament admin added |

### Web guardrails (`apps/web/features/guardrails/phase1-guardrails.spec.ts`)

| Check                                                       | Type      | Notes               |
| ----------------------------------------------------------- | --------- | ------------------- |
| `search.tournaments()` uses configurable `baseUrl`          | Permanent | No hardcoded domain |
| `search.tournaments()` path is `/api/v1/search/tournaments` | Permanent |                     |
| `TournamentsClient.getBySlug()` — no hardcoded origin       | Permanent |                     |
| No `getMatchById` on `TournamentsClient`                    | Permanent |                     |
| Analytics events follow dot-notation                        | Permanent |                     |
| No unsupported tournament formats                           | Permanent |                     |
| No match detail route on `TournamentsClient`                | Permanent |                     |

### Web homepage hardening (`apps/web/features/esports/homepage-hardening.spec.ts`)

| Check                                                      | Type                 |
| ---------------------------------------------------------- | -------------------- |
| Homepage sets `useHead` title and description              | Permanent            |
| Canonical link uses `siteUrl` runtime config               | Permanent            |
| No hardcoded `localhost` / `qesb.ir` in pages/components   | Permanent            |
| No unsupported tournament sub-routes linked                | Slice-2-precondition |
| Match detail route permanently forbidden                   | Permanent            |
| `useEsportsHome` composable uses `useAsyncData`            | Permanent            |
| No direct `fetch()` in homepage data flow                  | Permanent            |
| No fake post slugs / placeholder text                      | Permanent            |
| `EsportsApi` has only `getHome()` — no unsupported methods | Permanent            |

---

## Verification Commands

```bash
# Admin app
pnpm --filter @dragon/admin lint
pnpm --filter @dragon/admin typecheck
pnpm --filter @dragon/admin test

# Web app
pnpm --filter @dragon/web lint
pnpm --filter @dragon/web typecheck
pnpm --filter @dragon/web test

# SDK and types
pnpm --filter @dragon/sdk test
pnpm --filter @dragon/types test

# API
pnpm --filter @dragon/api test

# Monorepo format check
pnpm format:check
```

### Games API smoke test (requires running API and MongoDB)

```bash
# List games (admin token required)
curl -H "Authorization: Bearer <token>" http://localhost:4000/admin/v1/games | jq .

# Create a game
curl -X POST -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
  -d '{"name":"Counter-Strike 2","slug":"counter-strike-2","status":"active"}' \
  http://localhost:4000/admin/v1/games | jq .
```

Expected `GET /admin/v1/games` shape:

```json
{
  "items": [],
  "total": 0,
  "page": 1,
  "limit": 20
}
```

---

## Known Limitations

1. **No public game browser in Phase 1.** Games are an admin-only concept from the public
   web's perspective. There is no `/games` page on the web app.

2. **Soft-delete only.** `DELETE /admin/v1/games/:id` sets `deletedAt` — it does not
   permanently remove the record. Hard-delete is not exposed in Phase 1.

3. **No game cover/icon media upload in Slice 3.** `GameDto.coverMediaId` and
   `iconMediaId` fields exist in the type but are not surfaced in the `GameForm`. Media
   upload is a future slice concern.

4. **No TournamentModule in Slice 3.** `activeTournaments` and `upcomingTournaments` on
   the homepage continue to return `[]` until a future tournament slice.

5. **No admin game detail/preview page.** The admin games flow is list → create/edit only.
   A read-only detail view is not part of Slice 3.
