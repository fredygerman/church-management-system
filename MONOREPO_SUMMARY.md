# Church Management System - Monorepo Summary

## ✅ Migration Complete

The project has been successfully migrated from a single Next.js application to a **pnpm monorepo** structure.

## 📦 Architecture Overview

### Three-Tier Structure

```
┌─────────────────────────────────────────────────────────────┐
│                      Root Workspace                         │
│              (pnpm workspaces + Turbo)                      │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
   ┌────────┐  ┌────────┐  ┌─────────────┐
   │ apps/  │  │ apps/  │  │  packages/  │
   │  web   │  │  api   │  │  (shared)   │
   │(Next)  │  │(Nest)  │  │             │
   └────────┘  └────────┘  ├─ db         │
   Port 3000   Port 3001   ├─ config     │
                          ├─ eslint-cfg │
                          └─ ts-cfg     │
                          └─────────────┘
```

## 🎯 Quick Start

```bash
# Install dependencies
pnpm install

# Setup environment
cp .env.example .env.local

# Initialize database
pnpm db:push
pnpm db:seed

# Start development
pnpm dev
```

Visit:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

## 📂 Directory Guide

| Path | Purpose |
|------|---------|
| `apps/web/` | Next.js 14 frontend |
| `apps/api/` | NestJS backend |
| `packages/db/` | Shared Drizzle ORM |
| `packages/config/` | Shared types & DTOs |
| `packages/eslint-config/` | Shared linting rules |
| `packages/typescript-config/` | Shared TS configs |

## 🔧 Available Commands

### Start Development
```bash
pnpm dev              # All apps
pnpm web:dev         # Frontend only
pnpm api:dev         # Backend only
```

### Build & Production
```bash
pnpm build            # Build all
pnpm web:build        # Build frontend
pnpm api:build        # Build backend
pnpm start            # Run all in production
```

### Database
```bash
pnpm db:generate      # Generate migrations
pnpm db:push          # Push to database
pnpm db:seed          # Seed data
pnpm db:studio        # Open Drizzle Studio
```

### Code Quality
```bash
pnpm lint             # Check all
pnpm lint:fix         # Fix issues
pnpm type-check       # Type checking
pnpm format           # Format code
```

## 📚 Documentation

- **[README.md](./README.md)** - Project overview
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Development guide
- **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)** - Migration details
- **[SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md)** - Setup verification

## 🏗️ Technology Stack

### Frontend
- **Next.js 14** - React framework
- **Tailwind CSS** - Styling
- **Radix UI** - Component library
- **React Query** - Data fetching
- **Zod** - Validation
- **NextAuth** - Authentication

### Backend
- **NestJS** - Node.js framework
- **Drizzle ORM** - Database
- **PostgreSQL** - Database
- **Passport** - Authentication
- **JWT** - Tokens

### Shared
- **Drizzle ORM** - Database schema
- **TypeScript** - Type safety
- **ESLint** - Code quality
- **Prettier** - Code formatting

## 🔐 Database Access

### From Frontend (Server Components)
```typescript
import { db, members } from "@church/db";

const data = await db.select().from(members);
```

### From Backend (Services)
```typescript
import { db, members } from "@church/db";

const data = await db.select().from(members);
```

## 🚀 Key Features

✅ Monorepo with shared packages
✅ Turbo build system with caching
✅ Shared database layer
✅ Type-safe database queries
✅ Consistent code quality
✅ Single source of truth

## 📋 Environment Setup

Key variables in `.env.local`:
- `DATABASE_URL` - PostgreSQL connection
- `REDIS_URL` - Redis connection (optional)
- `JWT_SECRET` - JWT signing key
- `SESSION_SECRET` - Session management
- `API_BASE_URL` - Backend URL
- `NEXTAUTH_SECRET` - NextAuth config

See `.env.example` for complete list.

## ✨ Next Steps

1. ✅ Verify installation: `pnpm install`
2. ✅ Start development: `pnpm dev`
3. ⏭️ Test database: `pnpm db:studio`
4. ⏭️ Create your first feature
5. ⏭️ Deploy to production

## 🤝 Team Development

- All developers use `pnpm` (not npm/yarn)
- Always run `pnpm install` after pulling
- Database changes via `pnpm db:generate`
- Code formatting: `pnpm format`
- Before committing: `pnpm lint:fix && pnpm format`

## 📞 Support

Refer to:
- **Setup issues** → [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md)
- **Development help** → [DEVELOPMENT.md](./DEVELOPMENT.md)
- **Migration details** → [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)

---

**Status**: ✅ Monorepo Migration Complete
**Last Updated**: January 4, 2026
**Package Manager**: pnpm 9.12.3+
**Node**: 18+ or 20+
