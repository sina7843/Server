# Notification log foundation

This directory contains the Slice 0.2 notification log persistence foundation for safe SMS delivery tracking.

Current scope:

- `NotificationLog` schema with masked recipient and recipient hash fields.
- Repository methods for safe log creation and lookup.
- Service helpers for SMS queued, sent, failed, and skipped states.

Out of scope in this task:

- Notification Center features.
- Notification templates or admin management.
- Email sending implementation.
- SMS queues or worker integration.
- Storing raw phone numbers, raw OTP codes, or full SMS message bodies.
