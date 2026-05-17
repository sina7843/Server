# SMS foundation

This directory contains the Slice 0.2 SMS delivery abstraction for the API app.

Current scope:

- `SmsProvider` interface.
- `MockSmsProvider` for local development and tests.
- `SmsService` wrapper that records safe notification log entries.

Out of scope in this task:

- Real SMS provider adapters.
- Real SMS provider credentials.
- SMS queues or BullMQ workers.
- Auth endpoints or OTP delivery flows.
- Logging raw OTP codes, raw messages, or raw phone numbers.
