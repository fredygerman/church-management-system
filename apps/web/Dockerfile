FROM node:22-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/web/package.json ./apps/web/
COPY packages ./packages
RUN pnpm install --frozen-lockfile

FROM deps AS builder
COPY apps/web ./apps/web
RUN pnpm --filter @church/config build && pnpm --filter web build

FROM base AS production
ENV NODE_ENV=production
COPY --from=builder /app /app
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=5 CMD curl -fsS http://127.0.0.1:3000/ || exit 1
CMD ["pnpm", "--filter", "web", "start"]
