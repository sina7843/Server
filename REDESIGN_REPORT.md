# Dragon Ecosystem — Phase 1 Frontend Redesign Report

## Summary

Full frontend UI redesign applied across `apps/web` and `apps/admin` following Dragon Club visual identity guidelines. No backend logic, API contracts, routes, or data models were changed.

---

## Changed Files

### apps/web

| File | Change |
|------|--------|
| `app.vue` | Added `useTheme` init on mount |
| `composables/useTheme.ts` | **NEW** — theme toggle composable with localStorage persistence |
| `assets/css/main.css` | Added cyan / magenta / orange accent tokens, new glow vars, badge variants |
| `components/AppHeader.vue` | Theme toggle button, polished brand mark with hover animation, mobile nav |
| `components/AppFooter.vue` | Gradient top border, brand tagline dots (purple/cyan/magenta), improved grid |
| `components/esports/EsportsHero.vue` | Animated gradient orb accents, larger typography, styled type badge |
| `components/esports/EsportsTournamentSection.vue` | Clickable tournament cards linking to `/tournaments/[slug]`, live glow animation |
| `components/content/ContentCard.vue` | Lift-on-hover, brand-border glow on hover, arrow icon with animated direction |

### apps/admin

| File | Change |
|------|--------|
| `assets/css/main.css` | Added cyan / magenta / orange accent tokens, new glow vars |
| `components/layout/AdminSidebar.vue` | Gradient brand header section, refined nav section labels, polished user footer |
| `components/layout/AdminTopbar.vue` | ⌘K search hint badge, icon-btn border + spring animation, cleaner user chip |
| `components/state/EmptyState.vue` | Replaced `—` with folder SVG icon in a glass box |
| `components/state/UnauthorizedState.vue` | Gradient `401` text (purple → magenta → cyan), primary button CTA |
| `pages/dashboard.vue` | Uses `.admin-stat-grid` / `.admin-stat-card` tokens, animated status dot |

---

## Design System Additions

New CSS tokens added to **both** apps:

```css
/* Cyan */
--cyan-300..600
/* Magenta */
--magenta-300..600
/* Orange */
--orange-300..600
/* Glow variants */
--glow-primary-strong
--glow-cyan
--glow-magenta
--glow-orange
/* Badge variants (web only) */
.dr-badge-warning
.dr-badge-danger
.dr-badge-cyan
.dr-badge-magenta
```

---

## Theme System

Both apps now have full light/dark mode with localStorage persistence:

- **Admin**: `composables/useTheme.ts` (pre-existing), key `dragon-admin-theme`
- **Web**: `composables/useTheme.ts` (new), key `dragon-web-theme`
- Toggle button: in `AdminTopbar` (admin) and `AppHeader` (web)
- CSS: `[data-theme='light']` overrides already defined in both `main.css` files

---

## How to Test

### Web app (port 3000)

```bash
cd apps/web && pnpm dev
```

1. Open http://localhost:3000 — verify hero section has animated orbs
2. Click the sun/moon button in the header → page switches between dark/light
3. Refresh → theme persists from localStorage
4. Hover content cards → lift + purple border glow
5. If tournaments are seeded, hover tournament cards → red glow (live) / amber tint (upcoming)
6. Resize to mobile → nav collapses to search-only

### Admin app (port 3001)

```bash
cd apps/admin && pnpm dev
```

1. Open http://localhost:3001 — verify new sidebar brand section
2. Click sun/moon toggle in topbar → theme switches
3. Navigate to any page with no results → folder icon EmptyState
4. Go to `/dashboard` → stat cards with icon + animated status dot
5. Visit a page without auth → gradient 401 UnauthorizedState

---

## What Was NOT Changed

- All API composables and feature logic
- All routes and page files (beyond dashboard.vue layout)
- All backend / `apps/api` code
- Existing tournament/game/content table components (already well-styled)
- `NUXT_PUBLIC_API_BASE_URL` and env config
- No Phase 1 out-of-scope features added
