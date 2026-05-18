# Slice 0.4 Verification Checklist

## Commands

```bash
pnpm install
pnpm --filter @dragon/web lint
pnpm --filter @dragon/web typecheck
pnpm --filter @dragon/web test
pnpm --filter @dragon/web build
pnpm --filter @dragon/types lint
pnpm --filter @dragon/types typecheck
pnpm --filter @dragon/types test
pnpm --filter @dragon/types build
pnpm --filter @dragon/sdk lint
pnpm --filter @dragon/sdk typecheck
pnpm --filter @dragon/sdk test
pnpm --filter @dragon/sdk build
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm format:check
```

## Routes

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

## Account profile

- [ ] auth middleware protects `/account/profile`
- [ ] form validates username
- [ ] form validates displayName
- [ ] form validates bio length
- [ ] form validates visibility
- [ ] save success/error states exist

## Scope exclusions

- [ ] no avatar upload
- [ ] no media picker
- [ ] no follow/feed/wall UI
- [ ] no customization/cosmetic UI
- [ ] no Admin profile UI
- [ ] no full security center
