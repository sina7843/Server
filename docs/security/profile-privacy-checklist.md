# Profile Privacy Checklist — Slice 0.4

## Public profile

- [ ] Public route exists at `/u/:username`.
- [ ] Public response contains only safe profile fields.
- [ ] Private profile state does not render display name, bio, or avatar data.
- [ ] Pending verification users are not public.
- [ ] Suspended users are not public.
- [ ] Banned/deleted users resolve to safe not-found-like state.

## Lifecycle

- [ ] Successful phone verification ensures a profile for the active verified user.
- [ ] Lifecycle creation is idempotent.
- [ ] Lifecycle does not create profiles for pending/suspended/banned/deleted users.
- [ ] Generated default username does not use phone or email.

## Auth token handling

- [ ] Slice 0.4 does not store access tokens in readable cookies.
- [ ] `useAuthToken` is memory-only placeholder state.
- [ ] No login UI or refresh flow is added in this profile slice.

## SDK usage

- [ ] apps/web uses `@dragon/sdk` for profile API calls.
- [ ] profile API paths are not duplicated in frontend pages.
- [ ] frontend profile tests are runnable through the web package test script.

## Avatar and media

- [ ] Avatar UI is display/fallback only.
- [ ] Manual avatarMediaId editing is not exposed.
- [ ] Backend rejects invalid avatarMediaId with 400.
- [ ] No upload input exists.
- [ ] No media picker exists.

## Auth dependency safety

- [ ] ProfileModule imports AuthModule for `AccessTokenGuard` dependencies.
- [ ] AuthModule imports ProfileModule with `forwardRef`.
- [ ] No auth bypass exists for profile account routes.

## SEO and indexing

- [ ] Public active profile can be indexable.
- [ ] Private state is `noindex`.
- [ ] Not-found state is `noindex`.
- [ ] Error state is `noindex`.
- [ ] Hidden private data is not used in page title or meta description.

## Account profile

- [ ] `/account/profile` requires authentication.
- [ ] Update payload excludes phone, email, password, tokens, roles, and status.
- [ ] Avatar media field is reference-only and backend-safe.

## Out of scope

- [ ] No Admin profile UI.
- [ ] No avatar upload.
- [ ] No media picker.
- [ ] No follow/feed/wall.
- [ ] No profile customization/cosmetic UI.
