# Lane 10: church-join-and-switching

The switcher UI itself (pill, sheet, branch selector, confirmation) is lane 07 (RM-083). This lane owns joining another church: invite codes and links, approval, the admin UI and the mobile join flow.

- **Wave:** 2.
- **Backlog IDs:** RM-084 (API, schema), RM-085 (web admin), RM-086 (mobile join).
- **Decisions:** D-02 (default: invite code plus admin approval; invite links bound to a verified email may skip approval), D-21 (registration), D-14 (second tenant), D-15.
- **Depends on:** lane 03 (`manage:invitations`, role grants); lane 04 RM-029 and RM-031 (verified email for email-bound invites); lane 05 notifications service (inbox items `membership.requested`, `membership.approved`); lane 07 RM-083 (switcher row routes to `/join`) and `SessionGate` sending users with no active membership to `/join` (request to lane 07); lane 12 namespaces; lane 13 primitives.
- **Blocks:** nothing downstream.
- **Model:** Luna medium, three briefs: A (API and schema), B (web admin), C (mobile join).

## Goal

A signed-in member can join another church with a code or invite link and see "waiting for approval" until an admin approves; admins create, revoke and review invitations and requests from the web dashboard; a pending user has no access to church data.

## Facts (verified)

`membership_status` enum is `active | invited | suspended` (`packages/db/tables/userChurchMemberships.ts:19-23`); `role` is a `roleEnum` column, `member_id` nullable (`:40-43`). `ChurchContextGuard` rejects non-active memberships (`church-context.guard.ts:92-102`), and `GET /auth/memberships` returns active ones only. No invite or join route exists (WD-11, BE 4.4, MM-07). Users list, membership role change, delete and restore exist in `users.controller.ts:138-252` (web has no UI for them).

## Owned files (exclusive)

```
apps/api/src/invitations/**   (new)         apps/api/src/memberships/**   (new)
packages/db/tables/churchInvitations.ts (new), membershipEvents.ts (new), userChurchMemberships.ts
apps/web/app/[churchId]/dashboard/users/**   (new)
apps/web/app/join/**   (new: public landing)
apps/web/components/users/**, apps/web/actions/users.ts (exists, empty), apps/web/actions/invitations.ts   (new)
apps/web/tests/users-*.test.ts, invitations-*.test.ts   (new)
apps/mobile/app/join/**   (new: index.tsx, [token].tsx)
apps/mobile/components/join/**, apps/mobile/lib/join-api.ts   (new), apps/mobile/tests/join-*.test.ts   (new)
packages/config/src/i18n/messages/join.ts   (new, pre-registered by lane 12)
```

Not owned: `users/**` API (lane 09), `churches/**` (lane 01), `auth/**` (lane 04), `components/home/**` and `spaces-section.tsx` (lane 07).

## Tasks (in order)

1. **RM-084 schema (table TS only, integrator batch M3).** `church_invitations` with `kind` `code|invite`; `membership_events` (audit); `membership_status` gains `pending_approval` (own migration, non-transactional `ALTER TYPE ADD VALUE`). Sketch below.
2. **RM-084 API.** Admin: create, list, revoke invitations; list and decide membership requests. User: preview a code, join, see own pending requests. Codes are 8 characters from an unambiguous alphabet (no 0, O, 1, I), stored as sha256, shown once at creation; invite links carry a 32-byte random token, stored as sha256. Accept is transactional and idempotent per (invitation, user). Role ceiling: `role` at most the caller's role and `member` only for codes. Branch admins act on their own church only (`ChurchContextGuard` plus a check on the path `churchId`). Throttle: preview 10/min/IP; join 5/min/user and 20/day/user; wrong, expired and revoked codes return the same 404 body. Email-bound invites require `emailVerifiedAt` and a matching email. Approval creates a `members` row when none is linked (name, phone from the user) and links `member_id`; the admin may instead link an existing member (search by name, duplicate check using lane 03's endpoint). Inbox notifications through lane 05's service: admins get `membership.requested`, the user gets `membership.approved`. Every decision writes `membership_events`. Last admin of a church cannot be suspended or downgraded.
3. **RM-085 web admin.** `dashboard/users`: list (search, role, status, pagination) from existing `GET /users`; change role (guarded by the ceiling), suspend, restore; Invitations tab (create code or invite, copy once with a clear "shown once" note, revoke, usage count and expiry); Requests tab (approve, reject, link to existing member). Visible only with `manage:invitations`; server errors translated; no raw API text. Public `app/join/[token]` landing: shows the church name, offers "Open in the app" and sign-in, then accepts through a server action.
4. **RM-086 mobile join.** `app/join/index.tsx`: enter or paste a code (auto-uppercase, grouped as `ABCD-EFGH`), preview shows the church name and whether approval is needed, confirm; `app/join/[token].tsx` handles `mitoyabarakachurch://join/<token>` links; result screens: joined (switch offer), waiting for approval (explains next step, refresh action, uses `GET /join/requests/me`), errors mapped from codes. Entry points: switcher row (lane 07), after registration with no membership (lane 04), and the no-membership state. A pending user never reaches church tabs.
5. Tests on a two-church DEV setup (lane 03 RM-028): code created in church B by `staff.branch`, joined by `mobile.test@...`, approved, switcher shows both.

## Contracts (PROPOSED)

| Method and path | Auth and permission | Request | Response | Errors |
|---|---|---|---|---|
| `POST /churches/:churchId/invitations` | `manage:invitations` in that church | `{ "kind": "code", "role": "member", "maxUses": 50, "expiresInDays": 14, "requiresApproval": true }` or `{ "kind": "invite", "email": "a@b.org", "role": "member", "zoneId"?: "uuid", "maxUses": 1, "expiresInDays": 14 }` | `201 { "data": { "id": "uuid", "kind": "code", "code": "K7MQ-4XWD", "joinUrl": "https://.../join/<token>", "expiresAt": "ISO" } }` (secret shown once) | 403 `ROLE_CEILING`, 422 `INVALID_EXPIRY` |
| `GET /churches/:churchId/invitations` | same | | list with `lastChars`, `usedCount`, `maxUses`, `revokedAt` | |
| `DELETE /churches/:churchId/invitations/:id` | same | | 204 | |
| `POST /join/preview` (public) | throttled | `{ "code": "K7MQ4XWD" }` or `{ "token": "..." }` | `{ "data": { "churchName": "Mito ya Baraka HQ", "requiresApproval": true, "expiresAt": "ISO" } }` | 404 `INVITATION_NOT_FOUND` |
| `POST /join` | JWT, no church context | same body | `201 { "data": { "churchId": "uuid", "membershipId": "uuid", "status": "pending_approval|active" } }` | 404, 410 `INVITATION_EXPIRED_OR_USED`, 403 `EMAIL_NOT_VERIFIED`, 403 `EMAIL_MISMATCH`, 409 `ALREADY_MEMBER`, 429 |
| `GET /join/requests/me` | JWT | | `[ { "membershipId", "churchName", "status", "createdAt" } ]` | |
| `GET /churches/:churchId/membership-requests` | `manage:invitations` | | pending list (name, email, createdAt) | |
| `PATCH /churches/:churchId/memberships/:id` | `manage:invitations` | `{ "decision": "approve\|reject\|suspend", "memberId"?: "uuid" }` | 200 membership | 409 `LAST_ADMIN` |

DB sketch (table TS only):

```sql
church_invitations(id uuid pk, church_id uuid fk cascade, kind varchar(8) check in ('code','invite'),
  secret_sha256 char(64) unique not null, last_chars varchar(4), email varchar(255), role roleEnum not null default 'member',
  zone_id uuid, max_uses smallint not null default 1, used_count smallint not null default 0,
  requires_approval boolean not null default true, expires_at timestamptz not null, revoked_at timestamptz,
  created_by uuid fk users, created_at timestamptz default now())
membership_events(id uuid pk, church_id uuid, membership_id uuid, actor_user_id uuid, action varchar(32), detail jsonb, created_at timestamptz default now())
ALTER TYPE membership_status ADD VALUE 'pending_approval';   -- generated alone in its own migration
```

## Acceptance (testable)

- A non-admin cannot create invitations (403); branch admin of church A cannot create or read invitations of church B.
- A code works up to `maxUses`, then returns 410; an expired or revoked code returns the same 404 as a wrong code; 6 wrong joins from one user in a minute get 429.
- An invite for `a@x.org` cannot be accepted by `b@x.org` (403) or by an unverified account (403).
- After join with approval required the user's `GET /auth/memberships` omits the church, every church API route returns 403 for it, and `GET /join/requests/me` lists it; after approval the church appears and the switcher can switch.
- Approval creates or links a member; every decision has a `membership_events` row; the last admin cannot be suspended.
- Web: admin creates a code, sees it once, revokes it; mobile: join by pasted code shows the church name before confirming; pending screen is shown after joining.
- All strings `en` and `sw`; 44 px targets; no raw server text.

## Test plan (targeted)

`pnpm --filter api test -- src/invitations src/memberships` (token hashing, role ceiling, idempotent accept, throttles, tenant isolation, guard blocks pending); `pnpm --filter web test` for `users-*` and `invitations-*`; `pnpm --filter mobile test` for `join-*`. One final `type-check` per touched app. DEV flow with two churches only after M3 is applied (owner OK). Skip unrelated suites.

## Risks

- Codes forwarded in WhatsApp groups: expiry, usage caps, rotation and approval default on; admins see usage.
- `ALTER TYPE ADD VALUE` cannot run inside a transaction: M3 must generate it in a separate migration and be reviewed.
- Show-once codes are inconvenient for admins who print them: allow "create new code" and revoke the old one; do not store the code in clear text.
- Approval may create duplicate members; require the duplicate lookup before creating.
- Deep links need the app scheme only (already in `app.json`); universal links are out of scope.

## Agent brief (A: API and schema)

```
ROLE: build agent, lane 10 church-join-and-switching, brief A (RM-084 API + schema). Leaf worker: start no subagents.
REPO: /Users/upstairs/Personal/builds/church/church-management-system  BRANCH: design/mito-ya-baraka-concepts (stay on it)
READ FIRST: docs/roadmap/README.md (ground rules), docs/roadmap/specs/lane-10-church-join-and-switching.md (facts, tasks 1-2, contracts, DB sketch), docs/roadmap/audits/backend-api.md section 4.4.
PRECONDITIONS: lane 03 merged (manage:invitations exists in packages/config/src/permissions.ts); lane 04 merged (user.ts emailVerifiedAt). If not, STOP and report.
OWN (may edit): apps/api/src/{invitations/**, memberships/**}; packages/db/tables/{churchInvitations.ts (new), membershipEvents.ts (new), userChurchMemberships.ts}.
DO NOT TOUCH: auth/**, users/**, churches/**, notifications/** (call the existing public NotificationsService method), app.module.ts (report the import lines), packages/db/migrations, package.json, lockfile, web, mobile.
RULES: no commits/push; no pnpm add; never run db:generate/push/migrate; hash secrets with sha256, never log codes or tokens.
GOAL: tenant-safe invitations and join-with-approval API per the contracts.
STEPS:
1. Verify userChurchMemberships.ts (status enum L19-23, role/member_id L40-43), church-context.guard.ts:80-115 (active check), auth.controller.ts:254 (memberships list).
2. Add table TS: churchInvitations, membershipEvents; add 'pending_approval' to membershipStatusEnum. Build: pnpm --filter @church/db build.
3. invitations module: create (code: 8 chars from 23456789ABCDEFGHJKMNPQRSTUVWXYZ, token: 32 bytes), list, revoke, preview (public, throttled), join (transactional, idempotent per invitation+user; same 404 for wrong/expired/revoked; role ceiling; email-bound needs verified matching email).
4. memberships module: requests list, decision endpoint (approve creates or links a members row; reject; suspend; LAST_ADMIN guard), membership_events rows, inbox notifications via the existing NotificationsService (membership.requested / membership.approved).
5. Throttles: preview 10/min/IP, join 5/min/user + 20/day/user.
6. Specs: role ceiling, cross-church denial, reuse/expiry/revocation, idempotent join, pending member blocked by ChurchContextGuard, last admin.
VERIFY: pnpm --filter api test -- src/invitations src/memberships ; ONE pnpm --filter api type-check.
REPORT (max 15 lines): files changed; RM-084 status; tests run/skipped; app.module import lines; migration note for the integrator (M3: invitations table, then pending_approval alone); requests (lane 05: confirm NotificationsService.create signature; lane 07: SessionGate route to /join); open risks.
```

Briefs B (web admin, task 3) and C (mobile join, task 4) reuse this header with their owned files; mobile briefs include the device-check rules from the README.
