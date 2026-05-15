# Church Management System

A monorepo for church operations management, built with `pnpm` workspaces and `turbo`.

## Overview

This project provides tools for:

- member and visitor management
- zones and families
- attendance sessions, check-ins, trends, and risk insights
- communication templates and campaigns
- data-quality workflows (imports and duplicate resolution)
- role/permission-based access control

The system is split into a web app and an API, backed by PostgreSQL via Drizzle ORM.

## Workspace Structure

```text
.
├── apps/
│   ├── web/                 # Next.js frontend
│   └── api/                 # NestJS backend
├── packages/
│   ├── db/                  # Shared Drizzle schema, migrations, seeds
│   ├── eslint-config/       # Shared ESLint config
│   └── typescript-config/   # Shared TS config
├── turbo.json
└── pnpm-workspace.yaml
```

## Tech Stack

### Web (`apps/web`)

- Next.js 16
- React 19
- TypeScript
- NextAuth
- Tailwind CSS + Radix UI + Lucide
- Server actions for API interaction

### API (`apps/api`)

- NestJS
- TypeScript
- Drizzle ORM + PostgreSQL
- JWT auth (access + refresh tokens)
- global guards for auth, church context, permissions, and zone context

### Shared

- `@church/db` for schema/migrations/seeding

## Quick Start

### Prerequisites

- Node.js 20+
- `pnpm` 9.12.3+
- PostgreSQL 14+

### Install

```bash
pnpm install
```

### Environment

Create your local env file and set required variables:

```bash
cp .env.example .env.local
```

Commonly required values:

- `DATABASE_URL`
- `JWT_SECRET`
- `SESSION_SECRET`
- `API_BASE_URL`
- `NEXT_PUBLIC_API_BASE_URL`
- `NEXTAUTH_SECRET`

### Database

```bash
pnpm db:push
pnpm db:seed
```

### Run Development

```bash
pnpm dev
```

Run apps individually if needed:

```bash
pnpm web:dev
pnpm api:dev
```

Default local URLs:

- Web: [http://localhost:3000](http://localhost:3000)
- API: [http://localhost:3001](http://localhost:3001)

## Scripts

- `pnpm dev`: Run web + api in dev mode through Turbo
- `pnpm build`: Build web + api
- `pnpm start`: Start production builds
- `pnpm lint`: Lint workspace
- `pnpm lint:fix`: Lint with autofix
- `pnpm type-check`: Run TypeScript checks
- `pnpm format`: Prettier format
- `pnpm clean`: Clean generated artifacts
- `pnpm web:dev`: Run only web
- `pnpm api:dev`: Run only api
- `pnpm db:generate`: Generate Drizzle migrations
- `pnpm db:push`: Push schema changes
- `pnpm db:migrate`: Apply migrations
- `pnpm db:seed`: Seed database
- `pnpm db:studio`: Open Drizzle Studio

## API Domain Modules

Primary backend modules include:

- `auth`
- `users`
- `churches`
- `members`
- `zones`
- `families`
- `visitors`
- `attendance`
- `communications`
- `data-quality`
- `family-lifecycle`
- `mail`
- `sms`
- `file-upload`

## Status

This project is under active development. Interfaces and behavior may change.
