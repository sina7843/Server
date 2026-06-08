# Phase 1 Local Development Seed Data

This seed is local/dev/test only. It creates deterministic Phase 1 data so the web app, admin app, and API can be tested after local infrastructure is running.

## Start local infrastructure and apps

```bash
pnpm dev:local
```

This starts the Docker-based local infrastructure and the API, worker, web, and admin apps using the existing project scripts.

## Run the seed

In another terminal from the repository root:

```bash
pnpm seed:dev
```

The root command builds `@dragon/api` and then runs:

```bash
pnpm --filter @dragon/api seed:dev
```

The seed loads local env values from:

1. root `.env.example`
2. `apps/api/.env.example`
3. `apps/api/.env`
4. `apps/api/.env.local`

Existing shell environment variables are not overridden.

## Reset seeded data

Reset is intentionally guarded. From the repository root:

```bash
DRAGON_ALLOW_SEED_RESET=true pnpm seed:reset
```

The reset deletes only deterministic records created by the Phase 1 dev seed. It does not delete manual local data outside the seed keys.

Running reset twice is safe.

## Test accounts

Default local password:

```text
DragonTest@12345
```

Override locally with:

```bash
DRAGON_DEV_SEED_PASSWORD='YourLocalPassword@12345' pnpm seed:dev
```

The API login endpoint currently uses phone + password. Emails are still seeded for admin/user search and account identification.

| Purpose | Email | Phone | Password | Roles | Status |
|---|---|---:|---|---|---|
| Super Admin / Platform Owner | superadmin@dragon.local | +989001000001 | DragonTest@12345 | super_admin | active |
| Admin / Operations Manager | admin@dragon.local | +989001000002 | DragonTest@12345 | admin | active |
| Tournament Manager / Organizer | organizer@dragon.local | +989001000003 | DragonTest@12345 | tournament_manager | active |
| Content Manager / Editor | editor@dragon.local | +989001000004 | DragonTest@12345 | content_manager | active |
| Player 1 | player1@dragon.local | +989001000101 | DragonTest@12345 | user | active |
| Player 2 | player2@dragon.local | +989001000102 | DragonTest@12345 | user | active |
| Player 3 | player3@dragon.local | +989001000103 | DragonTest@12345 | user | active |
| Player 4 | player4@dragon.local | +989001000104 | DragonTest@12345 | user | active |
| Player 5 | player5@dragon.local | +989001000105 | DragonTest@12345 | user | active |
| Player 6 | player6@dragon.local | +989001000106 | DragonTest@12345 | user | active |
| Disabled / Suspended Sample User | disabled@dragon.local | +989001000199 | DragonTest@12345 | user | suspended |

Credentials are printed during local seed runs. They are not printed when `CI=true`.

## What the seed creates

The seed inspects and uses only implemented Phase 1 schemas/entities. It creates deterministic local records for:

- users
- user profiles
- permissions, roles, role permissions
- user role mappings
- content categories and tags
- content posts and pages
- media asset metadata
- games
- tournaments
- tournament registrations
- tournament matches
- notification templates and notification logs
- audit logs
- analytics events
- job logs
- backup logs

## Covered UI/API states

### Games

Seeded games:

- Valorant
- EA FC
- Dota 2
- Counter-Strike 2
- League of Legends
- Mobile Legends

Coverage includes active games, an inactive game, games with tournaments, and games without currently public open-registration tournaments.

### Tournaments

Supported Phase 1 formats only:

- `single_elimination`
- `round_robin`
- `manual`

Seeded tournament statuses:

- `draft`
- `published`
- `registration_open`
- `registration_closed`
- `in_progress`
- `completed`
- `cancelled`
- `archived`

Seeded timing cases:

- registration not started yet
- registration currently open
- registration already closed
- upcoming tournament
- in-progress tournament
- completed tournament
- cancelled tournament
- archived tournament
- full-capacity tournament

The public endpoint has meaningful local data for:

```http
GET /api/v1/search/tournaments
```

Useful local checks:

```bash
curl 'http://localhost:4000/api/v1/search/tournaments?q=Valorant'
curl 'http://localhost:4000/api/v1/search/tournaments?registrationOpen=true'
curl 'http://localhost:4000/api/v1/search/tournaments?registrationOpen=false'
curl 'http://localhost:4000/api/v1/search/tournaments?format=round_robin'
curl 'http://localhost:4000/api/v1/search/tournaments?page=1&limit=5'
```

### Registrations

Seeded registration states:

- `submitted`
- `approved`
- `rejected`
- `waitlisted`
- `withdrawn`
- `cancelled`

Coverage includes already registered users, approved players, rejected players, waitlisted players, a withdrawn registration, a cancelled registration, full capacity, and participant projection states such as removed and disqualified.

### Matches / bracket / standings data

The codebase uses tournament matches as the source for bracket and standings projections. The seed creates:

- scheduled matches
- in-progress matches
- completed matches with scores and winners
- cancelled matches
- single-elimination sample bracket inputs
- round-robin standings inputs
- manual tournament match data

No unsupported future bracket formats are seeded.

### Notifications

Only Phase 1 transactional SMS templates/logs are seeded:

- registration submitted
- registration approved
- registration rejected
- tournament cancelled

The seed does not call any real external SMS/email provider. Notification records use local-only masked/hash values.

## Safety restrictions

The seed refuses to run when:

- `NODE_ENV=production`
- `APP_ENV=production`
- `APP_ENV=staging`
- `MONGODB_URI` uses `mongodb+srv://`
- MongoDB host is not one of:
  - `localhost`
  - `127.0.0.1`
  - `mongo`
  - `mongodb`
- database name looks production/staging-like
- reset is requested without `DRAGON_ALLOW_SEED_RESET=true`

Allowed examples:

```text
mongodb://localhost:27017/dragon_local
mongodb://127.0.0.1:27017/dragon_local
mongodb://mongodb:27017/dragon_local
mongodb://mongo:27017/dragon_local
```

Blocked by default:

```text
mongodb+srv://...
mongodb://prod-db.example.com:27017/dragon_prod
mongodb://localhost:27017/dragon_staging
```

## Reset strategy

Most existing schemas do not expose a generic `seedSource` field. Reset therefore uses deterministic local identifiers:

- users by `emailNormalized` and `metadata.registrationSource=phase1-dev-seed`
- profiles by seeded user IDs/usernames
- games by seeded slugs
- tournaments by seeded slugs
- registrations and matches by seeded tournament/user IDs
- notifications by deterministic request IDs/template keys
- content by seeded slugs
- media/job/backup/audit/analytics records by deterministic local seed prefixes

System permissions and roles are upserted from the project registry and are not removed by reset because they are foundational RBAC data. Seeded user-role mappings are removed.

## Troubleshooting local MongoDB / Compass

The default API env example uses:

```text
mongodb://dragon_local:dragon_local_password@localhost:27017/dragon_local?authSource=admin
```

In MongoDB Compass, use the same URI. If the API runs inside Docker and you connect from another container, use `mongodb` or `mongo` depending on the Docker Compose service name. If you connect from the host machine, use `localhost`.

If seed refuses the database target, check:

```bash
echo $NODE_ENV
echo $APP_ENV
echo $MONGODB_URI
```

Then make sure you are using an approved local MongoDB target.
