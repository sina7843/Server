# API config foundation

This directory contains strict, testable configuration helpers for the Dragon API.

Slice 0.2 currently validates local Auth, OTP, Session, Password, JWT, and SMS provider selection settings only. It does not implement Auth behavior.

## Current scope

- Parse and validate required auth-related environment values.
- Keep numeric settings as numbers.
- Restrict `SMS_PROVIDER` to `mock` for now.
- Validate `AUTH_JWT_SECRET` minimum length without logging or exposing its value.

## Not implemented here

- No Auth module, controller, service, or endpoint.
- No OTP generation or SMS sending.
- No session persistence or JWT issuing.
- No guards, RBAC, roles, permissions, or profile logic.
- No schema, database model, queue, Redis, or worker integration.
