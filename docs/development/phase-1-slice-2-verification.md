# Phase 1 / Slice 2 — Verification Guide

## Scope Summary

Slice 2 implements the public news-first homepage backed by real Content Engine data.

| Area                                     | Implemented | Notes                             |
| ---------------------------------------- | ----------- | --------------------------------- |
| `GET /api/v1/esports/home`               | Yes         | Returns `EsportsHomeDto`          |
| Homepage UI (`apps/web/pages/index.vue`) | Yes         | SSR, news-first layout            |
| Featured posts (articles)                | Yes         | Empty-safe                        |
| Latest news                              | Yes         | Empty-safe                        |
| Top content (by viewCount)               | Yes         | Empty-safe                        |
| Active/upcoming tournaments              | Yes         | Empty state only — real data      |
| Homepage SEO                             | Yes         | title, description, OG, canonical |
| Esports category/tag seeds               | Yes         | Idempotent                        |
| Tournament detail pages                  | No          | Not in Slice 2                    |
| Tournament registration                  | No          | Not in Slice 2                    |
| Participants/matches/results             | No          | Not in Slice 2                    |
| Admin homepage UI                        | No          | Not in Slice 2                    |

---

## Backend: `GET /api/v1/esports/home`

**Endpoint:** `GET /api/v1/esports/home`
**Module:** `apps/api/src/esports/`
**Response type:** `EsportsHomeDto`

### `EsportsHomeDto`

```typescript
export interface EsportsHomeDto {
  readonly featuredPosts: readonly PublicPostDto[];
  readonly latestNews: readonly PublicPostDto[];
  readonly activeTournaments: readonly TournamentListItemDto[];
  readonly upcomingTournaments: readonly TournamentListItemDto[];
  readonly topContent: readonly PublicPostDto[];
}
```

### Data sources

| Field                 | Source                                                       | Sort             |
| --------------------- | ------------------------------------------------------------ | ---------------- |
| `featuredPosts`       | Content Engine — `tag=featured, status=published` (any type) | `createdAt desc` |
| `latestNews`          | Content Engine — `type=news, status=published`               | `createdAt desc` |
| `topContent`          | Content Engine — `status=published` (all types)              | `viewCount desc` |
| `activeTournaments`   | None — TournamentModule not implemented in Slice 2           | `[]` in Slice 2  |
| `upcomingTournaments` | None — TournamentModule not implemented in Slice 2           | `[]` in Slice 2  |

> **Note:** `featuredPosts` returns `[]` when the `featured` tag does not exist in the database
> or when no published posts carry that tag. It does **not** fall back to `type=article`.

### Seeds

Esports category and tag seeds are idempotent and safe to run multiple times:

```bash
pnpm --filter @dragon/api build
pnpm --filter @dragon/api seed:esports
```

Seeds create (if not already present):

- Categories: `esports`, `tournaments`, `game-coverage`
- Tags: `featured`, `breaking-news`, `top-content`

---

## SDK: `esports.getHome()`

**Package:** `packages/sdk`
**Client:** `EsportsClient`
**Factory:** `createEsportsClient(apiClient)`

### Usage in `apps/web`

```typescript
// composables/useEsportsHome.ts
import { createEsportsApi } from '../features/esports/esports-api';

export function useEsportsHome() {
  const runtimeConfig = useRuntimeConfig();
  const esports = createEsportsApi({
    baseUrl: runtimeConfig.public?.apiBaseUrl as string | undefined,
  });
  return useAsyncData('esports-home', () => esports.getHome());
}
```

### SDK surface

| Method      | Path                       | Returns          |
| ----------- | -------------------------- | ---------------- |
| `getHome()` | `GET /api/v1/esports/home` | `EsportsHomeDto` |

`EsportsClient` exposes only `getHome()` — no tournament detail methods.

---

## Homepage Section Behavior

| Section                                         | Shown when                                                       | Behavior when empty                 |
| ----------------------------------------------- | ---------------------------------------------------------------- | ----------------------------------- |
| Hero (`EsportsHero`)                            | `featuredPosts[0]` exists                                        | Hidden with `v-if`                  |
| Featured cards (`EsportsFeaturedCards`)         | `featuredPosts.length > 1`                                       | Hidden with `v-if`                  |
| Latest news (`EsportsNewsGrid`)                 | Always rendered                                                  | `ContentStateMessage state="empty"` |
| Top content (`EsportsTopContent`)               | `topContent.length > 0`                                          | Hidden with `v-if`                  |
| Tournament section (`EsportsTournamentSection`) | `activeTournaments.length > 0 OR upcomingTournaments.length > 0` | Hidden with `v-if`                  |

### Empty real data policy

**Empty real data is always acceptable. Fake data is always forbidden.**

- If `featuredPosts` is empty, both the hero and the featured cards sections are omitted — no placeholder hero message, no fake post.
- If `latestNews` is empty, `ContentStateMessage` empty state is shown — no fake news card.
- If `topContent` is empty, the section is omitted — no placeholder cards.
- If `activeTournaments` and `upcomingTournaments` are both empty, the tournament section is
  omitted entirely — no fake tournament cards.

---

## SEO and SSR Verification

### Homepage SEO metadata

```typescript
const siteName = (runtimeConfig.public?.siteName as string | undefined) ?? 'Dragon';
const SITE_TITLE = `${siteName} — پلتفرم اسپورت`;

useHead({
  title: SITE_TITLE,
  meta: [
    { name: 'description', content: '...' },
    { property: 'og:title', content: SITE_TITLE },
    { property: 'og:description', content: '...' },
    { property: 'og:type', content: 'website' },
  ],
  link: siteUrl ? [{ rel: 'canonical', href: siteUrl }] : [],
});
```

- `siteName` comes from `runtimeConfig.public.siteName` (set via `NUXT_PUBLIC_SITE_NAME`); falls back to `'Dragon'` when unset.
- The canonical URL comes from `runtimeConfig.public.siteUrl` (set via `NUXT_PUBLIC_SITE_URL`); omitted when unset.
- No hardcoded brand name is required — all branding is config-driven at runtime.
- No OG image — no fake media URL is hardcoded.
- Homepage is indexable (no `noindex`).
- Admin pages retain their existing `noindex` behavior — Slice 2 does not modify admin SEO.

### SSR

The homepage uses `useAsyncData` via `useEsportsHome`, which is SSR-compatible. Initial
content is server-rendered. No `localStorage`, `sessionStorage`, or browser-only API is
used for initial render.

---

## Domain-Awareness Policy

**Planned Phase 1 public domain:** `qesb.ir`
**Future domains (possible):** `stream.ir` and others

Runtime code must not hardcode any domain. All origins are config-driven:

| Config key                 | Source               | Purpose                  |
| -------------------------- | -------------------- | ------------------------ |
| `NUXT_PUBLIC_API_BASE_URL` | `.env`               | API origin for SDK calls |
| `NUXT_PUBLIC_SITE_URL`     | `.env`               | Canonical URL for SEO    |
| `API_INTERNAL_BASE_URL`    | `.env` (server-only) | Internal SSR API origin  |

Docs may mention `qesb.ir` as the planned public domain. Runtime TypeScript and Vue code
must not hardcode it.

### SSR API base requirement

The homepage fetches data via `useEsportsHome` during SSR. For SSR to succeed:

- `NUXT_PUBLIC_API_BASE_URL` must be set to a reachable API origin (e.g. `http://api:4000`
  in Docker, or `http://localhost:4000` in local dev via `.env`).
- Do **not** hardcode `localhost`, `qesb.ir`, or any other origin in runtime code.
- `API_INTERNAL_BASE_URL` may be introduced in a future slice for server-side API client
  hardening. Do not redesign the API client in this fix.
- If `NUXT_PUBLIC_API_BASE_URL` is absent, the SDK falls back to a relative URL which works
  for client-side navigation but will fail during SSR unless a proxy is configured.

---

## Route and Link Restrictions

### Allowed public routes (Slice 2)

| Route                                    | Status                   |
| ---------------------------------------- | ------------------------ |
| `/`                                      | Homepage                 |
| `/news`, `/news/:slug`                   | News list and detail     |
| `/articles`, `/articles/:slug`           | Articles list and detail |
| `/announcements`, `/announcements/:slug` | Announcements            |
| `/guides`, `/guides/:slug`               | Guides                   |
| `/rules`, `/rules/:slug`                 | Rules                    |
| `/search`                                | Public search            |
| `/categories/:slug`, `/tags/:slug`       | Taxonomy                 |
| `/pages/:slug`                           | Static pages             |

### Forbidden routes (not implemented in Slice 2)

| Route                                 | Reason                           |
| ------------------------------------- | -------------------------------- |
| `/tournaments/:slug`                  | Tournament detail — future slice |
| `/tournaments/:slug/register`         | Registration — future slice      |
| `/tournaments/:slug/my-registration`  | Registration — future slice      |
| `/tournaments/:slug/participants`     | Participants — future slice      |
| `/tournaments/:slug/matches`          | Matches — future slice           |
| `/tournaments/:slug/matches/:matchId` | Permanently forbidden in Phase 1 |
| `/tournaments/:slug/results`          | Results — future slice           |
| `/tournaments/:slug/standings`        | Standings — future slice         |
| `/tournaments/:slug/bracket`          | Bracket — future slice           |

The homepage does not link to any forbidden route. The tournament section (when shown)
displays title and format only — no detail links.

---

## Known Limitations

1. **No tournament detail pages in Slice 2.** Tournament cards in `EsportsTournamentSection`
   are informational only with no links to detail pages.

2. **No tournament registration in Slice 2.** No registration CTA exists in the homepage.

3. **No participants/matches/results/standings/bracket pages in Slice 2.** These routes are
   not created and are guarded by static tests.

4. **`activeTournaments` and `upcomingTournaments` return `[]` in Slice 2.** The
   TournamentModule backend is not implemented in Slice 2. Both arrays return `[]` while
   real tournament data is unavailable. Later tournament slices may replace these with real
   tournament data. Empty tournament sections are omitted from the homepage — no fake
   tournament cards are shown.

5. **Canonical URL requires environment variable.** If `NUXT_PUBLIC_SITE_URL` is not set,
   the homepage canonical link is omitted rather than hardcoded. Search engines will still
   index the page without a canonical hint.

6. **No OG image.** No media URL is available from `EsportsHomeDto`. An OG image should be
   added in a future slice when media assets are available.

7. **`featuredPosts` requires the `featured` tag; `latestNews` uses type `news`.** If the
   `featured` tag does not exist or no published post carries it, `featuredPosts` is `[]` and
   both the hero and featured cards sections are omitted. If no published news exists,
   `latestNews` is `[]` and the news grid shows an empty state.

---

## Verification Commands

```bash
# Web app
pnpm --filter @dragon/web lint
pnpm --filter @dragon/web typecheck
pnpm --filter @dragon/web test
pnpm --filter @dragon/web build

# SDK and types
pnpm --filter @dragon/sdk test
pnpm --filter @dragon/types test

# API
pnpm --filter @dragon/api test

# Monorepo
pnpm format:check
```

### Esports seed (requires running API and MongoDB)

```bash
pnpm --filter @dragon/api build
pnpm --filter @dragon/api seed:esports
```

### Manual smoke test (requires running services)

```bash
curl http://localhost:4000/api/v1/esports/home | jq .
```

Expected shape:

```json
{
  "featuredPosts": [],
  "latestNews": [],
  "activeTournaments": [],
  "upcomingTournaments": [],
  "topContent": []
}
```
