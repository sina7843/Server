# Audit Security Checklist

## Secret Redaction

- [ ] Passwords and password hashes (`password`, `passwordHash`) are never logged.
- [ ] Raw OTPs, OTP codes, and code hashes (`rawOtp`, `otp`, `code`, `codeHash`) are never logged.
- [ ] Session tokens and JTIs (`refreshToken`, `refreshTokenHash`, `accessToken`, `accessTokenJti`) are never logged.
- [ ] Reset tokens (`resetToken`) are never logged.
- [ ] Generic secret fields (`secret`, `secrets`, `clientSecret`) are never logged.
- [ ] Provider credentials (`providerSecret`, `providerCredentials`) are never logged.
- [ ] HTTP authorization headers and cookies (`authorization`, `cookie`, `cookies`) are never logged.
- [ ] The AuditRedactor applies recursively: secrets inside nested objects and arrays are also redacted.
- [ ] The AuditRedactor does not mutate its input object.
- [ ] Headers are matched case-insensitively for `authorization` and `cookie`.

## Write Safety

- [ ] AuditService.log() wraps the repository call in a try/catch.
- [ ] Write failures are logged structurally (action + actorType + error message) at the `error` level.
- [ ] Write failures are never re-thrown and never propagate to callers.
- [ ] All integration hooks use `void this.auditService?.log(...)` (fire-and-forget, optional chaining).
- [ ] Existing tests that do not inject AuditService compile and pass without modification (`@Optional()` pattern).

## Append-Only Guarantees

- [ ] AuditLogRepository exposes no `update`, `delete`, patch, or bulk-mutation methods.
- [ ] The schema uses `timestamps: { createdAt: true, updatedAt: false }` — no `updatedAt` field exists.
- [ ] No migration, seed, or fixture writes directly to `audit_logs` with mutating operations.

## Data Sensitivity in Before/After Snapshots

- [ ] `before` and `after` snapshots for auth operations do not include credentials.
- [ ] `before` and `after` snapshots for profile operations do not include contact info beyond what is strictly necessary.
- [ ] `before` and `after` snapshots for RBAC operations include only structural fields (key, name, roleId, permissionId).
- [ ] `metadata` fields do not contain user-entered free-form data that could contain secrets.

## Actor Attribution

- [ ] User-initiated actions include `actorId` (user's MongoDB ObjectId as string).
- [ ] Admin-initiated actions include `actorType: 'admin'`. Actor ID enrichment planned for Task 0.8.2.
- [ ] System and job actions use `actorType: 'system'` or `actorType: 'job'` with no actorId.

## Severity Labelling

- [ ] Destructive operations (delete, deactivate, remove) use `severity: 'warning'`.
- [ ] Normal read/write operations use `severity: 'info'`.
- [ ] Security anomalies (login failures) use `severity: 'warning'`.
- [ ] Critical policy violations are escalated to `severity: 'critical'` when applicable.

## Admin Audit Read APIs (Slice 0.8.2)

- [ ] Both admin audit endpoints (`GET /admin/v1/audit-logs`, `GET /admin/v1/audit-logs/:id`) require `AccessTokenGuard`.
- [ ] Both endpoints require `PermissionGuard` with `audit.log.read`.
- [ ] No `POST`, `PATCH`, or `DELETE` admin audit endpoint exists.
- [ ] `audit.log.read` is centralized in the permission registry — no raw string scattered in code.
- [ ] Audit list response uses `AuditLogListItemDto` — does not include `before`, `after`, or `metadata`.
- [ ] Audit detail response exposes `before`, `after`, `metadata` only as already redacted at write time.
- [ ] Admin frontend renders JSON payloads as escaped text — no raw HTML rendering from audit metadata.
- [ ] Admin frontend `/audit` and `/audit/:id` have no edit, delete, or export controls.
- [ ] Audit nav item is hidden unless the user has `audit.log.read`.
- [ ] SDK `AdminAuditClient` has no mutation methods (`create`, `update`, `delete`, `export`).
