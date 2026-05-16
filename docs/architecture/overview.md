# Architecture Overview

This overview reflects the current Slice 0.1 foundation state only. Product features are not implemented yet.

## Apps

- `apps/api` — minimal NestJS API shell with a static health route only.
- `apps/worker` — minimal TypeScript worker runtime shell with no queues, jobs, or domain logic.
- `apps/web` — minimal Nuxt public frontend shell, SSR-capable, with neutral shell content only.
- `apps/admin` — minimal Nuxt admin shell, separate from public web, with neutral shell content only.

## Packages

- `packages/config` — shared tooling configuration foundation for TypeScript, ESLint, Prettier, and Tailwind readiness.
- `packages/types` — neutral shared contracts and constants only.
- `packages/utils` — generic framework-agnostic utilities only.
- `packages/sdk` — generic framework-agnostic API client foundation only, with no endpoint-specific methods.
- `packages/ui` — Vue UI package skeleton with a neutral placeholder component only.

## Infrastructure

- `infra/docker` — local-only Docker Compose infrastructure for MongoDB, Redis, and MinIO.

## Current boundaries

Slice 0.1 does not include product modules, database schemas, queues, real UI flows, API integrations, deployment implementation, monitoring, backup, Auth, RBAC, Content, Media, Search, Analytics, or Notification features.
