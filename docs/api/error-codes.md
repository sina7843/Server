# Error Codes and HTTP Error Conventions

---

## HTTP status codes used

| Status | Meaning               | When used                                                                        |
| ------ | --------------------- | -------------------------------------------------------------------------------- |
| 200    | OK                    | Successful GET, PATCH, action (logout, verify)                                   |
| 201    | Created               | Successful POST creating a resource                                              |
| 400    | Bad Request           | Validation failure, invalid ObjectId, malformed body, value out of allowed range |
| 401    | Unauthorized          | Missing or expired access token; invalid credentials at login                    |
| 403    | Forbidden             | Valid token but insufficient permission; banned/suspended account                |
| 404    | Not Found             | Resource not found, or intentionally hidden (private profile, archived content)  |
| 409    | Conflict              | Duplicate slug, duplicate phone on register                                      |
| 413    | Payload Too Large     | JSON body > 1 MB; upload file > configured max                                   |
| 429    | Too Many Requests     | OTP rate limits exceeded (per-phone or per-IP)                                   |
| 500    | Internal Server Error | Unexpected server error                                                          |
| 503    | Service Unavailable   | Health readiness check failed (MongoDB or Redis unreachable)                     |

---

## Error response shape

### Validation errors (400)

```json
{
  "statusCode": 400,
  "message": ["phone must be a valid E.164 phone number", "..."],
  "error": "Bad Request"
}
```

### Auth / permission errors (401, 403)

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

Auth errors are intentionally generic. The API does not indicate whether a phone exists, whether a password was wrong, or why a token was rejected beyond the HTTP status code. This is to prevent user enumeration and timing attacks.

### Not found (404)

```json
{
  "statusCode": 404,
  "message": "Not Found",
  "error": "Not Found"
}
```

Public content routes return 404 for draft, archived, soft-deleted, or non-existent content. Public profile routes return 404 for private, banned, or deleted accounts. No difference is surfaced in the error body.

### Rate limit (429)

```json
{
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too Many Requests"
}
```

Retry-After header is not yet standardized across all rate-limited routes in Phase 0.

### Upload errors (400 / 413)

Upload validation failures use 400 with a message identifying the rejection reason (unsupported MIME type, extension not allowed). Oversized uploads use 413.

### Health 503

When the readiness endpoint detects a dependency failure, it returns 503 with the full dependency status body:

```json
{
  "statusCode": 503,
  "message": "Service Unavailable",
  "status": "down",
  "service": "api",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "dependencies": {
    "mongodb": { "status": "down" },
    "redis": { "status": "ok" }
  }
}
```

---

## Security — error body guarantees

- Auth error messages do not indicate whether a user account exists.
- Password error messages do not distinguish "wrong password" from "account not found".
- OTP error messages do not expose remaining attempts count (to prevent probing).
- No stack traces, internal paths, or raw error objects appear in production error responses.
- Backup and health error bodies never expose connection strings, bucket credentials, or internal config values.

---

## Internal error codes

The API does not use a structured internal error code registry in Phase 0. Error discrimination is by HTTP status + message string. A structured error code system (`ERR_AUTH_INVALID_OTP`, etc.) is a Phase 1 consideration.
