# Profile Privacy Checklist — Slice 0.4

## Public profile

- [x] Public route exists at `/u/:username`.
- [x] Public response contains only safe profile fields.
- [x] Private profile state does not render display name, bio, or avatar data.
- [x] Pending verification users are not public.
- [x] Suspended users are not public.
- [x] Banned/deleted users resolve to safe not-found-like state.

## Lifecycle

- [x] Successful phone verification ensures a profile for the active verified user.
- [x] Lifecycle creation is idempotent.
- [x] Lifecycle does not create profiles for pending/suspended/banned/deleted users.
- [x] Generated default username does not use phone or email.

## Auth token handling

- [x] Slice 0.4 does not store access tokens in readable cookies.
- [x] `useAuthToken` is memory-only placeholder state.
- [x] No login UI or refresh flow is added in this profile slice.

## SDK usage

- [x] apps/web uses `@dragon/sdk` for profile API calls.
- [x] profile API paths are not duplicated in frontend pages.
- [x] frontend profile tests are runnable through the web package test script.

## Avatar and media

- [x] Avatar UI is display/fallback only.
- [x] Manual avatarMediaId editing is not exposed.
- [x] Backend rejects invalid avatarMediaId with 400.
- [x] No upload input exists.
- [x] No media picker exists.

## Auth dependency safety

- [x] ProfileModule imports AuthModule for `AccessTokenGuard` dependencies.
- [x] AuthModule imports ProfileModule with `forwardRef`.
- [x] No auth bypass exists for profile account routes.

## SEO and indexing

- [x] Public active profile can be indexable.
- [x] Private state is `noindex`.
- [x] Not-found state is `noindex`.
- [x] Error state is `noindex`.
- [x] Hidden private data is not used in page title or meta description.

## Account profile

- [x] `/account/profile` requires authentication.
- [x] Update payload excludes phone, email, password, tokens, roles, and status.
- [x] Avatar media field is reference-only and backend-safe.

## Out of scope

- [x] No Admin profile UI.
- [x] No avatar upload.
- [x] No media picker.
- [x] No follow/feed/wall.
- [x] No profile customization/cosmetic UI.
