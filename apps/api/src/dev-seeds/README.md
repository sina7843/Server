# Phase 1 Dev Seed

Local/test-only deterministic seed system for Phase 1 development data.

Commands from repo root:

```bash
pnpm seed:dev
DRAGON_ALLOW_SEED_RESET=true pnpm seed:reset
```

Safety:

- refuses `NODE_ENV=production`
- refuses missing `MONGODB_URI`
- refuses production-like database URIs
- reset requires `DRAGON_ALLOW_SEED_RESET=true`
- reset deletes only seed-owned records

Seed marker:

```text
seedSource = phase1-dev-seed
seedBatch = phase1-dev-seed-v1
```

The seed creates local accounts, profiles, role assignments, games, tournaments, registrations, matches, and local notification log records. It does not call external SMS/email providers and does not implement production deployment or Task 0.6.5.
