# About Us & Contact Us — Site Settings Design

**Date:** 2026-06-15
**Status:** Approved (design), pending spec review

## Goal

Add superadmin-editable **About Us** and **Contact Us** content to the platform. About Us is rich text; Contact Us is structured contact info (email, phone, address, socials, map) plus a public message form whose submissions land in an admin inbox.

## Decisions

- **Model:** Approach A — a single `SiteSettings` singleton document holding both `about` (rich text) and `contact` (structured fields). Contact form submissions stored in a separate `ContactMessage` collection.
- **Contact form:** public form (name, email, subject, message) → stored → flat list in admin. No status workflow, no email notification, no reCAPTCHA.
- **Spam defense:** per-IP rate limit + hidden honeypot field only.
- **Access control:** new RBAC permissions granted to the `super_admin` role. No hardcoded role checks — consistent with the existing permission-based RBAC.
- **App context:** Persian / RTL web app. Reuse existing rich-text + SEO pipelines from the CMS `content/pages` module.

## Data Model

New api module: `apps/api/src/site/`.

### `SiteSettings` (singleton, collection `site_settings`)

```
key: string            // fixed 'global', unique index — enforces singleton
about:
  title: string
  bodyJson: Mixed      // rich-text editor state (mirrors page.schema.ts)
  bodyHtml: string     // rendered + sanitized HTML
contact:
  email?: string
  phone?: string
  address?: string     // free text (RTL)
  mapEmbedUrl?: string // map iframe/link
  socials: [{ platform: string, url: string }]
updatedBy: ObjectId
createdAt / updatedAt
```

- Singleton enforced by unique index on `key`. First read auto-creates an empty default (or seeded). Update is an upsert.
- `bodyJson` / `bodyHtml` mirror [page.schema.ts](../../../apps/api/src/content/pages/page.schema.ts) so the admin reuses the same rich-text editor and HTML sanitizer.
- All ObjectId props use `SchemaTypes.ObjectId` (not `Types.ObjectId`) per the known Mongoose query bug.

### `ContactMessage` (collection `contact_messages`)

```
name: string
email: string
subject?: string
message: string
ipHash?: string        // sha256(ip + salt), for rate-limit/audit — never raw IP
createdAt
```

Flat list, newest first. No status field.

## API

New module `apps/api/src/site/`, following the existing admin-controller + service + repository pattern.

### Public (no auth)

- `GET /v1/site/settings` → about + contact public view. Powers web About/Contact pages + footer.
- `POST /v1/site/contact-messages` → submit form.
  - Honeypot: a decoy field (e.g. `website`) must be empty; if filled, return `200` without storing (silent drop).
  - Rate limit: `@nestjs/throttler` (new dependency) scoped to this route, e.g. 5 requests/min/IP.
  - Stores `ipHash = sha256(ip + salt)`.

### Admin (`AccessTokenGuard` + `PermissionGuard`)

- `GET /admin/v1/site/settings` — `site.settings.read`
- `PUT /admin/v1/site/settings` — `site.settings.update` (upsert, sets `updatedBy`, writes audit log)
- `GET /admin/v1/site/contact-messages` — `site.message.read` (paginated)
- `GET /admin/v1/site/contact-messages/:id` — `site.message.read`
- `DELETE /admin/v1/site/contact-messages/:id` — `site.message.manage`

### New permissions

Added to [permission-keys.ts](../../../apps/api/src/rbac/registry/permission-keys.ts):

```
SITE_SETTINGS_READ:   'site.settings.read'
SITE_SETTINGS_UPDATE: 'site.settings.update'
SITE_MESSAGE_READ:    'site.message.read'
SITE_MESSAGE_MANAGE:  'site.message.manage'
```

Granted to the `super_admin` role in the RBAC seed.

## Admin UI (Nuxt — `apps/admin`)

- `pages/site/settings.vue` — two-section form:
  - **About:** rich-text editor reused from `content/pages`.
  - **Contact:** field inputs + repeatable socials rows (platform + url).
  - Save → `PUT /admin/v1/site/settings`. Gated by `site.settings.update` in nav + route middleware.
- `pages/site/messages/index.vue` — table (name, email, subject, date); row → detail view + delete. Fills the existing empty `pages/site/messages` directory.
- API client + types in `features/site/`, matching the existing `features/*` pattern.

## Web UI (Nuxt — `apps/web`, RTL)

- `pages/about.vue` — fetch `/v1/site/settings`; render `about.title` + `ContentHtmlRenderer` for `bodyHtml` (same as [pages/pages/[slug].vue](../../../apps/web/pages/pages/%5Bslug%5D.vue)).
- `pages/contact.vue` — render contact fields (email, phone, address, socials, map) + a submit form (name, email, subject, message, hidden honeypot). Loading / success / error states.
- `components/AppFooter.vue` — add links to `/about` and `/contact`.
- SEO head via existing `buildContentSeoHead`.

## Error Handling

- Public settings read: if no doc exists, return empty defaults (never 500).
- Contact submit: validate required fields (name, email, message); reject oversized payloads; honeypot hit returns silent success; rate-limit exceed returns `429`.
- Admin update: validate + sanitize `bodyHtml`; reject malformed socials entries.

## Testing

- API: schema + repository + service specs (singleton upsert, honeypot drop, rate-limit, message CRUD), matching existing `*.spec.ts` coverage in the content module.
- Permission guard coverage for the four new permissions.
- Web: component render of about/contact + form submit happy/error paths.

## Out of Scope (YAGNI)

- Message status workflow (new/read/archived).
- Email notification on submission.
- reCAPTCHA / external spam services.
- Multiple language variants of settings (single locale for now).
