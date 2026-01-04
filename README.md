# Church Management System - Monorepo

A modern monorepo for the Church Management System using pnpm workspaces, Turbo, Next.js, and NestJS.

## Overview

This is a church management system platform designed to help churches manage their members, events, donations, and communications efficiently. The platform provides tools for tracking attendance, organizing events, managing donations, and communicating with members through various channels.

## ⚠️ Warning

This project is under active development. Features and functionality may change frequently.

## 📦 Workspace Structure

```
.
├── apps/
│   ├── web/              # Next.js frontend application
│   └── api/              # NestJS backend application
├── packages/
│   ├── db/               # Shared Drizzle ORM database layer
│   ├── config/           # Shared configuration (types, DTOs, etc.)
│   ├── eslint-config/    # Shared ESLint configuration
│   └── typescript-config/ # Shared TypeScript configuration
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ or 20+
- pnpm 9.12.3+
- PostgreSQL 14+

### Installation

```bash
# Install dependencies
pnpm install

# Setup environment variables
cp .env.example .env.local

# Setup database
pnpm db:push
pnpm db:seed
```

### Development

```bash
# Start all apps
pnpm dev

# Or start individually
pnpm web:dev   # Frontend only
pnpm api:dev   # Backend only
```

Visit:
- Frontend: [http://localhost:3000](http://localhost:3000)
- API: [http://localhost:3001](http://localhost:3001)

## 📚 Available Scripts

### Root Level

- `pnpm dev` - Start all apps in development mode
- `pnpm build` - Build all apps
- `pnpm start` - Start all apps in production
- `pnpm lint` - Lint all packages
- `pnpm lint:fix` - Fix linting issues
- `pnpm type-check` - Type checking
- `pnpm format` - Format code with Prettier
- `pnpm clean` - Clean all build artifacts

### Frontend (Web)

- `pnpm web:dev` - Start Next.js dev server
- `pnpm web:build` - Build Next.js app

### Backend (API)

- `pnpm api:dev` - Start NestJS dev server
- `pnpm api:build` - Build NestJS app

### Database

- `pnpm db:generate` - Generate Drizzle migrations
- `pnpm db:push` - Push migrations to database
- `pnpm db:migrate` - Run migrations
- `pnpm db:seed` - Seed database with initial data
- `pnpm db:studio` - Open Drizzle Studio

## 🏗️ Architecture

### Frontend (`apps/web`)
- Next.js 14 with React 18
- Server Components & Actions
- NextAuth for authentication
- TailwindCSS + Radix UI
- Zod for validation
- React Query for data fetching

### Backend (`apps/api`)
- NestJS framework
- JWT authentication
- Drizzle ORM with PostgreSQL
- RESTful API
- Email (Resend)
- File uploads
- Payment processing
- SMS notifications

### Shared Packages
- `@church/db` - Database schema and migrations
- `@church/config` - Types, DTOs, configurations
- `@church/eslint-config` - ESLint rules
- `@church/typescript-config` - TypeScript configs

## 🔧 Environment Setup

Copy `.env.example` to `.env.local` and configure:

```bash
cp .env.example .env.local
```

Key variables:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret
- `SESSION_SECRET` - Session secret
- `API_BASE_URL` - Backend API URL
- `RESEND_API_KEY` - Email service key

## 📖 Additional Documentation

- [Development Guide](./docs/DEVELOPMENT.md)
- [Database Setup](./docs/DATABASE.md)
- [API Documentation](./docs/API.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Commit: `git commit -m 'Add feature'`
4. Push: `git push origin feature/your-feature`
5. Open a Pull Request

## 👨‍💻 Authors

- [@fredygerman](https://github.com/fredygerman)
- Mito ya Baraka Church IT team

## 📄 License

MIT License
