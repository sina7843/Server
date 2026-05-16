# Dragon API Session Foundation

This directory contains the Slice 0.2 Session persistence foundation for later Auth flows.

It includes only:

- the Session Mongoose schema
- repository methods for safe session persistence operations
- service helpers for session state checks
- unit tests that do not require a real MongoDB connection

This directory does not implement login, refresh, logout, JWT issuing, refresh token rotation, Auth guards, session endpoints, device management UI, RBAC, Profile, Admin, Content, Media, or any product feature.

Raw refresh tokens must never be stored here. Only refresh token hashes belong in persistence.
