# Offering Management — Design

**Status:** Approved for planning
**Date:** 2026-08-10
**Phase:** Phase 3.1 (Offering Management), per `PROJECT_PLAN.md`. Phase 3.2 (Calendar & Events) is a separate follow-up, not touched here.

## Purpose

Let a church record offerings/giving (individual member contributions and anonymous basket totals), organize them into church-defined categories (Tithe, Building Fund, Missions, etc.), and see basic giving reports (totals by category, totals by period) — plus let members view their own giving history in the member portal.

## Known landmine (verified, not assumed)

`apps/api/src/payment/payment.service.ts`, left over from the pre-monorepo codebase, is confirmed dead code: the file is 0 bytes, and nothing in `apps/api/src` references `PaymentModule` or `PaymentService`. It is not registered in `app.module.ts`. This feature is built from scratch, not extended from it.

## Key decisions

- **Session link is optional.** An offering can reference a `serviceSessions` row (so "Sunday service offering" rolls up with that day's attendance) but doesn't require one — covers both event-based and ad-hoc giving. No `manage:services` dependency.
- **`memberId` is nullable on the offering record itself.** A named contribution has a `memberId`; an anonymous/basket total for a whole service has `memberId = null`. One table covers both — this is what makes "member contribution history" possible while still supporting anonymous cash offerings, which is how most churches actually take up an offering.
- **Categories are a per-church configurable table**, not a fixed enum — admins create/rename/deactivate their own categories (e.g. "Building Fund," "Missions"), matching the Departments structural pattern rather than requiring a schema migration every time a church wants a new category name.
- **Amounts are stored as integer minor units (cents)**, not `numeric`/`decimal`. All arithmetic — including report sums — is plain integer addition in Postgres and JS, which is exact by construction. Conversion to major units (e.g. `/ 100`) happens only at the display edge.
- **Currency is a per-record column**, not assumed single-currency per church. This means report sums must group by `(dimension, currency)` pairs — a KES total and a USD total are never added together. Called out explicitly in the reports section below so it isn't mistaken for a bug later.
- **Edit/delete follow the existing Departments/Zones convention**: free edit via `PUT`, soft-delete via `DELETE` (`deletedAt`). No `createdBy`/`updatedBy` audit columns — consistent with every other module in this codebase, not a special case for this one.
- **Permissions are split**: `manage:offerings` (create/edit/delete offerings and categories) and `view:giving-reports` (reports endpoint only) — both currently granted to the same admin tier, but separable later (e.g. a future treasurer-type role could get `view:giving-reports` without record/edit/delete rights) without a permission-string migration.
- **Members see their own named contributions** in the portal via a new `read:own-giving-history` permission, mirroring `read:own-prayer-requests`. Anonymous/basket entries are excluded by construction (no `memberId` to match against).
- **Giving goals/campaigns (target amounts, progress bars, e.g. "$10,000 for a new bus") are explicitly out of scope for this phase.** See "Explicitly out of scope" below for the forward-compatibility note.

## Architectural template

This feature is a structural clone of the existing **Departments** module (`apps/api/src/departments`, `packages/db/tables/departments.ts`, `apps/web/app/[churchId]/dashboard/departments`) — same shape: named, church-scoped entities, a controller/service/module trio with no DTO classes, church-scoping enforced via manual `eq(table.churchId, churchId)` predicates, and Server Actions on the frontend hitting the API through `apiGet/apiPost/apiPut/apiDelete` helpers.

One structural difference from the Departments template: there is no membership junction table. `offering_categories` is the "named group" analog of `departments`, but the offering record itself (`offerings`) is the join between member, category, and church — a member's relationship to a category isn't persistent membership, it's a per-transaction reference.

The member self-service pattern (resolving the caller's member id via `MembersService.getMemberByUserId(churchId, userId)`, since the JWT/`UserContext` only carries `activeMembershipId`) is a clone of `prayer.controller.ts`'s existing `/prayer-requests/me` route.

## Data model

### `offering_categories` table (new — `packages/db/tables/offeringCategories.ts`)

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | default `gen_random_uuid()` |
| `churchId` | uuid FK → `churches.id` | not null, scoping column |
| `name` | varchar(255) | not null |
| `description` | text | optional |
| `createdAt` / `updatedAt` / `deletedAt` | date | soft-delete via `deletedAt`, matching departments |

Indexes: church, name.

### `offerings` table (new — `packages/db/tables/offerings.ts`)

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | default `gen_random_uuid()` |
| `churchId` | uuid FK → `churches.id` | not null, scoping column |
| `categoryId` | uuid FK → `offering_categories.id` | not null |
| `memberId` | uuid FK → `members.id`, nullable | null = anonymous/basket total; no cascade delete (a financial record must survive a member row change — members are soft-deleted via `deletedAt` in this codebase, so hard-delete cascades aren't a live concern in practice, but the FK itself carries no `onDelete: cascade`) |
| `sessionId` | uuid FK → `service_sessions.id`, nullable | optional link to the service the offering was taken at |
| `amountCents` | integer | not null; amount in minor currency units |
| `currency` | varchar(3) | not null; ISO-4217-style code, e.g. `KES`, `USD` |
| `offeringDate` | date | not null; the date the offering was given (distinct from `createdAt`, which is when the record was entered — supports backfilled entry) |
| `note` | text | optional |
| `createdAt` / `updatedAt` / `deletedAt` | date | soft-delete via `deletedAt` |

Indexes: church, category, member, session, offeringDate.

No uniqueness constraints — a member can have many offering rows (one per contribution), and a category can have many offerings.

## API layer (`apps/api/src/offerings`)

Same file shape as departments: `offerings.controller.ts`, `offerings.service.ts`, `offerings.module.ts`, handling both `/offering-categories` and `/offerings` routes (one module, like Departments handles both `/departments` and `/departments/:id/members`). Plain TS input types, no DTO classes.

| Route | Method | Permission | Notes |
|---|---|---|---|
| `/offering-categories` | POST | `manage:offerings` | `{name, description?}` |
| `/offering-categories` | GET | `manage:offerings` | list, church-scoped |
| `/offering-categories/:id` | PUT | `manage:offerings` | update |
| `/offering-categories/:id` | DELETE | `manage:offerings` | soft delete |
| `/offerings` | POST | `manage:offerings` | `{categoryId, amountCents, currency, offeringDate, memberId?, sessionId?, note?}` |
| `/offerings` | GET | `manage:offerings` | list, church-scoped; filterable by `categoryId`, `memberId`, `sessionId`, date range |
| `/offerings/:id` | GET | `manage:offerings` | detail |
| `/offerings/:id` | PUT | `manage:offerings` | update |
| `/offerings/:id` | DELETE | `manage:offerings` | soft delete |
| `/offerings/reports/summary` | GET | `view:giving-reports` | query: `groupBy=category\|period`, `period=week\|month\|year` (when grouping by period), optional `from`/`to` date range; returns totals in `amountCents`, grouped by `(dimension, currency)` pairs |
| `/offerings/me` | GET | `read:own-giving-history` | self-service; resolves caller's member id via `MembersService.getMemberByUserId`, returns only offering rows where `memberId` matches |

Service behavior:
- Church-scoping via explicit `eq(offerings.churchId, churchId)` / `eq(offeringCategories.churchId, churchId)` AND-ed into every query — manual pattern, matching every other module in this codebase.
- Report sums use Postgres `sum(amount_cents)` (integer aggregate, exact), grouped by the requested dimension **and** `currency` — a query spanning both KES and USD offerings returns separate rows per currency, never a single blended total.
- `/offerings/me` filters strictly on the resolved `memberId`; since anonymous rows have `memberId = null`, they can never appear in a member's own history by construction (no extra filter needed to exclude them).

## Guards, roles, permissions

- Two new permissions added to `PermissionAction` (`packages/config/src/permissions.ts`): `manage:offerings`, `view:giving-reports`, `read:own-giving-history`.
- `manage:offerings` and `view:giving-reports` granted to `super_admin`, `admin`, `branch_admin` — same tier as `manage:departments` today. Not granted to `zone_leader` or `department_leader` (no financial visibility for those roles in this phase).
- `read:own-giving-history` added to the `MEMBER` role's `PERMISSION_MAP` entry, alongside the existing `read:own-prayer-requests`.
- No new guard needed — unlike Departments (`department_leader` needed live-query scoping to a subset of departments), every role here either has full church-scoped access (`manage:offerings`/`view:giving-reports`) or strictly-own access (`read:own-giving-history`, enforced in the service layer by filtering on the resolved member id, the same way `prayer.controller.ts` does for `/prayer-requests/me`). No `OfferingContextGuard` is introduced.

## Web UI

### Staff-facing (`apps/web/app/[churchId]/dashboard/offerings`)

Same page/component shape as departments:
- `categories/page.tsx` — list categories (Server Component, `Suspense`-wrapped table), `categories/add/page.tsx`, `categories/[id]/edit/page.tsx`.
- `page.tsx` — offerings list, filterable by category/date range.
- `add/page.tsx` — record-offering form (zod + react-hook-form: category select, amount, currency, offering date, optional member picker, optional session picker, note).
- `[id]/edit/page.tsx` — edit form.
- `reports/page.tsx` — totals by category and by period, rendered as tables (no charting library introduced for "basic" reports — matches the "simple offering tracking" framing).
- `apps/web/actions/offering.ts` — Server Actions via existing `apiGet/apiPost/apiPut/apiDelete` helpers, `revalidatePath` after mutations, matching `actions/department.ts`.

### Member-facing (`apps/web/app/[churchId]/portal/offerings`)

- `page.tsx` — read-only "My Giving History" list (date, category name, amount, currency), gated on `read:own-giving-history`, same tier as the existing `portal/prayer` and `portal/departments` pages. Fetches via `getMyOfferings` action hitting `/offerings/me`.

## Error handling & edge cases

- Deleting a category with offerings still referencing it: soft-delete only (`deletedAt`); existing `offerings` rows keep their `categoryId` and remain visible in reports/history — the category simply drops out of the "create new offering" dropdown going forward, matching how deleted departments still leave `member_departments` rows in place.
- An offering referencing a soft-deleted category: still displays correctly (its `categoryId` FK is still valid; the join just returns a category row with `deletedAt` set), since reports query historical `offerings` rows directly rather than re-validating category liveness per row.
- Mixed-currency report request: grouped output never sums across currencies — each `(dimension, currency)` pair is its own row. UI renders one line/column per currency rather than a single misleading blended total.
- A member with no named offerings: `/offerings/me` returns an empty list, not an error.
- Anonymous offering (`memberId = null`) can never surface in any member's `/offerings/me` response, by construction of the filter — no separate "is this anonymous" check needed anywhere in the self-service path.

## Testing

- `offerings.service.ts` unit tests: create/list/update/soft-delete for both categories and offerings; church-scoping (church A cannot see church B's offerings/categories).
- Money-math test: report summary sums are exact for a set of `amountCents` integers (no floating-point drift), and multi-currency input produces separate per-currency totals rather than one combined figure.
- Self-service test: `/offerings/me` returns only the resolved member's own rows, excludes anonymous (`memberId = null`) rows, and excludes other members' rows.
- Match whatever test location/framework convention `departments`/`zones` currently use in this repo (no new test framework introduced for this feature).

## Explicitly out of scope

- **Giving goals/campaigns** (e.g. "$10,000 for a new bus" with a progress bar) — this needs its own data model (target amount, deadline, progress calculation) and its own dedicated brainstorming pass. Deferred to Phase 3.1b, to be designed immediately after this phase ships and before Phase 3.2 (Calendar & Events). The `offerings` schema here is deliberately not designed to preclude it: a future nullable `goalId` FK could be added to `offerings` via a normal migration without restructuring this table, but no such column or placeholder is added now.
- Online/electronic payment processing (the dead `payment.service.ts` code, and anything payment-gateway-shaped) — this phase is manual recording of already-received offerings, not a payment collection flow.
- Per-member annual giving statements/receipts (tax-style documents) — the "totals by category + by period" report is aggregate-only for v1, not a per-member document generator.
- A dedicated `OfferingContextGuard` or leader-scoped role for offerings — no role below admin tier gets any offering visibility in this phase.
