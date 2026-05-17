# Auth Security Utilities

This directory contains security utility foundations for later Auth flows.

Included utilities:

- phone normalization wrapper for API Auth usage
- password hashing and verification
- refresh/reset token hashing and safe comparison
- OTP code generation, hashing, and verification
- safe masking helpers for phone, email, and secrets

Slice 0.2 does not implement registration, login, OTP verification endpoints, SMS sending, JWT issuing, refresh token rotation, Auth guards, RBAC, or any product feature here.

Raw passwords, OTP codes, tokens, hashes, phone numbers, emails, and secrets must not be logged.
