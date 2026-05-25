# Monitoring Architecture

## Scope

Task 0.10.3 — Health endpoints, structured request logging, and requestId propagation.

## Health endpoints

All three endpoints are public (no auth) and served by the NestJS API.

| Endpoint                   | HTTP status | Purpose                                             |
| -------------------------- | ----------- | --------------------------------------------------- |
| `GET /health/live`         | 200 always  | Liveness probe — app process is up                  |
| `GET /health/ready`        | 200 / 503   | Readiness probe — critical deps (MongoDB, Redis) ok |
| `GET /health/dependencies` | 200 always  | Full dependency map including storage and SMS       |

### `/health/live`

Always returns 200. Confirms the Node.js process started and the HTTP listener is bound. Used as the Docker Compose healthcheck for the `api` service.

```json
{ "status": "ok", "service": "api", "timestamp": "2024-01-01T00:00:00.000Z" }
```

### `/health/ready`

Returns 200 when MongoDB and Redis are reachable, 503 otherwise. Used by load balancers and orchestrators to decide whether to route traffic.

```json
{
  "status": "ok",
  "service": "api",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "dependencies": {
    "mongodb": { "status": "ok", "latencyMs": 3 },
    "redis": { "status": "ok", "latencyMs": 1 }
  }
}
```

### `/health/dependencies`

Always returns 200. Provides the status of all four dependency categories. Used by the admin system health page and for ops visibility.

```json
{
  "status": "degraded",
  "service": "api",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "dependencies": {
    "mongodb": { "status": "ok", "latencyMs": 3 },
    "redis": { "status": "ok", "latencyMs": 1 },
    "storage": { "status": "ok" },
    "sms": { "status": "unknown" }
  }
}
```

### HealthStatus values

| Value      | Meaning                                         |
| ---------- | ----------------------------------------------- |
| `ok`       | Dependency is reachable and responding normally |
| `degraded` | Dependency is reachable but performing poorly   |
| `down`     | Dependency is unreachable or returning errors   |
| `unknown`  | Dependency configured but not actively verified |

### Overall status rules

- Any `down` → overall is `down`
- Any `degraded` or `unknown` (with no `down`) → overall is `degraded`
- All `ok` → overall is `ok`

### Security

Health responses **never** expose:

- Connection strings or database credentials
- S3/object-storage keys or secrets
- SMS API keys or tokens
- Provider endpoints with embedded credentials
- Internal IP addresses or hostnames with auth components

The `/health/dependencies` `storage` and `sms` entries report only whether the provider env var is set — not its value.

## Dependency checks

| Dependency | Check method                                     | Env vars read      |
| ---------- | ------------------------------------------------ | ------------------ |
| MongoDB    | `Connection.db.command({ ping: 1 })` (mongoose)  | `MONGODB_URI`      |
| Redis      | `Queue.client.ping()` (BullMQ SMS queue IORedis) | `REDIS_*`          |
| Storage    | Config-only: `STORAGE_PROVIDER` presence         | `STORAGE_PROVIDER` |
| SMS        | Config-only: `SMS_PROVIDER` presence             | `SMS_PROVIDER`     |

## Request logging

Every HTTP request is logged as a single-line JSON object by `LoggingInterceptor`:

```json
{ "requestId": "uuid-v4", "method": "GET", "url": "/health/live", "status": 200, "ms": 4 }
```

The interceptor is registered globally in `main.ts` via `app.useGlobalInterceptors(new LoggingInterceptor())`.

### What is logged

- `requestId` — UUID from `RequestIdMiddleware` (or forwarded `x-request-id`)
- `method` — HTTP verb
- `url` — request path (no query params to avoid logging search terms)
- `status` — HTTP status code
- `ms` — response time in milliseconds

### What is never logged

- Request or response bodies
- Authorization headers or tokens
- Phone numbers, email addresses
- OTP codes
- Database query contents
- S3 presigned URLs or storage secrets

## RequestId propagation

`RequestIdMiddleware` runs on every route. It:

1. Reads `x-request-id` or `x-correlation-id` from the incoming request headers.
2. Generates a UUID v4 if neither header is present.
3. Attaches the ID to `req.requestId`.
4. Sets `x-request-id` on the response so callers can correlate logs.

## Log rotation

All Docker Compose services use the `json-file` driver with rotation:

```yaml
logging:
  driver: json-file
  options:
    max-size: '10m'
    max-file: '3'
```

Maximum disk usage per service: 30 MB (3 × 10 MB files).

## Admin system health page

`GET /admin/v1/system/health` (auth-guarded, requires `SYSTEM_HEALTH_READ` permission) now calls `HealthService.getDependencies()` and maps the result to `AdminSystemHealthResponse`:

- `'down'` → `'unavailable'`
- `'degraded'` → `'degraded'`
- `'ok'` → `'ok'`

## Not implemented in this task

- External metrics endpoint (Prometheus/OpenMetrics) — out of scope for Phase 0
- Distributed tracing (OpenTelemetry) — out of scope for Phase 0
- Alerting rules — out of scope for Phase 0
- Database backup verification — see Task 0.10.4
