# API Contracts — DTO / Response / Envelope Conventions

This document describes the response shapes, pagination conventions, and DTO rules used across the Phase 0 API.

---

## General conventions

- All API responses are JSON (`Content-Type: application/json`).
- All requests expecting a body use `Content-Type: application/json` unless explicitly `multipart/form-data`.
- DTOs are contracts, not database entities. Response shapes may omit or rename internal MongoDB fields.
- `_id` fields from MongoDB are exposed as `id` (string) in response DTOs.
- All timestamps are ISO 8601 UTC strings (`"2024-01-01T00:00:00.000Z"`).

---

## Response envelope

The API does **not** use a universal wrapper envelope for all routes. Response shapes vary by domain:

| Pattern                         | Used by                                     |
| ------------------------------- | ------------------------------------------- |
| Direct object                   | Auth, profile, health, single-resource GETs |
| `{ items, total, page, limit }` | Paginated list routes                       |
| `{ success, message }`          | Action confirmations (logout, verify, etc.) |
| `{ permissions: [...] }`        | RBAC permission lists                       |
| `{ roles: [...] }`              | RBAC role lists                             |
| `{ sessions: [...] }`           | Session list                                |

Do not assume every route is wrapped. Check the specific domain doc for the exact shape.

---

## Pagination

Paginated list routes use query parameters `page` (1-based) and `limit`.

**Request query:**

```
?page=1&limit=20
```

**Response shape:**

```json
{
  "items": [...],
  "total": 150,
  "page": 1,
  "limit": 20
}
```

| Constraint                | Value                 |
| ------------------------- | --------------------- |
| Default page              | 1                     |
| Default limit             | 20 (varies by route)  |
| Max limit — public search | 50                    |
| Max limit — audit logs    | 100                   |
| Max limit — admin lists   | varies; typically 100 |

Requests exceeding the maximum limit return `400 Bad Request`.

---

## ObjectId validation

Route params and DTO fields that represent MongoDB ObjectIds are validated as 24-character hex strings. An invalid ObjectId format returns `400 Bad Request` before any database operation.

```
Valid:   507f1f77bcf86cd799439011
Invalid: not-an-id, 123, ""
```

---

## Sort and filter allowlists

Sort fields and filter values are validated against explicit allowlists in the DTO parsers. Unknown sort fields or filter keys return `400 Bad Request` rather than being silently ignored.

---

## Validation error shape

NestJS global validation pipe returns `400 Bad Request` with:

```json
{
  "statusCode": 400,
  "message": ["phone must be a valid E.164 phone number"],
  "error": "Bad Request"
}
```

Custom DTO parsers (Zod-based) may return a different message format but always use HTTP 400.

---

## Token response

`TokenResponseDto` — returned by login and refresh:

```json
{
  "accessToken": "<jwt-string>",
  "expiresIn": 900,
  "tokenType": "Bearer"
}
```

The refresh token is set as an **HttpOnly cookie** and does not appear in the JSON body.

---

## Auth generic response

`AuthGenericResponseDto` — returned by register, verify, logout, password operations:

```json
{
  "success": true,
  "message": "OTP sent"
}
```

---

## Health response shapes

`HealthLiveDto`:

```json
{
  "status": "ok",
  "service": "api",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

`HealthReadyDto` / `HealthDependenciesDto`:

```json
{
  "status": "ok",
  "service": "api",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "dependencies": {
    "mongodb": { "status": "ok" },
    "redis": { "status": "ok" },
    "storage": { "status": "ok" | "unknown" }
  }
}
```

Status values per dependency: `"ok"` | `"down"` | `"degraded"` | `"unknown"`.

Health responses never contain connection strings, credentials, bucket names, or internal paths.

---

## Request ID

Every response includes `x-request-id` (UUID). If the client supplies `x-request-id` in the request header, the same value is echoed. If not supplied, the API generates one.

---

## Security — sensitive fields

The following fields must never appear in any API response, log entry, or error body:

- Raw OTP codes
- Password or passwordHash
- Refresh token values
- Access token values (other than the explicit `TokenResponseDto`)
- JWT signing secrets
- SMS body text
- Phone numbers in audit/notification payloads (only masked forms are permitted)
- Storage connection strings, bucket credentials, or internal paths

---

## Body size limits

The API enforces a 1 MB limit on JSON and URL-encoded bodies (`Content-Type: application/json` and `application/x-www-form-urlencoded`). Oversized bodies return `413 Payload Too Large`.

Media uploads use `multipart/form-data` with a separate per-upload limit configured via `MEDIA_MAX_FILE_SIZE_BYTES` (default 10 MB, production 50 MB). Upload size enforcement is at the NestJS interceptor level, not the 1 MB body parser limit.

---

## CORS

The API allows only origins listed in `CORS_ALLOWED_ORIGINS` (comma-separated). Wildcard `*` is never used together with `credentials: true`. Cross-origin requests from unlisted origins are rejected.

---

## Known inconsistencies

- Not every list route returns the identical `{ items, total, page, limit }` shape — some older routes use `data` instead of `items`. Where this occurs, it is noted in the domain API doc.
- Admin dashboard summary and analytics routes return custom aggregation objects, not paginated lists.
