# Phase 0 Test Strategy

This document describes the testing approach used across Phase 0 of the Dragon Ecosystem backend.

## Goals

- Catch regressions in critical security and business flows before they reach production
- Verify that access control (auth, RBAC, permission guard) works correctly at the HTTP layer
- Ensure that no sensitive values (OTP, passwords, tokens, phone numbers) appear in API responses
- Keep the test suite maintainable: no brittle snapshot tests, no fake mocks that bypass real behavior

## Test layers

### 1. Unit tests (`apps/api/src/**/*.spec.ts`)

**What:** Individual class and function tests for services, repositories, guards, utilities, and config parsers.

**When run:** `pnpm test` (via turbo, runs all packages)

**Count:** 1390+ tests across 125+ suites

**Key characteristics:**

- Each test instantiates one class with mock dependencies via `jest.fn()`
- Fast (< 20 seconds total for the full suite)
- No network, no database, no file I/O
- Focus: business logic correctness and security invariants

**Examples:**

- `AuditRedactor.redact()` — case-insensitive key redaction
- `PermissionGuard` — deny-by-default behavior
- `getCorsConfig()` — wildcard stripping
- `parsePublicContentSearchQuery()` — pagination caps and ObjectId validation
- `OtpChallengeSchema.paths` — codeHash field, no rawCode

### 2. Security regression tests (`apps/api/src/common/security.regression.spec.ts`)

**What:** Cross-cutting security invariants that span multiple modules.

**When run:** `pnpm test` (included in the main unit test suite)

**Count:** 40+ assertions covering CORS, redactors, OTP schema, pagination caps, ObjectId validation, permission guard, public content filtering, backup credentials, health endpoint safety, no localStorage, no readable access token cookie

### 3. Smoke / integration tests (`apps/api/test/**/*-smoke.e2e-spec.ts`)

**What:** HTTP-layer smoke tests for high-risk flows using `@nestjs/testing`.

**When run:** `pnpm smoke`

**Count:** 80 tests across 8 suites

**Key characteristics:**

- Spins up a real NestJS HTTP server (random port) with mocked service dependencies
- Tests actual HTTP status codes (401/403/200/201/400/503/404)
- Verifies no secrets appear in serialized response text
- Tests the full request pipeline: routing, guards, pipes, controllers, exception filters
- No real database, no real external services — all mocks

**Coverage:**

- Health endpoints: `/health/live`, `/health/ready`, `/health/dependencies`
- Backup APIs: permission-protected, no restore endpoint, no credential exposure
- Search: public (published-only) and admin (permission-protected)
- Analytics: permission-protected, no raw OTP/IP in aggregates
- Audit logs: permission-protected, no raw secrets in entries
- Jobs: permission-protected, no raw payload secrets, retry gate
- Notifications: permission-protected, no raw OTP/phone
- Media: permission-protected, MIME/extension allowlist validation

### 4. Existing e2e specs (`apps/api/test/**/*.e2e-spec.ts`, pre-0.11.2)

**What:** Integration-style tests for auth, RBAC, content, and profile flows. Same `@nestjs/testing` pattern as smoke tests.

**When run:** `cd apps/api && npx jest --testRegex=".*\\.e2e-spec\\.ts$"`

**Note:** Some pre-existing specs have DI resolution failures in their test module setup (unrelated to the smoke suite). The `pnpm smoke` script targets only `*-smoke.e2e-spec.ts` to guarantee a clean run.

## What is intentionally NOT tested

| Item                          | Reason                                              |
| ----------------------------- | --------------------------------------------------- |
| Real SMS OTP delivery         | No real SMS credentials; mock provider used         |
| Real S3/Object Storage upload | No real storage credentials; mock adapter used      |
| Real MongoDB integration      | In-memory or mocked repos; no `mongod` required     |
| Playwright / browser E2E      | Phase 0 has no stable frontend requiring automation |
| Real mongodump / backup run   | No real MongoDB URI in tests; service is mocked     |
| Frontend rendering            | Nuxt apps are not part of the backend test suite    |
| Phase 1 features              | Out of scope                                        |

## Running the full suite

```bash
# Unit tests (all packages)
pnpm test

# Smoke tests only (api only, no external services required)
pnpm smoke

# Both
pnpm test && pnpm smoke
```

## Required local services

**Unit tests:** none

**Smoke tests:** none

**Integration tests against real services:** not implemented in Phase 0

## Test fixtures and helpers (`apps/api/test/helpers/`)

| File                            | Purpose                                                                           |
| ------------------------------- | --------------------------------------------------------------------------------- |
| `auth-test.factory.ts`          | Auth config, login/token response shapes                                          |
| `mock-sms.helper.ts`            | Mock SMS service (records sent messages)                                          |
| `rbac-test.factory.ts`          | `RbacTestAccessTokenGuard`, `PermissionResolverService` mock, test IDs and tokens |
| `security-assertions.helper.ts` | `expectNoSensitiveAuthFields()`, `expectGenericSuccessResponse()`                 |
| `token-test.helper.ts`          | Token response factory and assertion helpers                                      |
| `database-test.helper.ts`       | Database connection assertions (for future integration tests)                     |
| `profile-test.factory.ts`       | Profile and user document factories                                               |

## Principles

1. **No fake tests.** Every test asserts real behavior — a test that only confirms that a mock was called without checking HTTP status or response shape is not added.

2. **Security assertions are first-class.** Every HTTP-layer test checks that no sensitive value appears in the response body.

3. **No brittle snapshot tests.** Response shape assertions use `expect().toMatchObject()` or specific field checks.

4. **Mock external services at their boundary.** SMS, storage, and database are mocked at the service/repository level, not at the network level.

5. **Deny-by-default is tested explicitly.** Every permission-guarded route is tested with no-auth (→ 401), no-permission (→ 403), and correct-permission (→ 200).
