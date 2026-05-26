# API Route Index — Phase 0

All routes implemented and active in Phase 0. Routes are served at the API origin (`https://api.YOUR_DOMAIN`).

**Auth key:**

- `—` = no auth required (public)
- `Bearer` = `Authorization: Bearer <accessToken>` header required
- `Bearer + permission` = Bearer token + named permission key required

---

## Public APIs

### Health

| Method | Path                   | Auth | Permission | Notes                                             |
| ------ | ---------------------- | ---- | ---------- | ------------------------------------------------- |
| GET    | `/health/live`         | —    | —          | Liveness probe; always 200 if process is up       |
| GET    | `/health/ready`        | —    | —          | Readiness probe; 503 if MongoDB or Redis is down  |
| GET    | `/health/dependencies` | —    | —          | Full dependency status; never exposes credentials |

> **Note:** A legacy `GET /health` route exists and returns `{ status: 'ok' }` for backwards compatibility. Prefer the versioned endpoints above.

### Auth

| Method | Path                                     | Auth   | Permission | Request body                  | Response                    | Notes                                               |
| ------ | ---------------------------------------- | ------ | ---------- | ----------------------------- | --------------------------- | --------------------------------------------------- |
| POST   | `/api/v1/auth/register`                  | —      | —          | `{ phone, password }`         | `AuthGenericResponseDto`    | Sends OTP; phone E.164; password required at signup |
| POST   | `/api/v1/auth/verify-phone`              | —      | —          | `{ phone, code }`             | `AuthGenericResponseDto`    | Verifies OTP; activates account                     |
| POST   | `/api/v1/auth/login`                     | —      | —          | `{ phone, password }`         | `TokenResponseDto`          | Returns access token; sets HttpOnly refresh cookie  |
| POST   | `/api/v1/auth/refresh`                   | —      | —          | — (cookie)                    | `TokenResponseDto`          | Rotates tokens; reads `dragon_refresh` cookie       |
| POST   | `/api/v1/auth/logout`                    | Bearer | —          | `{}`                          | `AuthGenericResponseDto`    | Revokes current session                             |
| POST   | `/api/v1/auth/logout-all`                | Bearer | —          | `{}`                          | `AuthGenericResponseDto`    | Revokes all sessions for the user                   |
| GET    | `/api/v1/auth/me`                        | Bearer | —          | —                             | `MeResponseDto`             | Returns current authenticated identity              |
| GET    | `/api/v1/auth/sessions`                  | Bearer | —          | —                             | `AuthSessionsResponseDto`   | Lists active sessions                               |
| DELETE | `/api/v1/auth/sessions/:sessionId`       | Bearer | —          | —                             | `AuthGenericResponseDto`    | Revokes a specific session                          |
| POST   | `/api/v1/auth/password/forgot`           | —      | —          | `{ phone }`                   | `AuthGenericResponseDto`    | Sends password-reset OTP                            |
| POST   | `/api/v1/auth/password/verify-reset-otp` | —      | —          | `{ phone, code }`             | `VerifyResetOtpResponseDto` | Verifies reset OTP; returns short-lived reset token |
| POST   | `/api/v1/auth/password/reset`            | —      | —          | `{ resetToken, newPassword }` | `AuthGenericResponseDto`    | Sets new password; invalidates reset token          |

### Account / Profile

| Method | Path                       | Auth   | Permission | Request               | Response       | Notes                                |
| ------ | -------------------------- | ------ | ---------- | --------------------- | -------------- | ------------------------------------ |
| GET    | `/api/v1/me/profile`       | Bearer | —          | —                     | `MeProfileDto` | Own profile                          |
| PATCH  | `/api/v1/me/profile`       | Bearer | —          | `UpdateProfileDto`    | `MeProfileDto` | Update own profile                   |
| POST   | `/api/v1/me/avatar`        | Bearer | —          | `{ mediaId }`         | `MeProfileDto` | Set avatar from existing media asset |
| POST   | `/api/v1/me/avatar/upload` | Bearer | —          | `multipart/form-data` | `MeProfileDto` | Upload new avatar image              |
| DELETE | `/api/v1/me/avatar`        | Bearer | —          | —                     | `MeProfileDto` | Remove avatar                        |

### Public Profile

| Method | Path                  | Auth | Permission | Notes                                                        |
| ------ | --------------------- | ---- | ---------- | ------------------------------------------------------------ |
| GET    | `/api/v1/u/:username` | —    | —          | Public profile view; 404 if private, banned, or soft-deleted |

### Public Content

Content is served under type-specific paths. There is **no generic `/posts/:slug` route**.

| Method | Path                          | Auth | Permission | Notes                                            |
| ------ | ----------------------------- | ---- | ---------- | ------------------------------------------------ |
| GET    | `/api/v1/news`                | —    | —          | List published news; paginated                   |
| GET    | `/api/v1/news/:slug`          | —    | —          | Single news item by slug; 404 if not published   |
| GET    | `/api/v1/articles`            | —    | —          | List published articles; paginated               |
| GET    | `/api/v1/articles/:slug`      | —    | —          | Single article by slug                           |
| GET    | `/api/v1/guides`              | —    | —          | List published guides; paginated                 |
| GET    | `/api/v1/guides/:slug`        | —    | —          | Single guide by slug                             |
| GET    | `/api/v1/announcements`       | —    | —          | List published announcements; paginated          |
| GET    | `/api/v1/announcements/:slug` | —    | —          | Single announcement by slug                      |
| GET    | `/api/v1/rules`               | —    | —          | List published rules; paginated                  |
| GET    | `/api/v1/rules/:slug`         | —    | —          | Single rule by slug                              |
| GET    | `/api/v1/pages/:slug`         | —    | —          | Single static page by slug; 404 if not published |
| GET    | `/api/v1/categories`          | —    | —          | List all categories                              |
| GET    | `/api/v1/categories/:slug`    | —    | —          | Single category by slug                          |
| GET    | `/api/v1/tags`                | —    | —          | List all tags                                    |
| GET    | `/api/v1/tags/:slug`          | —    | —          | Single tag by slug                               |

### Public Search

| Method | Path                     | Auth | Permission | Query params                       | Notes                                |
| ------ | ------------------------ | ---- | ---------- | ---------------------------------- | ------------------------------------ |
| GET    | `/api/v1/search/content` | —    | —          | `q, page, limit, type, categoryId` | Published content only; limit max 50 |

---

## Admin APIs

All admin routes require `Authorization: Bearer <accessToken>`. Missing token → 401. Present token but missing permission → 403.

### Admin Auth / Access

| Method | Path                | Auth   | Permission             | Response                            | Notes                        |
| ------ | ------------------- | ------ | ---------------------- | ----------------------------------- | ---------------------------- |
| GET    | `/admin/v1/auth/me` | Bearer | `admin.dashboard.view` | Own identity + resolved permissions | Used by admin shell on login |

### Admin Dashboard

| Method | Path                          | Auth   | Permission             | Notes                      |
| ------ | ----------------------------- | ------ | ---------------------- | -------------------------- |
| GET    | `/admin/v1/dashboard/summary` | Bearer | `admin.dashboard.view` | Lightweight summary counts |

### Admin Users

| Method | Path                                      | Auth   | Permission            | Notes                         |
| ------ | ----------------------------------------- | ------ | --------------------- | ----------------------------- |
| GET    | `/admin/v1/users`                         | Bearer | `user.user.read`      | List users; paginated         |
| GET    | `/admin/v1/users/:id`                     | Bearer | `user.user.read`      | Single user detail            |
| PATCH  | `/admin/v1/users/:id/status`              | Bearer | `user.status.update`  | Activate / ban / suspend user |
| GET    | `/admin/v1/users/:id/sessions`            | Bearer | `user.user.read`      | List user sessions            |
| DELETE | `/admin/v1/users/:id/sessions/:sessionId` | Bearer | `user.session.revoke` | Revoke specific user session  |

### Admin RBAC

| Method | Path                                            | Auth   | Permission               | Notes                           |
| ------ | ----------------------------------------------- | ------ | ------------------------ | ------------------------------- |
| GET    | `/admin/v1/permissions`                         | Bearer | `rbac.permission.read`   | List all registered permissions |
| GET    | `/admin/v1/roles`                               | Bearer | `rbac.role.read`         | List roles                      |
| POST   | `/admin/v1/roles`                               | Bearer | `rbac.role.create`       | Create custom role              |
| GET    | `/admin/v1/roles/:id`                           | Bearer | `rbac.role.read`         | Single role detail              |
| GET    | `/admin/v1/roles/:id/permissions`               | Bearer | `rbac.role.read`         | Permissions attached to role    |
| PATCH  | `/admin/v1/roles/:id`                           | Bearer | `rbac.role.update`       | Update role metadata            |
| DELETE | `/admin/v1/roles/:id`                           | Bearer | `rbac.role.deactivate`   | Deactivate role (soft)          |
| POST   | `/admin/v1/roles/:id/permissions`               | Bearer | `rbac.permission.attach` | Attach permission to role       |
| DELETE | `/admin/v1/roles/:id/permissions/:permissionId` | Bearer | `rbac.permission.detach` | Detach permission from role     |
| POST   | `/admin/v1/users/:id/roles`                     | Bearer | `rbac.role.assign`       | Assign role to user             |
| DELETE | `/admin/v1/users/:id/roles/:userRoleId`         | Bearer | `rbac.role.assign`       | Remove role from user           |

### Admin Content — Posts

| Method | Path                                                | Auth   | Permission             | Notes                                  |
| ------ | --------------------------------------------------- | ------ | ---------------------- | -------------------------------------- |
| GET    | `/admin/v1/content/posts`                           | Bearer | `content.post.read`    | List all posts (any status); paginated |
| POST   | `/admin/v1/content/posts`                           | Bearer | `content.post.create`  | Create post (draft)                    |
| GET    | `/admin/v1/content/posts/:id`                       | Bearer | `content.post.read`    | Single post detail                     |
| PATCH  | `/admin/v1/content/posts/:id`                       | Bearer | `content.post.update`  | Update post body/metadata              |
| POST   | `/admin/v1/content/posts/:id/preview`               | Bearer | `content.post.read`    | Generate preview snapshot              |
| POST   | `/admin/v1/content/posts/:id/publish`               | Bearer | `content.post.publish` | Publish post                           |
| POST   | `/admin/v1/content/posts/:id/archive`               | Bearer | `content.post.archive` | Archive post                           |
| DELETE | `/admin/v1/content/posts/:id`                       | Bearer | `content.post.update`  | Soft-delete post                       |
| GET    | `/admin/v1/content/posts/:id/revisions`             | Bearer | `content.post.read`    | List revisions                         |
| GET    | `/admin/v1/content/posts/:id/revisions/:revisionId` | Bearer | `content.post.read`    | Single revision                        |

### Admin Content — Pages

| Method | Path                                                | Auth   | Permission             | Notes                       |
| ------ | --------------------------------------------------- | ------ | ---------------------- | --------------------------- |
| GET    | `/admin/v1/content/pages`                           | Bearer | `content.page.read`    | List all pages (any status) |
| POST   | `/admin/v1/content/pages`                           | Bearer | `content.page.create`  | Create page (draft)         |
| GET    | `/admin/v1/content/pages/:id`                       | Bearer | `content.page.read`    | Single page detail          |
| PATCH  | `/admin/v1/content/pages/:id`                       | Bearer | `content.page.update`  | Update page                 |
| POST   | `/admin/v1/content/pages/:id/preview`               | Bearer | `content.page.read`    | Preview snapshot            |
| POST   | `/admin/v1/content/pages/:id/publish`               | Bearer | `content.page.publish` | Publish page                |
| POST   | `/admin/v1/content/pages/:id/archive`               | Bearer | `content.page.archive` | Archive page                |
| DELETE | `/admin/v1/content/pages/:id`                       | Bearer | `content.page.update`  | Soft-delete page            |
| GET    | `/admin/v1/content/pages/:id/revisions`             | Bearer | `content.page.read`    | List revisions              |
| GET    | `/admin/v1/content/pages/:id/revisions/:revisionId` | Bearer | `content.page.read`    | Single revision             |

### Admin Content — Categories and Tags

| Method | Path                               | Auth   | Permission                | Notes           |
| ------ | ---------------------------------- | ------ | ------------------------- | --------------- |
| GET    | `/admin/v1/content/categories`     | Bearer | `content.category.read`   | List categories |
| POST   | `/admin/v1/content/categories`     | Bearer | `content.category.create` | Create category |
| PATCH  | `/admin/v1/content/categories/:id` | Bearer | `content.category.update` | Update category |
| DELETE | `/admin/v1/content/categories/:id` | Bearer | `content.category.delete` | Delete category |
| GET    | `/admin/v1/content/tags`           | Bearer | `content.tag.read`        | List tags       |
| POST   | `/admin/v1/content/tags`           | Bearer | `content.tag.create`      | Create tag      |
| PATCH  | `/admin/v1/content/tags/:id`       | Bearer | `content.tag.update`      | Update tag      |
| DELETE | `/admin/v1/content/tags/:id`       | Bearer | `content.tag.delete`      | Delete tag      |

### Admin Media

| Method | Path                                      | Auth   | Permission               | Notes                              |
| ------ | ----------------------------------------- | ------ | ------------------------ | ---------------------------------- |
| GET    | `/admin/v1/media`                         | Bearer | `media.asset.read`       | List media assets; paginated       |
| POST   | `/admin/v1/media/upload`                  | Bearer | `media.asset.upload`     | Upload file; `multipart/form-data` |
| GET    | `/admin/v1/media/:id`                     | Bearer | `media.asset.read`       | Single asset detail                |
| PATCH  | `/admin/v1/media/:id`                     | Bearer | `media.asset.update`     | Update asset metadata              |
| POST   | `/admin/v1/media/:id/regenerate-variants` | Bearer | `media.asset.regenerate` | Regenerate image variants          |
| DELETE | `/admin/v1/media/:id`                     | Bearer | `media.asset.delete`     | Delete asset and storage file      |

### Admin Search

| Method | Path                       | Auth   | Permission             | Query params           | Notes                               |
| ------ | -------------------------- | ------ | ---------------------- | ---------------------- | ----------------------------------- |
| GET    | `/admin/v1/search/content` | Bearer | `search.content.read`  | `q, page, limit, type` | Admin content search (all statuses) |
| GET    | `/admin/v1/search/users`   | Bearer | `search.user.read`     | `q, page, limit`       | User search                         |
| GET    | `/admin/v1/search/media`   | Bearer | `search.media.read`    | `q, page, limit`       | Media asset search                  |
| POST   | `/admin/v1/search/reindex` | Bearer | `search.index.reindex` | —                      | Trigger reindex job                 |

### Admin Analytics

| Method | Path                              | Auth   | Permission                 | Notes                                  |
| ------ | --------------------------------- | ------ | -------------------------- | -------------------------------------- |
| GET    | `/admin/v1/analytics/summary`     | Bearer | `analytics.analytics.read` | Overall platform summary counts        |
| GET    | `/admin/v1/analytics/content/top` | Bearer | `analytics.analytics.read` | Top-viewed content                     |
| GET    | `/admin/v1/analytics/auth`        | Bearer | `analytics.analytics.read` | Auth event aggregates                  |
| GET    | `/admin/v1/analytics/otp`         | Bearer | `analytics.analytics.read` | OTP delivery aggregates (no raw codes) |
| GET    | `/admin/v1/analytics/media`       | Bearer | `analytics.analytics.read` | Media usage aggregates                 |

### Admin Audit

| Method | Path                       | Auth   | Permission       | Query params                            | Notes                          |
| ------ | -------------------------- | ------ | ---------------- | --------------------------------------- | ------------------------------ |
| GET    | `/admin/v1/audit-logs`     | Bearer | `audit.log.read` | `userId, action, resource, page, limit` | Append-only log; limit max 100 |
| GET    | `/admin/v1/audit-logs/:id` | Bearer | `audit.log.read` | —                                       | Single audit entry             |

### Admin Jobs

| Method | Path                              | Auth   | Permission         | Notes                        |
| ------ | --------------------------------- | ------ | ------------------ | ---------------------------- |
| GET    | `/admin/v1/system/jobs`           | Bearer | `system.job.read`  | List BullMQ job logs         |
| GET    | `/admin/v1/system/jobs/:id`       | Bearer | `system.job.read`  | Single job log entry         |
| POST   | `/admin/v1/system/jobs/:id/retry` | Bearer | `system.job.retry` | Enqueue retry for failed job |

### Admin Notifications

| Method | Path                                 | Auth   | Permission              | Notes                         |
| ------ | ------------------------------------ | ------ | ----------------------- | ----------------------------- |
| GET    | `/admin/v1/system/notifications`     | Bearer | `notification.log.read` | List notification log entries |
| GET    | `/admin/v1/system/notifications/:id` | Bearer | `notification.log.read` | Single notification log entry |

### Admin System / Health

| Method | Path                      | Auth   | Permission           | Notes                                           |
| ------ | ------------------------- | ------ | -------------------- | ----------------------------------------------- |
| GET    | `/admin/v1/system/health` | Bearer | `system.health.read` | Admin health view (proxied from health service) |

### Admin Backup

| Method | Path                              | Auth   | Permission           | Notes                     |
| ------ | --------------------------------- | ------ | -------------------- | ------------------------- |
| GET    | `/admin/v1/system/backups`        | Bearer | `system.backup.read` | List backup log entries   |
| GET    | `/admin/v1/system/backups/latest` | Bearer | `system.backup.read` | Most recent backup entry  |
| POST   | `/admin/v1/system/backups/run`    | Bearer | `system.backup.run`  | Trigger manual backup job |

> **Security:** There is no restore endpoint, no restore UI, no backup download endpoint, and no backup delete endpoint. Restore is a manual runbook procedure only. See [restore-runbook.md](../operations/restore-runbook.md).

---

## Not implemented (Phase 0)

- No generic `/api/v1/posts/:slug` or `/api/v1/content/:slug` route
- No OAuth / social login callback routes
- No WebSocket or SSE endpoints
- No bulk notification send endpoints
- No backup restore or download endpoints
- No public media upload endpoint (upload is admin-only)
