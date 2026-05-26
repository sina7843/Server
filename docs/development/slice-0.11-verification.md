# Slice 0.11 Verification

## Task 0.11.2 — Risk-based Testing and Smoke Test Suite

### Files created

```
apps/api/test/health-smoke.e2e-spec.ts
apps/api/test/backup-smoke.e2e-spec.ts
apps/api/test/search-smoke.e2e-spec.ts
apps/api/test/analytics-smoke.e2e-spec.ts
apps/api/test/audit-smoke.e2e-spec.ts
apps/api/test/jobs-smoke.e2e-spec.ts
apps/api/test/notifications-smoke.e2e-spec.ts
apps/api/test/media-smoke.e2e-spec.ts
docs/development/smoke-tests.md
docs/development/phase-0-test-strategy.md
docs/development/slice-0.11-verification.md   ← updated
docs/operations/smoke-test-checklist.md       ← updated
```

### Files modified

```
apps/api/package.json    — added "smoke" script
package.json             — added "smoke" script
turbo.json               — added "smoke" task
```

### Verification commands

```bash
# Full smoke gate (19 suites = 8 operational + 11 critical flows, no external services required)
pnpm smoke

# Full unit test suite (must still pass after adding smoke specs)
pnpm test
pnpm lint
pnpm typecheck
pnpm build
pnpm format:check
```

### Expected results

| Command                                  | Expected                                                            |
| ---------------------------------------- | ------------------------------------------------------------------- |
| `pnpm smoke`                             | 19 suites (8 operational + 11 critical flow), 168 tests, 0 failures |
| `pnpm --filter @dragon/api smoke`        | 8 suites, 80 tests, 0 failures (operational)                        |
| `pnpm --filter @dragon/api smoke:phase0` | 11 suites, 88 tests, 0 failures (critical flows)                    |
| `pnpm test`                              | 1400+ pass                                                          |
| `pnpm lint`                              | 0 errors                                                            |
| `pnpm typecheck`                         | 0 errors                                                            |
| `pnpm build`                             | all packages built                                                  |
| `pnpm format:check`                      | all files pass                                                      |

### Coverage areas

| Area                                                       | Spec                              |
| ---------------------------------------------------------- | --------------------------------- |
| Health: no secrets, 503 on dep down                        | `health-smoke.e2e-spec.ts`        |
| Backup: permission-protected, no restore/download endpoint | `backup-smoke.e2e-spec.ts`        |
| Search: public published-only, admin permission-gated      | `search-smoke.e2e-spec.ts`        |
| Analytics: permission-gated, no raw OTP in aggregates      | `analytics-smoke.e2e-spec.ts`     |
| Audit: permission-gated, no raw secrets in log entries     | `audit-smoke.e2e-spec.ts`         |
| Jobs: permission-gated, retry gate, no raw payload secrets | `jobs-smoke.e2e-spec.ts`          |
| Notifications: permission-gated, no raw OTP/phone in logs  | `notifications-smoke.e2e-spec.ts` |
| Media: permission-gated, MIME/extension allowlist          | `media-smoke.e2e-spec.ts`         |

---

## Task 0.11.1 — Security Hardening Final Pass

### Files created

```
apps/api/src/common/middleware/security-headers.middleware.ts
apps/api/src/common/middleware/security-headers.middleware.spec.ts
apps/api/src/config/cors.config.ts
apps/api/src/config/cors.config.spec.ts
apps/api/src/common/security.regression.spec.ts
docs/security/security-hardening-checklist.md
docs/development/slice-0.11-verification.md   ← this file
```

### Files modified

```
apps/api/src/main.ts                          — NestExpressApplication, body limits, CORS enablement
apps/api/src/app.module.ts                    — SecurityHeadersMiddleware added to middleware chain
apps/api/src/jobs/job-payload-redactor.ts     — Case-sensitivity bug fix: REDACTED_KEYS lowercased, key.toLowerCase() on lookup
apps/api/src/jobs/job-payload-redactor.spec.ts — 10 case-insensitive redaction tests added
```

### Changes summary

| Area             | Change                                                                                        |
| ---------------- | --------------------------------------------------------------------------------------------- |
| CORS             | `getCorsConfig()` reads `CORS_ALLOWED_ORIGINS`, strips wildcard `*`, enables strict allowlist |
| Security headers | `SecurityHeadersMiddleware` sets 7 headers, removes `X-Powered-By`                            |
| Body size limits | JSON and URL-encoded bodies capped at `1mb` via `useBodyParser`                               |
| Job redactor     | Case-sensitivity bug fixed: mixed-case keys (`Password`, `RefreshToken`, etc.) now redacted   |
| Regression tests | `security.regression.spec.ts` — 40+ tests for all hardening invariants                        |

### Verification commands

Run all commands from the repo root.

**1. API-only checks**

```bash
pnpm --filter @dragon/api lint
pnpm --filter @dragon/api typecheck
pnpm --filter @dragon/api test
pnpm --filter @dragon/api build
```

**2. Workspace-wide checks**

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm format:check
```

**3. Targeted test suites**

```bash
# New spec files only
pnpm --filter @dragon/api test -- --testPathPattern="security-headers|cors.config|job-payload-redactor|security.regression"
```

### Expected results

| Command             | Expected                        |
| ------------------- | ------------------------------- |
| `pnpm lint`         | 0 errors, 0 warnings            |
| `pnpm typecheck`    | No type errors                  |
| `pnpm test`         | 1390/1390 pass (125 suites)     |
| `pnpm build`        | All packages build successfully |
| `pnpm format:check` | All files match Prettier style  |

### Security invariants verified by tests

| Invariant                             | Test file                                                     |
| ------------------------------------- | ------------------------------------------------------------- |
| CORS: no wildcard with credentials    | `cors.config.spec.ts`, `security.regression.spec.ts`          |
| Security headers present              | `security-headers.middleware.spec.ts`                         |
| Job redactor: case-insensitive        | `job-payload-redactor.spec.ts`, `security.regression.spec.ts` |
| Audit redactor: case-insensitive      | `security.regression.spec.ts`                                 |
| Analytics redactor: case-insensitive  | `security.regression.spec.ts`                                 |
| OTP schema: codeHash only, no rawCode | `security.regression.spec.ts`                                 |
| Pagination caps enforced              | `security.regression.spec.ts`                                 |
| ObjectId validation: RBAC and search  | `security.regression.spec.ts`                                 |
| PermissionGuard: deny by default      | `security.regression.spec.ts`                                 |
| Public content: published filter only | `security.regression.spec.ts`                                 |
| Backup: no credential logging         | `security.regression.spec.ts`                                 |
| Health: no secret exposure            | `security.regression.spec.ts`                                 |
| No localStorage token storage         | `security.regression.spec.ts`                                 |
| No readable access token cookie       | `security.regression.spec.ts`                                 |
