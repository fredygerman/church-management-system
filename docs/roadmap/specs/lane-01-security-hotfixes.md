# Lane 01: security-hotfixes

- **Wave:** 0 (first, same day), follow-up RM-145 later.
- **Backlog IDs:** RM-001, RM-002, RM-003, RM-004, RM-009, RM-011, RM-012, RM-013, RM-014, RM-145.
- **Decisions:** D-01 (default: remove both grants), D-18 (default: direct send SUPER_ADMIN only), D-29, V-05.
- **Depends on:** nothing. **Blocks:** lane 03 (takes over `permissions.ts`), lane 04 (takes over `auth/**`), lane 09 (takes over `users/**`).
- **Model:** Luna medium, split into brief A (API, RM-001..004, 009, 013, 014) and brief B (web, RM-011, 012). Brief B is the risky one; relaunch smaller if Luna stalls.

## Goal

Close the verified exposures: members reading visitor PII and draft events, cross-tenant SMS lookup, email takeover path, raw error leakage, mass assignment on church update, and browser access to refresh tokens.

## Owned files (exclusive)

Until Wave 0 merge, then ownership transfers as noted.

```
packages/config/src/permissions.ts            (MEMBER grants only; then lane 03)
apps/api/src/sms/sms.controller.ts
apps/api/src/mail/mail.controller.ts, apps/api/src/mail/dtos/send-email.dto.ts
apps/api/src/users/users.controller.ts, users.service.ts, users.service.spec.ts  (then lane 09)
apps/api/src/events/**
apps/api/src/dashboard/**
apps/api/src/churches/**
apps/api/src/common/**                        (interceptors, filters, helpers)
apps/api/src/auth/auth.controller.ts          (callbackUrl only; then lane 04)
apps/api/src/security/**                      (new: regression specs for this lane)
apps/web/auth.ts, apps/web/actions/auth.ts, apps/web/proxy.ts
apps/web/app/auth/callback/**, apps/web/app/auth/signin/**
apps/web/lib/auth-refresh.ts, apps/web/lib/api-client.ts
apps/web/components/layout/church-switcher.tsx
apps/web/components/church/setup-church.tsx
apps/web/components/church-management/church-card.tsx
apps/web/tests/auth-*.test.ts, apps/web/tests/session-*.test.ts (new)
```

Not owned: `apps/api/src/visitors/**`, `members/**` (lane 03); `sms/sms.service.ts`, `sms/dtos/**`, `communications/**` (lane 05); `config/index.ts` (lane 02); `apps/web/config/routes.ts` (lane 14).

## Tasks (in order)

1. **RM-001** In `packages/config/src/permissions.ts`, remove `'view:visitors', 'create:visitor'` from the `UserRole.MEMBER` list (line 191 at audit time). Leaders keep theirs. Confirm `dashboard.controller.ts:32` gates `pendingVisitors` on `view:visitors`; after the change members no longer receive it. Add `apps/api/src/security/member-grants.spec.ts` asserting the MEMBER list lacks both permissions and still has `read:self`, `view:events`, `rsvp:event`.
2. **RM-002** Grep callers of `GET /sms/notification/:reference` (web, mobile, docs). If none, delete the handler in `sms.controller.ts:91-100`; if used, restrict to the existing platform-admin check (`apps/api/src/auth/platform-admin.ts`) and say so in the report. Do not change `sms.service.ts` (lane 05 adds `church_id`, RM-038).
3. **RM-003** In `users.service.ts` update path (`:77-99`) and `users.controller.ts:119-121`: if `email` is present and differs from the stored email, throw `BadRequestException({ message: 'Email change requires verification', code: 'EMAIL_CHANGE_REQUIRES_VERIFICATION' })`; if equal (case-insensitive) ignore it. Keep `name` and `picture` updates working for now (lane 09 replaces `picture` with the avatar endpoint). Mobile profile still posts email; report as a request to lane 09 to make the field read-only.
4. **RM-004** `events.controller.ts:85-111`: compute `publishedOnly = !hasPermission(role, 'manage:events')` and pass it to list and detail (`events.service.ts:93,117`, keep service default `true`). Member detail of a draft returns 404. Ignore the `status` query for non-managers. Add `orderBy startsAt asc` and default `limit` 50 (MM-04). Specs under `apps/api/src/events/`.
5. **RM-009** `common/interceptors/error.interceptor.ts:43-48`: for non-`HttpException` errors return `message: 'Internal server error'` and never the original message or name; log details server-side with a request id (`x-request-id` or a new uuid) and return `requestId`. For `HttpException`, pass through `code` when the response object has one, else `HTTP_<status>`. Envelope otherwise unchanged: `{ success:false, statusCode, message, code, requestId }`.
6. **RM-013** `churches.controller.ts:29-36,98-106`: replace inline `UpdateChurchInput` with a class DTO (`@IsOptional` + validators; whitelisted fields only, never `id`, `networkId`, `deletedAt`); in `churches.service.ts:100-107` pick fields explicitly.
7. **RM-014** `sms.controller.ts` `POST /sms/send` and `POST /sms/test`; `mail.controller.ts` `POST /mail/send`: allow platform-admin or SUPER_ADMIN only (D-18); `/sms/test` only when `NODE_ENV !== 'production'`; drop `html` from `send-email.dto.ts` (templates only; check callers first, the communications service calls `MailService` directly, not this controller); mask phone numbers in controller logs (`+255***123`, helper in `common/`).
8. **RM-012** API part in `auth.controller.ts:312,388-389`: allow-list `callbackUrl` against `FRONTEND_URL` origins or drop it. Web part: use `isSafeInternalPath` (exists in `apps/web/lib/shell/navigation.ts`, read only) in `app/auth/callback/page.tsx` and the NextAuth `redirect` callback in `auth.ts:162-170`; reject `//` and `/\`.
9. **RM-011** Web tokens: end state = `GET /api/auth/session` JSON has no `accessToken` or `refreshToken`; server actions and server components obtain tokens from the encrypted NextAuth JWT cookie only. Steps: remove `session.accessToken/refreshToken` (`auth.ts:152-153`); give `lib/api-client.ts` a server-only token reader; rework the three client components that pass tokens into `update(...)` (`church-switcher.tsx:65`, `setup-church.tsx:82`, `church-card.tsx:58`) so the switch or refresh happens inside the `jwt` callback on `trigger === 'update'` with a non-secret payload (for example `{ switchChurchId }`); make `actions/auth.ts` return no tokens. If NextAuth cannot do this cleanly, stop, report the smallest safe alternative (for example drop `refreshToken` from the session and keep a short-lived access token) and do not ship a half change.
10. **RM-145 (later wave)** Move refresh rotation state in `lib/auth-refresh.ts` out of process memory before a second web replica (V-03).

## Contracts

- Error envelope (all modules): `{ "success": false, "statusCode": 400, "message": "...", "code": "EMAIL_CHANGE_REQUIRES_VERIFICATION", "requestId": "uuid" }`. Mobile maps `code` to catalogue keys (lane 12, RM-054).
- `PATCH /users/me` `{ name?, email?, picture? }`: `email` different from stored returns 400 with the code above.
- `GET /events` and `GET /events/:id` for roles without `manage:events`: published only; detail of non-published returns 404 `Event with ID ... not found`.

## Acceptance (testable)

- Member token: `GET /visitors`, `GET /visitors/:id`, `GET /visitors/status/new` return 403; `GET /dashboard/stats` has no `pendingVisitors`.
- Member token: `GET /events` returns only `status=published`; `GET /events/:draftId` returns 404; admin token still sees drafts.
- ADMIN of church A cannot fetch church B's SMS (route gone or 403 for non-platform admins).
- `PATCH /users/me {email: "other@x.org"}` returns 400 `EMAIL_CHANGE_REQUIRES_VERIFICATION` and the stored email is unchanged.
- Throwing a plain `Error('secret detail')` in a handler returns `Internal server error` with a `requestId`; the original text is only in logs.
- `PUT /churches/:id` with `{ "networkId": "..." }` is rejected (400) and the field is not written.
- `POST /sms/send` as BRANCH_ADMIN returns 403; `callbackUrl=//evil.example` ends on member Home.
- Web: session JSON has no tokens; sign-in, church switch, and church setup still work (manual check on DEV).

## Test plan (targeted)

- API: `pnpm --filter api test -- src/security src/events src/users src/churches src/common`.
- Web: `pnpm --filter web test` limited to `tests/auth-*.test.ts`, `tests/session-*.test.ts`, `tests/shell-navigation.test.ts`.
- One final `pnpm --filter api type-check` and `pnpm --filter web type-check`. Skip full suites.
- Manual (owner OK for DEV): the four member-token requests above; session JSON check.

## Risks

- Removing `create:visitor` from MEMBER could hide a flow nobody remembers; none found in web or mobile (grep `create:visitor` first).
- RM-011 touches sign-in, OAuth and church switching on web; test each on DEV before merge. Highest-risk task; keep it last and separate.
- Existing accounts may already carry attacker-set emails: run V-05 (owner approves a read-only query) after RM-003 deploys.
- Members relying on drafts shown in the app: the list shrinks; mention in release notes.

## Agent brief (A: API)

```
ROLE: build agent, lane 01 security-hotfixes, brief A (API). Leaf worker: start no subagents.
REPO: /Users/upstairs/Personal/builds/church/church-management-system  BRANCH: design/mito-ya-baraka-concepts (stay on it)
READ FIRST: docs/roadmap/README.md (ground rules), docs/roadmap/specs/lane-01-security-hotfixes.md, backlog rows RM-001..004, 009, 013, 014.
OWN (may edit): packages/config/src/permissions.ts (MEMBER grants only); apps/api/src/{sms/sms.controller.ts, mail/mail.controller.ts, mail/dtos/send-email.dto.ts, users/users.controller.ts, users/users.service.ts, events/**, dashboard/**, churches/**, common/**, security/**}; apps/api/src/auth/auth.controller.ts (callbackUrl lines only).
DO NOT TOUCH: anything else (visitors/**, members/**, sms.service.ts, communications/**, config/index.ts, apps/web, apps/mobile, package.json, lockfile, migrations).
RULES: no commits/push/stash; no pnpm add/install; no db commands; no deploys; no secrets in output.
GOAL: close the member-visible and cross-tenant exposures listed below with minimal, tested changes.
STEPS:
1. Verify each cited line first (audits can drift): permissions.ts MEMBER block, events.controller.ts ~99, sms.controller.ts ~91-100, users.service.ts ~77-99, error.interceptor.ts ~43-48, churches.controller.ts ~29-36.
2. RM-001 remove 'view:visitors','create:visitor' from MEMBER; add apps/api/src/security/member-grants.spec.ts.
3. RM-002 grep callers of GET /sms/notification/:reference; delete the handler if unused, else restrict to platform admin.
4. RM-003 email on PATCH /users/me: differing email => 400 {code:'EMAIL_CHANGE_REQUIRES_VERIFICATION'}; equal => ignore.
5. RM-004 events: publishedOnly = !has manage:events (list + detail, detail draft => 404); orderBy startsAt asc; default limit 50; specs.
6. RM-009 error interceptor: non-HttpException => 'Internal server error' + requestId; HttpException keeps/derives code.
7. RM-013 churches update DTO class + explicit field pick.
8. RM-014 /sms/send, /sms/test, /mail/send => SUPER_ADMIN/platform-admin only; /sms/test off in production; remove html from send-email DTO after checking callers; mask phones in controller logs.
9. RM-012 (API half) allow-list callbackUrl in auth.controller.ts against FRONTEND_URL origins.
VERIFY: pnpm --filter api test -- src/security src/events src/users src/churches src/common ; then ONE pnpm --filter api type-check. Do not run the full suite.
REPORT (max 15 lines): files changed; RM IDs done/partial; tests run + result; tests skipped; requests to other lanes (lane 09: make email read-only in mobile profile; lane 05: mask phone/body in sms.service logs; lane 03: now owns permissions.ts); open risks.
```

## Agent brief (B: web tokens and redirects)

```
ROLE: build agent, lane 01 security-hotfixes, brief B (web). Leaf worker.
REPO/BRANCH/RULES: as in brief A (see README ground rules).
OWN: apps/web/{auth.ts, actions/auth.ts, proxy.ts, lib/auth-refresh.ts, lib/api-client.ts, app/auth/callback/**, app/auth/signin/**, components/layout/church-switcher.tsx, components/church/setup-church.tsx, components/church-management/church-card.tsx, tests/auth-*.test.ts, tests/session-*.test.ts}.
DO NOT TOUCH: apps/web/config/routes.ts, app/auth/forgot|reset|verify, any other web file, apps/api, packages.
GOAL: tokens never reach browser JavaScript; post-login redirect is same-origin only (RM-011, RM-012).
STEPS:
1. Read auth.ts:140-175, actions/auth.ts, app/auth/callback/page.tsx, lib/api-client.ts, and the three client components (they pass tokens to NextAuth update()).
2. Drop accessToken/refreshToken from session() (auth.ts ~152-153). Give lib/api-client.ts a server-only token reader from the NextAuth JWT cookie.
3. Rework church switch / setup / church-card so tokens stay server side (jwt callback on trigger==='update' with a non-secret payload). actions/auth.ts must return no tokens.
4. Use isSafeInternalPath (lib/shell/navigation.ts, read only) in callback/page.tsx and the NextAuth redirect callback; reject '//' and '/\'.
5. If the end state is not feasible with the installed NextAuth, STOP and report the smallest safe alternative; do not ship a half change.
VERIFY: pnpm --filter web test (only tests/auth-*.test.ts tests/session-*.test.ts tests/shell-navigation.test.ts); ONE pnpm --filter web type-check.
MANUAL (only if the owner approved a DEV session): GET /api/auth/session has no tokens; sign-in, church switch, church setup work.
REPORT (max 15 lines): as brief A, plus which client components changed and how switch/setup now works.
```
