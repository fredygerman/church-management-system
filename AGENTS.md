# Agent Instructions

## Database Migrations

- Do not hand-write Drizzle migration SQL for normal schema changes.
- If manual SQL or a manual migration edit seems necessary, ask Fredy for explicit confirmation before creating, editing, or running it.
- Change the schema in `packages/db/tables/*` and `packages/db/schema.ts`.
- Ensure every `pgEnum` used by a table is exported from `packages/db/schema.ts`; otherwise generated migrations can reference enum types without creating them.
- Generate migrations with `pnpm db:generate`.
- Inspect the generated migration before applying it.
- Apply migrations with `pnpm db:migrate`.
- If migration history is stale or conflicts with the database, stop and ask Fredy before any manual SQL or migration repair.
