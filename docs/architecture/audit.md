# Audit Log Architecture

## Overview

The audit log subsystem provides append-only, tamper-evident records of security-relevant operations across the Dragon platform. It is designed for compliance, incident response, and forensic analysis. Audit writes are best-effort: a write failure never blocks a normal business operation.

## Status

All components implemented as of Slice 0.8.1.

## Components

### AuditLog Schema (`audit_logs` collection)

Append-only Mongoose document. All fields are set at creation and never mutated. The schema uses `timestamps: { createdAt: true, updatedAt: false }` to prevent an `updatedAt` field from being created.

**Fields:**

| Field           | Type     | Required | Description                                                              |
| --------------- | -------- | -------- | ------------------------------------------------------------------------ |
| `actorId`       | ObjectId | No       | ID of the user or system actor. Omitted for anonymous or system actions. |
| `actorType`     | enum     | Yes      | `user`, `admin`, `system`, or `job`                                      |
| `action`        | string   | Yes      | Namespaced action constant (e.g., `auth.login_success`)                  |
| `resourceType`  | string   | Yes      | Type of the affected resource (e.g., `content_post`)                     |
| `resourceId`    | string   | No       | ID of the affected resource                                              |
| `before`        | object   | No       | Pre-mutation state snapshot. Must not contain secrets.                   |
| `after`         | object   | No       | Post-mutation state snapshot. Must not contain secrets.                  |
| `metadata`      | object   | No       | Additional context. Must not contain secrets.                            |
| `ip`            | string   | No       | Source IP address                                                        |
| `userAgent`     | string   | No       | Source user agent string                                                 |
| `requestId`     | string   | No       | Trace ID from the originating HTTP request                               |
| `correlationId` | string   | No       | Cross-service correlation ID                                             |
| `severity`      | enum     | Yes      | `info`, `warning`, or `critical`. Defaults to `info`.                    |
| `createdAt`     | Date     | Yes      | Auto-set by Mongoose timestamps. Never mutated.                          |

**Indexes:**

1. `{ actorId: 1, createdAt: -1 }` — actor activity timeline
2. `{ resourceType: 1, resourceId: 1, createdAt: -1 }` — resource history
3. `{ action: 1, createdAt: -1 }` — action frequency and timeline
4. `{ requestId: 1 }` — sparse, for request tracing
5. `{ createdAt: -1 }` — global timeline

### AuditLogRepository

Read-only after creation. Exposes only:

- `create(input)` — persists a new audit log entry
- `findById(id)` — retrieves a single entry by ID

No `update`, `delete`, or bulk-mutation methods exist. This is intentional and enforced by the repository design.

### AuditRedactor

Applies secret-key redaction before any data is persisted. Operates recursively on nested objects and arrays. Does not mutate its input.

**Redacted keys** (any occurrence at any nesting depth):

`password`, `passwordHash`, `rawOtp`, `otp`, `code`, `codeHash`, `refreshToken`, `refreshTokenHash`, `accessToken`, `accessTokenJti`, `resetToken`, `secret`, `secrets`, `clientSecret`, `providerSecret`, `providerCredentials`, `authorization`, `cookie`, `cookies`

Special handling for `headers` objects: `authorization` and `cookie` keys are matched case-insensitively.

### AuditService

- Accepts a `WriteAuditLogInput`, applies redaction via `AuditRedactor`, then delegates to `AuditLogRepository.create()`.
- Wraps the entire operation in a try/catch. Any write failure is logged structurally at `error` level with `action` and `actorType` for triage, but is never re-thrown.
- All callers use the fire-and-forget pattern: `void this.auditService?.log(...)`.

### AuditModule

Leaf module — imports only `MongooseModule`. Safe to import into any domain module without creating circular dependencies.

Provides and exports: `AuditService`.

## Integration Points

### Auth

| Trigger                             | Action constant      |
| ----------------------------------- | -------------------- |
| Login success                       | `auth.login_success` |
| Login failure (bad OTP/credentials) | `auth.login_failed`  |
| Session logout                      | `auth.logout`        |
| Logout all sessions                 | `auth.logout_all`    |

### Profile

| Trigger                 | Action constant        |
| ----------------------- | ---------------------- |
| Profile updated         | `profile.updated`      |
| Avatar set              | `media.avatar_updated` |
| Avatar uploaded and set | `media.avatar_updated` |
| Avatar deleted          | `media.avatar_deleted` |

### RBAC

| Trigger                       | Action constant            | Severity |
| ----------------------------- | -------------------------- | -------- |
| Admin role created            | `rbac.role_created`        | info     |
| Admin role updated            | `rbac.role_updated`        | info     |
| Admin role deactivated        | `rbac.role_deactivated`    | warning  |
| User role assigned            | `rbac.role_assigned`       | info     |
| User role removed             | `rbac.role_removed`        | warning  |
| Permission attached to role   | `rbac.permission_attached` | info     |
| Permission detached from role | `rbac.permission_detached` | warning  |

### Content

| Trigger           | Action constant             | Severity |
| ----------------- | --------------------------- | -------- |
| Post created      | `content.post_created`      | info     |
| Post updated      | `content.post_updated`      | info     |
| Post published    | `content.post_published`    | info     |
| Post archived     | `content.post_archived`     | info     |
| Post soft-deleted | `content.post_soft_deleted` | warning  |

### Media

| Trigger                | Action constant             | Severity |
| ---------------------- | --------------------------- | -------- |
| Media uploaded (admin) | `media.asset_uploaded`      | info     |
| Media deleted (admin)  | `media.asset_deleted`       | warning  |
| Variants regenerated   | `media.variant_regenerated` | info     |

## Design Decisions

**Append-only:** No update or delete APIs for audit records. Retention and purge are out of scope for Slice 0.8.

**Best-effort writes:** Business operations must not fail due to audit infrastructure. AuditService.log() swallows all errors.

**@Optional() injection:** All domain services inject AuditService with `@Optional()`. Existing tests that do not mock AuditService continue to compile and pass without modification.

**Actor ID in RBAC:** Admin RBAC operations are logged with `actorType: 'admin'` and no `actorId`. Admin identity enrichment is planned for Task 0.8.2.

**No admin API:** Admin viewer (`GET /admin/v1/audit-logs`) is planned for Task 0.8.2 and is out of scope here.

## Out of Scope (Slice 0.8.1)

- Admin audit viewer UI and REST API
- Audit log export
- Audit log edit or delete endpoints
- Purge/retention jobs
- SIEM integration
- Anomaly detection
- Full event sourcing
- Outbox dispatcher / saga engine
