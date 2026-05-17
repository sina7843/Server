# Password Reset Foundation

This directory contains the Slice 0.2 password reset flow foundation.

It supports only SMS OTP-based password reset for active, phone-verified users.

It must not contain Profile, RBAC, Admin, UI, passwordless login, OAuth, email reset, or production provider logic.

Reset tokens are short-lived, purpose-bound, and never logged.
