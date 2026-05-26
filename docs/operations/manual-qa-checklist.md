# Manual QA Checklist — Phase 0

Run this checklist against a deployed or locally running stack before declaring a release ready.
This checklist requires a running API, web, and admin frontend.

**Prerequisites:**

- Stack is running (`docker compose up -d` or local dev servers)
- At least one `super_admin` user exists and can log in
- RBAC seed has been run
- SMS provider is configured (`mock` for local, real provider for production)

---

## Public web

### Homepage and content

- [ ] Homepage (`https://YOUR_DOMAIN/`) loads without errors
- [ ] Public content list pages load (`/news`, `/articles`, `/guides`, `/announcements`, `/rules`)
- [ ] A published content item is accessible by slug (e.g. `/news/my-slug`)
- [ ] A draft item returns 404 on the public route
- [ ] An archived item returns 404 on the public route
- [ ] Categories list (`/categories`) returns categories
- [ ] Tags list (`/tags`) returns tags
- [ ] A static page is accessible by slug (`/pages/my-page-slug`)

### Public search

- [ ] `GET /api/v1/search/content?q=test` returns results (or empty list) without auth
- [ ] Public search does not return draft or archived items
- [ ] Public search with limit > 50 returns 400

### Public profile

- [ ] A public profile is accessible by username (`/api/v1/u/:username`)
- [ ] A private profile (isPublic: false) returns 404
- [ ] A banned/suspended account returns 404 on the public profile route

---

## Admin — authentication and access

- [ ] Admin login page loads at `https://admin.YOUR_DOMAIN/`
- [ ] Login with a `super_admin` phone + password succeeds (OTP delivered if SMS live)
- [ ] Admin dashboard loads after login
- [ ] Logging out works — session is revoked — dashboard is inaccessible without re-login
- [ ] Accessing an admin route without auth returns 401 (via API) or redirects to login (via admin frontend)
- [ ] Accessing an admin route with a user who lacks the permission returns 403

### Admin dashboard

- [ ] Dashboard loads and shows summary counts
- [ ] No fake metrics or placeholder numbers labeled as real data

---

## Admin — users

- [ ] User list loads (`GET /admin/v1/users`)
- [ ] User detail loads (`GET /admin/v1/users/:id`)
- [ ] User status update works (ban/suspend/activate a test user — verify it is reversible)
- [ ] User session list loads (`GET /admin/v1/users/:id/sessions`)
- [ ] User session revoke works

---

## Admin — RBAC

- [ ] Permissions list loads (`GET /admin/v1/permissions`)
- [ ] Roles list loads (`GET /admin/v1/roles`)
- [ ] Creating a custom role works
- [ ] Attaching a permission to a custom role works
- [ ] Assigning the custom role to a test user works
- [ ] The test user can access the permitted route and is denied the unpermitted route
- [ ] `super_admin` role cannot be assigned via the roles API

---

## Admin — content

- [ ] Content posts list loads (any status)
- [ ] Creating a post (draft) works
- [ ] Updating a post body works
- [ ] Publishing a post works — it appears on the public route after publish
- [ ] Archiving a post works — it disappears from the public route after archive
- [ ] Soft-deleting a post works — it disappears from the public route
- [ ] Post revisions list loads
- [ ] Pages CRUD works (same lifecycle as posts)
- [ ] Categories CRUD works
- [ ] Tags CRUD works

---

## Admin — media

- [ ] Media list loads
- [ ] Uploading a valid image (JPEG, PNG, WebP) succeeds
- [ ] Uploading an invalid file type (e.g. `.exe`, `.js`) is rejected with 400
- [ ] Uploading a file with a valid MIME type but wrong extension is rejected with 400
- [ ] Uploading a file that exceeds the size limit is rejected with 413
- [ ] A public media asset has a direct URL
- [ ] A private media asset URL is a signed URL that expires
- [ ] Image variants (thumbnail, medium) are generated and accessible
- [ ] Deleting a media asset removes it from the list

---

## Admin — audit log

- [ ] Audit log list loads
- [ ] Performing a sensitive action (login, publish, status update) creates an audit entry
- [ ] Audit entries do not contain raw OTP codes, passwords, tokens, or phone numbers
- [ ] Audit log is read-only — no delete or edit UI exists

---

## Admin — jobs

- [ ] Job list loads
- [ ] A failed job shows the error (sanitized — no raw secrets)
- [ ] Retrying a failed job works
- [ ] Job payloads do not expose raw tokens, OTPs, or phone numbers

---

## Admin — notifications

- [ ] Notification log list loads
- [ ] Notification entries show `recipientMasked` (not full phone number)
- [ ] No raw OTP code appears in any notification log entry
- [ ] No SMS body text is exposed in any response

---

## Admin — analytics

- [ ] Analytics summary loads
- [ ] Top content loads
- [ ] Auth analytics loads
- [ ] OTP analytics loads — no raw codes appear
- [ ] Media analytics loads
- [ ] No IP addresses appear in analytics responses

---

## Admin — system health

- [ ] `GET /admin/v1/system/health` loads and shows dependency statuses
- [ ] MongoDB, Redis, and Storage dependency statuses are visible
- [ ] No connection strings, credentials, or internal paths appear on the health page

---

## Admin — backup

- [ ] Backup list loads (`GET /admin/v1/system/backups`)
- [ ] Latest backup loads (`GET /admin/v1/system/backups/latest`)
- [ ] Manual backup run (`POST /admin/v1/system/backups/run`) is accessible only with `system.backup.run` permission
- [ ] After triggering a backup, a log entry appears with status `completed` (if Object Storage is configured)
- [ ] **No restore button exists** on the admin backup page
- [ ] **No restore endpoint exists:** `GET /admin/v1/system/backups/restore` returns 404
- [ ] **No backup download link exists**

---

## Account / profile

- [ ] Own profile loads (`GET /api/v1/me/profile`)
- [ ] Updating own profile (display name, bio) works
- [ ] Uploading an avatar image works
- [ ] Setting avatar from existing media ID works
- [ ] Removing avatar works
- [ ] Own session list loads
- [ ] Revoking a specific session works

---

## Security — negative checks

- [ ] A non-admin user cannot access any `/admin/v1/*` route (401 or 403)
- [ ] A user with `user` role (no admin permissions) cannot access admin dashboard
- [ ] A user lacking `content.post.publish` cannot publish a post
- [ ] Draft content does not appear on any public content list or slug route
- [ ] Archived content does not appear on any public content list or slug route
- [ ] Soft-deleted content does not appear on any public content list or slug route
- [ ] A private profile (`isPublic: false`) returns 404 on the public profile route
- [ ] A banned user cannot log in (returns 403)
- [ ] Uploading a file with wrong MIME type is rejected
- [ ] Uploading a file with wrong extension is rejected
- [ ] Uploading a file exceeding the size limit is rejected

---

## Phase 1 placeholder check

- [ ] No "coming soon" pages or nav items exist in the admin
- [ ] No Tournament, Shop, Academy, Streaming, or Boardgame module is accessible or linked
- [ ] No fake metrics (placeholder numbers that don't reflect real data) exist
- [ ] No restore UI exists anywhere in the admin
- [ ] No `/api/v1/posts/:slug` generic route is accessible (type-scoped routes only)
- [ ] No Phase 1 API endpoints return 200 (they should not exist)

---

## Sign-off

| Field           | Value                        |
| --------------- | ---------------------------- |
| Tested by       |                              |
| Environment     | local / staging / production |
| Date            |                              |
| Overall result  | PASS / FAIL                  |
| Blocking issues |                              |
| Notes           |                              |
