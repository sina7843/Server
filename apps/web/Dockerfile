# ── Stage 1: builder ───────────────────────────────────────────────────────────
# Build context: repo root
#   docker build -f apps/web/Dockerfile -t dragon-web .
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@10.12.1 --activate

WORKDIR /build

COPY pnpm-workspace.yaml .npmrc pnpm-lock.yaml package.json ./

# Workspace packages (@dragon/sdk, @dragon/types)
COPY packages/ packages/

# App source
COPY apps/web/ apps/web/

RUN pnpm install --frozen-lockfile

# Nuxt build produces a self-contained Nitro bundle at apps/web/.output/
RUN pnpm --filter @dragon/web build

# ── Stage 2: runtime ───────────────────────────────────────────────────────────
# .output/ is a standalone Nitro server — no node_modules required at runtime.
FROM node:20-alpine AS runtime

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

COPY --from=builder --chown=appuser:appgroup /build/apps/web/.output ./

USER appuser

EXPOSE 3001

# Nuxt runtimeConfig public values can be overridden at container start via
# NUXT_PUBLIC_* environment variables. Private SSR values (e.g.
# NUXT_API_INTERNAL_BASE_URL) must be supplied at runtime only — never baked in.
ENV HOST=0.0.0.0
ENV PORT=3001

CMD ["node", "server/index.mjs"]
