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

# ── Stage 2: mongo-tools ───────────────────────────────────────────────────────
# Provides mongodump binary for backup execution inside the API container.
# Only the binary is copied to the runtime stage — this image is not included
# in the final image layer.
FROM mongo:7 AS mongo-tools

# ── Stage 3: runtime ───────────────────────────────────────────────────────────
# node:20-slim (Debian Bookworm) is used instead of Alpine so that the
# mongodump binary copied from mongo:7 (also Debian-based / glibc) is
# ABI-compatible at runtime.
FROM node:20-slim AS runtime

RUN groupadd --system appgroup && useradd --system --gid appgroup --no-create-home appuser

WORKDIR /app

# Install mongodump from the official MongoDB image for admin API backup execution.
# The binary runs inside the API container; no host-level mongodump is required
# for the API backup endpoint.
COPY --from=mongo-tools /usr/bin/mongodump /usr/local/bin/mongodump

# Build-time verification: mongodump must be on PATH and executable
RUN mongodump --version

COPY --from=builder --chown=appuser:appgroup /deploy ./

USER appuser

EXPOSE 3000

CMD ["node", "dist/main.js"]
