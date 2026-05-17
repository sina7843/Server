# Auth cleanup foundation

This directory contains the Slice 0.2 Auth cleanup foundation.

The cleanup service is callable and testable, but it is not scheduled automatically in this slice. A later worker or operations task may decide how to invoke it.

## Current cleanup behavior

The cleanup foundation can:

- soft-delete pending, unverified users older than the cleanup threshold
- mark expired, unconsumed OTP challenges as consumed while relying on the existing MongoDB TTL index for eventual removal
- mark expired, unrevoked sessions as revoked with reason `expired`

Cleanup returns counts only. It must not expose phone numbers, OTP hashes, token hashes, or user metadata.

## Out of scope

Slice 0.2 cleanup does not include:

- public cleanup endpoints
- admin cleanup controls
- cron or production scheduling
- Redis
- BullMQ
- worker runtime loops
- monitoring or backup automation
- Profile, RBAC, Admin, Content, or Media cleanup
