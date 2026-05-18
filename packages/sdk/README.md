# @dragon/sdk

SDK helpers for Dragon Ecosystem.

Profile support is provided through the framework-agnostic API client:

- `createApiClient({ baseUrl, fetch, headers })`
- `createProfilesClient(apiClient)`
- `getPublicProfile(username)`
- `getMyProfile()`
- `updateMyProfile(input)`

Profile endpoint paths live in the SDK. Frontend apps should not duplicate those
paths in page components or feature helpers.

The SDK does not add token storage, does not include Nuxt composables, and does
not hardcode environment-specific base URLs.
