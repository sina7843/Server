# ADR 0002 — Phone-First Auth

## Status

Accepted / Locked by HQ

## Context

Phone-first authentication is a locked product direction for Dragon Ecosystem. Slice 0.2 implemented the Auth / OTP / Session foundation around phone-based identity while keeping Profile, RBAC, Admin, UI, and production-provider concerns out of scope.

## Decision

Dragon Ecosystem uses phone number as the primary Auth identity foundation. Email may exist as optional secondary account data, but it is not the primary authentication feature in Slice 0.2.

Slice 0.2 includes:

- phone-first registration
- phone verification through SMS OTP using the provider abstraction
- password-based login
- session persistence
- short-lived access tokens
- refresh token rotation
- logout and logout-all session revocation
- password reset with SMS OTP
- authentication-only access token guard
- minimal `/me` identity endpoint
- current-user session list/revoke
- auth cleanup foundation

## Scope in Slice 0.2

The Slice 0.2 implementation is an Auth foundation, not a full identity platform. It creates the backend foundation for account verification, login, session lifecycle, password reset, and safe current-user session management.

Security-sensitive data is handled conservatively:

- raw passwords are not stored
- raw OTP codes are not stored
- raw refresh tokens are not stored
- token responses do not expose stored token hashes
- notification logs store masked and hashed recipients
- account enumeration is reduced with generic responses where needed

## Not implemented yet

The following are not implemented in Slice 0.2:

- OAuth
- passwordless login
- passkeys
- full 2FA/TOTP enrollment
- RBAC or ABAC enforcement
- role assignment
- permission model
- Profile or UserProfile
- Admin UI
- Admin user management
- Admin session management
- real SMS provider integration
- production secret management
- production monitoring and alerting

These may be added only in later approved slices.
