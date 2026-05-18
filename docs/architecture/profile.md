# Profile Architecture — Slice 0.4

Slice 0.4 implements the base user profile identity surface.

Implemented:

- `UserProfile` persistence foundation
- username policy and reserved username protection
- profile lifecycle foundation for active verified users
- public profile API
- authenticated account profile API
- minimal frontend routes:
  - `/u/:username`
  - `/account`
  - `/account/profile`
  - `/account/security`
- safe public/private/not-found profile states
- safe DTO mapping
- thin SDK/profile API helper

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
