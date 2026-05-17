# RBAC Object Policy Foundation

This directory contains the thin ABAC-ready object policy foundation for Slice 0.3.

## Implemented

- Generic `PolicyContext`
- Generic `PolicyResult`
- `ObjectPolicyService`
- Own-resource comparison helper
- Permission-based helper
- Deny-by-default basic policy evaluation
- Generic object policy guard/decorator foundation

## Scope awareness

`scopeType` and `scopeId` are carried through the policy context as future-ready
metadata. They are not domain-enforced in this slice.

## Not implemented

- Full ABAC engine
- Dynamic policy language
- Policy DSL
- Domain-specific object loaders
- Profile/content/media/tournament/team ownership policies
- Policy builder UI
- Admin policy management API
- RBAC admin API

The foundation is intentionally small so future domain modules can provide their
own resource loading and policy context construction without changing the RBAC
persistence model.
