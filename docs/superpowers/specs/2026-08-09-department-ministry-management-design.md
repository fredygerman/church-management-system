# Department/Ministry Management — Design

**Status:** Approved for planning
**Date:** 2026-08-09
**Phase:** Phase 2.3 (last open item in Phase 2, per `PROJECT_PLAN.md`)

## Purpose

Let a church organize members into ministries/departments (Choir, Ushers, Intercessors, etc.), track who leads each one, and see attendance broken down by department — closing out Phase 2 of the project plan.

## Key decisions

- A member can belong to **multiple departments** at once (sings in Choir and serves as an Usher).
- A department can have **multiple leaders** at once, and one person can lead **multiple departments**.
- Department attendance tracking means **analytics grouping only** — reuse the existing attendance trends/comparison endpoints with a new `department` groupBy, joined through membership. No dedicated department attendance-session/check-in system (that would be cloning the whole attendance module — out of scope).
- A new **`department_leader`** role is added, scoped to only the department(s) they lead, via a guard modeled on the existing `ZoneContextGuard` — but read-only (view their department's members/stats), matching what `zone_leader` actually gets today.
- The leader-scoping guard uses a **live DB query** (no new column, no stored array) — queries `member_departments` for `isLeader = true` rows at request time. This avoids the drift bug Zones has between `zones.leaderId` and `member_zones.isLeader` (two sources of truth that can go out of sync), and avoids adding a migration for an array column that would itself need to stay in sync.

## Architectural template

This feature is a structural clone of the existing **Zones** module (`apps/api/src/zones`, `packages/db/tables/zones.ts`, `apps/web/app/[churchId]/dashboard/zones`) — same shape: a named group scoped to a church, a member-to-group junction table, a controller/service/module trio with no DTO classes, church-scoping enforced via manual `eq(table.churchId, churchId)` predicates, and Server Actions on the frontend hitting the API through `apiGet/apiPost/apiPut/apiDelete` helpers.

Two structural changes from the Zones template, both driven by the "multiple leaders / multiple departments per member" decision above:
1. No `leaderId` column on `departments` itself — leadership lives only in the junction table's `isLeader` flag, since there's no single "the leader" slot to store.
2. No leader-reassignment dialog (zones needs one because removing the sole leader requires picking a replacement) — instead a plain per-row "toggle leader" action, since there's no "must always have exactly one leader" invariant to protect.

The permission string `manage:departments` was already reserved in `packages/config/src/permissions.ts` (`PERMISSION_MAP`, granted to `super_admin`/`admin`/`branch_admin`) with zero routes or pages using it yet — confirming this feature was anticipated in the original permission design.

## Data model

### `departments` table (new — `packages/db/tables/departments.ts`)

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | default `gen_random_uuid()` |
| `churchId` | uuid FK → `churches.id` | not null, scoping column |
| `name` | varchar(255) | not null |
| `description` | text | optional |
| `meetingDay` | varchar(50) | optional |
| `createdAt` / `updatedAt` / `deletedAt` | date | soft-delete via `deletedAt`, matching zones |

Indexes: church, name.

### `member_departments` table (new — `packages/db/tables/memberDepartments.ts`)

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `memberId` | uuid FK → `members.id`, `onDelete: cascade` | not null |
| `departmentId` | uuid FK → `departments.id`, `onDelete: cascade` | not null |
| `churchId` | uuid FK → `churches.id`, `onDelete: cascade` | not null, denormalized for scoping, matches `member_zones` |
| `isLeader` | boolean, default false | multiple rows per department may have `isLeader = true` |
| `createdAt` / `updatedAt` / `deletedAt` | date | |

Constraints: unique(`memberId`, `departmentId`) — one row per member per department (no duplicate membership), but a member may have many rows across different departments. No uniqueness constraint on `isLeader` — multiple leaders per department is intentional.

## API layer (`apps/api/src/departments`)

Same three-file shape as zones: `departments.controller.ts`, `departments.service.ts`, `departments.module.ts`. Plain TS input types, no DTO classes, matching the existing convention.

| Route | Method | Permission | Notes |
|---|---|---|---|
| `/departments` | POST | `manage:departments` | `{name, description?, meetingDay?}` |
| `/departments` | GET | `read:department` | list, church-scoped; filtered to led departments only when caller role is `department_leader` |
| `/departments/:id` | GET | `read:department` | detail |
| `/departments/:id` | PUT | `manage:departments` | update |
| `/departments/:id` | DELETE | `manage:departments` | soft delete |
| `/departments/:id/members` | GET | `read:department` | list members + leader flags |
| `/departments/:id/members` | POST | `manage:departments` | `{memberId, isLeader?}`, upsert on conflict `(memberId, departmentId)` |
| `/departments/:id/members/:memberId` | DELETE | `manage:departments` | hard delete of the junction row (matches zones' actual behavior today, inconsistency not fixed here — out of scope) |
| `/departments/:id/leaders` | POST | `manage:departments` | `{memberId}` — sets `isLeader = true` on that member's row (adds a leader, doesn't replace any existing one) |
| `/departments/:id/leaders/:memberId` | DELETE | `manage:departments` | unsets `isLeader` on that row |
| `/departments/:id/stats` | GET | `read:department` | member count, leader count — derived in memory from the members list, matching zone stats |

Service behavior:
- Church-scoping via explicit `eq(departments.churchId, churchId)` AND-ed into every query (manual pattern, matches zones — no ORM-level automatic scoping to hook into in this codebase).
- `assignMemberToDepartment` upserts `member_departments` on conflict `(memberId, departmentId)`; no cross-table leader sync needed since there's no `departments.leaderId` column.
- `getDepartmentMembers` uses raw joins (`member_departments` ⋈ `departments` ⋈ `members`), matching the existing "avoid relation issues" pattern used in `zones.service.ts`.

## Guards, roles, permissions

- New role `department_leader` added to `UserRole` enum (`packages/config/src/permissions.ts`).
- New permission `read:department`, granted to: `department_leader`, and alongside existing `manage:departments` grants for `super_admin`/`admin`/`branch_admin`. Not granted to `zone_leader` or plain `member`.
- `department_leader`'s permission set otherwise mirrors `zone_leader`'s baseline (read-only: `read:member`, `view:attendance`, `view:communications`, `read:self`, `update:self`, `create:prayer-request`, `read:own-prayer-requests`, etc.) — view access only, no member add/remove, matching what `zone_leader` actually has today despite the guard existing.
- New `DepartmentContextGuard`, registered in the global `APP_GUARD` chain in `app.module.ts` immediately after `ZoneContextGuard`. Only engages for role `department_leader` (all other roles pass through untouched):
  1. Query `member_departments` for rows where `memberId` = caller's linked member id, `isLeader = true`, `churchId` = current church context → set of led department ids. Live query, no stored column, no JWT/session array.
  2. No `departmentId` in the request: exactly one led department → auto-inject it (mirrors `ZoneContextGuard`'s single-zone UX); zero or multiple → pass through, service layer filters `GET /departments` to the led set for this role.
  3. Explicit `departmentId` in the request that isn't in the led set → 403, matching `ZoneContextGuard`.
- Frontend (`apps/web/lib/permissions.ts`, sidebar config) mirrors the new role/permission. Sidebar nav item gated on `read:department` (not `manage:departments`), so both admins and department leaders see it — avoiding the zones sidebar/route/API permission-string mismatch for this module.

## Web UI (`apps/web/app/[churchId]/dashboard/departments`)

Same page/component shape as zones:
- `page.tsx` — list (Server Component), `Suspense`-wrapped table.
- `add/page.tsx` — create form (zod + react-hook-form: name/description/meetingDay).
- `[id]/page.tsx` — detail: members list, leaders (rendered as a list, not a single field), stats.
- `[id]/edit/page.tsx` — edit form.
- No leader-reassignment dialog (see "Architectural template" above) — a plain per-row "toggle leader" action instead.
- `apps/web/actions/department.ts` — server actions via existing `apiGet/apiPost/apiPut/apiDelete` helpers, `revalidatePath` after mutations, matching `actions/zone.ts`.
- Member portal gets a read-only "my departments" view for members with the `department_leader` role, gated on `read:department`.

## Attendance integration

Add `'department'` to the `groupBy` union type in `attendance.service.ts`'s `getTrends()` and `getPeriodComparison()`, joining `attendanceCheckins` → `members` → `member_departments` → `departments`, added alongside the existing zone join (not replacing it). Members with no department fall back to an `'unassigned'` bucket, matching the zone groupBy's existing convention.

Because a member can be in multiple departments, this join fans out: someone in both Choir and Ushers is counted once in each bucket when they attend. The sum across department buckets can therefore exceed total attendance for a session — expected behavior for "how many choir members attended," not a bug, but worth a one-line note in the endpoint's docs/response so it isn't mistaken for one later.

## Error handling & edge cases

- Deleting a department with members still assigned: soft-delete only; `member_departments` rows are left in place and excluded from results going forward via the parent's `isNull(departments.deletedAt)` filter — no cascade cleanup needed.
- Removing the last leader from a department: allowed, no guard — unlike zones there is no "must always have a leader" invariant here, so no confirmation dialog is needed.
- A `department_leader` whose last led department is removed: role and `read:department` permission remain, but the guard's live query returns an empty led-set, so list/detail routes return nothing. Self-resolving, no cleanup job needed.
- Duplicate `POST /departments/:id/members` for an already-assigned member: upsert via `onConflictDoUpdate`, allowing `isLeader` to be flipped on an existing row, matching zones.

## Testing

- `departments.service.ts` unit tests: create/list/update/soft-delete; assign/remove member; add/remove leader (verify multiple leaders can coexist on one department); church-scoping (church A cannot see church B's departments).
- `DepartmentContextGuard` unit tests: single led department auto-injects; multiple led departments requires an explicit id; a non-led id returns 403; non-`department_leader` roles pass through untouched.
- Attendance trend test: `department` groupBy produces correct fan-out counts for a member belonging to two departments.
- Match whatever test location/framework convention `zones`/`attendance` currently use in this repo (no new test framework introduced for this feature).

## Explicitly out of scope

- Fixing the pre-existing Zones bugs (leaderId/isLeader drift, inconsistent soft-delete on member removal, redundant `ChurchContextGuard` decorator, granular-vs-coarse permission string inconsistency) — noted here for awareness, not touched by this feature.
- Dedicated department attendance sessions/check-ins (rejected in favor of analytics-only grouping — see "Key decisions").
- A stored `assignedDepartmentIds` column or any JWT/session change — the guard reads live from `member_departments` instead.
