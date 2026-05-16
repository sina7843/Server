# ADR 0001 — Monorepo Modular Monolith

## Status

Accepted / Locked by HQ

## Context

Dragon Ecosystem needs a foundation that supports multiple apps and shared packages while keeping development coordinated in one repository.

## Decision

Dragon Ecosystem uses a pnpm/Turborepo monorepo. The backend direction is modular monolith. Services may become extractable later if real operational needs appear.

## Scope in Slice 0.1

Slice 0.1 provides the monorepo foundation, minimal app shells, and shared package skeletons only. No microservice split is implemented in Slice 0.1.

## Not implemented yet

No backend domain modules, service extraction, distributed service boundaries, or product feature modules are implemented yet.
