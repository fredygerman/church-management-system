# Development Guide

Guide for developing and maintaining the Church Management System monorepo.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Workflow](#development-workflow)
3. [Project Structure](#project-structure)
4. [Database Development](#database-development)
5. [Frontend Development](#frontend-development)
6. [Backend Development](#backend-development)
7. [Testing](#testing)
8. [Debugging](#debugging)
9. [Git Workflow](#git-workflow)

## Getting Started

### Prerequisites

- Node.js 18+ or 20+
- pnpm 9.12.3+
- PostgreSQL 14+
- Git

### Initial Setup

```bash
# Clone the repository
git clone <repository-url>
cd church-management-system

# Install dependencies
pnpm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your settings

# Setup database
pnpm db:push

# Start development
pnpm dev
```

## Development Workflow

### Starting Development

```bash
# Start all applications
pnpm dev

# Or start specific applications
pnpm web:dev    # Frontend only
pnpm api:dev    # Backend only
```

### Building for Production

```bash
# Build all
pnpm build

# Build specific
pnpm web:build
pnpm api:build
```

### Running in Production

```bash
# Start all in production mode
pnpm start
```

## Project Structure

### Root Level

```
.
├── apps/                    # Executable applications
│   ├── web/                # Next.js frontend
│   └── api/                # NestJS backend
├── packages/               # Shared packages
│   ├── db/                # Database layer (Drizzle ORM)
│   ├── config/            # Shared types and DTOs
│   ├── eslint-config/     # ESLint rules
│   └── typescript-config/ # TypeScript configs
├── turbo.json             # Turbo build config
├── pnpm-workspace.yaml    # Workspace definition
├── package.json           # Root config
├── .env.example           # Environment template
├── README.md              # Project overview
└── MIGRATION_GUIDE.md     # Migration documentation
```

### Frontend (`apps/web`)

```
web/
├── app/                   # Next.js app directory
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Home page
│   ├── api/              # API routes
│   ├── auth/             # Auth routes
│   ├── members/          # Members routes
│   └── [workspaceId]/    # Dynamic routes
├── components/           # React components
│   ├── ui/              # UI components (Radix)
│   ├── layout/          # Layout components
│   ├── members/         # Member-specific components
│   └── ...
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions
├── styles/              # Global styles
├── types/               # TypeScript types
├── actions/             # Server Actions
├── config/              # Configuration
├── public/              # Static assets
├── next.config.js       # Next.js config
├── tailwind.config.ts   # Tailwind config
└── package.json         # Dependencies
```

### Backend (`apps/api`)

```
api/
├── src/
│   ├── main.ts                # Application entry
│   ├── app.module.ts          # Root module
│   ├── app.service.ts         # Root service
│   ├── auth/                  # Authentication module
│   ├── users/                 # Users module
│   ├── members/               # Members module
│   ├── config/                # Configuration
│   ├── database/              # Database config
│   ├── common/                # Common utilities
│   ├── core/                  # Core modules
│   ├── file-upload/           # File upload module
│   ├── mail/                  # Email module
│   ├── payment/               # Payment module
│   ├── sms/                   # SMS module
│   └── ...
├── test/                      # Test files
├── dist/                      # Compiled output
├── nest-cli.json              # NestJS CLI config
├── tsconfig.json              # TypeScript config
└── package.json               # Dependencies
```

### Database (`packages/db`)

```
db/
├── schema.ts            # Database schema
├── migrate.ts           # Migration utilities
├── seed.ts              # Database seeds
├── index.ts             # Package exports
├── drizzle.config.ts    # Drizzle config
├── tables/              # Table definitions (organized)
├── meta/                # Drizzle metadata
├── seeds/               # Seed data
└── migrations/          # Generated migrations
```

### Shared Config (`packages/config`)

```
config/
├── src/
│   ├── index.ts         # Main exports
│   ├── types/           # TypeScript types
│   ├── schemas/         # Zod schemas
│   └── dtos/            # Data Transfer Objects
└── package.json
```

## Database Development

### Understanding the Schema

The database schema is defined in `packages/db/schema.ts` using Drizzle ORM:

```typescript
import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

### Making Schema Changes

1. **Update schema** in `packages/db/schema.ts`
2. **Generate migration:**
   ```bash
   pnpm db:generate
   ```
3. **Review generated SQL** in `packages/db/migrations/`
4. **Push to database:**
   ```bash
   pnpm db:push
   ```

### Adding Seeds

Edit `packages/db/seed.ts`:

```typescript
async function main() {
  console.log("Seeding database...");
  
  await db.insert(users).values([
    { email: "user@example.com", name: "Test User" },
    // ...
  ]);
  
  console.log("Seeding complete");
}
```

Run seeds:

```bash
pnpm db:seed
```

### Exploring Database

Use Drizzle Studio:

```bash
pnpm db:studio
```

This opens an interactive database explorer at `http://localhost:5555`

## Frontend Development

### Creating a New Page

```bash
# Create directory structure
mkdir -p apps/web/app/my-feature

# Create page file
touch apps/web/app/my-feature/page.tsx
```

**Example page:**

```typescript
// apps/web/app/my-feature/page.tsx
import { db, myTable } from "@church/db";

export default async function MyFeaturePage() {
  const data = await db.select().from(myTable);
  
  return (
    <main className="container py-8">
      <h1 className="text-3xl font-bold">My Feature</h1>
      {/* Render data */}
    </main>
  );
}
```

### Creating Components

```typescript
// apps/web/components/my-component.tsx
"use client";

import { ReactNode } from "react";

interface MyComponentProps {
  children?: ReactNode;
  title: string;
}

export function MyComponent({ children, title }: MyComponentProps) {
  return (
    <div className="rounded-lg border p-4">
      <h2 className="text-xl font-semibold">{title}</h2>
      {children}
    </div>
  );
}
```

### Using Server Actions

```typescript
// apps/web/actions/my-action.ts
"use server";

import { db, myTable } from "@church/db";
import { revalidatePath } from "next/cache";

export async function createItem(formData: FormData) {
  const name = formData.get("name");
  
  const result = await db.insert(myTable).values({ name });
  
  revalidatePath("/my-feature");
  
  return result;
}
```

### Using Custom Hooks

```typescript
// apps/web/hooks/use-my-data.ts
"use client";

import { useEffect, useState } from "react";

export function useMyData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Fetch data
  }, []);
  
  return { data, loading };
}
```

## Backend Development

### Creating a New Module

```bash
# Generate module
nest generate module features/my-module
nest generate service features/my-module
nest generate controller features/my-module
```

### Example Module Structure

```typescript
// src/features/my-module/my-module.module.ts
import { Module } from "@nestjs/common";
import { MyModuleService } from "./my-module.service";
import { MyModuleController } from "./my-module.controller";

@Module({
  controllers: [MyModuleController],
  providers: [MyModuleService],
  exports: [MyModuleService],
})
export class MyModuleModule {}
```

### Using Database in Service

```typescript
// src/features/my-module/my-module.service.ts
import { Injectable } from "@nestjs/common";
import { db, myTable, eq } from "@church/db";

@Injectable()
export class MyModuleService {
  async findAll() {
    return await db.select().from(myTable);
  }
  
  async findOne(id: number) {
    return await db
      .select()
      .from(myTable)
      .where(eq(myTable.id, id))
      .limit(1);
  }
  
  async create(data: CreateMyDTO) {
    return await db.insert(myTable).values(data);
  }
}
```

### Creating API Endpoints

```typescript
// src/features/my-module/my-module.controller.ts
import { Controller, Get, Post, Body, Param } from "@nestjs/common";
import { MyModuleService } from "./my-module.service";

@Controller("my-module")
export class MyModuleController {
  constructor(private readonly service: MyModuleService) {}
  
  @Get()
  async findAll() {
    return await this.service.findAll();
  }
  
  @Get(":id")
  async findOne(@Param("id") id: string) {
    return await this.service.findOne(parseInt(id));
  }
  
  @Post()
  async create(@Body() createDTO: CreateMyDTO) {
    return await this.service.create(createDTO);
  }
}
```

### Using Shared DTOs

```typescript
// packages/config/src/dtos/my-module.ts
import { z } from "zod";

export const CreateMyDTOSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

export type CreateMyDTO = z.infer<typeof CreateMyDTOSchema>;
```

## Testing

### Frontend Testing

```bash
# Run tests
pnpm web test

# Watch mode
pnpm web test:watch

# Coverage
pnpm web test:cov
```

### Backend Testing

```bash
# Run tests
pnpm api test

# Watch mode
pnpm api test:watch

# E2E tests
pnpm api test:e2e

# Coverage
pnpm api test:cov
```

## Debugging

### VS Code Debugging

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "NestJS Debug",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/nest",
      "args": ["start", "--debug", "--watch"],
      "cwd": "${workspaceFolder}/apps/api",
      "outFiles": ["${workspaceFolder}/apps/api/dist/**/*.js"]
    }
  ]
}
```

### Browser DevTools

- Frontend: Use Chrome DevTools (F12)
- Backend: Use REST client or Postman

### Logs

```bash
# View all logs
pnpm dev

# View specific logs
pnpm api:dev 2>&1 | grep "error"
```

## Git Workflow

### Branching Strategy

```bash
# Feature branch
git checkout -b feature/feature-name

# Bugfix branch
git checkout -b bugfix/bug-name

# Release branch
git checkout -b release/v1.0.0
```

### Commit Guidelines

```bash
# Good commits
git commit -m "feat: add user authentication"
git commit -m "fix: resolve member list pagination"
git commit -m "docs: update database setup guide"
git commit -m "refactor: optimize query performance"
git commit -m "test: add member service tests"

# Avoid
git commit -m "update"
git commit -m "fix stuff"
```

### Pull Request Process

1. Create feature branch
2. Make changes
3. Run tests: `pnpm test`
4. Run linting: `pnpm lint:fix`
5. Format code: `pnpm format`
6. Create Pull Request
7. Request review
8. Merge after approval

## Common Tasks

### Adding a Feature

1. **Create database schema** (if needed)
   ```bash
   # Update packages/db/schema.ts
   pnpm db:generate
   pnpm db:push
   ```

2. **Create API endpoint** (if needed)
   ```bash
   nest generate module features/my-feature
   # Implement service and controller
   ```

3. **Create frontend page/component**
   ```bash
   # Create in apps/web/
   # Use API client or direct DB access
   ```

4. **Test everything**
   ```bash
   pnpm dev
   # Manual testing
   ```

### Updating Dependencies

```bash
# Check outdated packages
pnpm outdated

# Update all
pnpm update -r

# Update specific package
pnpm update react@latest
```

### Code Quality

```bash
# Lint
pnpm lint

# Fix linting issues
pnpm lint:fix

# Type check
pnpm type-check

# Format code
pnpm format
```

## Performance Tips

1. **Use Turbo cache** - build artifacts are cached
2. **Use database indexes** - for frequently queried columns
3. **Optimize images** - use Next.js `Image` component
4. **Lazy load components** - use `dynamic()` in Next.js
5. **Monitor bundle size** - use `npm-check-updates`

## Helpful Resources

- [Turbo Docs](https://turbo.build/repo/docs)
- [pnpm Docs](https://pnpm.io)
- [Next.js Docs](https://nextjs.org/docs)
- [NestJS Docs](https://nestjs.com)
- [Drizzle Docs](https://orm.drizzle.team)
- [PostgreSQL Docs](https://www.postgresql.org/docs)
