# Slice 0.4 Verification Checklist

## Commands

```bash
pnpm install
pnpm --filter @dragon/api lint
pnpm --filter @dragon/api typecheck
pnpm --filter @dragon/api test
pnpm --filter @dragon/api build
pnpm --filter @dragon/web lint
pnpm --filter @dragon/web typecheck
pnpm --filter @dragon/web test
pnpm --filter @dragon/web build
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm format:check
```

## Backend closeout checks

- [x] ProfileModule can resolve AccessTokenGuard dependencies.
- [x] Phone verification calls profile lifecycle after activation.
- [x] Profile lifecycle is idempotent.
- [x] Generated profile username does not use phone/email.
- [x] Real profile endpoint tests exist for public profile routes.
- [x] Real profile endpoint tests exist for account profile routes.
- [x] Invalid avatarMediaId returns 400 and cannot cause a 500.

## Frontend closeout checks

- [x] apps/web depends on `@dragon/sdk`.
- [x] apps/web uses SDK profile methods through one thin helper.
- [x] apps/web does not duplicate profile endpoint paths outside SDK.
- [x] apps/web lint covers profile TypeScript files.
- [x] apps/web test runs profile tests.
- [x] `useAuthToken` does not use readable cookie access-token storage.
- [x] ProfileEditForm does not expose manual avatarMediaId editing.

## Routes

- [x] `GET /api/v1/u/:username`
- [x] `GET /api/v1/me/profile`
- [x] `PATCH /api/v1/me/profile`
- [x] `/u/:username`
- [x] `/account`
- [x] `/account/profile`
- [x] `/account/security`

## Public profile states

- [x] loading
- [x] public
- [x] private
- [x] not found
- [x] error

## Privacy and SEO

- [x] public active profile is indexable
- [x] private state is noindex
- [x] not-found state is noindex
- [x] error state is noindex
- [x] private state does not render hidden profile fields
- [x] profile responses do not expose phone/email/passwordHash/token/session fields

## Account profile

- [x] auth middleware protects `/account/profile`
- [x] backend guard protects `GET /api/v1/me/profile`
- [x] backend guard protects `PATCH /api/v1/me/profile`
- [x] form validates username
- [x] form validates displayName
- [x] form validates bio length
- [x] form validates visibility
- [x] save success/error states exist

## Scope exclusions

- [x] no avatar upload
- [x] no media picker
- [x] no manual media ID input UX
- [x] no follow/feed/wall UI
- [x] no customization/cosmetic UI
- [x] no Admin profile UI
- [x] no full security center
