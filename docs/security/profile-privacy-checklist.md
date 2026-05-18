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
- [ ] Avatar media field is reference-only.
- [ ] No upload input exists.

## Out of scope

- [ ] No Admin profile UI.
- [ ] No avatar upload.
- [ ] No media picker.
- [ ] No follow/feed/wall.
- [ ] No profile customization/cosmetic UI.
