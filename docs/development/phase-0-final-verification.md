# Phase 0 Final Verification — Release Gate

**Phase 0 is platform foundation only.**
**Phase 1 must not start until this document has been completed and signed off.**
**No production deployment is performed by this task.**
**No real secrets are committed to the repository.**
**No restore endpoint or restore UI exists — restore is a manual runbook procedure only.**

---

## 1. Phase 0 scope summary

Dragon Ecosystem Phase 0 delivers the full backend foundation for a modular content-and-community platform. It is not a shipped product — it is the secure, tested, documented platform on which Phase 1 business modules will be built.

What Phase 0 is:

- Phone-first auth with OTP, password reset, and session management
- Flat RBAC with ABAC-ready foundation
- User profiles (own and public)
- Content engine (posts by type, pages, categories, tags) with full lifecycle
- Media library with Arvan Object Storage and image variants
- Audit log, BullMQ jobs, notification logs
- Basic search (MongoSearchAdapter) and lightweight analytics
- Health probes, backup log, manual backup via mongodump
- Docker Compose production stack with nginx reverse proxy
- Security hardening (CORS, security headers, body limits, case-insensitive redactors)
- Smoke test suite (80 tests, no real services required)
- Complete internal developer documentation

What Phase 0 is not:

- A feature-complete product
- A deployed production system (deployment is a manual operator step)
- Phase 1 business modules (Tournament, Shop, Academy, Streaming, Boardgame)
- OAuth, passkeys, or full 2FA
- Full ABAC engine
- Elasticsearch or advanced search
- Backup encryption (required before production, not yet implemented)

---

## 2. Completed slices

| Slice                                             | Status                  |
| ------------------------------------------------- | ----------------------- |
| 0.1 — Monorepo / Infrastructure                   | Closed / Final Approved |
| 0.2 — Auth / OTP / Session                        | Closed / Final Approved |
| 0.3 — RBAC / ABAC-ready Authorization             | Closed / Final Approved |
| 0.4 — User Profile Base                           | Closed / Final Approved |
| 0.5 — Admin Platform Core                         | Closed / Final Approved |
| 0.6 — Content Engine + TipTap                     | Closed / Final Approved |
| 0.7 — Media Library + Arvan Object Storage        | Closed / Final Approved |
| 0.8 — Audit / Events / Jobs / Notifications       | Closed / Final Approved |
| 0.9 — Search / Analytics                          | Closed / Final Approved |
| 0.10 — Deployment / Monitoring / Backup           | Closed / Final Approved |
| 0.11.1 — Security Hardening                       | Done                    |
| 0.11.2 — Risk-based Testing and Smoke Suite       | Done                    |
| 0.11.3 — API Docs and Developer Documentation     | Done                    |
| 0.11.4 — Final Verification and Release Checklist | This document           |

---

## 3. Required command matrix

Run every command in this matrix before approving Phase 0. Record results in Section 14 (Final approval checklist). A single failure blocks approval.

### Package-level verification

```bash
pnpm --filter @dragon/api lint
pnpm --filter @dragon/api typecheck
pnpm --filter @dragon/api test
pnpm --filter @dragon/api build

pnpm --filter @dragon/worker lint
pnpm --filter @dragon/worker typecheck
pnpm --filter @dragon/worker test
pnpm --filter @dragon/worker build

pnpm --filter @dragon/admin lint
pnpm --filter @dragon/admin typecheck
pnpm --filter @dragon/admin test
pnpm --filter @dragon/admin build

pnpm --filter @dragon/web lint
pnpm --filter @dragon/web typecheck
pnpm --filter @dragon/web test
pnpm --filter @dragon/web build

pnpm --filter @dragon/sdk lint
pnpm --filter @dragon/sdk typecheck
pnpm --filter @dragon/sdk test
pnpm --filter @dragon/sdk build

pnpm --filter @dragon/types lint
pnpm --filter @dragon/types typecheck
pnpm --filter @dragon/types build
```

> **Note:** `@dragon/types` has no runtime test suite — lint/typecheck/build are the applicable checks. All other packages (`api`, `worker`, `admin`, `web`, `sdk`) have meaningful test suites that must pass.

### Repository-level verification

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm format:check
```

Expected: all commands exit 0. `pnpm test` → 1390 tests pass across 125 suites.

### Smoke test verification

```bash
pnpm smoke
```

Expected: 8 suites, 80 tests, 0 failures. Runs with `--runInBand` to prevent port-binding race conditions.

---

## 4. Package-level verification record

| Package          | lint | typecheck | test | build |
| ---------------- | ---- | --------- | ---- | ----- |
| `@dragon/api`    |      |           |      |       |
| `@dragon/worker` |      |           |      |       |
| `@dragon/admin`  |      |           |      |       |
| `@dragon/web`    |      |           |      |       |
| `@dragon/sdk`    |      |           |      |       |
| `@dragon/types`  |      |           | n/a  |       |

---

## 5. Repository-level verification record

| Command             | Result |
| ------------------- | ------ |
| `pnpm lint`         |        |
| `pnpm typecheck`    |        |
| `pnpm test`         |        |
| `pnpm build`        |        |
| `pnpm format:check` |        |
| `pnpm smoke`        |        |

---

## 6. Docker / infra verification

Run these commands to validate Docker Compose configuration and build all production images. These require Docker Engine to be running.

### Compose config validation (no Docker daemon required for YAML parsing)

```bash
docker compose -f infra/docker/docker-compose.local.yml config
docker compose -f infra/docker/docker-compose.prod.yml --env-file infra/docker/.env.production.example config
```

Expected: both commands print the rendered config with no errors.

### Image builds (requires Docker daemon)

```bash
docker build -f apps/api/Dockerfile -t dragon-api:test .
docker build -f apps/worker/Dockerfile -t dragon-worker:test .
docker build -f apps/web/Dockerfile -t dragon-web:test .
docker build -f apps/admin/Dockerfile -t dragon-admin:test .
```

Expected: all images build successfully with no errors. Record image IDs.

**If Docker is unavailable in the current environment:**

- Record the exact error.
- Verify YAML config manually (compose config command above).
- Re-run image builds in a Docker-enabled environment before final approval.
- Image builds are required before declaring Phase 0 production-ready.

| Check                      | Result |
| -------------------------- | ------ |
| Local compose config       |        |
| Prod compose config        |        |
| `dragon-api:test` build    |        |
| `dragon-worker:test` build |        |
| `dragon-web:test` build    |        |
| `dragon-admin:test` build  |        |

---

## 7. Smoke test verification

Run the automated smoke suite (no real services required):

```bash
pnpm smoke
```

Expected: 8 suites, 80 tests, 0 failures.

Then complete the post-deploy manual smoke checklist: [smoke-test-checklist.md](../operations/smoke-test-checklist.md)

| Check                  | Result |
| ---------------------- | ------ |
| `pnpm smoke`           |        |
| Manual smoke checklist |        |

---

## 8. Security verification

Complete the Phase 0 security checklist: [phase-0-security-checklist.md](../security/phase-0-security-checklist.md)

Security invariants that must hold before Phase 1:

- [ ] Refresh token is HttpOnly, Secure, SameSite=Strict — not readable by JavaScript
- [ ] Access token is never stored in localStorage
- [ ] Access token never appears in any API response body except `TokenResponseDto`
- [ ] OTP raw codes are never stored, logged, or returned in any response
- [ ] Generic auth error messages (no enumeration)
- [ ] All admin routes require authentication and named permission
- [ ] `PermissionGuard` denies by default — routes without `@RequirePermission()` are not admin-accessible
- [ ] Draft, archived, and soft-deleted content is never returned on public routes
- [ ] Private media assets are served only via signed URLs
- [ ] MIME type and extension validation is enforced before file storage
- [ ] Upload size limits are enforced (1 MB JSON body, 50 MB media upload)
- [ ] Security headers are present on all API responses (X-Content-Type-Options, X-Frame-Options, HSTS, CSP, Referrer-Policy, Permissions-Policy)
- [ ] CORS allows only the listed origins — wildcard `*` is never used with `credentials: true`
- [ ] Admin is served with `X-Robots-Tag: noindex,nofollow,noarchive`
- [ ] Audit log entries are redacted (no OTP, passwords, tokens, phones)
- [ ] Job payload is redacted (case-insensitive)
- [ ] Notification logs expose only masked recipient (last digits only)
- [ ] Backup responses never contain connection strings, passwords, or bucket credentials
- [ ] Health responses never contain connection strings or credentials
- [ ] No `.env.production` file is committed to the repository
- [ ] No restore endpoint exists (`GET /admin/v1/system/backups/restore` → 404)

---

## 9. Manual QA verification

Complete the manual QA checklist: [manual-qa-checklist.md](../operations/manual-qa-checklist.md)

Key QA gates that must pass before Phase 1:

- [ ] Public web loads and content routes return published content
- [ ] Draft and archived content returns 404 on public routes
- [ ] Admin login works (OTP delivered, session established)
- [ ] Forbidden route returns 403 for insufficient permission
- [ ] Private profile returns 404 on public profile route
- [ ] Media upload rejects invalid file (wrong MIME type or extension)
- [ ] No restore button or restore UI exists anywhere in the admin
- [ ] No Phase 1 placeholder nav items, "coming soon" pages, or fake metrics
- [ ] No Tournament, Shop, Academy, Streaming, or Boardgame modules are visible

---

## 10. Deployment readiness verification

Complete before the first production deployment:

- [ ] All environment variables in `infra/docker/.env.production.example` are filled in `.env.production`
- [ ] `AUTH_JWT_SECRET` is at least 64 random characters
- [ ] No `CHANGE_ME` placeholder remains in `.env.production`
- [ ] `.env.production` is not committed to git (`git check-ignore infra/docker/.env.production`)
- [ ] TLS certificates provisioned for all three domains
- [ ] Nginx config validated (`nginx -t` after certs are in place)
- [ ] RBAC seed has been run once: `docker compose exec api node dist/rbac/seeds/run-rbac-seed.js`
- [ ] At least one `super_admin` user exists
- [ ] Arvan Object Storage bucket is configured and accessible

Full pre-launch checklist: [production-readiness-checklist.md](../operations/production-readiness-checklist.md)

---

## 11. Backup / restore verification

- [ ] Object Storage is configured (`STORAGE_PROVIDER=arvan`)
- [ ] A test backup has been triggered: `POST /admin/v1/system/backups/run`
- [ ] The backup appears in `GET /admin/v1/system/backups/latest` with `status: "completed"`
- [ ] The backup artifact is visible in the Arvan Object Storage console
- [ ] Restore runbook has been reviewed: [restore-runbook.md](../operations/restore-runbook.md)
- [ ] **No restore endpoint exists.** Confirmed: `GET /admin/v1/system/backups/restore` returns 404.
- [ ] **No restore UI exists.** Confirmed: no restore button in admin backup page.
- [ ] **Backup encryption is NOT implemented in Phase 0.** Risk accepted or GPG encryption implemented before enabling production backups.
- [ ] Restore verification checklist has been reviewed: [restore-verification-checklist.md](../operations/restore-verification-checklist.md)

Backup runbook: [backup-runbook.md](../operations/backup-runbook.md)

---

## 12. Known limitations

See [phase-0-known-limitations.md](phase-0-known-limitations.md) for the complete list. Key accepted limitations before Phase 1:

- Single VPS deployment — no redundancy or auto-scaling
- MongoDB and Redis run in Docker containers on the same VPS — no managed DB service
- Basic MongoDB text search — no Elasticsearch, no fuzzy/Persian search
- Lightweight analytics aggregations — no time-series DB, no BI dashboards
- Manual restore only — no restore endpoint, no restore UI, no automated backup scheduling
- No monitoring stack (Prometheus/Grafana/Loki) — health endpoints and logs only
- Backup archives are unencrypted (GPG encryption required before production)
- No OAuth, passkeys, or 2FA (phone/OTP only)
- No full ABAC engine (foundation scaffolded)
- No video processing, streaming, or advanced media
- No Phase 1 business modules

---

## 13. Out-of-scope / later list

See [phase-0-out-of-scope.md](phase-0-out-of-scope.md) for the complete list.

---

## 14. Final approval checklist

All items must be checked before Phase 0 is declared complete and Phase 1 can begin.

### Automated checks

- [ ] `pnpm lint` — 0 errors, 0 warnings
- [ ] `pnpm typecheck` — 0 errors
- [ ] `pnpm test` — all packages pass (api: 125 suites, worker: 5 suites, admin: 13 suites, web: 4 suites, sdk: 8 suites)
- [ ] `pnpm build` — all packages build
- [ ] `pnpm format:check` — all files pass
- [ ] `pnpm smoke` — 8 suites, 80 tests, 0 failures
- [ ] Docker compose config validated (local and prod)
- [ ] Docker image builds pass (all 4 services)

### Manual checks

- [ ] Manual QA checklist completed
- [ ] Manual smoke checklist completed
- [ ] Phase 0 security checklist completed
- [ ] Production readiness checklist reviewed (pre-deploy)
- [ ] Backup/restore verification completed
- [ ] Known limitations reviewed and accepted
- [ ] Out-of-scope list reviewed

### Documentation checks

- [ ] `docs/api/route-index.md` reviewed against actual controllers
- [ ] `docs/api/permissions.md` reviewed against RBAC registry
- [ ] No stale "not implemented" claims for completed Phase 0 features
- [ ] No restore endpoint or restore UI documented as implemented
- [ ] No Phase 1 features documented as implemented

### Sign-off

| Field           | Value       |
| --------------- | ----------- |
| Verified by     |             |
| Reviewed by     |             |
| Date            |             |
| Overall result  | PASS / FAIL |
| Blocking issues |             |
| Notes           |             |

---

## 15. What must be reviewed before Phase 1 starts

1. **Security review:** Review the Phase 0 security checklist. Resolve any open items, especially backup encryption.
2. **Architecture review:** Review [architecture/README.md](../architecture/README.md) and confirm Phase 1 modules do not conflict with Phase 0 boundaries.
3. **Database schema review:** Review MongoDB schemas for extensibility. Phase 1 modules must not break existing collections.
4. **API versioning:** Confirm `/api/v1/` and `/admin/v1/` versioning strategy is acceptable for Phase 1 additions.
5. **ABAC evaluation:** Decide whether to implement the ABAC policy engine in Phase 1 or continue with flat RBAC.
6. **Search engine:** Decide whether to replace MongoSearchAdapter with Meilisearch or Elasticsearch in Phase 1.
7. **Monitoring:** Plan the Prometheus/Grafana/Loki monitoring stack for Phase 1.
8. **Backup encryption:** Implement GPG or cloud-native encryption before enabling production backups.
9. **CI/CD pipeline:** Review whether a GitHub Actions (or equivalent) pipeline should be established for Phase 1.
10. **Node.js version:** The engine constraint says `>=20 <21` but Node 24 is in use locally. Resolve before Phase 1.
