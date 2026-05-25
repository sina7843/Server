# Analytics Architecture

## Status

Backend foundation implemented in Slice 0.9.3.
Admin analytics APIs exist.
Frontend dashboard is Task 0.9.4 — not implemented yet.
No funnels, cohorts, retention, A/B testing, revenue analytics, real-time analytics, data warehouse, or BI.
No fake metrics.

## Overview

Phase 0 analytics is **operational, not BI-grade**. It tracks a small set of well-defined events non-blocking, stores them in MongoDB, and exposes aggregate counts via admin APIs. No external analytics platform is used.

## AnalyticsEvent Schema

Collection: `analytics_events`

```ts
AnalyticsEvent {
  _id
  type: 'user.registered' | 'user.logged_in' | 'otp.requested' | 'otp.verified'
      | 'otp.failed' | 'content.viewed' | 'content.published' | 'media.uploaded'
  userId?: ObjectId
  anonymousId?: string
  resourceType?: string
  resourceId?: string
  metadata?: object   // sensitive keys are redacted before storage
  ipHash?: string     // SHA-256 of IP — raw IP is never stored
  userAgent?: string
  createdAt
}
```

**Required indexes:**

```text
type + createdAt
resourceType + resourceId + createdAt
userId + createdAt
createdAt
```

**Append-only:** No update or delete operations exist on the analytics events repository.

## Privacy and Security

- **Raw IP is never stored.** If an IP is provided to `AnalyticsService.track()`, it is hashed with SHA-256 before persisting. The hash is deterministic and suitable for bucketing but cannot be reversed to the original IP.
- **Sensitive metadata is redacted.** `AnalyticsRedactor` removes or replaces the following keys recursively: `password`, `passwordHash`, `rawOtp`, `otp`, `code`, `codeHash`, `refreshToken`, `refreshTokenHash`, `accessToken`, `accessTokenJti`, `resetToken`, `authorization`, `cookie`, `cookies`, `secret`, `secrets`, `clientSecret`, `providerSecret`, `providerCredentials`, `phone`, `phoneNormalized`, `email`, `recipient`, `recipientPhone`, `recipientEmail`, `recipientPhoneNormalized`.
- **No raw phone or email is stored** in analytics events or their metadata.
- **No token, password, or OTP** is stored in analytics events or their metadata.
- Admin media analytics results never contain `objectKey`, `bucket`, or `storageProvider`.

## AnalyticsService — Non-blocking Tracking

```ts
analyticsService.track({
  type: AnalyticsEventType;
  userId?: string;
  anonymousId?: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: object;
  ip?: string;        // hashed before storage — never stored raw
  userAgent?: string;
})
```

`track()` is **best-effort and non-blocking**:

- Returns immediately. The write to MongoDB happens asynchronously.
- If the write fails (DB down, timeout), the error is logged and the calling request is unaffected.
- No tracking failure propagates to the caller.

## Tracked Events

| Event               | Where tracked                                     | Notes                                    |
| ------------------- | ------------------------------------------------- | ---------------------------------------- |
| `user.registered`   | `AuthService.verifyPhone()` (success)             | Phone verified = user fully registered   |
| `user.logged_in`    | `AuthService.login()` (success)                   | IP hashed if provided                    |
| `otp.requested`     | `AuthService.sendPhoneVerificationOtpIfAllowed()` | Tracked after OTP created                |
| `otp.verified`      | `AuthService.verifyPhone()` (success)             | No raw OTP or phone                      |
| `otp.failed`        | `AuthService.verifyPhone()` (failure)             | No raw OTP or phone                      |
| `content.viewed`    | `PublicPostsService.getPublished()`               | Public endpoints only                    |
| `content.published` | `AdminContentPostsService.publishPost()`          | Admin publish action                     |
| `media.uploaded`    | `AdminMediaService.uploadMedia()`                 | No objectKey, bucket, or storageProvider |

## Content View Tracking

`PublicPostsService.getPublished()` calls `analyticsService.track()` non-blocking after returning the published post. It also increments `Post.viewCount` via `PostRepository.incrementViewCount()` (MongoDB `$inc`). Both operations are fire-and-forget and never affect the public response.

Only public detail endpoints track views. List endpoints do not.

## Admin Analytics APIs

All endpoints require `AccessTokenGuard` + `PermissionGuard(analytics.read)`.

```
GET /admin/v1/analytics/summary      — combined count of all event types
GET /admin/v1/analytics/content/top  — top content by view count + published count
GET /admin/v1/analytics/auth         — user.registered + user.logged_in counts
GET /admin/v1/analytics/otp          — otp.requested + otp.verified + otp.failed counts
GET /admin/v1/analytics/media        — media.uploaded count
```

**Query parameters (all endpoints):**

| Parameter  | Type         | Notes                                |
| ---------- | ------------ | ------------------------------------ |
| `dateFrom` | ISO string   | Optional lower bound (inclusive)     |
| `dateTo`   | ISO string   | Optional upper bound (inclusive)     |
| `limit`    | integer 1–50 | For content/top endpoint; default 10 |

**Behavior:**

- Returns real aggregates from MongoDB. No fake or placeholder data.
- Returns zero counts when no events exist for the given range.
- `dateFrom` must not be after `dateTo` — returns 400 if violated.
- Aggregations use `$match` + `$group` / `countDocuments`.

## Permissions

| Constant         | Value                      | Roles              |
| ---------------- | -------------------------- | ------------------ |
| `ANALYTICS_READ` | `analytics.analytics.read` | admin, super_admin |

Registered in:

- `apps/api/src/rbac/registry/permission-keys.ts`
- `apps/api/src/rbac/registry/role-permission-registry.ts`
- `packages/types/src/constants/permissions.ts`

## Module Structure

```
apps/api/src/analytics/
├── analytics-event.schema.ts        # Mongoose schema + indexes
├── analytics-event.repository.ts   # Append-only repository
├── analytics-redactor.ts           # Sensitive key redactor
├── analytics.service.ts            # Non-blocking track() method
├── analytics.types.ts              # TrackInput interface
├── analytics.module.ts             # Module wiring; exports AnalyticsService
├── analytics.service.spec.ts       # Unit tests
└── admin/
    ├── admin-analytics.controller.ts
    ├── admin-analytics.service.ts
    ├── admin-analytics.module.ts
    └── dto/
        ├── admin-analytics-query.ts
        └── admin-analytics-response.ts
```

## packages/types Contracts

```ts
AnalyticsEventType;
AnalyticsSummaryDto;
AnalyticsAuthSummaryDto;
AnalyticsOtpSummaryDto;
AnalyticsContentTopItemDto;
AnalyticsContentSummaryDto;
AnalyticsMediaSummaryDto;
AnalyticsDateRangeQueryDto;
```

No Mongoose/DB entity types are exported.

## packages/sdk

```ts
createAdminAnalyticsClient(client).getSummary(params);
// GET /admin/v1/analytics/summary

createAdminAnalyticsClient(client).getContentTop(params);
// GET /admin/v1/analytics/content/top

createAdminAnalyticsClient(client).getAuth(params);
// GET /admin/v1/analytics/auth

createAdminAnalyticsClient(client).getOtp(params);
// GET /admin/v1/analytics/otp

createAdminAnalyticsClient(client).getMedia(params);
// GET /admin/v1/analytics/media
```

SDK has no real-time method, no BI/funnel/cohort/revenue method, no WebSocket method, no Meilisearch-specific method.

## Phase 0 Limitations

- **No advanced analytics.** No funnels, cohorts, retention, A/B testing, revenue analytics, or user journeys.
- **No real-time analytics.** Aggregations run on-demand against MongoDB. Not suitable for dashboards requiring sub-second freshness.
- **No data warehouse.** All events are stored in MongoDB alongside operational data.
- **No analytics frontend dashboard.** Admin UI for analytics is Task 0.9.4.
- **No Persian/Farsi NLP.** Not implemented.
- **No retention policy enforcement.** Retention policy is documented as follows: analytics events are indefinitely retained in Phase 0. A TTL index or batch cleanup job can be added in a future slice when a retention window is agreed.
- **No throttle/dedupe on content.viewed.** Phase 0 counts all view events. Dedupe by session/user can be added later.

## Out of Scope (Slice 0.9.3)

- Frontend analytics dashboard (Task 0.9.4)
- Funnels / cohorts / retention analytics
- A/B testing
- Revenue analytics
- Real-time analytics / WebSocket dashboard
- Data warehouse / BI tools
- Advanced charting
- Search-over-analytics events
- Marketing analytics
- Fake/placeholder metrics
