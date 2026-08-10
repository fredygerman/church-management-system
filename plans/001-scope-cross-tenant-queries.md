# Plan 001: Close the confirmed cross-tenant data leaks in visitor followups and user delete/restore

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**:
> `git diff --stat 38d74e8..HEAD -- apps/api/src/visitors apps/api/src/users apps/api/src/churches apps/api/src/events`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `38d74e8`, 2026-08-10

## Why this matters

This is a multi-tenant church management system. Every table is partitioned by
`churchId`, and the global `ChurchContextGuard` establishes *which church the
caller is acting as* — but it does **not** verify that the row identified by a
`:id` path parameter belongs to that church. Two code paths rely on the guard
for protection it does not provide:

1. **Visitor followups** are readable and writable across churches by anyone
   with the `read:visitation` / `create:visitation` permission in *any* church.
   Followup notes are pastoral-care records — the most sensitive free text in
   the product. An attacker needs only a visitor UUID.
2. **User soft-delete and restore** operate on `users.id` with no church
   filter, so an `admin` of Church A can delete or resurrect a user account
   belonging to Church B.

After this plan lands, both paths verify row ownership before acting, matching
the scoping convention already used by every other endpoint in these modules.

## Current state

### Files involved

- `apps/api/src/visitors/visitors.controller.ts` — three endpoints (lines
  129–164) do not read the request's church context at all, unlike the eight
  endpoints above them in the same file.
- `apps/api/src/visitors/visitors.service.ts` — `createFollowup`,
  `getFollowupsByVisitor`, `getLatestFollowupStatus` take only `visitorId`.
- `apps/api/src/users/users.service.ts` — `deleteUser` / `restoreUser` update
  `users` by id alone.
- `apps/api/src/users/users.controller.ts` — the two callers.
- `apps/api/src/churches/churches.service.ts` — `getChurchById` omits the
  soft-delete filter (small, unrelated to the above, included because it is a
  one-line fix in the same class of bug).
- `apps/api/src/events/events.service.ts` — `setAttendance` accepts arbitrary
  member ids (see Step 5; this is data integrity, **not** a cross-tenant leak).

### How church scoping works in this repo — read this before touching anything

`ChurchContextGuard` is registered **globally** in `apps/api/src/app.module.ts:78`,
so it runs on every non-`@Public()` route. It resolves the caller's active
church, verifies the caller has an `active` membership in it, and then stores
it on the request (`apps/api/src/auth/guards/church-context.guard.ts:110-114`):

```ts
// apps/api/src/auth/guards/church-context.guard.ts:110-114
    // Store churchId in request for use in controllers
    request['churchId'] = requestedChurchId
    if (request.body && typeof request.body === 'object') {
      request.body.churchId = requestedChurchId
    }
```

**The guard authorizes the caller, not the target row.** For a route like
`GET /visitors/:id/followups` the guard resolves `requestedChurchId` from the
caller's own membership — the `:id` in the path is never consulted. Every
handler is therefore responsible for scoping its own query. That is the bug
this plan fixes.

**The convention for reading it in a controller** (`visitors.controller.ts`
uses this in all eight of its other endpoints):

```ts
// apps/api/src/visitors/visitors.controller.ts:64-72 — the exemplar to match
  @Get(':id')
  @RequirePermission('view:visitors')
  async getOne(@Req() request: Request, @Param('id') id: string) {
    const visitor = await this.visitorsService.getVisitorById(request['churchId'] as string, id)
    if (!visitor) {
      throw new BadRequestException(`Visitor with ID ${id} not found`)
    }
    return visitor
  }
```

`users.controller.ts` uses a different but equally valid accessor, already
present in that file at line 157 — `const churchId = req.user.churchId;`.
**Match whichever convention the file you are editing already uses.** Do not
introduce a third.

### Excerpt 1 — the unscoped visitor followup endpoints

```ts
// apps/api/src/visitors/visitors.controller.ts:129-164 — CURRENT (broken)
  @Post(':id/followup')
  @RequirePermission('create:visitation')
  async createFollowup(
    @Param('id') id: string,
    @Body() createFollowupDto: CreateVisitorFollowupDto,
  ) {
    if (!createFollowupDto.status) {
      throw new BadRequestException('status is required')
    }

    return this.visitorsService.createFollowup({
      visitorId: id,
      status: createFollowupDto.status,
      notes: createFollowupDto.notes,
      followupDate: createFollowupDto.followupDate ? new Date(createFollowupDto.followupDate) : undefined,
      completedBy: createFollowupDto.completedBy,
    })
  }

  @Get(':id/followups')
  @RequirePermission('read:visitation')
  async getFollowups(@Param('id') id: string) {
    return this.visitorsService.getFollowupsByVisitor(id)
  }

  @Get(':id/latest-followup')
  @RequirePermission('read:visitation')
  async getLatestFollowup(@Param('id') id: string) {
    return this.visitorsService.getLatestFollowupStatus(id)
  }
```

Note the absence of `@Req() request: Request` in all three — that is the tell.

### Excerpt 2 — the unscoped service methods

```ts
// apps/api/src/visitors/visitors.service.ts:165-201 — CURRENT (broken)
  async createFollowup(data: {
    visitorId: string
    status: string
    notes?: string
    followupDate?: Date | string
    completedBy?: string
  }): Promise<VisitorFollowup> {
    const [followup] = await db.insert(visitorFollowups).values({
      ...data,
      followupDate: toDateString(data.followupDate || new Date()) as any,
    }).returning()
    return followup
  }

  async getFollowupsByVisitor(visitorId: string): Promise<VisitorFollowup[]> {
    return db.query.visitorFollowups.findMany({
      where: and(
        eq(visitorFollowups.visitorId, visitorId),
        isNull(visitorFollowups.deletedAt),
      ),
    })
  }

  async getLatestFollowupStatus(visitorId: string): Promise<VisitorFollowup | undefined> {
    const followups = await this.getFollowupsByVisitor(visitorId)
    return followups.length > 0 ? followups[followups.length - 1] : undefined
  }
```

### CRITICAL: `visitor_followups` has no `churchId` column

```ts
// packages/db/tables/visitors.ts:60-77 — the schema, DO NOT CHANGE IT
export const visitorFollowups = pgTable(
  "visitor_followups",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`).notNull(),
    visitorId: uuid("visitor_id").references(() => visitors.id).notNull(),
    status: visitorFollowupStatusEnum("status").default("none"),
    notes: text("notes"),
    followupDate: date("followup_date"),
    completedBy: uuid("completed_by"),
    createdAt: date("created_at").defaultNow(),
    updatedAt: date("updated_at").defaultNow(),
    deletedAt: date("deleted_at"),
  },
  ...
```

**You cannot add `eq(visitorFollowups.churchId, ...)` — that column does not
exist.** Tenancy is enforced through the parent `visitors` row, which does have
`churchId`. The correct fix is to verify the parent visitor belongs to the
church first, then operate on its followups. **Do not add a `churchId` column
and do not write a migration** — see the repo rule below.

`visitors.service.ts` already has the ownership-check helper you need, and
already uses exactly this pattern in `convertVisitorToMember`:

```ts
// apps/api/src/visitors/visitors.service.ts:104 — the pattern to copy
    const visitor = await this.getVisitorById(data.churchId, data.visitorId)

    if (!visitor) {
      throw new BadRequestException(`Visitor with ID ${data.visitorId} not found`)
    }
```

### Excerpt 3 — the unscoped user delete/restore

```ts
// apps/api/src/users/users.service.ts:266-296 — CURRENT (broken)
  async deleteUser(userId: string): Promise<void> {
    const [user] = await this.db
      .update(users)
      .set({ deletedAt: new Date().toISOString() })
      .where(eq(users.id, userId))
      .returning();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    this.logger.log(`Soft deleted user: ${userId}`);
  }

  async restoreUser(userId: string): Promise<User> {
    const [user] = await this.db
      .update(users)
      .set({ deletedAt: null })
      .where(eq(users.id, userId))
      .returning();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    this.logger.log(`Restored user: ${userId}`);
    return user;
  }
```

The correctly-scoped exemplar is **in the same file, 8 lines above** —
`updateUserRole` ends with:

```ts
// apps/api/src/users/users.service.ts:256-259 — the pattern to copy
    await this.db
      .update(users)
      .set({ role: nextRole })
      .where(and(eq(users.id, userId), eq(users.churchId, churchId)));
```

Their callers:

```ts
// apps/api/src/users/users.controller.ts:234-235 and 274-275 — CURRENT
  async deleteUser(@Request() req: any) {
    await this.usersService.deleteUser(req.params.userId);
...
  async restoreUser(@Request() req: any) {
    const user = await this.usersService.restoreUser(req.params.userId);
```

### Repo convention: NEVER hand-write migrations

`AGENTS.md` at the repo root states, verbatim:

> - Do not hand-write Drizzle migration SQL for normal schema changes.
> - If manual SQL or a manual migration edit seems necessary, ask Fredy for
>   explicit confirmation before creating, editing, or running it.

**This plan requires zero schema changes.** If you conclude you need one, that
is a STOP condition — do not run `pnpm db:generate` or `pnpm db:migrate`.

### Code style

Two styles coexist and are split by module. Match the file you are in:

- `visitors/`, `churches/`, `events/` — **no semicolons**, single quotes, 2-space indent.
- `users/` — **semicolons**, single quotes, 2-space indent.

## Commands you will need

Run all commands from the repo root.

| Purpose | Command | Expected on success |
|---|---|---|
| Install | `pnpm install` | exit 0 (deps are already installed; only run if imports fail to resolve) |
| Typecheck | `pnpm --filter api type-check` | exit 0, no errors |
| Tests (all) | `pnpm --filter api test` | exit 0, all suites pass |
| Tests (one file) | `pnpm --filter api test -- visitors.service.spec` | exit 0 |
| Lint (check only) | `pnpm --filter api exec eslint "src/**/*.ts"` | exit 0 |

**Do not run `pnpm --filter api lint`.** That script is defined as
`eslint ... --fix` (`apps/api/package.json`), which rewrites files. Use the
explicit `eslint` invocation in the table, which does not.

There is no CI workflow in this repo (`.github/workflows/` is empty), so these
local commands are the only gate. There are 8 existing `*.spec.ts` files under
`apps/api/src`; they must all still pass.

## Scope

**In scope** (the only files you may modify):

- `apps/api/src/visitors/visitors.controller.ts`
- `apps/api/src/visitors/visitors.service.ts`
- `apps/api/src/users/users.service.ts`
- `apps/api/src/users/users.controller.ts`
- `apps/api/src/churches/churches.service.ts` (Step 4 only — one line)
- `apps/api/src/events/events.service.ts` (Step 5 only)
- `apps/api/src/visitors/visitors.service.spec.ts` (**create**)
- `plans/README.md` (status row only)

**Out of scope** (do NOT touch, even though they look related):

- `packages/db/**` — no schema changes are needed. See the AGENTS.md rule above.
- `apps/api/src/auth/guards/church-context.guard.ts` — the guard is working as
  designed. Changing it would alter authorization for every route in the app.
- `apps/api/src/churches/churches.controller.ts` — the `update` and `delete`
  handlers pass a raw `:id` through, which **looks** like the same bug but is
  not. `ChurchContextGuard` has a dedicated branch for this route
  (`church-context.guard.ts:37-38`, `request.path.startsWith('/churches/')` →
  `request.params.id`), and there is no global route prefix, so the guard does
  resolve and membership-check the target church id. Leave it alone.
- `apps/api/src/visitors/visitors.service.ts` → `convertVisitorToMember`. Its
  `update(visitorFollowups)` at line 156 filters on `visitorId` only, which
  again looks like the same bug — but the visitor is ownership-verified at line
  104 before that write. It is already correct.
- Public response shapes for the endpoints you touch. The web app calls these;
  keep the returned JSON identical.
- Any performance work (pagination, N+1). Tracked separately.

## Git workflow

- Branch: `advisor/001-scope-cross-tenant-queries`
- Commit style is conventional commits scoped by module — from `git log`:
  `fix(events): scope the headcount-only attendance write to the owning church`
  Use e.g. `fix(visitors): scope followup endpoints to the owning church`.
- Do NOT push, open a PR, or merge. Leave the branch for review.
- Per repo config, do not add `Co-Authored-By:` lines to commit messages.

## Steps

### Step 1: Scope the visitor followup service methods to a church

In `apps/api/src/visitors/visitors.service.ts`:

1. Add a `churchId: string` field to the `createFollowup` `data` parameter
   object. At the top of the method body, verify ownership and strip
   `churchId` before the insert (the table has no such column, so spreading it
   into `.values()` would break):

   ```ts
   async createFollowup(data: {
     churchId: string
     visitorId: string
     status: string
     notes?: string
     followupDate?: Date | string
     completedBy?: string
   }): Promise<VisitorFollowup> {
     const { churchId, ...followupData } = data
     const visitor = await this.getVisitorById(churchId, data.visitorId)
     if (!visitor) {
       throw new BadRequestException(`Visitor with ID ${data.visitorId} not found`)
     }

     const [followup] = await db.insert(visitorFollowups).values({
       ...followupData,
       followupDate: toDateString(data.followupDate || new Date()) as any,
     }).returning()
     return followup
   }
   ```

2. Change `getFollowupsByVisitor(visitorId: string)` to
   `getFollowupsByVisitor(churchId: string, visitorId: string)`. Verify
   ownership first and return `[]` when the visitor is not in that church
   (a read should not disclose existence — return empty, do not throw):

   ```ts
   async getFollowupsByVisitor(churchId: string, visitorId: string): Promise<VisitorFollowup[]> {
     const visitor = await this.getVisitorById(churchId, visitorId)
     if (!visitor) return []

     return db.query.visitorFollowups.findMany({
       where: and(
         eq(visitorFollowups.visitorId, visitorId),
         isNull(visitorFollowups.deletedAt),
       ),
     })
   }
   ```

3. Change `getLatestFollowupStatus(visitorId: string)` to
   `getLatestFollowupStatus(churchId: string, visitorId: string)` and forward
   both arguments to `getFollowupsByVisitor`. Its body otherwise stays as-is.

Note: `getVisitorById` already filters `isNull(visitors.deletedAt)`, so a
soft-deleted visitor's followups become unreachable through these paths. That
is intended.

`BadRequestException` is already imported at line 1 of this file.

**Verify**: `pnpm --filter api type-check` → fails with errors **only** in
`visitors.controller.ts` (the callers you fix in Step 2). If errors appear in
any other file, STOP.

### Step 2: Pass the request's church context from the visitor controller

In `apps/api/src/visitors/visitors.controller.ts`, add `@Req() request: Request`
as the **first** parameter of `createFollowup`, `getFollowups`, and
`getLatestFollowup`, and forward `request['churchId'] as string`. Match the
formatting of `getOne` at line 64. `Req` and `Request` are already imported
(lines 11 and 13).

```ts
  @Post(':id/followup')
  @RequirePermission('create:visitation')
  async createFollowup(
    @Req() request: Request,
    @Param('id') id: string,
    @Body() createFollowupDto: CreateVisitorFollowupDto,
  ) {
    if (!createFollowupDto.status) {
      throw new BadRequestException('status is required')
    }

    return this.visitorsService.createFollowup({
      churchId: request['churchId'] as string,
      visitorId: id,
      status: createFollowupDto.status,
      notes: createFollowupDto.notes,
      followupDate: createFollowupDto.followupDate ? new Date(createFollowupDto.followupDate) : undefined,
      completedBy: createFollowupDto.completedBy,
    })
  }

  @Get(':id/followups')
  @RequirePermission('read:visitation')
  async getFollowups(@Req() request: Request, @Param('id') id: string) {
    return this.visitorsService.getFollowupsByVisitor(request['churchId'] as string, id)
  }

  @Get(':id/latest-followup')
  @RequirePermission('read:visitation')
  async getLatestFollowup(@Req() request: Request, @Param('id') id: string) {
    return this.visitorsService.getLatestFollowupStatus(request['churchId'] as string, id)
  }
```

Do not add a manual `if (!churchId) throw` guard here — `ChurchContextGuard`
already rejects the request before the handler runs when church context cannot
be resolved, and the other endpoints in this file rely on that.

**Verify**: `pnpm --filter api type-check` → exit 0, no errors.

### Step 3: Scope user delete and restore to the caller's church

In `apps/api/src/users/users.service.ts`, add a `churchId: string` parameter to
both methods and add the church predicate to the `where` clause, exactly
mirroring `updateUserRole` at lines 256-259:

```ts
  async deleteUser(userId: string, churchId: string): Promise<void> {
    const [user] = await this.db
      .update(users)
      .set({ deletedAt: new Date().toISOString() })
      .where(and(eq(users.id, userId), eq(users.churchId, churchId)))
      .returning();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    this.logger.log(`Soft deleted user: ${userId}`);
  }

  async restoreUser(userId: string, churchId: string): Promise<User> {
    const [user] = await this.db
      .update(users)
      .set({ deletedAt: null })
      .where(and(eq(users.id, userId), eq(users.churchId, churchId)))
      .returning();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    this.logger.log(`Restored user: ${userId}`);
    return user;
  }
```

Returning the existing `NotFoundException` on a cross-church id is correct — it
does not disclose that the user exists elsewhere.

Confirm `and` is already imported from `drizzle-orm` at the top of the file (it
is — `updateUserRole` uses it). If it is not, add it to the existing import.

Then update both callers in `apps/api/src/users/users.controller.ts` to pass
the caller's church, using the accessor already used at line 157 of that file:

```ts
  async deleteUser(@Request() req: any) {
    await this.usersService.deleteUser(req.params.userId, req.user.churchId);
```

```ts
  async restoreUser(@Request() req: any) {
    const user = await this.usersService.restoreUser(req.params.userId, req.user.churchId);
```

**Verify**: `pnpm --filter api type-check` → exit 0.

### Step 4: Exclude soft-deleted churches from `getChurchById`

One line. In `apps/api/src/churches/churches.service.ts`, `getChurchById`
currently returns soft-deleted churches, unlike `getChurches` immediately above
it which filters `isNull(churches.deletedAt)`:

```ts
  async getChurchById(churchId: string): Promise<Church | undefined> {
    const [church] = await db.query.churches.findMany({
      where: and(eq(churches.id, churchId), isNull(churches.deletedAt)),
    })
    return church
  }
```

Confirm `and` and `isNull` are imported in this file (`isNull` is, via
`getChurches`). Add `and` to the existing `drizzle-orm` import if missing.

**Verify**: `pnpm --filter api type-check` → exit 0.

### Step 5: Reject non-member ids in event attendance

`setAttendance` in `apps/api/src/events/events.service.ts` is **not** a
cross-tenant leak — it calls `getOwnedEvent(churchId, eventId)` on its first
line and throws if the event is not owned, so every subsequent query keyed on
`eventId` is already church-scoped. Do not "fix" that.

The real defect is narrower: `input.attendedMemberIds` is never validated, so
the insert loop will happily create an `eventRsvps` row stamped with the
caller's `churchId` but pointing at a `memberId` from another church.

Immediately after the `getOwnedEvent` null-check, and before the
`if (input.attendedMemberIds && ...)` block, validate the ids against the
church's members:

```ts
    if (input.attendedMemberIds && input.attendedMemberIds.length > 0) {
      const churchMembers = await db.query.members.findMany({
        where: and(
          eq(members.churchId, churchId),
          inArray(members.id, input.attendedMemberIds),
          isNull(members.deletedAt),
        ),
      })
      if (churchMembers.length !== new Set(input.attendedMemberIds).size) {
        throw new BadRequestException('One or more members do not belong to this church')
      }
    }
```

Add `members` to the existing `@church/db` import and `BadRequestException` to
the existing `@nestjs/common` import in this file if they are not already
there. `and`, `eq`, `inArray`, and `isNull` are already imported.

If `members` does not export a `deletedAt` column, drop that predicate rather
than inventing one, and note it in your final report.

**Verify**: `pnpm --filter api type-check` → exit 0, and
`pnpm --filter api test -- events.service.spec` → all pass. The existing
`events.service.spec.ts` mocks `@church/db` with an in-memory store that has
only `events` and `eventRsvps` tables; if adding a `members` query breaks that
spec, extend its mock store with a `members: []` array and seed the members
used by its `setAttendance` tests. Do not delete or skip any existing test.

### Step 6: Write the regression tests

Create `apps/api/src/visitors/visitors.service.spec.ts`. See the Test plan
below for the required cases and the pattern to follow.

**Verify**: `pnpm --filter api test -- visitors.service.spec` → all pass.

## Test plan

**New file**: `apps/api/src/visitors/visitors.service.spec.ts`

**Model it structurally after `apps/api/src/events/events.service.spec.ts`** —
read that file in full before writing. It fakes `drizzle-orm` combinators as
predicate closures and `@church/db` as an in-memory store, so real service
query logic is exercised with no database. Its header comment explains the
approach. Reuse its `makeColumnRef` / `tableArr` / `findMany` helpers,
substituting the `visitors` and `visitorFollowups` tables.

You will also need to mock `@church/config` (`toDateString`, `getToday`), which
`visitors.service.ts` imports.

Required cases — each must **fail** against the pre-Step-1 code:

1. `getFollowupsByVisitor('church-a', visitorInChurchA)` → returns that
   visitor's followups.
2. `getFollowupsByVisitor('church-b', visitorInChurchA)` → returns `[]`.
   **This is the core regression test.**
3. `getLatestFollowupStatus('church-b', visitorInChurchA)` → returns
   `undefined`.
4. `createFollowup({ churchId: 'church-b', visitorId: visitorInChurchA, ... })`
   → throws `BadRequestException`, and no row is added to the
   `visitorFollowups` store.
5. `createFollowup({ churchId: 'church-a', visitorId: visitorInChurchA, ... })`
   → inserts one row, and the inserted row has **no** `churchId` key (proving
   the destructure in Step 1 works and no phantom column is written).
6. `getFollowupsByVisitor` on a soft-deleted visitor (`deletedAt` set) →
   returns `[]`.

Do **not** write tests for `users.service.ts` in this plan. It has no existing
spec, injects `this.db` through Nest DI rather than importing `@church/db`
directly, and standing up that harness is a separate piece of work — record it
as a follow-up instead.

**Verification**: `pnpm --filter api test` → exit 0, all 9 suites pass
(8 existing + 1 new), with 6 new tests in the new suite.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `pnpm --filter api type-check` exits 0
- [ ] `pnpm --filter api test` exits 0; `visitors.service.spec.ts` exists and its 6 tests pass
- [ ] `pnpm --filter api exec eslint "src/**/*.ts"` exits 0
- [ ] `git diff --stat 38d74e8..HEAD -- packages/db` returns empty (no schema changes)
- [ ] `git status --porcelain` shows no modified file outside the "In scope" list
- [ ] `grep -n "getFollowupsByVisitor(id)\|getLatestFollowupStatus(id)" apps/api/src/visitors/visitors.controller.ts` returns no matches
- [ ] `grep -n "deleteUser(req.params.userId)\|restoreUser(req.params.userId)" apps/api/src/users/users.controller.ts` returns no matches
- [ ] `grep -rn "churchId" apps/api/src/visitors/visitors.controller.ts` shows a hit inside each of the three followup handlers
- [ ] `plans/README.md` status row for 001 updated

## STOP conditions

Stop and report back (do not improvise) if:

- The drift check shows an in-scope file changed since `38d74e8` and the live
  code no longer matches the "Current state" excerpts.
- You conclude a database migration or a new `churchId` column on
  `visitor_followups` is required. Per `AGENTS.md`, migrations need explicit
  human confirmation. The fix in this plan needs none.
- `getVisitorById` turns out not to filter by `churchId` (it should — verify at
  `visitors.service.ts` around line 45). If it does not, the entire ownership
  strategy in Step 1 is unsound and the plan needs rewriting.
- Changing `getFollowupsByVisitor`'s signature breaks a caller outside the
  in-scope files. Run
  `grep -rn "getFollowupsByVisitor\|getLatestFollowupStatus\|createFollowup" apps/api/src`
  before Step 1; if it returns hits in a module other than `visitors/`, STOP.
- Any existing spec that passed before your changes now fails and the cause is
  not a mock-store gap you can fill without changing the assertion.
- A verification command fails twice after a reasonable fix attempt.

## Maintenance notes

For the reviewer and whoever owns this next:

- **What to scrutinize in review**: that no `churchId` key reaches
  `db.insert(visitorFollowups).values(...)` — the column does not exist and
  Drizzle will not warn you at compile time about the extra key in a spread.
- **The wider pattern**: `ChurchContextGuard` scopes the *caller*, never the
  *target row*. Any handler taking a `:id` and passing it to a service must
  scope that lookup itself. When reviewing new endpoints, treat a handler that
  does not read `request['churchId']` (or `req.user.churchId`) as suspect until
  proven otherwise. A repo-wide sweep for this pattern is worth doing and is
  **not** covered by this plan.
- **Deferred out of this plan, deliberately**:
  - `users.service.ts` unit tests (no DI test harness exists yet).
  - The N+1 insert loop in `setAttendance` — batch it into a single
    `.values([...]).onConflictDoUpdate()`. Left alone here to keep this a
    security-only diff; do it when touching that method next.
  - Pagination on the unbounded list endpoints in `members`, `visitors`,
    `events`, and `offerings` services.
- **Future interaction**: if `visitor_followups` ever does gain a `churchId`
  column, the ownership lookups added in Step 1 become redundant and should be
  replaced with a direct predicate — but keep them until then.
