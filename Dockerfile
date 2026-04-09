# syntax=docker/dockerfile:1

# =============================================================================
# Dockerfile for Raspberry Pi 4 (ARM64)
# =============================================================================
# Multi-stage build optimized for ARM64 devices like Raspberry Pi 4
# - Uses BuildKit cache mounts for faster rebuilds
# - Pre-compiles TypeScript for faster startup and lower memory usage
# - Uses slim base image to reduce size
# - Runs as non-root user for security
#
# Build with: DOCKER_BUILDKIT=1 docker build -t hondabot .
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Build base with common dependencies
# -----------------------------------------------------------------------------
FROM node:22-bookworm-slim AS base

# Install build dependencies needed for native modules (sharp, etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    git \
    && rm -rf /var/lib/apt/lists/* \
    && npm install -g npm@11.9.0

# -----------------------------------------------------------------------------
# Stage 2: Dependencies & Build
# -----------------------------------------------------------------------------
FROM base AS builder

WORKDIR /build

# Copy package files and patches for better layer caching
# Note: patches/ is needed for the postinstall script that patches rustplus.proto
COPY package.json package-lock.json ./
COPY patches/ ./patches/

# Install all dependencies with BuildKit cache mount for npm
# This dramatically speeds up rebuilds by caching downloaded packages
RUN --mount=type=cache,target=/root/.npm,sharing=locked \
    npm ci --include=dev

# Copy source code
COPY . .

# Compile TypeScript to JavaScript for production
RUN NODE_OPTIONS="--max-old-space-size=2048" npm run build

# -----------------------------------------------------------------------------
# Stage 3: Production Dependencies
# -----------------------------------------------------------------------------
FROM base AS deps

WORKDIR /deps

COPY package.json package-lock.json ./
COPY patches/ ./patches/

# Install production deps with cache mount
# Note: Cannot use --ignore-scripts as sharp needs post-install on ARM64
# Note: patches/ is needed for the postinstall script that patches rustplus.proto
RUN --mount=type=cache,target=/root/.npm,sharing=locked \
    npm ci --omit=dev

# -----------------------------------------------------------------------------
# Stage 4: Final Runtime Image
# -----------------------------------------------------------------------------
FROM node:22-bookworm-slim AS runtime

LABEL org.opencontainers.image.title="HondaBot"
LABEL org.opencontainers.image.description="Discord bot for Rust+ integration"

# Install runtime dependencies (sharp includes its own libvips)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    dumb-init \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd --gid 1001 hondabot \
    && useradd --uid 1001 --gid hondabot --shell /bin/bash --create-home hondabot

WORKDIR /app

# Copy production dependencies
COPY --from=deps /deps/node_modules ./node_modules

# Copy compiled JavaScript
COPY --from=builder /build/dist ./dist
COPY --from=builder /build/package.json ./

# Copy runtime resources (must be in dist/src/ to match compiled code paths)
COPY --from=builder /build/src/resources ./dist/src/resources
COPY --from=builder /build/src/languages ./dist/src/languages
COPY --from=builder /build/src/staticFiles ./dist/src/staticFiles
COPY --from=builder /build/src/templates ./dist/src/templates

# Create data directories
RUN mkdir -p /app/credentials /app/instances /app/logs /app/maps /app/temp \
    && chown -R hondabot:hondabot /app

VOLUME ["/app/credentials", "/app/instances", "/app/logs", "/app/maps"]

ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=1024"

USER hondabot

HEALTHCHECK --interval=60s --timeout=10s --start-period=120s --retries=3 \
    CMD node -e "console.log('healthy')" || exit 1

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "dist/index.js"]
