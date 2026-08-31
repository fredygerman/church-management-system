# Church Management System

A monorepo for church operations management, built with `pnpm` workspaces and `turbo`.

## Overview

This project provides tools for:

- member and visitor management
- zones, departments/ministries, and families
- attendance sessions, check-ins, trends, and risk insights (with zone and department breakdowns)
- offering/giving tracking, categories, basic giving reports, and time-bound fundraising goals with an opt-in donor wall
- a calendar of one-off events (church-specific or network-wide), with RSVP and attendance tracking
- communication templates and campaigns
- data-quality workflows (imports and duplicate resolution)
- member self-service portal (profile, attendance, prayer requests, announcements, departments, giving history, giving goals, events)
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
- global guards for auth, church context, permissions, zone context, and department context

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

### Demo data and email/password access

Email/password users can register through the dashboard or `POST /auth/register`; passwords must be at least 12 characters. To create an idempotent, non-destructive demo church and administrator, run:

```bash
DEMO_SEED_CONFIRM=true DEMO_ADMIN_EMAIL=admin@example.com DEMO_ADMIN_PASSWORD='use-a-unique-12-character-password' pnpm db:seed:demo
```

The demo seed adds sample members, services, attendance, offerings, an event, a visitor, and a prayer request without deleting existing data.

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

### Public hostnames

| Environment | Landing site | Dashboard | API |
| --- | --- | --- | --- |
| Production | `mitoyabarakachurch.org` / `www.mitoyabarakachurch.org` (Vercel) | `app.mitoyabarakachurch.org` | `api.mitoyabarakachurch.org` |
| Development | — | `dev-app.mitoyabarakachurch.org` | `dev-api.mitoyabarakachurch.org` |

The dashboard and API hosts are reserved deployment targets, not active DNS records. Set the web `NEXTAUTH_URL` to its dashboard URL; set `API_BASE_URL` and `NEXT_PUBLIC_API_BASE_URL` to the API URL; set the API `APP_URL` and `API_BASE_URL` to the API URL, `FRONTEND_URL` and `CORS_ORIGINS` to the dashboard URL. Google OAuth must allow `${API_BASE_URL}/auth/google/callback`.

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
- `departments`
- `offerings` (includes giving goals)
- `events`
- `families`
- `visitors`
- `attendance`
- `communications`
- `data-quality`
- `family-lifecycle`
- `prayer`
- `mail`
- `sms`
- `file-upload`

## Status

This project is under active development. Interfaces and behavior may change.
