# @dragon/sdk

This package contains the framework-agnostic Dragon SDK foundation.

Slice 0.1 introduced only a generic API client wrapper. Slice 0.2 may export safe shared Auth request/response types, but it still must not contain endpoint-specific clients.

This package must not contain Nuxt/Vue-specific logic, token storage, endpoint constants, or product API methods. Auth API methods will be added only in later slices when explicitly requested.

Slice 0.2 also exposes type-only auth contracts such as `RefreshRequest` and `TokenResponse`; no refresh client method or token storage is implemented here.

Slice 0.2 also exposes type-only logout response contracts. No logout or logout-all SDK methods are implemented.
