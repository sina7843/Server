# @dragon/types

This package contains shared Dragon DTO, contract, and constant definitions only.

It must not contain database entities or persistence models. It must not contain product feature logic.

Slice 0.2 adds only safe Auth/User status contracts. It still does not include User/Profile DTOs, persistence models, or product flow contracts.

Slice 0.2 also includes the neutral `SessionRevocationReason` contract for later session revocation flows. This is a shared type only and does not implement session endpoints, token rotation, JWT issuing, or admin behavior.
