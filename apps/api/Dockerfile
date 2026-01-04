# Use the official Node.js image
FROM node:18-slim AS base

# Install curl for health checks with better error handling
RUN apt-get clean && \
    apt-get update --fix-missing && \
    apt-get install -y --no-install-recommends curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Enable pnpm
RUN corepack enable

# -------------------------------
# 1. Dependencies
# -------------------------------
FROM base AS deps
WORKDIR /app

# Copy package files for dependency resolution
COPY package.json pnpm-lock.yaml ./
COPY pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/ ./packages/

# Install dependencies
RUN pnpm install --frozen-lockfile

# -------------------------------
# 2. Builder
# -------------------------------
FROM base AS builder
WORKDIR /app

# Copy installed dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=deps /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=deps /app/turbo.json ./turbo.json

# Copy packages and service
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/apps/api ./apps/api

# Copy app source (this may overwrite some files, but that's expected)
COPY apps/api ./apps/api

# Build the NestJS service from workspace root
WORKDIR /app
RUN pnpm --filter api build

# -------------------------------
# 3. Development stage
# -------------------------------
FROM base AS development
WORKDIR /app

# Install all dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=deps /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=deps /app/turbo.json ./turbo.json
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/apps/api ./apps/api

# Copy source code
COPY apps/api/ ./apps/api/

# Expose port using environment variable
EXPOSE ${API_INTERNAL_PORT:-3001}

# Default command (can be overridden)
CMD ["pnpm", "api:dev"]

# -------------------------------
# 4. Production Runner
# -------------------------------
FROM base AS production
WORKDIR /app

# Create non-root user
RUN groupadd -g 1001 nodejs \
    && useradd -u 1001 -g nodejs -m nodejs

# Copy entire workspace structure with pnpm node_modules
COPY --from=builder --chown=nodejs:nodejs /app ./

# Create uploads directory
RUN mkdir -p uploads && chown nodejs:nodejs uploads

USER nodejs

EXPOSE ${API_INTERNAL_PORT:-3001}

# Health check - use explicit port for reliability
HEALTHCHECK --interval=30s --timeout=15s --start-period=120s --retries=5 \
  CMD curl -f -s -S http://127.0.0.1:3001/health || exit 1

# Define entrypoint - run from workspace root where pnpm can resolve dependencies
CMD ["node", "apps/api/dist/apps/api/src/main.js"]
