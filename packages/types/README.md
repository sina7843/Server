# @dragon/types

This package contains shared Dragon DTO/contract/constants only.

It must not contain database entities or persistence models.
It must not contain product feature logic.

Slice 0.1 includes neutral foundation-level exports.
Slice 0.2 adds only safe Auth foundation contracts such as `UserStatus`, `SessionRevocationReason`, and `OtpPurpose`.
These contracts are not endpoint DTOs and do not implement Auth, Session, OTP, Profile, RBAC, Admin, Content, or Media behavior.
