# ADR 0006 — Separate API and Worker Runtime

## Status

Accepted / Locked by HQ

## Context

Dragon Ecosystem separates request/response API runtime concerns from background worker runtime concerns.

## Decision

API and worker are separate runtimes. The worker must not duplicate API business or domain logic.

## Scope in Slice 0.1

Slice 0.1 has only minimal app shells for API and worker. No BullMQ jobs, queue processors, schedulers, or domain logic exist yet.

## Not implemented yet

Queue processing, background jobs, scheduling, worker-to-API coordination, and domain modules are not implemented yet.
