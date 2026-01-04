# Monorepo Migration Guide

This document outlines the migration from a single Next.js application to a monorepo architecture.

## Overview

The project has been successfully migrated from a single Next.js application to a **pnpm monorepo** with the following structure:

```
church-management-system/
├── apps/
│   ├── web/           # Next.js frontend (port 3000)
│   └── api/           # NestJS backend (port 3001)
├── packages/
│   ├── db/            # Shared Drizzle ORM layer
│   ├── config/        # Shared types, DTOs, schemas
│   ├── eslint-config/ # Shared ESLint configuration
│   └── typescript-config/ # Shared TypeScript configuration
├── turbo.json         # Turbo build system configuration
├── pnpm-workspace.yaml # pnpm workspace definition
└── package.json       # Root package configuration
```

## Key Changes

### 1. **Workspace Structure**

#### Before (Single App)
```
project/
├── app/
├── components/
├── hooks/
├── lib/
├── actions/
├── db/
├── drizzle/
└── package.json
```

#### After (Monorepo)
```
project/
├── apps/web/          # Frontend application
├── apps/api/          # Backend application
├── packages/db/       # Database (shared)
├── packages/config/   # Shared config
└── package.json       # Root workspace
```

### 2. **Frontend (`apps/web`)**

- **Port:** 3000
- **Framework:** Next.js 14
- **Technology Stack:**
  - React 18
  - Next Auth
  - Radix UI
  - TailwindCSS
  - React Query
  - Zod

**Key Features:**
- Server Components & Actions
- API routes for NextAuth integration
- Direct database access via `@church/db`
- Server-only utilities

### 3. **Backend (`apps/api`)**

- **Port:** 3001
- **Framework:** NestJS
- **Technology Stack:**
  - TypeScript
  - Drizzle ORM
  - PostgreSQL
  - JWT Authentication
  - Passport.js

**Key Features:**
- RESTful API endpoints
- JWT-based authentication
- Database schema access via `@church/db`
- Shared types from `@church/config`

### 4. **Shared Database (`packages/db`)**

**Exports:**
- Database schema (Drizzle ORM)
- Migration utilities
- Seed scripts
- All Drizzle ORM functions

**Usage:**
```typescript
import { 
  db, 
  eq, 
  desc,
  // ... schema tables
  users,
  members,
  // ...
} from "@church/db";
```

### 5. **Shared Configuration (`packages/config`)**

**Contains:**
- TypeScript interfaces/types
- Zod schemas
- DTOs (Data Transfer Objects)
- Notification types
- Payment schemas

**Usage:**
```typescript
import { CreateUserDTO, UserSchema } from "@church/config";
```

## Database Access Pattern

### From Frontend (Next.js)

```typescript
// app/members/page.tsx
import { db, members, eq } from "@church/db";

export default async function MembersPage() {
  const allMembers = await db.select().from(members);
  return <div>{/* render members */}</div>;
}
```

### From Backend (NestJS)

```typescript
// src/users/users.service.ts
import { db, users, eq } from "@church/db";
import { Injectable } from "@nestjs/common";

@Injectable()
export class UsersService {
  async findAll() {
    return await db.select().from(users);
  }
}
```

## Common Scripts

### Development

```bash
# Start all apps
pnpm dev

# Start frontend only
pnpm web:dev

# Start backend only
pnpm api:dev
```

### Building

```bash
# Build all apps
pnpm build

# Build frontend only
pnpm web:build

# Build backend only
pnpm api:build
```

### Database

```bash
# Generate migrations
pnpm db:generate

# Push migrations to database
pnpm db:push

# Run seeds
pnpm db:seed

# Open Drizzle Studio
pnpm db:studio
```

### Code Quality

```bash
# Lint all packages
pnpm lint

# Fix linting issues
pnpm lint:fix

# Type checking
pnpm type-check

# Format code
pnpm format
```

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
cp .env.example .env.local
```

**Key Variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - JWT signing secret
- `SESSION_SECRET` - Session management secret
- `API_BASE_URL` - Backend API URL for frontend
- `NEXTAUTH_SECRET` - NextAuth configuration

## Package Dependencies

### Frontend (`apps/web`)

Depends on:
- `@church/db` - Database layer
- `@church/config` - Shared types (optional)

### Backend (`apps/api`)

Depends on:
- `@church/db` - Database layer
- `@church/config` - Shared types and DTOs

### Database (`packages/db`)

Has no dependencies on other workspace packages.

## Adding New Features

### Adding a New Database Table

1. **Update schema** in `packages/db/schema.ts`
2. **Generate migration:**
   ```bash
   pnpm db:generate
   ```
3. **Push migration:**
   ```bash
   pnpm db:push
   ```
4. **Update seed** (if needed) in `packages/db/seed.ts`

### Adding a New API Endpoint

1. **Create module** in `apps/api/src/`
2. **Import database** from `@church/db`
3. **Define DTOs** in `packages/config/`
4. **Create service** with database operations
5. **Create controller** with route handlers

### Adding a New Frontend Page

1. **Create page component** in `apps/web/app/`
2. **Import database** from `@church/db`
3. **Create Server Action** if needed in `apps/web/actions/`
4. **Use components** from shared library

## File Locations Reference

| Type | Location | Example |
|------|----------|---------|
| Frontend Pages | `apps/web/app/` | `pages/members/page.tsx` |
| Frontend Components | `apps/web/components/` | `components/members/member-card.tsx` |
| Frontend Hooks | `apps/web/hooks/` | `hooks/use-members.ts` |
| Backend Modules | `apps/api/src/` | `src/members/members.module.ts` |
| Backend Services | `apps/api/src/` | `src/members/members.service.ts` |
| Database Schema | `packages/db/` | `schema.ts` |
| Shared Types | `packages/config/src/` | `types/user.ts` |
| ESLint Config | `packages/eslint-config/` | Various `.js` files |

## Troubleshooting

### Dependencies Not Found

**Issue:** `Cannot find module '@church/db'`

**Solution:**
1. Ensure `packages/db/package.json` exists
2. Run `pnpm install` in the root
3. Verify `pnpm-workspace.yaml` includes `packages/*`

### Monorepo Scripts Not Working

**Issue:** Commands like `pnpm dev` don't work

**Solution:**
1. Verify root `package.json` has the scripts defined
2. Check `turbo.json` exists and is valid
3. Run `pnpm install` to ensure dependencies are installed

### Port Conflicts

**Issue:** Port 3000 or 3001 already in use

**Solution:**
```bash
# Frontend on different port
PORT=3002 pnpm web:dev

# Backend on different port
PORT=3002 pnpm api:dev
```

### Database Connection Issues

**Issue:** Cannot connect to PostgreSQL

**Solution:**
1. Verify `DATABASE_URL` in `.env.local`
2. Check PostgreSQL is running
3. Verify credentials in connection string
4. Test with: `psql $DATABASE_URL`

## Migration Checklist

- [x] Created `apps/web/` with Next.js application
- [x] Created `apps/api/` with NestJS application
- [x] Created `packages/db/` with Drizzle schema
- [x] Created `packages/config/` with shared types
- [x] Setup `pnpm-workspace.yaml`
- [x] Created root `package.json` with scripts
- [x] Created `turbo.json` build configuration
- [x] Updated all package names with `@church/` namespace
- [x] Created `.env.example` with all variables
- [x] Updated `README.md` with monorepo documentation
- [ ] Test all scripts: `pnpm dev`, `pnpm build`, etc.
- [ ] Verify database migrations run
- [ ] Test frontend and backend communication
- [ ] Update deployment configuration
- [ ] Archive or remove `mono-repo-stuff/` directory

## Next Steps

1. **Test the setup:**
   ```bash
   pnpm install
   pnpm db:push
   pnpm dev
   ```

2. **Verify both apps start:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

3. **Test database operations:**
   ```bash
   pnpm db:seed
   ```

4. **Update deployment:**
   - Update Docker configuration
   - Update CI/CD pipelines
   - Update environment variables

5. **Clean up:**
   - Remove `mono-repo-stuff/` directory once verified
   - Remove old configuration files
   - Update documentation

## References

- [Turbo Documentation](https://turbo.build)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [Drizzle ORM](https://orm.drizzle.team)
- [NestJS Documentation](https://nestjs.com)
- [Next.js Documentation](https://nextjs.org)
