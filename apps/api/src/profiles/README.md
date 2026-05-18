# Profile Module — Slice 0.4

This module contains only the `UserProfile` persistence foundation and username
policy for Slice 0.4.

Implemented:

- `UserProfile` schema
- repository foundation
- service foundation
- username normalization and validation policy
- reserved username blocking
- canonical `publicUrl` generation as `/u/:username`

Not implemented in this task:

- public profile API
- account profile API
- profile lifecycle integration with Auth
- avatar upload
- media integration
- social/customization features
- frontend pages
- SDK profile methods
