# ── Stage 1: builder ───────────────────────────────────────────────────────────
# Build context: repo root
#   docker build -f apps/api/Dockerfile -t dragon-api .
FROM node:20-alpine AS builder

# Native build tools required by argon2 and sharp
RUN apk add --no-cache python3 make g++

RUN corepack enable && corepack prepare pnpm@10.12.1 --activate

WORKDIR /build

# Workspace manifests first — own layer for pnpm install caching
COPY pnpm-workspace.yaml .npmrc pnpm-lock.yaml package.json ./

# Workspace packages (@dragon/types, @dragon/utils)
COPY packages/ packages/

# App source
COPY apps/api/ apps/api/

# Install all deps (dev included — needed by tsc)
RUN pnpm install --frozen-lockfile

# Compile TypeScript to dist/
RUN pnpm --filter @dragon/api build

# Produce self-contained production deployment directory.
# pnpm deploy resolves workspace symlinks to real copies and installs prod-only
# node_modules. dist/ is gitignored so it is not copied by pnpm deploy — we
# copy it explicitly below.
RUN pnpm --filter @dragon/api deploy --prod /deploy && \
    cp -r /build/apps/api/dist /deploy/dist

# ── Stage 2: runtime ───────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

COPY --from=builder --chown=appuser:appgroup /deploy ./

USER appuser

EXPOSE 3000

CMD ["node", "dist/main.js"]
