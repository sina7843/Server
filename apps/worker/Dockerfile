# ── Stage 1: builder ───────────────────────────────────────────────────────────
# Build context: repo root
#   docker build -f apps/worker/Dockerfile -t dragon-worker .
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@10.12.1 --activate

WORKDIR /build

COPY pnpm-workspace.yaml .npmrc pnpm-lock.yaml package.json ./
COPY packages/ packages/
COPY apps/worker/ apps/worker/

RUN pnpm install --frozen-lockfile

# Worker uses tsconfig.json (not tsconfig.build.json) as its build config
RUN pnpm --filter @dragon/worker build

# pnpm deploy resolves workspace deps and installs prod-only node_modules.
# dist/ is gitignored so it is not copied by pnpm deploy — copied explicitly.
RUN pnpm --filter @dragon/worker deploy --prod /deploy && \
    cp -r /build/apps/worker/dist /deploy/dist

# ── Stage 2: runtime ───────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

COPY --from=builder --chown=appuser:appgroup /deploy ./

USER appuser

# Worker processes BullMQ jobs; it does not expose an HTTP port.

CMD ["node", "dist/main.js"]
