# Phase 1 Local/Test Seed Data

This seed is for local development and automated test environments only. It creates deterministic accounts and sample Phase 1 esports data so developers can test Auth, RBAC, profiles, tournament search, registration, bracket/match, standings, and transactional notification log flows immediately after starting the project.

These credentials are intentionally known for local testing. **Never use them in production or commit them to a real environment.**

## Commands

From the repository root:

```bash
pnpm seed:dev
```

To delete only records created by this seed system:

```bash
DRAGON_ALLOW_SEED_RESET=true pnpm seed:reset
```

On Windows PowerShell:

```powershell
$env:DRAGON_ALLOW_SEED_RESET="true"; pnpm seed:reset
```

The root scripts build `@dragon/api` first and then run the compiled seed runner.

## Seed password

The default seed password is `DragonTest@12345`. This is a **local/dev-only credential** — do not reuse it anywhere real.

To override the password without rebuilding, set `DRAGON_DEV_SEED_PASSWORD` before running:

```bash
DRAGON_DEV_SEED_PASSWORD='MyLocalPass@1' pnpm seed:dev
```

Credential printing behavior:

| Environment | Default behavior |
|---|---|
| Local (CI not set) | Prints email, phone, and password for all accounts |
| CI (`CI=true`) | Suppresses password printing to avoid leaking into build logs |
| CI with override | Set `DRAGON_PRINT_SEED_CREDENTIALS=true` to force-print credentials in CI |

## Required environment

The seed runners use the existing API database configuration and require `MONGODB_URI`.

Allowed `NODE_ENV` values:

- `development`
- `test`
- `local`

The seed and reset commands refuse to run when:

- `NODE_ENV=production`
- `MONGODB_URI` is missing
- the database URI looks production-like
- reset is called without `DRAGON_ALLOW_SEED_RESET=true`

## Test Accounts

Current Auth login is phone-first. Email fields are still populated for admin display and local identification, but login uses the phone value plus the password below.

| Role | Email | Phone | Password |
|---|---|---|---|
| Super Admin | superadmin@dragon.local | +15550001001 | DragonTest@12345 |
| Admin | admin@dragon.local | +15550001002 | DragonTest@12345 |
| Organizer | organizer@dragon.local | +15550001003 | DragonTest@12345 |
| Editor | editor@dragon.local | +15550001004 | DragonTest@12345 |
| Player 1 | player1@dragon.local | +15550001011 | DragonTest@12345 |
| Player 2 | player2@dragon.local | +15550001012 | DragonTest@12345 |
| Player 3 | player3@dragon.local | +15550001013 | DragonTest@12345 |
| Player 4 | player4@dragon.local | +15550001014 | DragonTest@12345 |

## Role mapping

| Account | Existing role key |
|---|---|
| Super Admin | `super_admin` |
| Admin | `admin` |
| Organizer | `tournament_manager` |
| Editor | `content_manager` |
| Players | `user` |

The seed runs the existing RBAC seed first so roles and permissions exist before user-role assignments are attached.

## Seeded data

Approximate records created on a fresh local database:

- 8 active verified users
- 8 profiles
- 8 user-role assignments
- 4 games: Valorant, EA FC, Dota 2, Counter-Strike 2
- 7 tournaments covering draft, published, registration-open, registration-closed, full-capacity, cancelled, and completed states
- 13 registrations covering submitted, approved, rejected, withdrawn, and cancelled states
- 4 matches including scheduled and completed matches with sample scores
- 4 local/test notification log records for transactional tournament SMS purposes

Seeded tournament slugs are prefixed with `phase1-dev-` so public search can be tested safely.

Example public search checks:

```bash
GET /api/v1/search/tournaments?q=Valorant
GET /api/v1/search/tournaments?registrationOpen=true
GET /api/v1/search/tournaments?format=single_elimination
GET /api/v1/search/tournaments?status=completed
```

## Seed marker and reset behavior

Seeded records use:

```text
seedSource = phase1-dev-seed
seedBatch = phase1-dev-seed-v1
```

For users, the existing metadata field is also used:

```text
metadata.registrationSource = phase1-dev-seed
```

Reset deletes only seed-owned data and dependent seed data. It does not delete unmarked manual data.

## Notifications

Seeded notification logs are local/test records only. The seed does not call SMS, email, push, campaign, or external provider APIs.

## Troubleshooting

If reset refuses to run, confirm:

- `NODE_ENV` is not `production`
- `MONGODB_URI` points to a local/test database
- `DRAGON_ALLOW_SEED_RESET=true` is set for reset only

If seed refuses to overwrite a record, a manual/non-seed record likely uses the same deterministic local slug, username, or phone. Rename or remove that manual local record before seeding.
