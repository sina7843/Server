# ── Stage 1: builder ───────────────────────────────────────────────────────────
# Build context: repo root
#   docker build -f apps/admin/Dockerfile -t dragon-admin .
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@10.12.1 --activate

WORKDIR /build

COPY pnpm-workspace.yaml .npmrc pnpm-lock.yaml package.json ./

# Workspace packages (@dragon/sdk, @dragon/types)
COPY packages/ packages/

# App source
COPY apps/admin/ apps/admin/

RUN pnpm install --frozen-lockfile

# Nuxt build produces a self-contained Nitro bundle at apps/admin/.output/
# ssr: false — Nitro serves pre-rendered static assets; no SSR at request time.
RUN pnpm --filter @dragon/admin build

# ── Stage 2: runtime ───────────────────────────────────────────────────────────
# .output/ is a standalone Nitro server — no node_modules required at runtime.
FROM node:20-alpine AS runtime

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

COPY --from=builder --chown=appuser:appgroup /build/apps/admin/.output ./

USER appuser

EXPOSE 3002

# Nuxt runtimeConfig public values can be overridden at container start via
# NUXT_PUBLIC_* environment variables. Supply at runtime only — never baked in.
ENV HOST=0.0.0.0
ENV PORT=3002

CMD ["node", "server/index.mjs"]
