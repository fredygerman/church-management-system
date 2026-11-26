# Lane 03: rbac-and-roles

- **Waves:** 1 (tasks 1-9), 2 (tasks 10-12), 3 (RM-147).
- **Backlog IDs:** RM-020, 021, 022, 023, 024, 025, 026, 027, 028, 065 (W1); RM-095, RM-101 (W2, API half of RM-099); RM-133 API half, RM-147 (W3).
- **Decisions:** D-15 (usher and publisher roles: default enum values), D-05, D-18, D-31 (test accounts), D-14 (second tenant), D-22 (service times).
- **Depends on:** lane 01 merged (owns `permissions.ts` first); RM-029 (lane 04 schema adds the enum values) for RM-021 and RM-027; RM-030 (phone normaliser) for RM-101.
- **Blocks:** lanes 05, 06, 09, 10, 11 (permission names), all device testing (accounts).
- **Model:** Luna medium; split brief A (permissions, matrix test, guard) from brief B (scope, projection, attendance) from brief C (seeds).

## Goal

One reviewed permission matrix with roles for ushers and announcement publishers, least-privilege scoping on staff data, and a seeded dev account per role so every later lane can test against real roles.

## Owned files (exclusive)

```
packages/config/src/permissions.ts            (after lane 01's Wave 0 merge)
packages/config/src/permissions.test.ts       (new)
apps/api/src/auth/guards/**, apps/api/src/auth/decorators/**
apps/api/src/members/**, visitors/**, families/**, attendance/**
apps/api/src/rbac/**                          (new: matrix fixture + spec)
packages/db/tables/members.ts, attendance.ts, visitors.ts, families.ts
packages/db/seeds/**, packages/db/seed.ts, packages/db/demo.ts
apps/web/app/[churchId]/dashboard/permissions/**, apps/web/components/permissions/**
```

Not owned: `packages/db/tables/user.ts` (lane 04 adds `usher` and `publisher` to `roleEnum` at `user.ts:13`), `apps/api/src/auth/auth.*` (lane 04), `dashboard/**` (lane 01).

## Tasks (in order)

1. **Permission contract PR (publish first, small).** Add to the `Permission` union and `PERMISSION_MAP`: `view:announcements` (all roles), `publish:announcements`, `approve:announcements`, `manage:invitations`, `view:prayer-requests`, `search:members` (projection only: name, phone, zone). Defaults: `publish:announcements` for SUPER_ADMIN, ADMIN, BRANCH_ADMIN, `publisher`; `approve:announcements` for SUPER_ADMIN, ADMIN; `manage:invitations` for SUPER_ADMIN, ADMIN, BRANCH_ADMIN (own branch, enforced in lane 10); `search:members` for admins, leaders, `usher`; `view:prayer-requests` for nobody until D-17. Remove `manage:sms` from BRANCH_ADMIN (D-18). Keep existing names untouched. Add `UserRole.USHER` and `UserRole.PUBLISHER` types after lane 04's enum PR; grants below.
2. **RM-021** Role grants. `usher`: member self-service set plus `view:attendance`, `manage:attendance`, `view:visitors`, `create:visitor`, `search:members`. `publisher`: member self-service set plus `view:communications`, `manage:communications`, `view:announcements`, `publish:announcements`. Neither holds delete, settings, giving reports or `read:member` full records. Document D-15 option (b) if the owner chooses a bundle instead.
3. **RM-020 matrix test.** `apps/api/src/rbac/rbac-matrix.fixture.ts` encodes the expected matrix (table in `audits/backend-api.md` 4.8 plus the grants above); `rbac-matrix.spec.ts` compares it with `PERMISSION_MAP` in both directions and fails on any unlisted grant. Add `packages/config/src/permissions.test.ts` (MEMBER has no `view:visitors`, `create:visitor`, `manage:*`).
4. **RM-026** `auth/guards/church-context.guard.ts:55-71`: replace `request.path.includes('/profile')` and `'/users/me'` substring checks with exact route patterns or a `@SkipChurchContext()` decorator; guard spec with a route whose path merely contains `/profile`.
5. **RM-022** Leader scope for visitors, families and attendance sessions/trends using the `getLeaderScope` pattern (`members.service.ts:101-107`). If `visitors` has no zone or owner column, scope leaders to visitors they created or follow up and report the gap (schema tweak allowed in `visitors.ts`). MEMBER reads nothing here.
6. **RM-023** Member list and search projection: `GET /members` and `GET /members/search` return only `id, firstName, lastName, phone, zoneId, departmentIds, status`; `notes`, `dateOfBirth`, `dateOfSalvation`, `occupation` only on `GET /members/:id` for roles with `read:member`. Search: `q` at least 2 characters (400 `QUERY_TOO_SHORT`), `limit` default 25, max 50, `offset`, `meta.total`. Permission: `search:members` or `read:member`.
7. **RM-024** Attendance: stable codes `CHECKIN_DUPLICATE`, `SESSION_CLOSED`, `MEMBER_NOT_FOUND` in `HttpException` bodies; a unique-index violation on `attendance.ts:102` maps to 409 `CHECKIN_DUPLICATE`, not 500 (MS-11).
8. **RM-025** Session QR token: 32 random bytes (hex); `qrToken` omitted from `listSessions` unless the caller holds `manage:attendance` (`attendance.service.ts:85,99-109`).
9. **RM-027 / RM-028 seeds.** New `packages/db/seeds/staff-test-users.ts` (idempotent, `onConflictDoNothing`): accounts `staff.admin` (admin), `staff.branch` (branch_admin, HQ plus TEST church), `staff.zone` (zone_leader, one zone), `staff.ministry` (department_leader), `staff.usher` (usher), `staff.publisher` (publisher), `member.control` (member). Requires `DEMO_SEED_CONFIRM=true`, refuses `NODE_ENV=production` and any `DATABASE_URL` host not on a dev allow-list, passwords from env vars only (never in repo). Seed set per `mobile-staff.md` section 5 (open session today, closed session, 25+ members with +255 numbers incl. two sharing a phone and one soft-deleted, three zones and departments with leaders, three visitors incl. one matching a member phone, one event with RSVPs, one prayer request from `member.control`). Add a second church labelled `Mito ya Baraka (TEST Kimara)` with memberships for `staff.branch` and `mobile.test@...` (RM-028, D-14). Add a production refusal to `seed.ts` and `demo.ts` (IO-33). Do not run the seeds; the owner approves dev DB writes (D-31).

### Wave 2

10. **RM-095** Service times: in `attendance.ts` add `starts_at timestamptz` to service sessions and `service_time` (time) plus `weekday` to service types; keep `session_date` as the local date; API accepts both for one release. Table TypeScript only (integrator generates M3).
11. **RM-101** `GET /visitors/duplicates?phone=&name=` PROPOSED (permission `create:visitor`): returns up to 5 candidates from visitors and members with masked phone; E.164 normalisation of `phone` on visitor create and convert using `packages/config/src/utils/phone.ts` (lane 04). Convert-to-member checks duplicates (`visitors.service.ts:116-140`).
12. **RM-065** Replace the per-visitor query loop in `getVisitorsByStatus` (`visitors.service.ts:98-108`) with one paginated query joining the latest follow-up.

### Wave 3

13. **RM-133 (API half)** signed short-lived member code for staff QR scanning (PROPOSED `GET /members/me/checkin-code` returning an HMAC-signed token, 60 s TTL, bound to member and church; `POST /attendance/checkins/qr/:token` accepts it instead of a raw member id, `attendance.controller.ts:113-117`). Not before D-34 and RM-097. **RM-147** replace seed placeholder text (`seedChurches.ts:25`, `seedWorkspaces.ts:25`) and add a server flag for placeholder About text.

## Contracts

`GET /members/search?q=mw&limit=25&offset=0` (PROPOSED query params on an existing route), permission `search:members`:

```json
{ "success": true, "data": [ { "id": "uuid", "firstName": "Neema", "lastName": "Mwakyusa", "phone": "+255712345678", "zoneId": "uuid", "departmentIds": [], "status": "active" } ],
  "meta": { "total": 41, "limit": 25, "offset": 0 } }
```

Errors: `400 QUERY_TOO_SHORT`, `403 FORBIDDEN`. `GET /visitors/duplicates?phone=%2B255712345678` returns `{ "data": [ { "type": "visitor|member", "id": "uuid", "name": "Neema M.", "phoneMasked": "+255***678" } ] }`. Attendance errors: `{ "statusCode": 409, "code": "CHECKIN_DUPLICATE" }`.

DB sketch (table TS only, M3): `service_sessions.starts_at timestamptz NULL`, `service_types.service_time time NULL`, `service_types.weekday smallint NULL`.

## Acceptance (testable)

- Matrix spec passes; adding an unlisted grant to any role fails it.
- MEMBER: 403 on `/visitors*`, `/attendance/sessions/:id/headcount`, `/members/search`; `/members` returns only the own row.
- `staff.usher`: can check in and set headcount, 403 on `/offerings`, member delete, settings; search response has no `notes`.
- `staff.zone`: visitors and families lists contain only own scope; another zone's id returns 404.
- Concurrent duplicate check-in returns 409 `CHECKIN_DUPLICATE`, never 500.
- `qrToken` absent from sessions for `view:attendance`-only roles.
- Seeds: running twice changes nothing; running with `NODE_ENV=production` aborts before any write.

## Test plan (targeted)

`pnpm --filter api test -- src/rbac src/members src/visitors src/families src/attendance src/auth/guards`; `pnpm --filter @church/config test` for `permissions.test.ts`. Seeds: dry-run unit test of the guard function only. One final `pnpm --filter api type-check` and `pnpm --filter @church/config build`. Skip web unless the permissions page changed.

## Risks

- Role enum values depend on lane 04 and the M1 migration (non-trivial ordering): do not start RM-021 grants until RM-029 is merged.
- Mobile keeps a client copy of grants via `@church/config/permissions` (`lib/claims.ts`); new roles must appear in lane 11's claims test.
- Scoping visitors may be impossible without a schema column; report instead of guessing.
- Seeding writes to DEV only with the owner's OK for the session.

## Agent brief (A: contract, matrix, guard, seeds; run before B)

```
ROLE: build agent, lane 03 rbac-and-roles, brief A. Leaf worker: start no subagents.
REPO: /Users/upstairs/Personal/builds/church/church-management-system  BRANCH: design/mito-ya-baraka-concepts (stay on it)
READ FIRST: docs/roadmap/README.md (ground rules), docs/roadmap/specs/lane-03-rbac-and-roles.md tasks 1-4 and 9, docs/roadmap/audits/backend-api.md section 4.8, mobile-staff.md section 5.
PRECONDITION: lane 01 merged (RM-001 done in packages/config/src/permissions.ts). If MEMBER still has 'view:visitors', STOP and report.
OWN (may edit): packages/config/src/permissions.ts, packages/config/src/permissions.test.ts; apps/api/src/{rbac/**, auth/guards/**, auth/decorators/**}; packages/db/{seeds/**, seed.ts, demo.ts}.
DO NOT TOUCH: packages/db/tables/** (lane 04 adds usher/publisher to roleEnum in user.ts), auth.service.ts, package.json, lockfile, migrations, mobile, web.
RULES: no commits/push; no pnpm add; no db commands; never run the seed scripts; no secrets or passwords in files.
GOAL: publish the new permission names and role grants, a generated RBAC matrix test, an exact-path church-context guard, and an idempotent dev seed guarded against production.
STEPS:
1. Read permissions.ts (union ~L10-60, MEMBER ~L189, metadata ~L247). Add permissions: view:announcements, publish:announcements, approve:announcements, manage:invitations, view:prayer-requests, search:members. Remove manage:sms from BRANCH_ADMIN. Do not rename existing ones.
2. If lane 04's roleEnum PR is merged (user.ts has 'usher','publisher'), add UserRole.USHER/PUBLISHER grants per the spec; if not, add the permission names only and report that role grants are pending.
3. Write apps/api/src/rbac/rbac-matrix.fixture.ts + rbac-matrix.spec.ts comparing fixture and PERMISSION_MAP both ways; add permissions.test.ts.
4. church-context.guard.ts:55-71: exact route patterns or @SkipChurchContext(); add a guard spec.
5. packages/db/seeds/staff-test-users.ts per spec task 9: idempotent, DEMO_SEED_CONFIRM=true, refuses NODE_ENV=production and non-allow-listed hosts, passwords from env. Add production refusal to seed.ts and demo.ts. Do NOT run them.
VERIFY: pnpm --filter api test -- src/rbac src/auth/guards ; pnpm --filter @church/config test (permissions only); ONE pnpm --filter api type-check; pnpm --filter @church/config build.
REPORT (max 15 lines): files changed; RM IDs done/partial; tests run/skipped; exact permission names added (for lanes 05/06/09/10); requests to lane 04 (enum values) and lane 11 (claims test); open risks.
```

Brief B (scope, projection, attendance, tasks 5-8) and brief C (Wave 2 tasks 10-12) reuse this header with the matching task list and the owned files above.
