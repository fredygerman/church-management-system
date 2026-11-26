# Lane 14: web-dashboard-quality

Owns the rest of the web app: truthful states, role gating, the member portal, staff modules that have no UI yet, accessibility and tests.

- **Waves:** 1 (RM-059, 061, 062), 2 (RM-077), 3 (RM-110..117).
- **Backlog IDs:** RM-059, 061, 062, 077; RM-110, 111, 112, 113, 114, 115, 116, 117; RM-128 (web strings), RM-145 hook.
- **Decisions:** D-16 (feed rule), D-22 (service times editor), D-26 (TZS), D-33, DEC-06 (no role redesign), R-LIB-01 and R-PUB-01 field ownership (existing).
- **Depends on:** lane 01 merged (auth files, token exposure); lane 13 tokens (RM-047, RM-049) before RM-115; lane 05 RM-070 for RM-077; lane 03 RM-095 for RM-111 service times; lane 12 keys for web hard-coded strings.
- **Blocks:** nothing critical.
- **Model:** Luna medium; W3 modules are independent briefs (library, church profile, data quality, families, exports, design pass, tests). The design pass (RM-115) is the widest: split by route group.

## Goal

The web dashboard and portal never show a failure as an empty list, are gated by staff role, cover the staff jobs the API already supports, pass automated accessibility checks on key journeys, and have route and action tests.

## Owned files (exclusive)

```
apps/web/app/[churchId]/portal/**
apps/web/app/[churchId]/dashboard/{ai,analytics,attendance,content,data-quality,departments,events,families,family-lifecycle,home,members,more,offerings,profile,visitors,zones,library,settings}/**   (library and settings new)
apps/web/app/[churchId]/dashboard/layout.tsx, dashboard/page.tsx, apps/web/app/[churchId]/{docs,support}/**
apps/web/app/{(home),churches,setup,forbidden,api}/**, app/layout.tsx, app/error.tsx
apps/web/actions/**   except auth.ts, communications.ts, announcements.ts, users.ts, invitations.ts
apps/web/components/**   except ui/**, communications/**, users/**, permissions/**, layout/church-switcher.tsx, church/setup-church.tsx, church-management/church-card.tsx
apps/web/lib/**   except auth-refresh.ts, api-client.ts, announcements/**
apps/web/config/**, apps/web/env.mjs
apps/web/tests/**   except auth-*, session-*, announcements-*, communications-*, users-*, invitations-*, visual/**
apps/api/src/public/**   (church public-profile publish endpoint, RM-111)
packages/config/src/i18n/messages/web-portal.ts   (new, pre-registered by lane 12)
```

Not owned: `dashboard/communications|users|permissions` (lanes 06, 10, 03), `components/ui/**`, `globals.css`, ESLint config (lane 13), `app/auth/**` (lanes 01, 04).

## Tasks (in order)

### Wave 1
1. **RM-059** Attendance check-in actions: move `redirect()` out of `try` (`attendance/check-in/page.tsx:38-44,60-66`, `check-in/[token]/page.tsx`); grep all remaining `redirect(` inside `try` under owned paths (WD-03 found 6 files; communications are lane 06). Tests with a mocked redirect throwing `NEXT_REDIRECT`.
2. **RM-061** (a) Add `loading.tsx` skeletons for dashboard and portal route groups (zero today, 4 `error.tsx`); (b) silent fallbacks become `unavailable`: `actions/portal.ts:37-45` (`getMyAnnouncements` returns `[]` on error), `data-quality/page.tsx` `listImportJobs(...).catch(() => [])`; reuse the `unavailable` result pattern from `actions/member.ts:94-97` with a retry button; (c) `dashboard/layout.tsx` gates on `isStaffRole` (`lib/shell/navigation.ts`): members who type `/dashboard/...` get the denied state with a way back to the member portal (WD-16); distinguish API unavailable from "church not found" instead of swallowing errors (WD-31).
3. **RM-062** Delete dead `lib/api/apiBase.ts`; one validated API base URL in `env.mjs` (four env families today, WD-26); in production `env.mjs` fails on a missing `NEXTAUTH_SECRET` (IO-01 web half); per-route `metadata` through section layouts (0 of 86 pages export metadata); login form must not reuse the 12-character registration rule (request to lane 01 for `app/auth/signin`). Ask the integrator for a check-only `lint` script (current `eslint . --fix` rewrites files).

### Wave 2
4. **RM-077** Portal feed: `actions/portal.ts` and `portal/page.tsx:81` consume lane 05's audience-filtered `GET /announcements`; add `portal/announcements/[id]` detail with the same allow-list renderer idea (web renderer from lane 06's `lib/announcements/` is imported read-only); unavailable state on failure.

### Wave 3
5. **RM-110 library publishing.** `dashboard/library/**`: list grouped by draft, review, published, archived; editor (title, description, type, language, author, cover, categories, file); transitions through existing `PATCH /library/resources/:id` and `POST /library/resources/:id/status` with a confirm dialog showing actor and time; client upload allow-list and size hint (`staff-document-upload-form.tsx:42` has none); member-view preview. Keep `dashboard/content` for staff documents.
6. **RM-111 church profile.** `dashboard/settings/church`: edit name, location, lead pastor, About, service times (D-22), image; publish toggle for the public profile through a new endpoint in `apps/api/src/public/**` (PROPOSED `PUT /public/churches/:publicId/profile` with `publishedFields`); `updateChurch` (`actions/church.ts:41`) finally gets a caller; event form `publicPublishedAt` control (`components/event/event-form.tsx`).
7. **RM-112 data quality.** `previewAction` currently discards the preview result (`data-quality/page.tsx:12-27`): show inline errors and duplicates, add a column-mapping step including `email`, accept CSV and XLSX upload, commit only when no blocking errors, idempotent re-submit; synthetic fixtures only.
8. **RM-113 families.** `dashboard/families/[id]` detail, edit, delete (confirm, does not delete members) and member zone and family assignment panel (`/members/:id/assign-zone`, `/link-family` exist); household policy unresolved, so link at most one family.
9. **RM-114 export and money.** Server action pages through the existing list endpoints (cap 5 000 rows) and builds the CSV with formula-injection escaping (prefix `=`, `+`, `-`, `@` cells with `'`); `lib/export.ts:45` exported only the current page (default 10 rows). `formatMoney` defaults to `TZS` and uses the shared locale formatter (`lib/utils.ts:56-62`; `GivingGoalForm.tsx:72`, `OfferingForm.tsx:204` default `KES`). No new API.
10. **RM-115 design pass.** After lane 13 tokens: codemod raw palette classes to semantic tokens (54 files, `text-gray-600` x38, `text-red-500` x23), labelled inputs (shadcn `Label` + `Input`) in sign-in-adjacent forms, campaigns excluded (lane 06), data-quality, check-in; narrow-screen card layout for staff tables under 768 px (`dashboard/content/page.tsx:60`); per-route metadata finished. Split by route group, one brief each.
11. **RM-116** "Switch to staff / Switch to member" controls (`components/layout/space-nav.tsx`, `portal/more`, `dashboard/more`, profile) only for authorised roles. **RM-117** route-matrix test for `config/routes.ts` (`isRouteAllowed`) and `proxy.ts`, server-action tests, Playwright smoke sign-in to member to staff using lane 13's config (`tests/e2e/**`). **RM-128** apply catalogue keys for `portal/offerings/page.tsx:29` and `giving-goals/page.tsx:15`.

## Contracts

- Result type used by loaders: `{ status: 'ok', data } | { status: 'unavailable' } | { status: 'forbidden' }`; components render retry for `unavailable`, the denied state for `forbidden`, and never an empty list for a failure.
- PROPOSED API (lane 14, `apps/api/src/public/**`): `PUT /public/churches/:publicId/profile` permission `manage:churches` or `update:church-profile` (new, requested from lane 03), body `{ "about": "...", "serviceTimes": [...], "published": true, "publishedFields": ["about","serviceTimes"] }`, response the public projection. No pastor or member data in the projection.
- Existing: library status and patch endpoints, `members/:id/assign-zone`, `link-family`, `imports/preview`, `imports/:id/commit`.

## Acceptance (testable)

- After a successful create or check-in no `err` query parameter appears; an API 500 on a list page shows retry, not an empty table.
- Member direct URL `/{churchId}/dashboard/members` shows the denied state and no records; staff are unaffected.
- `GET /api/auth/session` unchanged by this lane; `env.mjs` fails a production start without `NEXTAUTH_SECRET`.
- Library: draft invisible to members; repeat publish is idempotent; unpublish stops new access; invalid file type shows an actionable error.
- Church profile: unpublished fields absent from `GET /public/churches/:publicId`.
- Export of 25 members yields 25 rows; a cell starting with `=` is escaped; Swahili screen shows TZS with Swahili number format.
- Axe: zero serious violations on sign-in, member Home, Library, Content; no raw palette classes (grep gate); contrast 4.5:1 light and dark.

## Test plan (targeted)

`pnpm --filter web test` limited to files this lane touched (`tests/routes-*.test.ts`, `tests/actions-*.test.ts`, `tests/export-*.test.ts`, `tests/shell-navigation.test.ts`); `pnpm --filter api test -- src/public` for RM-111; one final `pnpm --filter web type-check` (and api type-check for RM-111). Playwright and axe on DEV only when asked (owner OK). Screenshots at 320, 390, 768, 1280 px with synthetic data.

## Risks

- Large diff in the design pass: split by route group and merge after lane 13.
- Gating the dashboard layout must not lock out staff roles that have partial access: use `isStaffRole` plus per-page API 403 as today.
- Household privacy for family linking is unresolved (`screen-specification.md`).
- Exports are personal data: gate with the existing `view:*` permission and note it in the PR.
- Public profile publishing touches privacy of leadership fields: default nothing published.

## Agent brief (Wave 1: RM-059, RM-061, RM-062)

```
ROLE: build agent, lane 14 web-dashboard-quality, Wave 1 tasks 1-3. Leaf worker: start no subagents.
REPO: /Users/upstairs/Personal/builds/church/church-management-system  BRANCH: design/mito-ya-baraka-concepts (stay on it)
READ FIRST: docs/roadmap/README.md (ground rules), docs/roadmap/specs/lane-14-web-dashboard-quality.md (tasks 1-3), docs/roadmap/audits/web-dashboard.md WD-03, WD-16, WD-24, WD-26, WD-31, WD-33.
OWN (may edit): apps/web/app/[churchId]/dashboard/{attendance,data-quality,home,more,profile,layout.tsx,page.tsx}, apps/web/app/[churchId]/portal/**, apps/web/actions/{portal.ts,data-quality.ts,attendance.ts,member.ts}, apps/web/lib/** except auth-refresh.ts/api-client.ts/announcements/**, apps/web/env.mjs, apps/web/config/**, apps/web/tests/{actions,routes}-*.test.ts (new).
DO NOT TOUCH: dashboard/{communications,users,permissions}, app/auth/**, components/ui/**, globals.css, eslint config, apps/web/auth.ts, apps/api, packages, package.json, lockfile.
RULES: no commits/push; no pnpm add; no deploys; synthetic data only in tests.
GOAL: failures never look like empty lists, members cannot open staff pages, redirects after success are not turned into errors.
STEPS:
1. Verify: attendance/check-in/page.tsx:38-44,60-66, check-in/[token]/page.tsx (redirect in try); actions/portal.ts:37-45; data-quality/page.tsx:12-27 and listImportJobs catch; dashboard/layout.tsx (getChurches swallowed error); lib/shell/navigation.ts isStaffRole; lib/api/apiBase.ts (unused?); env.mjs.
2. RM-059: move redirect() after try/catch (or rethrow NEXT_REDIRECT) in each; test with a mocked redirect that throws.
3. RM-061: loading.tsx for dashboard and portal; unavailable result type + retry UI where silent [] fallbacks exist; dashboard/layout.tsx staff-role gate with denied state and link back to portal; unavailable vs not-found split.
4. RM-062: delete lib/api/apiBase.ts after confirming no importers; single validated API base URL and production NEXTAUTH_SECRET check in env.mjs; section-layout metadata titles.
5. Add tests/routes-matrix.test.ts for config/routes.ts isRouteAllowed (member vs staff).
VERIFY: pnpm --filter web test (only the tests you added/changed + tests/shell-navigation.test.ts); ONE pnpm --filter web type-check.
REPORT (max 15 lines): files changed; RM IDs done/partial; tests run/skipped; requests (integrator: check-only lint script; lane 01: login form minLength; lane 12: keys); open risks.
```

Further briefs (library, church profile, data quality, families, exports, design pass by route group, tests) reuse this header with the task list above.
