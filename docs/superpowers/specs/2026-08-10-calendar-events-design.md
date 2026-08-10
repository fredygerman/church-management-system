# Calendar & Event Planning — Design

**Status:** Approved for planning
**Date:** 2026-08-10
**Phase:** Phase 3.2 (Calendar & Event Planning), per `PROJECT_PLAN.md`. Phase 3.1 (Offerings) and 3.1b (Giving Goals) are complete/specced independently and untouched here.

## Purpose

Give a church a calendar of one-off events (camp meetings, seminars, socials) distinct from its recurring service schedule, let events be published either to a single branch or across the whole network, and let members RSVP and have their attendance recorded — closing out Phase 3.2.

## Verified findings (investigated, not assumed)

The offerings spec confirmed `payment.service.ts` was dead code before building on it. The equivalent verification for this phase:

1. **There is no HQ concept in this codebase — at all.** `packages/db/tables/churches.ts` defines a completely flat `churches` table: `id`, `name`, `location`, `leadPastorName`, `phone`, `email`, `description`, timestamps. No `parentChurchId`, no `isHq`, no `type`, no hierarchy of any kind. A case-insensitive grep for `hq|headquarter|all.?branch|cross.?church|broadcast` across `apps/api/src`, `packages/config/src`, `packages/db/tables`, `apps/web/app` and `apps/web/actions` returns **zero** matches. "Branch" exists only as the role name `branch_admin`.
2. **`groupBy: 'branch'` in the attendance analytics is a misnomer, not a cross-church feature.** `apps/api/src/attendance/attendance.service.ts` accepts `'branch'` as a grouping dimension, which reads like cross-church aggregation. It isn't: the query is scoped to a single `eq(attendanceCheckins.churchId, churchId)`, and the `'branch'` bucket resolves as `row.zoneName || 'unassigned'` — identical to the `'zone'` bucket. "Branch comparison" is zone grouping within one church. Pre-existing bug/misnomer; **not fixed here**, but it must not be mistaken for a cross-church precedent.
3. **Communications has no cross-branch broadcast.** This was the most likely place for one. `AudienceFilters` (`communications.service.ts`) is `{ zoneIds, genders, maritalStatuses, includeMembersWithoutPhone, includeMembersWithoutEmail }` — no church/branch dimension. `campaigns.churchId` is `notNull`, and the member-portal announcement feed filters `eq(campaigns.churchId, churchId)`. A campaign cannot reach a second branch.
4. **The only cross-church capability in the system is context *switching*, not simultaneous access.** `ChurchContextGuard` lets a `SUPER_ADMIN` with no membership row set any `churchId` as their active context — one church at a time. `PROJECT_PLAN.md` already records this as the accepted product answer for a different feature: *"no separate cross-branch aggregate view — admins switch church context to compare branches."* Every service method in every module takes `churchId` as its first argument and AND-s it into every query.
5. **Extending `service_sessions` for events would corrupt two existing analytics.** Verified, not theoretical:
   - `getAttendanceCohorts` (`attendance.service.ts`) computes `totalSessions` as a raw `count(*)` over `service_sessions` in the date range, then classifies each member `regular` if `checkins / totalSessions >= 0.6`. Every camp meeting or seminar added as a session row raises the denominator for everyone and silently demotes members to "irregular."
   - The engagement-risk system (`engagementRiskFlags.consecutiveMissedCount`) is built on consecutive missed sessions. Skipping an optional seminar would count toward "this member is disengaging."
   - Structurally it's also a poor fit: `service_sessions.serviceTypeId` is `notNull` and `qrToken` is `notNull` + uniquely indexed, so every event would need a dummy service type and a QR token it never uses; and `sessionDate` is a bare `date` with no time-of-day and no end date — it cannot express "camp meeting, Fri 6pm through Sun 4pm."
6. **Nothing calendar- or event-shaped is reserved in the permission system.** `packages/config/src/permissions.ts` has no `manage:events`, `view:events`, `manage:calendar`, or `rsvp:*` string anywhere. Unlike `manage:departments` (pre-reserved before Phase 2.3), this feature was not anticipated — all permission strings here are genuinely new.
7. **No new frontend dependency is needed.** `apps/web/package.json` already has `date-fns@^4.1.0` and `react-day-picker@^8.10.1`.

## Key decisions

- **Events are a new table, not an extension of `service_sessions`.** Justified by finding #5 — reuse would silently corrupt cohort and risk-flag math for the whole church. `service_sessions` remains the recurring-service concept; `events` is the one-off concept. They are displayed together on the calendar page (frontend-merged, see "Web UI") but never share storage.
- **Attendance tracking reuses the RSVP junction rather than the check-in machinery.** An `attended` boolean lives directly on the RSVP row, plus an optional `headcount` on the event for "500 came, nobody scanned." This is the same "reuse, don't clone" call Phase 2.3 made when it rejected department-specific check-in sessions in favor of an analytics `groupBy`. Known ceiling: no QR scanning at events, and only people who RSVP'd can be marked attended — a walk-up is handled as a staff-side "add attendee," which is just an RSVP insert with `status='going', attended=true`.
- **`churchId` stays `notNull` on both new tables; network-wide visibility is a `scope` enum (`church` | `network`), not a nullable FK.** `events.churchId` is always the owning/authoring church, even for network events. Reads widen (`or(eq(churchId, ctx), and(eq(scope,'network'), eq(status,'published')))`); **writes never widen** — a church can only ever mutate rows it owns. This asymmetry is the whole safety property, and it required no `churches` table migration and no `ChurchContextGuard` change. Publishing a `network` event additionally requires a separate `manage:network-events` permission granted to `super_admin`/`admin` only — a single branch must never be able to push events onto every other branch's calendar. Known ceiling: this is all-or-nothing (every branch or just the owning one) — targeting a specific subset of branches is not supported. If that becomes a real requirement, the upgrade path is a `event_church_visibility` junction table, not a rework of the `scope` column.
- **`event_rsvps.churchId` is the RSVP-er's church, not the event's owning church.** For a network camp meeting this is what makes "how many are coming from each branch" a plain `groupBy` — and it keeps the junction consistent with `member_zones`/`member_departments`, which both denormalize `churchId` for scoping.
- **`status` (`draft`/`published`/`cancelled`) rather than relying on soft-delete for cancellation.** A cancelled event must stay visible to the people who RSVP'd — deleting it would silently remove it from their portal with no explanation. Mirrors `campaignStatusEnum` and `serviceSessionStatusEnum`.
- **No recurrence in v1.** Camp meetings and seminars are one-off by nature, and recurring gatherings are already `service_sessions`. No RRULE engine, no recurrence columns.
- **Timestamps, not `date`, for audit columns on these tables.** Events need real `timestamp` columns for `startsAt`/`endsAt`; mixing `timestamp` event columns with `date` audit columns in one table would be worse than following the `campaigns`/`user_church_memberships` convention, which is all-`timestamp`. Naive `timestamp`, not `timestamptz` — this repo has no timezone-aware date columns anywhere yet, and adding the first one here would make this module inconsistent with everything else rather than more correct in isolation. Known ceiling: a network-wide event announced across branches in different timezones will display the wrong local time for someone. If that becomes a real requirement, it's a cross-cutting change (a `timezone` column on `churches`, `timestamptz` everywhere), not a fix scoped to this feature.
- **Event creation is admin/branch-admin only in this phase** (`manage:events`). Members and leaders get view + RSVP. Member-authored events and department/zone-leader-scoped events are both explicitly deferred — see "Explicitly out of scope." No speculative `departmentId`/`zoneId` column is added to `events` now; adding one later is a plain additive migration.
- **The calendar page merges events with service sessions at the frontend only.** The page fetches `/events` and the existing attendance sessions endpoint and merges them for display; sessions remain non-editable from the calendar and no backend endpoint is added for this. Cheap, and avoids coupling the two modules at the API layer.
- **No RSVP capacity limits, waitlists, or reminder notifications.** Both are legitimate future features with their own data model and are not needed to close out the phase's core scope (camp meetings, seminars, RSVP, attendance).
- **No new guard.** Every role either has full church-scoped access (`manage:events`), read access (`view:events`), or strictly-own access (`rsvp:event`, enforced by filtering on the resolved member id in the service). No `EventContextGuard` is introduced.

## Architectural template

Structurally this is the **Offerings** module (`apps/api/src/offerings`, `packages/db/tables/offerings.ts`, `apps/web/app/[churchId]/dashboard/offerings`): a church-scoped entity plus a member-linked child table, a controller/service/module trio with **no DTO classes** (plain exported TS input types), church-scoping via manual `eq(table.churchId, churchId)` predicates, and Server Actions on the frontend hitting the API through `apiGet/apiPost/apiPut/apiDelete`.

Two structural differences from that template:

1. **The child table is a true membership junction with a uniqueness constraint**, unlike `offerings` (a transaction log with no uniqueness). `event_rsvps` is closer to `member_departments`: `unique(eventId, memberId)`, written via `onConflictDoUpdate`, exactly as `assignMemberToDepartment` does.
2. **Read scoping is not a single `eq(churchId, ...)`.** It is `or(owned, published-network)`. This is the only place in the codebase where a read predicate widens past the active church, so it is centralized in one private helper on the service (`visibleToChurch(churchId)`) and never inlined per-query.

The member self-service pattern — resolving the caller's member id via `MembersService.getMemberByUserId(churchId, userId)`, since the JWT/`UserContext` carries only `activeMembershipId` — is a clone of `prayer.controller.ts` and `offerings.controller.ts`'s `/offerings/me`.

## Data model

### `events` table (new — `packages/db/tables/events.ts`)

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | default `gen_random_uuid()` |
| `churchId` | uuid FK → `churches.id` | **not null** — the owning/authoring church, even for network events. This is the write-scoping column. |
| `title` | varchar(255) | not null |
| `description` | text | optional |
| `location` | varchar(255) | optional; free text (no venue entity — YAGNI) |
| `startsAt` | timestamp | not null |
| `endsAt` | timestamp | optional; null = open-ended. Multi-day events (camp meetings) are a single row spanning days, not one row per day. |
| `scope` | `event_scope` enum (`church`, `network`) | default `church`, not null. `network` = visible to every church once published. |
| `status` | `event_status` enum (`draft`, `published`, `cancelled`) | default `draft`, not null. Only `published` is visible in the member portal or to other churches. |
| `headcount` | integer | optional; recorded total attendance for events where nobody was individually marked. |
| `createdAt` / `updatedAt` / `deletedAt` | timestamp | soft-delete via `deletedAt` |

Indexes: `churchId`, `startsAt`, `status`, and a composite on `(scope, status)` — the network-visibility read predicate hits that pair on every calendar load.

No uniqueness constraints — two events may legitimately share a title, date and location.

### `event_rsvps` table (new — `packages/db/tables/eventRsvps.ts`)

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | default `gen_random_uuid()` |
| `eventId` | uuid FK → `events.id`, `onDelete: cascade` | not null |
| `memberId` | uuid FK → `members.id`, `onDelete: cascade` | not null |
| `churchId` | uuid FK → `churches.id`, `onDelete: cascade` | not null — **the RSVP-er's church**, denormalized for scoping, matching `member_departments`/`member_zones`. For a network event this differs from `events.churchId`, and that is what makes per-branch RSVP breakdowns a plain `groupBy`. |
| `status` | `event_rsvp_status` enum (`going`, `maybe`, `declined`) | not null |
| `attended` | boolean | default false, not null. This is the "event attendance tracking" record. |
| `createdAt` / `updatedAt` | timestamp | no `deletedAt` — changing your mind updates `status` in place rather than creating a tombstone |

Constraints: `unique(eventId, memberId)` — one RSVP row per member per event, upserted via `onConflictDoUpdate` on that target.

Indexes: `eventId`, `memberId`, `churchId`.

Both tables get their `$inferSelect`/`$inferInsert` types exported and re-exported from `packages/db/schema.ts`, matching the tail of that file.

## API layer (`apps/api/src/events`)

Three files — `events.controller.ts`, `events.service.ts`, `events.module.ts` — with a single `@Controller('events')`. `EventsModule` imports `MembersModule` for `getMemberByUserId`, exactly as `OfferingsModule` does. Plain exported TS input types (`CreateEventInput`, `UpdateEventInput = Partial<CreateEventInput>`), no DTO classes.

| Route | Method | Permission | Notes |
|---|---|---|---|
| `/events/me` | GET | `rsvp:event` | self-service; caller's own RSVPs joined to event details. **Must be declared before `/events/:id`** — same ordering constraint `offerings.controller.ts` observes for `me` and `reports/summary`. |
| `/events` | POST | `manage:events` | `{title, startsAt, description?, location?, endsAt?, scope?, status?}`. `scope: 'network'` additionally requires `manage:network-events` (checked in the controller, 403 otherwise). |
| `/events` | GET | `view:events` | list; visibility predicate below; filters `from`, `to`, `status`, `scope` |
| `/events/:id` | GET | `view:events` | detail; 404 if not visible to the caller's church |
| `/events/:id` | PUT | `manage:events` | update; **owning church only** |
| `/events/:id` | DELETE | `manage:events` | soft delete; owning church only |
| `/events/:id/rsvps` | GET | `manage:events` | RSVP roster: rows plus counts by status, and — for `network` events — counts grouped by `event_rsvps.churchId` |
| `/events/:id/rsvps` | POST | `manage:events` | `{memberId, status}` — staff RSVP on a member's behalf, or register a walk-up; upsert on `(eventId, memberId)` |
| `/events/:id/rsvp` | PUT | `rsvp:event` | **self-service**; `{status}`; resolves the caller's member id via `MembersService.getMemberByUserId`, upserts on `(eventId, memberId)` |
| `/events/:id/attendance` | PUT | `manage:events` | `{attendedMemberIds?: string[], headcount?: number}` — sets `attended = true` on the listed RSVP rows (creating `going` rows for walk-ups) and/or writes `events.headcount` |

### Service behavior

- **Read visibility** is one private helper, used by every read:
  ```ts
  private visibleToChurch(churchId: string) {
    return or(
      eq(events.churchId, churchId),
      and(eq(events.scope, 'network'), eq(events.status, 'published')),
    )
  }
  ```
  A `draft` network event stays private to its owning church until published.
- **Write scoping never widens.** `updateEvent`, `deleteEvent`, `setAttendance` and the staff RSVP routes all AND in `eq(events.churchId, churchId)` — a branch admin cannot edit HQ's camp meeting even though they can see it.
- **Member-portal reads additionally require `eq(events.status, 'published')`** so drafts never leak to members of the owning church either.
- `rsvp()` verifies the event is visible **and** `status = 'published'` before upserting, then writes `churchId` from the request context (the RSVP-er's church), not from the event row.
- `getMyRsvps(churchId, memberId)` filters strictly on the resolved `memberId` — the same construction that makes `getMyOfferings` safe.

## Guards, roles, permissions

Four new strings in `PermissionAction` (`packages/config/src/permissions.ts`), added under a new `// Events` comment block matching the existing `// Offerings` block:

| Permission | Granted to | Purpose |
|---|---|---|
| `manage:events` | `super_admin`, `admin`, `branch_admin` | create/edit/cancel/delete events, manage RSVP rosters and attendance. Same tier as `manage:departments` and `manage:offerings`. |
| `view:events` | **all six roles** | read the calendar. Everyone in a church should see what's on. |
| `rsvp:event` | all six roles | self-service RSVP, following the `create:prayer-request` precedent (granted broadly, not just to `MEMBER`); it degrades gracefully — a user with no linked member row gets a 400 with the same wording `prayer.controller.ts` uses. |
| `manage:network-events` | `super_admin`, `admin` only — **not** `branch_admin` | publish an event with `scope = 'network'`. This is the HQ gate: a single branch must not be able to push events onto every other branch's calendar. |

`PERMISSION_METADATA` entries are added for all four, reusing the existing `category` union values (`'admin'` for the three manage/view strings, `'member'` for `rsvp:event`) rather than extending the union — following the precedent set by the offerings/goals permissions, which reused `'admin'`/`'member'` rather than adding a new category.

**No new guard.** Unlike Phase 2.3 (where `department_leader` needed live-query scoping to a subset of departments), every role here has either full church-scoped access, plain read access, or strictly-own access enforced in the service layer. No `EventContextGuard` is registered in the `APP_GUARD` chain in `app.module.ts`.

Frontend mirrors the new strings in `apps/web/lib/permissions.ts`. The sidebar nav item is gated on `view:events` (not `manage:events`) so leaders and members reach the calendar too — deliberately avoiding the sidebar/route permission-string mismatch that Zones has.

## Web UI

### Staff-facing (`apps/web/app/[churchId]/dashboard/events`)

- `page.tsx` — Server Component. Month grid rendered with the already-installed `react-day-picker@8`, using `modifiers`/`modifiersClassNames` to mark days that have events; selecting a day filters a `Suspense`-wrapped list beneath it. **The list additionally fetches and merges in `service_sessions` for the same range, read-only** — sessions render with a distinct visual treatment and are not clickable into an edit flow from here. Dates formatted with the already-installed `date-fns`. **No new calendar dependency.** Known ceiling: this gives a month grid with day markers, not a week/agenda view with time-slot lanes — that would need a real calendar library, and is the upgrade path if it's ever asked for.
- `add/page.tsx` — create form (zod + react-hook-form: title, description, location, `startsAt`, `endsAt`, scope, status). The `scope` select is rendered only for users holding `manage:network-events`.
- `[id]/page.tsx` — detail: event fields, RSVP roster grouped by status (and, for network events, a per-branch breakdown), attendance marking, headcount field.
- `[id]/edit/page.tsx` — edit form.
- `apps/web/actions/event.ts` — Server Actions over `apiGet/apiPost/apiPut/apiDelete`, `revalidatePath` after each mutation, matching `actions/offering.ts`.
- `apps/web/config/sidebar.ts` — a new `{ title: "Events", href: "/dashboard/events", icon: CalendarDays, permissions: ["view:events"] }` item alongside the existing Offerings entry.

### Member-facing (`apps/web/app/[churchId]/portal/events`)

- `page.tsx` — upcoming **published** events (own church + published network events), each with Going / Maybe / Declined buttons posting to `/events/:id/rsvp`, and the caller's current RSVP highlighted. Cancelled events remain listed with a cancelled badge. **Service sessions are not merged into this view** — the member-facing merge is a "nice to have" left for a later pass; the staff calendar is where the merge matters for planning, and the phase's scope statement is about events/RSVP, not a member-facing service schedule.
- `apps/web/app/[churchId]/portal/layout.tsx` — new nav entry `{ href: "events", label: "Events", icon: CalendarDays, permission: "view:events" }`, matching the existing `portalLinks` shape.

## Error handling & edge cases

- `endsAt` earlier than `startsAt` → `BadRequestException` in the controller, validated at the trust boundary the same way `offerings.controller.ts` validates `amountCents`.
- Missing `title` or `startsAt` → `BadRequestException`, matching the `Missing required fields: ...` message shape used across the existing controllers.
- `scope: 'network'` requested without `manage:network-events` → 403, not a silent downgrade to `church`.
- RSVP to a `draft` or `cancelled` or soft-deleted event → `BadRequestException`; the service checks visibility **and** `status = 'published'` before upserting.
- RSVP by a user with no linked member row in this church → `BadRequestException` with `prayer.controller.ts`'s existing wording, not a 500.
- Duplicate RSVP / changing your mind → upsert on `(eventId, memberId)`; `going → declined` updates the row in place, so an event never shows a member twice.
- Cancelling an event keeps all RSVP rows — members who RSVP'd must be able to see that it was cancelled. Cancellation is `status = 'cancelled'`, never a soft-delete.
- Soft-deleting an event leaves `event_rsvps` rows in place, excluded from results via the parent's `isNull(events.deletedAt)` filter — no cascade cleanup, matching departments.
- A network event whose owning church is later soft-deleted stays visible to every other church (the event row itself is untouched). No cleanup job.
- A member RSVPs to a network event, then their membership in that church is removed: the RSVP row survives with its original `churchId`. Rosters render it under that branch. No orphan-sweeping.
- **Known ceiling — timezones.** `startsAt`/`endsAt` are naive `timestamp`, matching `campaigns.scheduledAt`. Correct for a single-timezone deployment; wrong for a network camp meeting spanning timezones (accepted for this phase, see "Key decisions").

## Testing

Colocated `*.service.spec.ts`, matching `offerings.service.spec.ts`, `departments.service.spec.ts` and `attendance.service.spec.ts`. No new test framework.

- `events.service.spec.ts` — CRUD and soft-delete; **church scoping**: church A cannot see church B's `scope='church'` events.
- **Network visibility** (the highest-risk logic here, three cases): church B *does* see church A's `published` `network` event; church B does *not* see church A's `draft` network event; church B *cannot* `PUT` or `DELETE` church A's network event even though it can read it.
- **Member-portal visibility**: a `draft` event is invisible to members of its own owning church.
- RSVP: upsert is idempotent on `(eventId, memberId)`; `going → declined` updates in place rather than inserting a second row; RSVP to a `draft`/`cancelled` event is rejected; `event_rsvps.churchId` records the RSVP-er's church, not the event owner's — asserted directly on a network event.
- Self-service: `/events/me` returns only the resolved member's RSVPs and no other member's.
- Attendance: marking `attendedMemberIds` sets `attended` only on those rows; a walk-up id with no prior RSVP creates a `going`/`attended` row.

## Explicitly out of scope

- **Recurring events / RRULE.** Recurring gatherings are already `service_sessions`; the Phase 3.2 scope statement names camp meetings and seminars, both one-off. No recurrence columns or placeholders are added.
- **Merging events into the attendance analytics** (`getTrends`, `getAttendanceCohorts`, risk flags). Event attendance is reported on the event, not folded into service-attendance trends.
- **Fixing the `groupBy: 'branch'` misnomer** in `attendance.service.ts`. Documented in findings #2 for awareness; not touched by this feature.
- **Capacity limits, waitlists, ticketing.** Their own data model and their own design pass.
- **Event reminder notifications / RSVP confirmations** via the communications module.
- **Linking offerings to events.** `offerings.sessionId` points at `service_sessions`; no `eventId` column is added. A future nullable `eventId` FK is a plain additive migration.
- **Department/zone-scoped events and leader-authored events.** No `departmentId`/`zoneId` column added speculatively; a plain additive migration if this is picked up later.
- **Member-authored events**, with or without an approval flow. `manage:events` is admin/branch-admin only this phase.
- **Public/external registration** (non-members RSVPing via a public link) and **ICS export / Google Calendar sync.**
- **Timezone-aware scheduling.** Naive timestamps only, matching the rest of this codebase (see "Key decisions").
- **A dedicated `EventContextGuard`** — no role below admin tier gets scoped write access in this phase.
