# RBAC Permissions — Reference

Phase 0 implements flat role-based access control with an ABAC-ready foundation. The backend is the authority on all permission checks. Frontend permission states are display hints only.

---

## Naming convention

```
<domain>.<resource>.<action>
```

Examples: `content.post.publish` · `user.status.update` · `system.backup.run`

---

## Role model

Five system roles are seeded at startup. System roles cannot be deleted.

| Role            | Key               | Assignable          | Description                                                                   |
| --------------- | ----------------- | ------------------- | ----------------------------------------------------------------------------- |
| Super Admin     | `super_admin`     | No (seed-time only) | All permissions; bypass-free (resolved by permission check, not guard bypass) |
| Admin           | `admin`           | Yes                 | Platform administration; no content.post.publish or media.asset.delete        |
| Content Manager | `content_manager` | Yes                 | Full content lifecycle + media upload; no user management                     |
| Support         | `support`         | Yes                 | Read-only users, health view, session revoke                                  |
| User            | `user`            | Yes                 | No admin permissions (placeholder)                                            |

Custom roles can be created via `POST /admin/v1/roles` and have permissions attached individually.

### super_admin behavior

`super_admin` receives every registered permission key. It is not a guard bypass — permission resolution runs the same path as all other roles. There is no hardcoded admin bypass in any guard.

`super_admin` is assigned at seed time only via `RBAC_BOOTSTRAP_SUPER_ADMIN_PHONE`. The assignment API (`POST /admin/v1/users/:id/roles`) cannot assign `super_admin` — `isAssignable: false`.

---

## Full permission registry

### Admin / Dashboard

| Key                    | Constant               | Granted to                  |
| ---------------------- | ---------------------- | --------------------------- |
| `admin.dashboard.view` | `ADMIN_DASHBOARD_VIEW` | super_admin, admin, support |

### User Management

| Key                   | Constant              | Granted to                  |
| --------------------- | --------------------- | --------------------------- |
| `user.user.read`      | `USER_READ`           | super_admin, admin, support |
| `user.user.update`    | `USER_UPDATE`         | super_admin, admin          |
| `user.status.update`  | `USER_STATUS_UPDATE`  | super_admin, admin          |
| `user.session.revoke` | `USER_SESSION_REVOKE` | super_admin, admin, support |

### RBAC

| Key                      | Constant                 | Granted to         |
| ------------------------ | ------------------------ | ------------------ |
| `rbac.role.read`         | `RBAC_ROLE_READ`         | super_admin, admin |
| `rbac.role.create`       | `RBAC_ROLE_CREATE`       | super_admin, admin |
| `rbac.role.update`       | `RBAC_ROLE_UPDATE`       | super_admin, admin |
| `rbac.role.deactivate`   | `RBAC_ROLE_DEACTIVATE`   | super_admin, admin |
| `rbac.role.assign`       | `RBAC_ROLE_ASSIGN`       | super_admin, admin |
| `rbac.permission.read`   | `RBAC_PERMISSION_READ`   | super_admin, admin |
| `rbac.permission.attach` | `RBAC_PERMISSION_ATTACH` | super_admin, admin |
| `rbac.permission.detach` | `RBAC_PERMISSION_DETACH` | super_admin, admin |

### System

| Key                  | Constant             | Granted to                  |
| -------------------- | -------------------- | --------------------------- |
| `system.health.read` | `SYSTEM_HEALTH_READ` | super_admin, admin, support |
| `system.backup.read` | `SYSTEM_BACKUP_READ` | super_admin, admin          |
| `system.backup.run`  | `SYSTEM_BACKUP_RUN`  | super_admin only            |
| `system.job.read`    | `SYSTEM_JOB_READ`    | super_admin, admin          |
| `system.job.retry`   | `SYSTEM_JOB_RETRY`   | super_admin, admin          |

### Content — Posts

| Key                    | Granted to                            |
| ---------------------- | ------------------------------------- |
| `content.post.read`    | super_admin, admin\*, content_manager |
| `content.post.create`  | super_admin, content_manager          |
| `content.post.update`  | super_admin, content_manager          |
| `content.post.publish` | super_admin, content_manager          |
| `content.post.archive` | super_admin, content_manager          |

\* `admin` role does not include content permissions by default; `super_admin` does via all-permissions grant.

### Content — Pages

| Key                    | Granted to                   |
| ---------------------- | ---------------------------- |
| `content.page.read`    | super_admin, content_manager |
| `content.page.create`  | super_admin, content_manager |
| `content.page.update`  | super_admin, content_manager |
| `content.page.publish` | super_admin, content_manager |
| `content.page.archive` | super_admin, content_manager |

### Content — Categories

| Key                       | Granted to                   |
| ------------------------- | ---------------------------- |
| `content.category.read`   | super_admin, content_manager |
| `content.category.create` | super_admin, content_manager |
| `content.category.update` | super_admin, content_manager |
| `content.category.delete` | super_admin, content_manager |

### Content — Tags

| Key                  | Granted to                   |
| -------------------- | ---------------------------- |
| `content.tag.read`   | super_admin, content_manager |
| `content.tag.create` | super_admin, content_manager |
| `content.tag.update` | super_admin, content_manager |
| `content.tag.delete` | super_admin, content_manager |

### Media

| Key                      | Granted to                            |
| ------------------------ | ------------------------------------- |
| `media.asset.read`       | super_admin, admin\*, content_manager |
| `media.asset.upload`     | super_admin, content_manager          |
| `media.asset.update`     | super_admin, content_manager          |
| `media.asset.delete`     | super_admin only                      |
| `media.asset.regenerate` | super_admin only                      |

### Audit / Notifications

| Key                     | Granted to         |
| ----------------------- | ------------------ |
| `audit.log.read`        | super_admin, admin |
| `notification.log.read` | super_admin, admin |

### Analytics

| Key                        | Granted to         |
| -------------------------- | ------------------ |
| `analytics.analytics.read` | super_admin, admin |

### Search

| Key                    | Granted to                          |
| ---------------------- | ----------------------------------- |
| `search.content.read`  | super_admin, admin, content_manager |
| `search.user.read`     | super_admin, admin                  |
| `search.media.read`    | super_admin, admin, content_manager |
| `search.index.reindex` | super_admin, admin                  |

---

## Route-to-permission map (admin routes)

| Route                                                | Permission required        |
| ---------------------------------------------------- | -------------------------- |
| GET `/admin/v1/auth/me`                              | `admin.dashboard.view`     |
| GET `/admin/v1/dashboard/summary`                    | `admin.dashboard.view`     |
| GET/PATCH `/admin/v1/users`                          | `user.user.read`           |
| PATCH `/admin/v1/users/:id/status`                   | `user.status.update`       |
| DELETE `/admin/v1/users/:id/sessions/:sid`           | `user.session.revoke`      |
| GET `/admin/v1/permissions`                          | `rbac.permission.read`     |
| GET/POST/PATCH/DELETE `/admin/v1/roles`              | `rbac.role.*` (per action) |
| POST `/admin/v1/roles/:id/permissions`               | `rbac.permission.attach`   |
| DELETE `/admin/v1/roles/:id/permissions/:pid`        | `rbac.permission.detach`   |
| POST/DELETE `/admin/v1/users/:id/roles`              | `rbac.role.assign`         |
| GET `/admin/v1/content/posts`                        | `content.post.read`        |
| POST `/admin/v1/content/posts`                       | `content.post.create`      |
| PATCH `/admin/v1/content/posts/:id`                  | `content.post.update`      |
| POST `/admin/v1/content/posts/:id/publish`           | `content.post.publish`     |
| POST `/admin/v1/content/posts/:id/archive`           | `content.post.archive`     |
| DELETE `/admin/v1/content/posts/:id`                 | `content.post.update`      |
| GET `/admin/v1/content/pages`                        | `content.page.read`        |
| POST `/admin/v1/content/pages`                       | `content.page.create`      |
| PATCH `/admin/v1/content/pages/:id`                  | `content.page.update`      |
| POST `/admin/v1/content/pages/:id/publish`           | `content.page.publish`     |
| POST `/admin/v1/content/pages/:id/archive`           | `content.page.archive`     |
| GET/POST/PATCH/DELETE `/admin/v1/content/categories` | `content.category.*`       |
| GET/POST/PATCH/DELETE `/admin/v1/content/tags`       | `content.tag.*`            |
| GET `/admin/v1/media`                                | `media.asset.read`         |
| POST `/admin/v1/media/upload`                        | `media.asset.upload`       |
| PATCH `/admin/v1/media/:id`                          | `media.asset.update`       |
| DELETE `/admin/v1/media/:id`                         | `media.asset.delete`       |
| POST `/admin/v1/media/:id/regenerate-variants`       | `media.asset.regenerate`   |
| GET `/admin/v1/search/content`                       | `search.content.read`      |
| GET `/admin/v1/search/users`                         | `search.user.read`         |
| GET `/admin/v1/search/media`                         | `search.media.read`        |
| POST `/admin/v1/search/reindex`                      | `search.index.reindex`     |
| GET `/admin/v1/analytics/*`                          | `analytics.analytics.read` |
| GET `/admin/v1/audit-logs`                           | `audit.log.read`           |
| GET `/admin/v1/system/notifications`                 | `notification.log.read`    |
| GET `/admin/v1/system/jobs`                          | `system.job.read`          |
| POST `/admin/v1/system/jobs/:id/retry`               | `system.job.retry`         |
| GET `/admin/v1/system/health`                        | `system.health.read`       |
| GET `/admin/v1/system/backups`                       | `system.backup.read`       |
| POST `/admin/v1/system/backups/run`                  | `system.backup.run`        |

---

## Guard behavior

- `PermissionGuard` is the authority. It resolves the user's permission set at request time and compares against the `@RequirePermission()` decorator value.
- **Deny by default:** routes with `@RequirePermission()` but no matching permission → `403 Forbidden`.
- Missing access token → `401 Unauthorized` (via `AccessTokenGuard`).
- `super_admin` is resolved via the same permission lookup path — not a bypass flag.

---

## ABAC-ready foundation

`scopeType` and `scopeId` fields are scaffolded on the permission schema to support future object-level policy checks. The `ObjectPolicyGuard` is implemented but not enabled on any route in Phase 0. Full ABAC evaluation (dynamic policy engine, per-resource ACL) is Phase 1+.

---

## Frontend permissions note

The admin frontend may read the resolved `permissionKeys` array from `GET /admin/v1/auth/me` to show or hide UI elements. This is a UX optimization only. The backend enforces permissions independently on every request — frontend state cannot grant access.
