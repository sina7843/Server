# @dragon/sdk

SDK helpers for Dragon Ecosystem.

Profile support is intentionally thin:

- `createProfilesClient(client)`
- `getPublicProfile(username)`
- `getMyProfile()`
- `updateMyProfile(input)`

The SDK does not add token storage, does not include Nuxt composables, and does
not hardcode environment-specific base URLs.
