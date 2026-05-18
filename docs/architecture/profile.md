# Profile Architecture — Slice 0.4

Slice 0.4 implements the base user profile identity surface.

Implemented:

- `UserProfile` persistence foundation
- username policy and reserved username protection
- profile lifecycle foundation for active verified users
- phone verification lifecycle alignment: successful verification ensures a profile for the newly active user
- public profile API
- authenticated account profile API
- minimal frontend routes:
  - `/u/:username`
  - `/account`
  - `/account/profile`
  - `/account/security`
- safe public/private/not-found profile states
- safe DTO mapping
- SDK-owned profile endpoint methods used by apps/web

Frontend integration:

- apps/web uses `@dragon/sdk` profile methods through a thin Nuxt helper.
- profile endpoint paths live in `packages/sdk`.
- Slice 0.4 does not store access tokens in readable cookies.
- `useAuthToken` is an in-memory placeholder for future Auth UI integration.
- refresh-token HttpOnly cookie behavior remains an Auth concern and is not implemented in this profile slice.

Avatar and media behavior:

- avatars are display/fallback only in the frontend.
- manual avatar media ID editing is not exposed.
- backend validates `avatarMediaId` as a valid ObjectId string or null if supplied.
- avatar upload, Media Library, and media picker are not implemented.

Runtime integration:

- `ProfileModule` imports `AuthModule` with `forwardRef` so `MeProfileController` can use `AccessTokenGuard`.
- `AuthModule` imports `ProfileModule` with `forwardRef` so `AuthService` can call `UserProfileLifecycleService` after phone verification.
- Profile creation remains idempotent and status-aware.
- Generated usernames use `user-{shortUserId}` style candidates and do not use phone/email.

Privacy behavior:

- public active profiles may be indexable
- private profile state uses `noindex`
- not-found profile state uses `noindex`
- generic error state uses `noindex`
- private/not-found states must not render hidden profile fields

Not implemented:

- avatar upload
- Media Library
- social graph, follow, feed, or wall
- profile customization/cosmetic marketplace
- admin profile management
- search indexing
- analytics
