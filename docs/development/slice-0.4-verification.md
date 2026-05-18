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

- [ ] ProfileModule can resolve AccessTokenGuard dependencies.
- [ ] Phone verification calls profile lifecycle after activation.
- [ ] Profile lifecycle is idempotent.
- [ ] Generated profile username does not use phone/email.
- [ ] Real profile endpoint tests exist for public profile routes.
- [ ] Real profile endpoint tests exist for account profile routes.
- [ ] Invalid avatarMediaId returns 400 and cannot cause a 500.

## Frontend closeout checks

- [ ] apps/web depends on `@dragon/sdk`.
- [ ] apps/web uses SDK profile methods through one thin helper.
- [ ] apps/web does not duplicate profile endpoint paths outside SDK.
- [ ] apps/web lint covers profile TypeScript files.
- [ ] apps/web test runs profile tests.
- [ ] `useAuthToken` does not use readable cookie access-token storage.
- [ ] ProfileEditForm does not expose manual avatarMediaId editing.

## Routes

- [ ] `GET /api/v1/u/:username`
- [ ] `GET /api/v1/me/profile`
- [ ] `PATCH /api/v1/me/profile`
- [ ] `/u/:username`
- [ ] `/account`
- [ ] `/account/profile`
- [ ] `/account/security`

## Public profile states

- [ ] loading
- [ ] public
- [ ] private
- [ ] not found
- [ ] error

## Privacy and SEO

- [ ] public active profile is indexable
- [ ] private state is noindex
- [ ] not-found state is noindex
- [ ] error state is noindex
- [ ] private state does not render hidden profile fields
- [ ] profile responses do not expose phone/email/passwordHash/token/session fields

## Account profile

- [ ] auth middleware protects `/account/profile`
- [ ] backend guard protects `GET /api/v1/me/profile`
- [ ] backend guard protects `PATCH /api/v1/me/profile`
- [ ] form validates username
- [ ] form validates displayName
- [ ] form validates bio length
- [ ] form validates visibility
- [ ] save success/error states exist

## Scope exclusions

- [ ] no avatar upload
- [ ] no media picker
- [ ] no manual media ID input UX
- [ ] no follow/feed/wall UI
- [ ] no customization/cosmetic UI
- [ ] no Admin profile UI
- [ ] no full security center
