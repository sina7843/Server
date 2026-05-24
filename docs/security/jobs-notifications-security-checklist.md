# Jobs and Notifications Security Checklist

## Job Payload Safety

- [ ] `JobPayloadRedactor` redacts all secret keys before storing in `payloadSummary`.
- [ ] Redacted keys include: `password`, `passwordHash`, `rawOtp`, `otp`, `code`, `codeHash`, `refreshToken`, `refreshTokenHash`, `accessToken`, `accessTokenJti`, `resetToken`, `secret`, `secrets`, `clientSecret`, `providerSecret`, `providerCredentials`, `authorization`, `cookie`, `cookies`.
- [ ] Redaction is recursive (nested objects and arrays).
- [ ] `JobPayloadRedactor` does not mutate its input.
- [ ] No raw OTP is ever stored in `payloadSummary`.
- [ ] No password or password hash is ever stored in `payloadSummary`.
- [ ] No access or refresh tokens are ever stored in `payloadSummary`.
- [ ] No large binary or file buffer data is stored in `payloadSummary`.

## Retry Safety

- [ ] Retry endpoint requires `system.job.retry` permission.
- [ ] Retry is rejected if `job.status !== 'failed'`.
- [ ] Retry is rejected if `job.attempts >= job.maxAttempts` (no infinite retry).
- [ ] BullMQ retry failure is logged but does not crash the retry endpoint.
- [ ] Retry permission (`system.job.retry`) is centralized in `permission-keys.ts` — no raw string in controller.

## Admin Job APIs

- [ ] Both GET endpoints require `system.job.read` permission.
- [ ] POST retry endpoint requires `system.job.retry` permission.
- [ ] Both GET and POST endpoints require `AccessTokenGuard`.
- [ ] No `DELETE`, `PATCH`, or bulk-mutation job endpoint exists.
- [ ] `payloadSummary` returned in detail response has already been redacted at write time — no re-hydration.
- [ ] List response (`JobLogListItemDto`) does not include `payloadSummary`.
- [ ] Missing auth returns 401 Unauthorized.
- [ ] Missing permission returns 403 Forbidden.

## Worker Security

- [ ] Worker connects to Redis with configurable credentials — no hardcoded secrets.
- [ ] Worker connects to MongoDB with configurable URI — no hardcoded credentials.
- [ ] Worker does not log full job payloads (only job name and error messages).
- [ ] Worker processors do not re-emit sensitive data in error messages.
- [ ] MongoDB connection is optional in the worker — worker starts safely without it.

## Redis / BullMQ Config

- [ ] `REDIS_PASSWORD` is never committed to source control.
- [ ] `.env.example` contains only placeholder/empty values for credentials.
- [ ] `BULLMQ_DEFAULT_ATTEMPTS` is bounded (default: 3, must be positive integer).
- [ ] No unlimited retry is possible via config (max configurable, not infinite).

## Event Payload Safety

- [ ] `DomainEvent.payload` must not contain passwords, OTPs, tokens, cookies, or provider secrets.
- [ ] Event names follow `domain.entity.action` convention — no sensitive data in names.
- [ ] Internal event bus only — no external broker in Slice 0.8.3.

## Scope Limits

- [ ] No Kafka or RabbitMQ integration exists.
- [ ] No full event sourcing exists.
- [ ] No saga engine exists.
- [ ] No real search or analytics job implementation exists.
- [ ] No backup jobs exist.
- [ ] No admin jobs frontend UI exists in Slice 0.8.3.
- [ ] SMS queued sending is not integrated in Slice 0.8.3 (Task 0.8.4).
- [ ] No notification center or campaign system exists.
- [ ] No realtime/WebSocket job dashboard exists.
- [ ] SDK `AdminJobsClient` has no cancel, delete, export, or realtime methods.
