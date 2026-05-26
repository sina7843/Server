# Smoke Tests

Phase 0 smoke suite — the official release gate. Two suites together form the complete automated smoke gate:

1. **Operational smoke** (`pnpm --filter @dragon/api smoke`) — 8 suites, 80 tests
2. **Critical flow smoke** (`pnpm --filter @dragon/api smoke:phase0`) — 11 suites, 88 tests
3. **Full gate** (`pnpm smoke`) — runs both, 19 suites, 168 tests total

## What is covered

### Operational smoke (`*-smoke.e2e-spec.ts`)

| Area          | Spec file                              | Tests                                                     |
| ------------- | -------------------------------------- | --------------------------------------------------------- |
| Health        | `test/health-smoke.e2e-spec.ts`        | live/ready/dependencies; no secrets in response           |
| Backup        | `test/backup-smoke.e2e-spec.ts`        | permission-protected; no restore endpoint; no credentials |
| Search        | `test/search-smoke.e2e-spec.ts`        | public published-only; admin permission-protected         |
| Analytics     | `test/analytics-smoke.e2e-spec.ts`     | permission-protected; no raw OTP/IP in response           |
| Audit         | `test/audit-smoke.e2e-spec.ts`         | permission-protected; no raw secrets in logs              |
| Jobs          | `test/jobs-smoke.e2e-spec.ts`          | permission-protected; no raw secrets in payload           |
| Notifications | `test/notifications-smoke.e2e-spec.ts` | permission-protected; no raw OTP/phone in logs            |
| Media         | `test/media-smoke.e2e-spec.ts`         | permission-protected; MIME/extension allowlist validation |

### Critical flow smoke (`smoke:phase0`)

| Area               | Spec file                             | Tests                                               |
| ------------------ | ------------------------------------- | --------------------------------------------------- |
| Auth login         | `test/auth-login.e2e-spec.ts`         | login; cookie set; token shape                      |
| Auth refresh       | `test/auth-refresh.e2e-spec.ts`       | cookie-based refresh; rotation; 401 without cookie  |
| Auth register      | `test/auth-register.e2e-spec.ts`      | registration; unknown field rejection               |
| Auth full flow     | `test/auth-full-flow.e2e-spec.ts`     | register → verify → login → refresh → logout        |
| Auth security      | `test/auth-security.e2e-spec.ts`      | replay, timing, generic error shape                 |
| RBAC admin         | `test/rbac-admin.e2e-spec.ts`         | admin route access                                  |
| RBAC authorization | `test/rbac-authorization.e2e-spec.ts` | allow/deny by permission, deny-by-default           |
| Profile account    | `test/profile-account.e2e-spec.ts`    | get/update own profile, username validation         |
| Profile public     | `test/profile-public.e2e-spec.ts`     | public profile visible/private, banned/deleted safe |
| Content admin      | `test/content-admin.e2e-spec.ts`      | create/publish/archive; permission guard            |
| Content public     | `test/content-public.e2e-spec.ts`     | published visible, draft/archived 404, type-scoped  |

## What is mocked

All smoke tests in `apps/api/test/` run entirely in-process using `@nestjs/testing`. Nothing requires a real database, real Redis, or real external service.

| Dependency                | Mock mechanism                                                                   |
| ------------------------- | -------------------------------------------------------------------------------- |
| SMS provider              | `jest.fn()` mock — `createMockSmsService()` in `test/helpers/mock-sms.helper.ts` |
| MongoDB                   | All repositories/services are jest mocks                                         |
| Redis / BullMQ            | All job/queue services are jest mocks                                            |
| Object storage            | All storage services are jest mocks                                              |
| AccessTokenGuard          | `RbacTestAccessTokenGuard` (test helper) sets `req.auth` from token header       |
| PermissionResolverService | jest mock returning specific `permissionKeys[]` per test                         |

## Required services

**None.** All smoke tests run without any running service. Jest spawns a temporary NestJS app bound to a random port.

## How to run

```bash
# From repo root — runs full smoke gate (operational + critical flows)
pnpm smoke

# Operational smoke only (8 suites, 80 tests)
pnpm --filter @dragon/api smoke

# Critical flow smoke only (11 suites, 88 tests)
pnpm --filter @dragon/api smoke:phase0

# Run a specific operational area
pnpm --filter @dragon/api smoke -- --testPathPattern="health-smoke"
pnpm --filter @dragon/api smoke -- --testPathPattern="backup-smoke"
pnpm --filter @dragon/api smoke -- --testPathPattern="search-smoke"
pnpm --filter @dragon/api smoke -- --testPathPattern="analytics-smoke"
pnpm --filter @dragon/api smoke -- --testPathPattern="audit-smoke"
pnpm --filter @dragon/api smoke -- --testPathPattern="jobs-smoke"
pnpm --filter @dragon/api smoke -- --testPathPattern="notifications-smoke"
pnpm --filter @dragon/api smoke -- --testPathPattern="media-smoke"

# Run all e2e specs (all 26 files including non-smoke auth/session/password-reset)
cd apps/api && npx jest --testRegex=".*\\.e2e-spec\\.ts$"
```

## How smoke tests work

Each spec file follows the `@nestjs/testing` pattern:

1. Create a minimal NestJS test module with the target controller(s)
2. Provide mock implementations for all injected services
3. Override `AccessTokenGuard` with `RbacTestAccessTokenGuard`
4. Include `Reflector` + `PermissionGuard` for realistic permission enforcement
5. Bind the app to a random port (`app.listen(0)`)
6. Use `fetch()` to make HTTP calls and assert status codes and response shapes
7. Verify no sensitive values appear in serialized responses
8. Tear down the app in `afterEach`

## Security assertions pattern

All smoke tests verify that sensitive fields never appear in HTTP responses:

```typescript
const SENSITIVE_MARKERS = ['password', 'token', 'otp', 'secret', 'credential'];
const text = await res.text();
for (const marker of SENSITIVE_MARKERS) {
  expect(text).not.toContain(marker);
}
```

## CI notes

The `pnpm smoke` script runs in `apps/api` only and requires no external services, so it can
run in any CI environment with Node.js. It does **not** replace the main `pnpm test` suite
(unit tests); both should pass.

```yaml
# Example GitHub Actions step
- name: Smoke tests
  run: pnpm smoke
```

## Known limitations

- No Playwright or browser-based E2E — Phase 0 has no stable public frontend to automate
- Media upload smoke only tests the permission guard, not actual file processing (Sharp, S3)
  because these require real services
- SMS OTP smoke relies on mock provider; real OTP delivery is not tested
- Backup run smoke only verifies the permission guard and service delegation; no real mongodump
