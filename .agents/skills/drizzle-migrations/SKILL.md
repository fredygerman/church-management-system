---
name: drizzle-migrations
description: Use when changing Drizzle ORM database schema, tables, indexes, enums, relations, or migrations in this repo. Enforces generated migrations and safe migration verification.
---

# Drizzle Migrations

For normal schema changes in this repo, do not hand-write migration SQL.
If a manual migration or manual SQL change seems necessary, stop and ask Fredy for explicit confirmation before creating, editing, or running it.

Workflow:
1. Edit Drizzle schema files first, usually `packages/db/tables/*` and `packages/db/schema.ts`.
2. Export every `pgEnum` used by a table from `packages/db/schema.ts`; otherwise generated migrations can reference enum types without creating them.
3. Run `pnpm db:generate`.
4. Inspect the generated SQL before applying it. Watch for duplicate object creation, missing enum creation, full-schema catch-up migrations, or dropped objects.
5. Run `pnpm db:migrate`.
6. Run `pnpm type-check` and relevant tests.

If generation produces a huge catch-up migration or migrate fails because objects already exist, the migration journal and database are out of sync. Do not patch around it with hand-written SQL. Ask Fredy before any manual SQL or migration repair, then reset the dev database or repair the migration baseline, regenerate, and migrate again.
