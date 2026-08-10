# Giving Goals — Design

**Status:** Approved for planning
**Date:** 2026-08-10
**Phase:** Phase 3.1b (Giving Goals/Campaigns), the follow-up explicitly deferred by the Phase 3.1 Offering Management spec. Phase 3.2 (Calendar & Events) is a separate follow-up, specced independently.

## Purpose

Let a church run time-bound fundraising goals — "KES 1,000,000 for a new bus by December 31" — record offerings against them, show how much has been raised so far, and (for givers who consent) recognize who gave on a public donor wall. This is deliberately distinct from `offering_categories`, which are permanent accounting labels that never expire.

## Known landmines (verified, not assumed)

Each of these was checked with an actual command, in the spirit of the Phase 3.1 spec's `payment.service.ts` verification.

1. **`campaign` is already taken.** `grep -rniE "goal|campaign|target|progress" packages/db/tables/` returns 30+ hits, all in `packages/db/tables/communications.ts`: a `campaigns` table, `campaign_recipients`, `campaign_events`, and a `campaign_status` pgEnum — the SMS/email messaging feature. `apps/api/src/communications/` owns `/communications/campaigns/*` routes, and the web app has `dashboard/communications/campaigns/`. **This feature must not be called "campaigns" anywhere** — table, module, route, or permission string. It is named **giving goals** throughout (`giving_goals`, `/giving-goals`, `manage:giving-goals`).
2. **No existing time-bound target/progress concept exists.** The only other `target` hits are `dataQuality.ts`'s `targetMemberId` (a duplicate-merge target member, unrelated). There is no `goal`, no `progress`, and no percentage-of-target anything in `packages/db/tables` or `apps/api/src`. This is greenfield.
3. **No permission string is reserved for it.** `grep -niE "goal|campaign|target|fundrais" packages/config/src/permissions.ts` returns only three hits, all inside the *descriptions* of the existing `manage:communications` / `view:communications` / `send:communications` entries. Unlike `manage:departments` (which was pre-reserved before the Departments feature was built), nothing here was anticipated — the new permission strings are genuinely new.
4. **Pre-existing bug in the shipped offerings module, noted for awareness only.** `apps/web/app/[churchId]/dashboard/offerings/categories/[id]/edit/page.tsx` calls `getOfferingCategoryById`, which hits `GET /offering-categories/:id` — a route that **does not exist**. `grep -n "@Get" apps/api/src/offerings/offerings.controller.ts` shows the categories controller has only `@Get()`; the `@Get(':id')` belongs to `OfferingsController`. The category edit page is therefore broken at runtime. Out of scope to fix here, but this design ships `GET /giving-goals/:id` explicitly so goals don't repeat it.
5. **`read:own-giving-history` is granted to `MEMBER` only** — not to `zone_leader` or `department_leader`, who therefore cannot see their own giving in the portal. A pre-existing inconsistency in the shipped permission map; not fixed here.

## Key decisions

- **Named `giving_goals`, never `campaigns`** — see landmine 1. Non-negotiable; the collision is real and already shipped.
- **Its own church-scoped table**, following the exact `offering_categories` shape (uuid PK, `churchId` FK, `createdAt`/`updatedAt`/`deletedAt` dates, soft-delete). Not an extra column on `offering_categories` — a category and a goal have different lifecycles and different visibility rules.
- **`offerings.goalId` is a new nullable FK, orthogonal to `categoryId`.** An offering can have both a category (accounting label) and, independently, a goal (fundraising target) — or neither, or just one. This is the exact forward-compatible change the Phase 3.1 spec pre-authorized. One `ALTER TABLE ADD COLUMN` plus one index; no existing rows change, no backfill.
- **Progress is computed live, never cached.** `sum(amount_cents)` over linked offerings, at request time. No `raisedCents` denormalized column. This is the same call the Departments spec made when it rejected a stored leader column in favor of a live `member_departments` query, and for the same reason: a cached total is a second source of truth that drifts the moment an offering is edited, soft-deleted, re-linked, or created outside the one code path that remembers to update the cache. Postgres summing a few thousand integer rows behind an index on `goal_id` is not a performance problem at church scale.
- **No stored `status`.** `upcoming | active | ended` is derived in the service from `startDate`/`endDate` versus today; `targetReached` is derived from progress versus `targetCents`. Nothing to keep in sync, nothing to migrate, no job. A goal whose deadline passes without hitting its target simply reads as `ended` and keeps showing its final partial progress — no auto-archive, no notification, no scheduled job. Staff can extend `endDate` or soft-delete it manually if needed.
- **Amounts are integer minor units (`targetCents`), matching `offerings.amountCents`.** All progress arithmetic is integer addition and one integer comparison. The percentage is computed at the display edge only.
- **Currency is a column on the goal.** Progress counts only same-currency offerings — an off-currency offering linked to the same goal is tracked and displayed separately ("also received: USD 300, not included in the bar"), never converted or blended. Consistent with the shipped Phase 3.1 rule that a KES total and a USD total are never added together.
- **A goal's progress visibility is a per-goal `isPublic` boolean, default `true`.** Everything else in this codebase so far is either flat admin-only or flat strictly-own; a fundraising goal is the first thing that plausibly wants "church-wide, but the admin can dial it back per instance." Defaulting to `true` matches the point of a fundraising goal (rally the congregation); an admin can flip any individual goal private with one edit if it's meant as internal-only tracking.
- **Multiple goals can run concurrently, with no cap.** A church can run "New Bus" and "Youth Camp" side by side; each offering points at exactly one goal (or none), so there's no double-counting. If the portal gets visually noisy with many goals, that's a display-ordering fix (soonest deadline first), not a schema constraint.
- **A donor wall exists, opt-in, name-only, captured at data-entry time.** A new `offerings.showOnDonorWall` boolean (default `false`) is set via a checkbox on the offering-entry form when staff records the gift, based on a verbal confirmation from the giver. It is **not** a member self-service toggle in this phase — offerings are staff-recorded, so consent capture happens at the same point of entry, not retroactively. The donor wall shows **names only, never amounts** — the checkbox is consent to public recognition, not to public disclosure of how much was given, which stays exactly as private as every other individual amount in this codebase. An anonymous offering (`memberId = null`) can never appear on the donor wall regardless of the flag, since there's no name to show; the service rejects `showOnDonorWall: true` on a `memberId: null` offering with a 400 as a defensive backstop (the web form disables the checkbox when no member is selected, so this path shouldn't normally be reachable). Donor-wall names are **currency-agnostic** — an off-currency gift still earns recognition even though it doesn't count toward the progress bar, because the wall is about who gave, not how much.
- **Permissions split three ways**: `manage:giving-goals` (create/edit/delete, and the full staff-facing list including private goals) is admin-tier only, mirroring `manage:offerings`. `view:giving-goals` (the public list — `isPublic = true` goals, with embedded donor-wall names) is granted to **all six roles**, mirroring how `view:communications` makes announcements visible church-wide. Progress does **not** piggyback on `view:giving-reports` — that permission is `riskLevel: medium` and means "see the church's full giving breakdown by category and period," which is genuinely sensitive; a public progress bar for one goal is not. Conflating them would make it impossible to show members a progress bar without also showing them the church's entire giving picture.
- **Edit/delete follow the module convention already established**: free edit via `PUT`, soft-delete via `DELETE` setting `deletedAt`. No `createdBy`/`updatedBy` columns — consistent with every other module here.
- **No new guard.** Every role either has full church-scoped access, or read-only access to the public subset of the same church-scoped data. There is no per-goal scoping subset, so nothing resembling `DepartmentContextGuard` is needed.

## Architectural template

This feature is a structural clone of the shipped **Offerings** module (`apps/api/src/offerings`, `packages/db/tables/offerings.ts`, `apps/web/app/[churchId]/dashboard/offerings`) — extended, not replaced. Same shape throughout:

- A controller/service/module trio with **no DTO classes** — plain exported TS input types (`CreateGivingGoalInput`, `UpdateGivingGoalInput = Partial<...>`), matching `offerings.service.ts` exactly.
- Church-scoping enforced by manual `eq(givingGoals.churchId, churchId)` predicates AND-ed into every query.
- `@UseGuards(ChurchContextGuard)` on the controller, `@RequirePermission(...)` per route, `churchId` read off `request['churchId']`.
- Server Actions in `apps/web/actions/` using the existing `apiGet/apiPost/apiPut/apiDelete` helpers with `revalidatePath` after mutations.

Three structural notes specific to this feature:

1. **The goals routes live in the existing `OfferingsModule`, not a new module.** `OfferingsModule` already registers two controllers (`OfferingCategoriesController`, `OfferingsController`) over one `OfferingsService` — precisely the precedent for adding a third controller for a closely-related resource. New files: `giving-goals.controller.ts` and `giving-goals.service.ts` inside `apps/api/src/offerings/`, both registered in the existing `offerings.module.ts`.
2. **The progress and donor-wall queries live in `GivingGoalsService`, not `OfferingsService`** — they read the `offerings` table directly with Drizzle, the same way `getSummaryReport` does. There is no repository layer to route through.
3. **The public route follows the `/communications/announcements` pattern, not the `/offerings/me` pattern.** `/offerings/me` resolves the caller's member id because it returns *personal* rows. A goal's public progress (and its donor-wall names) is the same response for every caller in the church, so the endpoint takes no member resolution at all. `MembersService` is **not** injected into `GivingGoalsController`.

## Data model

### `giving_goals` table (new — `packages/db/tables/givingGoals.ts`)

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | default `gen_random_uuid()` |
| `churchId` | uuid FK → `churches.id` | not null, scoping column |
| `name` | varchar(255) | not null — e.g. "New Church Bus" |
| `description` | text | optional — the pitch shown to members |
| `targetCents` | integer | not null, must be > 0; minor currency units, matching `offerings.amountCents` |
| `currency` | varchar(3) | not null; ISO-4217-style code, same convention as `offerings.currency` |
| `startDate` | date | not null; defaults to today at the API layer if the caller omits it |
| `endDate` | date | nullable — an open-ended goal is legitimate and shouldn't require a fake far-future date. When null, the goal never derives to `ended`. |
| `isPublic` | boolean | not null, default `true` — whether this goal appears in the public/member-facing list |
| `createdAt` / `updatedAt` / `deletedAt` | date | soft-delete via `deletedAt`, matching `offerings` and `offering_categories` |

Indexes: `idx_giving_goals_church` on `churchId`, `idx_giving_goals_end_date` on `endDate` (the portal sorts by soonest deadline).

No uniqueness constraints — two goals may share a name, and any number may be active at once.

### `offerings` table (existing — one migration, two added columns)

| Column | Type | Notes |
|---|---|---|
| `goalId` | uuid FK → `giving_goals.id`, nullable | null = this offering counts toward no goal (the overwhelming majority of rows, and the value every existing row gets). Independent of `categoryId`. No `onDelete` cascade — goals are soft-deleted, and a financial record must never disappear because a fundraising goal was removed. |
| `showOnDonorWall` | boolean, not null, default `false` | set via a checkbox at data-entry time. Can only be `true` when `memberId` is not null — enforced in the service (400 otherwise), and disabled in the web form when no member is selected. |

Added indexes: `idx_offerings_goal` on `goalId` (the index the progress sum and donor-wall query run against).

Migration is a plain `ALTER TABLE offerings ADD COLUMN goal_id uuid REFERENCES giving_goals(id), ADD COLUMN show_on_donor_wall boolean NOT NULL DEFAULT false` plus the index, generated through the existing `packages/db/migrations` flow. No backfill needed beyond the column defaults, no downtime.

`packages/db/schema.ts` gets the `givingGoals` import/export pair alongside the existing `offerings` / `offeringCategories` entries, and `Offering` / `NewOffering` inferred types pick up both new columns automatically.

### Progress, defined precisely

For a goal `g`, progress is:

```
sum(offerings.amount_cents)
  where offerings.goal_id  = g.id
    and offerings.church_id = g.church_id
    and offerings.deleted_at is null
    and offerings.currency  = g.currency
```

grouped by `currency` so off-currency linked rows come back as separate rows rather than silently vanishing. `raisedCents` is the row matching the goal's own currency, or `0` when there are no matching rows. `percent` is **not** stored or returned as a rounded integer from the service — the API returns `raisedCents` and `targetCents`, and the UI computes the percentage, keeping one conversion point exactly as `formatMoney`/`centsFromDecimal` already do for money.

Soft-deleted offerings are excluded by the `deleted_at is null` predicate, so deleting a mis-entered offering correctly lowers the goal's total with no extra bookkeeping.

### Donor wall, defined precisely

For a goal `g`, the donor-wall name list is:

```
select distinct members.first_name, members.last_name
  from offerings
  join members on members.id = offerings.member_id
  where offerings.goal_id = g.id
    and offerings.show_on_donor_wall = true
    and offerings.deleted_at is null
```

No currency filter — recognition is currency-agnostic even though the progress bar isn't. `distinct` because the same person may have given more than once toward the same goal and should appear once. This returns names only; no amount, no offering id, no count is exposed alongside a name.

## API layer (`apps/api/src/offerings`)

New files `giving-goals.controller.ts` and `giving-goals.service.ts`, both registered in the existing `offerings.module.ts` (a third controller alongside `OfferingCategoriesController` and `OfferingsController`, plus `GivingGoalsService` in `providers`/`exports`). Plain TS input types, no DTO classes.

| Route | Method | Permission | Notes |
|---|---|---|---|
| `/giving-goals` | POST | `manage:giving-goals` | `{name, targetCents, currency, startDate?, endDate?, description?, isPublic?}` |
| `/giving-goals` | GET | `manage:giving-goals` | staff list, church-scoped, **includes private goals**; each row includes derived `status` and `raisedCents` |
| `/giving-goals/public` | GET | `view:giving-goals` | member-facing list, `isPublic = true` goals only; each row includes `raisedCents`, `targetCents`, derived `status`, and an embedded `donorWallNames: string[]` — one fetch for the whole portal page, no separate detail route |
| `/giving-goals/:id` | GET | `manage:giving-goals` | staff detail + progress |
| `/giving-goals/:id` | PUT | `manage:giving-goals` | update; same field set as POST, all optional |
| `/giving-goals/:id` | DELETE | `manage:giving-goals` | soft delete (`deletedAt`) |
| `/giving-goals/:id/offerings` | GET | `manage:offerings` | the offering rows linked to this goal, for staff reconciliation. Gated on `manage:offerings`, **not** `manage:giving-goals` or `view:giving-goals` — this is the one goals route that exposes individual, unfiltered contribution rows (amounts included), so it must never be reachable by whoever can only see the public progress bar or donor wall. |
| `/offerings` | POST | `manage:offerings` | *(existing route)* accepts optional `goalId`, `showOnDonorWall` |
| `/offerings/:id` | PUT | `manage:offerings` | *(existing route)* accepts optional `goalId` (including `null` to unlink), `showOnDonorWall` |
| `/offerings` | GET | `manage:offerings` | *(existing route)* gains an optional `goalId` query filter |

### Service behavior

- **Church-scoping** via explicit `eq(givingGoals.churchId, churchId)` AND `isNull(givingGoals.deletedAt)` on every read, update and delete, exactly as `OfferingsService` does.
- **The public list is one grouped progress query plus one donor-wall query**, not N+1: progress is `select goalId, currency, sum(amountCents) from offerings where churchId = ? and goalId in (...) and deletedAt is null group by goalId, currency`; donor-wall names are fetched with a second `select distinct` for the same set of goal ids, then both are zipped onto the `isPublic = true` goals in memory.
- **Derived status**, computed in JS from the goal's dates against `new Date().toISOString().split('T')[0]` — the same `today()` helper convention `offerings.service.ts` already defines:
  - `startDate > today` → `upcoming`
  - `endDate` is null, or `endDate >= today` → `active`
  - `endDate < today` → `ended`
  - plus a separate boolean `targetReached = raisedCents >= targetCents`, orthogonal to the date status (a goal can be `active` *and* `targetReached`, which is the happy case).
- **Validation on create/update** (in the controller, `BadRequestException`, matching how `OfferingsController` validates `amountCents` inline):
  - `name` required and non-empty after `.trim()`
  - `targetCents` must be a positive integer — `Number.isInteger(targetCents) && targetCents > 0`
  - `currency` required, 3 characters
  - when both are given, `endDate >= startDate`
- **Validation on linking an offering to a goal** (in `OfferingsService.createOffering` / `updateOffering`): the referenced goal must exist, be in the same church, and not be soft-deleted → otherwise `BadRequestException`, since the FK alone doesn't know about churches.
- **Validation on `showOnDonorWall`** (same location): rejected with `BadRequestException` if `true` and `memberId` is null.

## Guards, roles, permissions

Two new strings added to `PermissionAction` in `packages/config/src/permissions.ts`, under the existing `// Offerings` comment block:

```
| 'manage:giving-goals'
| 'view:giving-goals'
```

`PERMISSION_MAP` grants:

- **`manage:giving-goals`** → `super_admin`, `admin`, `branch_admin` — appended to the same line that already carries `'manage:offerings', 'view:giving-reports'` in each of those three arrays. Not granted to `zone_leader`, `department_leader`, or `member`.
- **`view:giving-goals`** → **all six roles**, including `member`, `zone_leader`, and `department_leader` — granted explicitly per role rather than by copy-pasting an existing role's array, so `zone_leader`/`department_leader` don't silently inherit the `read:own-giving-history` gap noted in landmine 5 (they get `view:giving-goals` even though they don't get `read:own-giving-history`, since a public goal is not personal giving data).

`PERMISSION_METADATA` entries:

```
'manage:giving-goals': { label: 'Manage Giving Goals',
  description: 'Create, edit, and delete church fundraising goals',
  category: 'admin', riskLevel: 'high' },
'view:giving-goals':   { label: 'View Giving Goals',
  description: 'View public fundraising goals, their progress, and donor-wall recognition',
  category: 'admin', riskLevel: 'low' },
```

`riskLevel: 'low'` on the read permission is the deliberate signal that it exposes an aggregate progress figure and opt-in names, never individual amounts — contrast `view:giving-reports` at `medium`.

**No new guard.** `ChurchContextGuard` + `@RequirePermission` is the whole story: every role either has church-wide manage access or church-wide read access to the public subset. No per-goal scoping subset exists, so nothing `ZoneContextGuard`/`DepartmentContextGuard`-shaped is introduced, and `app.module.ts`'s `APP_GUARD` chain is untouched.

Frontend mirror: `apps/web/lib/permissions.ts` picks the new strings up from the shared `@church/config` package automatically.

## Web UI

### Staff-facing (`apps/web/app/[churchId]/dashboard/offerings/goals/`)

Nested under the existing offerings dashboard rather than given a top-level sidebar entry — `dashboard/offerings/categories/` already establishes the sub-resource pattern. Same page shapes as the shipped categories pages:

- `goals/page.tsx` — Server Component list (staff view — includes private goals, marked with a badge); each row shows name, target, raised, a percentage, currency, deadline, derived status, and whether it's public. `Suspense`-wrapped table with a `Skeleton` fallback. Guarded with `ensurePermission("manage:giving-goals")`.
- `goals/add/page.tsx` — create form (zod + react-hook-form): name, description, target amount, currency, start date, end date, and an "Publicly visible" checkbox defaulting to checked (`isPublic`). The target amount input takes a decimal string and converts once via the existing `centsFromDecimal` helper.
- `goals/[id]/page.tsx` — detail: the progress figure, the donor-wall name list (staff can see it too, obviously), and the linked-offerings table fetched from `/giving-goals/:id/offerings`.
- `goals/[id]/edit/page.tsx` — edit form, including the `isPublic` toggle.
- **Offering form change:** `offerings/add/page.tsx` and `offerings/[id]/edit/page.tsx` gain (a) an optional "Count toward goal" select, populated from `/giving-goals` filtered to `status=active` client-side, with a blank default, and (b) a "Show on donor wall" checkbox, **disabled unless a member is selected** (mirrors the server-side validation that `showOnDonorWall` requires a non-null `memberId`).
- **Offerings list change:** `offerings/page.tsx` gains a goal column and a `goalId` filter in its `searchParams`, alongside the existing `categoryId`/`from`/`to`.
- `apps/web/actions/giving-goal.ts` — new Server Actions file (`getGivingGoals`, `getPublicGivingGoals`, `getGivingGoalById`, `createGivingGoal`, `updateGivingGoal`, `deleteGivingGoal`, `getGivingGoalOfferings`) via the existing `apiGet/apiPost/apiPut/apiDelete` helpers, structured exactly like `actions/offering.ts`. `actions/offering.ts` itself gains `goalId`/`showOnDonorWall` in the `createOffering`/`updateOffering` payload types and the `getOfferings` filter type.
- `apps/web/config/sidebar.ts` — the existing "Offerings" item already lists `permissions: ["manage:offerings", "view:giving-reports"]`; add `"manage:giving-goals"` so an admin-tier user who somehow only holds the goals permission still reaches the section.

### Member-facing (`apps/web/app/[churchId]/portal/giving-goals/page.tsx`)

- Read-only list of public church goals with a progress bar per goal: name, description, `formatMoney(raisedCents, currency)` of `formatMoney(targetCents, currency)`, a percentage, and — beneath the bar — a "Given by" line listing `donorWallNames` when non-empty (nothing rendered when the list is empty; no "no one has consented yet" message, which would read oddly).
- The bar's *width* is clamped at 100%; the *number* is not — an over-funded goal reads "KES 1,200,000 of KES 1,000,000 (120%)" with a full bar.
- Rendered with the plain Tailwind/shadcn primitives already in use (a `div` with a percentage width inside a bordered track). **No charting library is introduced.**
- One fetch: `getPublicGivingGoals(churchId)` → `GET /giving-goals/public`. No per-goal detail page, no second request — the donor names are embedded in the same list response.
- `apps/web/app/[churchId]/portal/layout.tsx` — add `{ href: "giving-goals", label: "Giving Goals", icon: Target, permission: "view:giving-goals" }` to the `portalLinks` array, following the exact shape of the existing offerings entry. The `Target` icon comes from `lucide-react`, already imported in that file.
- The existing "My Giving" portal page is untouched — a member's own private history and the church's public goal progress are two separate pages with two separate visibility models.

## Error handling & edge cases

- **Goal with no linked offerings:** the grouped progress query returns no row for it; the service maps that to `raisedCents: 0`, not `null` and not an error. The bar renders empty. Donor-wall names list is empty.
- **`targetCents` of zero:** rejected at create/update time, so the display-edge percentage can never divide by zero.
- **Over-target goal:** allowed and expected. `raisedCents > targetCents` yields a percentage above 100; nothing is clamped server-side, only the bar's visual width.
- **Soft-deleted goal with offerings still linked:** soft-delete only (`deletedAt`), never a cascade. The `offerings.goalId` values stay put; the goal simply drops out of both list responses and the "count toward goal" dropdown going forward.
- **Offering pointing at a soft-deleted goal:** the staff offerings list resolves the goal name via a lookup that doesn't re-filter on `deletedAt`, so the row still displays "New Bus" rather than a bare uuid.
- **Deleting an offering that counted toward a goal:** progress drops on the next read automatically (the sum filters `deletedAt is null`); the offering's name also drops out of the donor wall on the next read, for the same reason.
- **Editing an offering's `goalId`** (including clearing it to `null`): both goals' totals and donor-wall lists are correct on the next read.
- **Toggling `showOnDonorWall` off after it was on:** the name drops off the donor wall on the next read — no retraction workflow needed, it's just an edit.
- **`showOnDonorWall: true` with `memberId: null`:** rejected with a 400. The web form prevents this by disabling the checkbox with no member selected, so this is a defensive backstop, not a primary UX path.
- **Cross-church `goalId` on an offering:** rejected with a 400 by the same-church validation in `OfferingsService`.
- **Off-currency offering linked to a goal:** counted toward donor-wall recognition (currency-agnostic) but excluded from `raisedCents` and the bar, shown as a separate "also received" line on the staff detail page so the money is visibly accounted for.
- **`endDate` in the past at creation time:** allowed — backfilling a goal that already ran, to record its outcome, is legitimate.
- **Null `endDate`:** the goal derives to `active` indefinitely and sorts last in the deadline-ordered lists.
- **A member hitting the portal page when the church has no public goals:** empty state text, not an error.
- **A goal is toggled from public to private:** it disappears from the portal list (and the donor wall it carried) on the next read, but stays fully visible/manageable on the staff side. No data changes, only the `isPublic` flag.
- **Concurrent offerings against the same goal:** no contention. Nothing is incremented; every request recomputes from the rows.

## Testing

Matching whatever test location/framework convention `offerings`/`departments` currently use in this repo — no new test framework is introduced.

- **`GivingGoalsService` CRUD:** create/list/get/update/soft-delete; church-scoping (church A cannot read, update, or delete church B's goals).
- **Progress math:** a goal with several linked offerings sums to the exact integer total; a goal with zero linked offerings returns `0`; soft-deleted offerings are excluded; an offering re-linked from goal A to goal B moves the money correctly.
- **Multi-currency:** an off-currency offering linked to a goal does not contribute to `raisedCents` and appears as its own breakdown row, but its giver still appears on the donor wall if opted in.
- **Public list filtering:** `GET /giving-goals/public` returns only `isPublic = true` goals; `GET /giving-goals` (staff) returns both public and private.
- **Donor wall:** a `showOnDonorWall = true` named offering's giver appears in `donorWallNames`; a `showOnDonorWall = false` offering's giver does not; an anonymous (`memberId = null`) offering can never have `showOnDonorWall = true` (rejected at write time); a giver who gave twice to the same goal with the flag on appears once, not twice; toggling the flag off removes the name on the next read.
- **Derived status:** `upcoming` / `active` / `ended` for goals whose dates straddle today, plus a null-`endDate` goal deriving to `active`; and `targetReached` true for an over-funded goal that is still `active`.
- **Validation:** `targetCents` of `0`, a negative value, and a non-integer are each rejected; `endDate` before `startDate` is rejected; an empty/whitespace `name` is rejected.
- **Link validation:** creating an offering with a `goalId` from another church is rejected; with a soft-deleted `goalId` is rejected; with `goalId` omitted succeeds and leaves the column null.
- **Permission separation:** a caller holding only `view:giving-goals` gets 200 on `GET /giving-goals/public` and 403 on `GET /giving-goals` (staff list) and on `GET /giving-goals/:id/offerings`. This is the test that protects the privacy line between "sees the public bar and names" and "sees individual contribution amounts," and it is the single most important test in this list.

## Explicitly out of scope

- **Pledges and commitments** ("I pledge $500, paid over 6 months") — a genuinely different data model. Nothing here precludes a future `pledges` table referencing `giving_goals.id`.
- **Recurring/scheduled giving and any payment-gateway integration** — still out of scope, same as Phase 3.1.
- **Amounts on the donor wall** — names only, by design (see "Key decisions"). Showing individual gift sizes publicly is a separate, more sensitive feature not built here.
- **Member self-service donor-wall opt-in/opt-out** — consent is captured by staff at data-entry time only in this phase. A retroactive self-service toggle is a plausible future addition (would need a new write endpoint on `read:own-giving-history`'s surface) but is not built now.
- **Notifications on goal milestones or deadlines** (50% reached, deadline approaching, goal ended unmet) — needs the communications module's recipient/template design and a scheduler this module doesn't have.
- **Automatic archival or any background job** — nothing in this feature runs outside a request.
- **FX conversion between currencies** — no rate source, no rate-as-of semantics, no rounding policy is introduced.
- **Charts** — the progress bar is a styled div. No charting dependency is added.
- **A public unauthenticated goal page** (a shareable link an unauthenticated visitor could open) — "all members" means all authenticated members of that church, behind `ChurchContextGuard`. A truly public URL is a different security surface with its own design.
- **Fixing the missing `GET /offering-categories/:id` route** (landmine 4) or the `read:own-giving-history` role gap (landmine 5) — both noted for awareness, neither touched here.
