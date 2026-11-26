# Web dashboard audit (apps/web) — read-only

Branch: `design/mito-ya-baraka-concepts`. Audit date: 2026-11-26. Scope: `apps/web`, with API/shared-package reads only where they explain a web finding. No source, DB, or server was changed. Evidence labels: **verified** = read in code during this audit; **verify** = needs a test or running app to confirm.

Cross-references: remediation IDs (R-*) from `docs/shipwave/platform/remediation-plan.md`; decisions (DEC-*) from `docs/shipwave/platform/decisions.md`; design IDs from `docs/product-design/`.

## 1) Summary

- The web app is broad: 86 `page.tsx` routes cover people, families, attendance, events, offerings, zones, departments, visitors, communications, data quality, family lifecycle, AI, and a member portal. Most list pages use server-side pagination.
- **Two P0 data exposures sit behind the shared permission map, not in the web UI.** `MEMBER` holds `view:visitors` and `view:events`. Any ordinary member can list all visitors (WD-01) and see draft and past events (WD-02). Both must be fixed before more feature work.
- **Staff-facing communications have a systemic bug.** The success `redirect()` runs inside `try`, so it is caught and replaced by an error redirect (WD-03). Email announcements cannot send at all, and no "verified contact" concept exists (WD-06).
- **Auth hands raw tokens to browser JavaScript** (WD-04). Password recovery exists in the API but has no UI (WD-12).
- **Content authoring is far from the brief.** Announcements are a plain textarea with no preview, approval, or images. The library publish workflow in the API has no staff UI. Church profile and public-profile editing are missing (WD-08 to WD-10).
- **Design fidelity is partial.** Tokens are applied in `globals.css`, but 54 TSX files still use raw Tailwind palette classes. Forms rely on placeholder-only labels. There is no a11y lint (WD-22, WD-23).
- Several R-* specs in `remediation-product-and-design.md` are stale. R-WEB-01 and R-WEB-02 are implemented (WD-30). R-UX-01 is partial: no "Switch to staff / member" control exists.

Counts: 33 findings (P0 2, P1 13, P2 14, P3 4). 13 proposed feature specs. 9 parallel lanes.

## 2) Findings

Severity: P0 = exposure or data-loss now; P1 = broken core workflow or security gap; P2 = material quality or completeness gap; P3 = polish or hardening. Effort: S ≤ 1 day, M 2–5 days, L > 1 week.

| ID | Sev | Area | Evidence | Recommendation | Effort | Depends on |
|---|---|---|---|---|---|---|
| WD-01 | P0 | RBAC / visitors | `packages/config/src/permissions.ts:189-205` gives `MEMBER` `view:visitors`; `apps/api/src/visitors/visitors.controller.ts:52-53,72-73,84-85` list/status/get use `view:visitors` and `getVisitorsByChurch` is church-wide; `apps/web/config/routes.ts` maps `/dashboard/visitors` to `view:visitors`, so the proxy admits members. **verify** with a member-token request. | Remove `view:visitors` (and `create:visitor` if not intended) from MEMBER; add row-scoping or deny tests for visitor reads; hide nav for non-staff. | S | DEC owner for role matrix (WD-31) |
| WD-02 | P0 | Events publishing | `apps/api/src/events/events.service.ts:90-103` `getEventsByChurch(..., publishedOnly=false)` and `:110-124` detail lookup; `events.controller.ts:85-107` exposes both under `view:events` (MEMBER has it). `apps/web/app/[churchId]/portal/events/page.tsx:36` calls `GET /events?from=today`, so draft events render in member UI. | Member-facing reads must pass `publishedOnly=true` and exclude `publicPublishedAt` rules for public routes; add `published` filter in portal; test draft invisible to member. | S | none |
| WD-03 | P1 | Communications / all server actions | Success `redirect()` inside `try`, caught by `catch`, then redirected again with `err=NEXT_REDIRECT…`: `communications/campaigns/new/page.tsx:52-55`; `campaigns/[campaignId]/page.tsx:42-48,58-64,74-80`; `attendance/check-in/page.tsx:38-44,60-66`. Staff see an error after success; on "new campaign" a retry can create a duplicate. | Move `redirect()` after `try/catch` (or rethrow `NEXT_REDIRECT` digests). Audit every `redirect` inside `try` (6 files found). Add a server-action test. | S | none |
| WD-04 | P1 | Auth / token exposure | `apps/web/auth.ts:152-153` puts `accessToken` and `refreshToken` into `session()`, readable from `/api/auth/session`; `actions/auth.ts:43-65` returns raw tokens to the client; `app/auth/callback/page.tsx:36-54` passes them to `signIn` in JS; `app/auth/signin/page.tsx:50-70` posts the password from the browser to `NEXT_PUBLIC_API_BASE_URL`. An XSS would exfiltrate the refresh token. | Keep tokens server-only: drop them from `session()`; complete OAuth and credentials sign-in in a server route/action that sets the NextAuth cookie. Coordinate with R-SEC-01 (auth owner). | M | R-SEC-01 owner |
| WD-05 | P1 | Announcements feed | `apps/api/src/communications/communications.service.ts:211-223` returns every `completed` campaign on any channel to any `view:communications` holder (MEMBER included); no audience or recipient check; SMS bodies shown. Consumed by `apps/web/actions/portal.ts:37-45` and `portal/page.tsx:81`. | Separate a published-announcement entity from campaigns; member feed filters by audience and published flag; never return SMS-only content. | M | S1 |
| WD-06 | P1 | Communications / contacts | Email recipients are all skipped: `communications.service.ts` `resolveRecipients` branch `channel === 'email'` ("Member email not available in current profile schema"). `packages/db/tables/members.ts:35` has `phone` only; email lives on `users` (`tables/user.ts:31`) with no verified flag; channel enum is `sms|email` only (`tables/communications.ts:19`). No in-app channel. | Add contact verification state (email and phone) and consent/opt-out; resolve email via verified `users` link; add in-app channel. Schema lane. | L | Schema owner; DEC-05 (sending activation) |
| WD-07 | P1 | Scheduling timezone | `apps/web/app/[churchId]/dashboard/communications/campaigns/new/page.tsx:94` uses `datetime-local` (no offset); API parses `new Date(input.scheduledAt)` (`communications.service.ts` ~157, ~185, ~262). Result depends on server TZ, not Tanzania (UTC+3). | Send an explicit offset or ISO with church timezone; store `scheduled_at` as UTC; show timezone label; test DST-free EAT round trip. | S | none |
| WD-08 | P1 | Announcement authoring | `campaigns/new/page.tsx:89` plain `textarea` for body; no preview, no image, no rich text, no approval step, no send-confirmation dialog; audience = free-text `zoneIds`/`genders` (`:97-98`), no `maritalStatuses` UI, no picker. | See S1 (authoring suite). | L | S1, WD-06 |
| WD-09 | P1 | Library publishing | API has `PATCH /library/resources/:id` and `POST :id/status` (`apps/api/src/library/*.controller.ts`); `apps/web/actions/library-resources.ts` exposes only list/get/access/progress. Staff uses legacy `/api/files` (`actions/library.ts:44,149,168`) and `dashboard/content/page.tsx` (upload, visibility, delete only). No draft/review/publish UI. | Add staff resource editor and publish transitions (S6). | L | R-LIB-01, R-CNT-01 |
| WD-10 | P1 | Church profile / public publishing | `apps/web/actions/church.ts:41` `updateChurch` has no caller; `portal/church/page.tsx:38-40` is read-only; `apps/api/src/public/public-church.service.ts` is read-only (no publish endpoint for `public_church_profiles`); `components/event/event-form.tsx` has no `publicPublishedAt` control. | Church profile editor (name, location, lead pastor, About, service times, leadership, photo) and publish toggle (S7). | M | R-PUB-01 field ownership decision |
| WD-11 | P1 | Users / invitations | No web reference to `/users` (`apps/api/src/users/users.controller.ts:138-252`: list, membership role change, delete, restore). No invite API or UI anywhere. `dashboard/permissions/page.tsx` renders a read-only `permissions-viewer.tsx`. | User admin list with role/status change, suspend/restore, invite by email (S8). | L | DEC on invite policy; R-SEC-02 |
| WD-12 | P1 | Password recovery | API routes exist: `apps/api/src/auth/auth.controller.ts:52,60`. Sign-in page (`app/auth/signin/page.tsx`) has no "forgot password" link and no reset route under `app/auth/`. | Recovery request + reset screens (S5). | M | DEC-05 delivery adapter |
| WD-13 | P1 | Upload validation | `actions/library.ts:127` checks only `file.size === 0`; `dashboard/content/staff-document-upload-form.tsx:42` `<Input type="file">` has no `accept`, no max size, no client MIME check. API multipart limits are still open (R-API-01, `file-upload.controller.ts:77,162,306-312`). | Client allow-list + size hint; server re-validates (S6). | S | R-API-01 |
| WD-14 | P1 | Data-quality import | `dashboard/data-quality/page.tsx:12-27` `previewAction` discards `previewImport` result and only revalidates (silent failure). Column mapping hard-coded (`:25-33`, no `email`). CSV paste only (`:55`); API accepts `xlsx` but UI never sends it. | Show preview/errors inline; mapping UI; file upload with format detection (S9). | M | none |
| WD-15 | P1 | Notifications / inbox | `portal/inbox/page.tsx:24` shows a translated title only if `templateKey` is a dictionary key. API emits `events.created` (`apps/api/src/events/events.service.ts:75`) and `library.document_published` (`file-upload.service.ts:713`), neither in `packages/config/src/i18n/messages/*`. `templateData` (titles, names) is dropped. `actions/notifications.ts:7-15` types both fields. | Add keys with `{title}` placeholders; render `templateData` through the catalogue; allowlist targets (S10). | S | R-NOT-01 |
| WD-16 | P2 | Layout role gating | `app/[churchId]/dashboard/layout.tsx` checks only that the church exists (via `getChurches`), not staff role. Members pass the proxy (`config/routes.ts`: `/dashboard` = `read:member`, which MEMBER holds). Pages then depend on API 403 → `redirect('/forbidden')` (`lib/api-client.ts:~101`). | Gate dashboard layout on `isStaffRole` (`lib/shell/navigation.ts`); return the denied state. | S | none |
| WD-17 | P2 | Currency / i18n | `lib/utils.ts:56-62` `formatMoney` prints the raw code and uses `en-US` for all locales. `components/form/GivingGoalForm.tsx:72` defaults to `KES`; `OfferingForm.tsx:204` placeholder `KES`. Church operates in Tanzania (TZS). Locale formatter (DEC-16) not used for money. | Default to `TZS`; use `formatLocaleNumber` with currency code, locale-aware; no hard-coded symbol. | S | DEC-16 |
| WD-18 | P2 | Families | `app/[churchId]/dashboard/families/` has only `page.tsx` and `add/`. API `families.controller.ts` has `GET/PUT/DELETE :id`. No detail, edit, or delete. | Family detail with members, edit, lifecycle link (S12). | M | none |
| WD-19 | P2 | Member↔zone/family | `actions/member.ts` has no call to `/members/:id/assign-zone` or `/link-family` (API `members.controller.ts`); no member-side UI. | Add assignment panel on member detail (S12). | M | none |
| WD-20 | P2 | Prayer (staff) | API: `prayer/prayer.controller.ts` has only `POST` and `GET me`. Web: member form only (`portal/prayer`). No staff triage. | Decision-gated (DEC-02/08); do not build staff view until policy accepted. | L | DEC-02/08 |
| WD-21 | P2 | Export | `lib/export.ts:45` uses `table.getRowModel()`; tables are `manualPagination` (`hooks/use-data-table.ts:349`), so CSV = current page only (default 10 rows). `lib/export.ts:50-53` quotes but does not neutralise `= + - @` (CSV formula injection). | Export via server endpoint for full filtered set; prefix risky cells with `'`. | S | API export endpoint |
| WD-22 | P2 | Design tokens | `app/globals.css:57-90` defines semantic tokens, `:202` dark theme exists, but 54 TSX files use raw palette classes (e.g. `text-gray-600` ×38, `text-red-500` ×23, `bg-red-50` ×9). Raw classes break dark mode contrast. Staff content table (`dashboard/content/page.tsx:60`, 6 columns) has no card layout. | Codemod to semantic tokens; card variant for narrow screens (S11). | M | R-DES-01 shell contract |
| WD-23 | P2 | Accessibility / forms | `app/auth/signin/page.tsx` inputs are raw `<input className="rounded border p-2">` with placeholder + `aria-label` only (no visible label). Same pattern in 20 files with `<input>` (e.g. `campaigns/new/page.tsx:73-95`). `eslint.config.mjs` has no `jsx-a11y`. ~36 `<button>` without `aria-label` (heuristic). | Use shadcn `Label`+`Input`; add `eslint-plugin-jsx-a11y`; run axe on sign-in, member Home, Content (S11). | M | none |
| WD-24 | P2 | Loading / empty / error states | Zero `loading.tsx` in `app/`; 4 `error.tsx`. Silent fallbacks turn failure into valid-looking empty: `actions/portal.ts:37-45` (`getMyAnnouncements` returns `[]` on error → "no announcements"); `campaigns/new/page.tsx` `getTemplates(...).catch(() => [])`; `data-quality/page.tsx` `listImportJobs(...).catch(() => [])`. Violates the spec's "never a valid-looking empty" invariant (remediation-product-and-design.md §Shared invariants 6). | Return `{status:'unavailable'}` and render retry (pattern already in `actions/member.ts:94-97`). Add route `loading.tsx` skeletons. | M | none |
| WD-25 | P2 | Post-login redirect | `app/auth/callback/page.tsx` ends with `router.push(searchParams.get("callbackUrl") || "/")` with no safety check. `auth.ts:162-170` NextAuth `redirect` callback accepts any string starting with `/` and calls `new URL(url)` on others (throws on malformed input). `lib/shell/navigation.ts` has the correct `isSafeInternalPath`, but it is not used here. | Use `isSafeInternalPath` in both places; reject `//` and `/\`. | S | R-SEC-01 owner |
| WD-26 | P2 | API base config drift | `lib/api-client.ts:47-54` falls back to `http://localhost:3001`; `lib/api/apiBase.ts` (dead code, unused) defaults to `:8871/api/v1` and reads `process.env[process.env.DASHBOARD_API_NAME]`. `env.mjs` validates `NEXT_PUBLIC_API_BASE_URL` only. Four env families. | Single `env.mjs`-validated base URL; delete `apiBase.ts`. | S | none |
| WD-27 | P2 | Refresh-token rotation state | `lib/auth-refresh.ts` keeps `latest`, `inFlight`, `rejected` in process memory. Multiple replicas (Coolify) will not share state, so a rotated token can be replayed or a session dropped. | Store rotation state server-side (or per-session cookie) before running >1 web replica. | M | R-SEC-01 owner |
| WD-28 | P2 | Permission matrix (member) | `permissions.ts:189-205` MEMBER also holds `view:attendance`, `view:lifecycle-dashboard`, `view:communications`, `view:giving-goals`. Each must be justified or narrowed. | Role matrix review with DEC owner; add API tests per role (S8/S2). | M | DEC owner |
| WD-29 | P2 | Test coverage | `apps/web/tests/` has 4 files (`report-catalog`, `auth-refresh`, `shell-navigation`, `library-format`). None cover `proxy.ts`, `config/routes.ts` (`isRouteAllowed`), server actions, or rendered pages. `npm test` is `node --test`, no browser e2e. | Add route-matrix test; server-action tests for WD-03; Playwright smoke for sign-in→member→staff (R-QA-01). | M | none |
| WD-30 | P2 | Remediation status (R-WEB-01/02, R-UX-01) | R-WEB-01 done: `dashboard-header.tsx:40` builds `churchPath(churchId,"dashboard/profile")`. R-WEB-02 done: `app/(home)/page.tsx` no longer passes `totalMembers`; `church-card.tsx:104` renders only when defined. R-UX-01 partial: `components/layout/space-nav.tsx` and `lib/shell/navigation.ts` exist, but there is no "Switch to staff/member" control anywhere (`portal/more`, `dashboard/more`, profile). Spec §Decisions says so too. | Update the remediation spec status; implement space switch (S13 part). | S | R-UX-01 |
| WD-31 | P2 | Dashboard layout error | `dashboard/layout.tsx` calls `getChurches()` on every route and swallows errors (`console.error`), then renders `ChurchNotFoundError` for a transient API failure. Looks like "church not found" to staff. | Distinguish `unavailable` from `not found`; retry UI. | S | WD-24 |
| WD-32 | P2 | Visitor follow-up convert / staff | `actions/visitor.ts` covers convert/follow-up; no combined People view with visitor follow-up as in `staff.png` (People → Visitor Follow-up). | Defer to People IA work after WD-01 fix. | M | WD-01 |
| WD-33 | P3 | Hardening / metadata / lint | (a) 0 of 86 pages export `metadata` (all tabs same title). (b) `auth/guards/church-context.guard.ts` uses substring `request.path.includes('/profile')` for safe paths when no churchId. (c) login form reuses registration `minLength={12}` (`signin/page.tsx` input). (d) `lint` script is `eslint . --fix` (mutating; noted in remediation spec). | Per-route metadata; anchor safe-path matching; split login/register validation; check-only lint script. | S | none |

Notes on items checked and found **not** broken (to avoid re-work): no `dangerouslySetInnerHTML` or `innerHTML` in app/components/lib; `NEXT_PUBLIC_*` holds only the API base URL (`env.mjs:18,28`); the announcement page renders text with `whitespace-pre-wrap` (React escapes); `church-context.guard.ts` enforces membership for `:churchId`, `/churches/:id`, and query/body church IDs; members list is row-scoped for MEMBER (`members.service.ts:101-107`).

## 3) Module coverage matrix

Present = usable UI for the core job. Partial = some operations or screens missing. Missing = API exists, no web UI. Deferred = intentionally out of scope per DEC/spec.

| API module (`apps/api/src`) | Web status | Web evidence / gap |
|---|---|---|
| ai | Present | `dashboard/ai`, `portal/ai`, `components/ai/*`; `/ai/chat`, `/ai/feedback` wired |
| attendance | Present | 9 dashboard routes incl. check-in (manual + QR), at-risk, analytics, v2 |
| auth | Partial | Sign-in, register, Google, setup, switch-church, profile. **Missing:** password recovery UI (WD-12); token handling (WD-04) |
| churches | Partial | Church list/create (`create-church-dialog`, `create-workspace-dialog` — duplicate). `updateChurch` unused (WD-10) |
| communications | Partial | Campaign create/list/detail, templates list. Redirect bug (WD-03); no authoring suite (WD-08); no preview |
| dashboard | Present | `dashboard/home` stats |
| data-quality | Partial | Paste-CSV preview (WD-14); duplicates page present; no mapping UI |
| departments | Present | list/add/detail/edit with members and leaders |
| events | Partial | Create/edit, RSVPs, attendance marking present. Member drafts leak (WD-02); no `publicPublishedAt` (WD-10) |
| families | Partial | List and add only (WD-18); family lifecycle page exists |
| family-lifecycle | Present | dashboard, rules, milestones, suggestions with resolve |
| file-upload (`api/files`) | Partial | Legacy staff docs and member library via `/api/files`; upload validation weak (WD-13) |
| health | n/a | Infrastructure |
| library (`library/resources`) | Partial | Member list/detail/access/progress present. **Missing** staff create/edit/publish (WD-09) |
| mail | Missing (deferred) | `send-*` endpoints; sending activation deferred (DEC-05) |
| members | Present/Partial | List (server-paged), detail, add, edit. **Missing:** zone assignment and family linking UI (WD-19) |
| notifications | Partial | Inbox list, mark read, read-all. Titles lost (WD-15) |
| offerings | Present | offerings, categories, goals, reports; currency defaults wrong (WD-17) |
| payment | n/a | Service only; commerce deferred |
| prayer | Partial | Member submit/list only; no staff triage (WD-20, decision-gated) |
| public | Partial | `app/churches/*` public directory (read). No publishing UI (WD-10) |
| retention | Partial | Surfaced via attendance at-risk pages; no retention-specific workflow |
| sms | Missing (direct) | No direct send/test UI; SMS only via campaigns |
| users | Missing | No UI for list, membership role change, suspend/delete/restore (WD-11) |
| visitors | Present (over-exposed) | List/add/detail/convert/follow-up present; **exposed to members** (WD-01) |
| zones | Present | list/add/detail/edit, members, leader reassignment |
| core, config, database, common, helpers | n/a | Infrastructure |

Missing features from the brief, explicitly: **members-facing church join/invite flow** (none exists; `POST /churches` needs `manage:churches`, SUPER_ADMIN only per `permissions.ts`); **user invitations** (none); **password recovery UI** (WD-12); **giving goals** present; **RSVPs** present; **member import/duplicates** present in data-quality; **AI assistant** present.

## 4) Proposed feature specs (13)

Ordered by value. S0 is an immediate hotfix (no product decision needed).

### S0 — Member visibility hotfix (WD-01, WD-02)
- **Goal:** stop members seeing visitor PII and draft/past events.
- **Story:** As a member, I see only my own portal content; visitors and drafts are never in my responses.
- **In:** remove MEMBER `view:visitors` (and check `view:events` → add `published` filter for member reads); API `publishedOnly=true` when caller lacks `manage:events`; web portal events uses published only.
- **Out:** staff UI changes.
- **Files:** `packages/config/src/permissions.ts` (lane I), `apps/api/src/events/events.controller.ts`, `events.service.ts`, `apps/web/app/[churchId]/portal/events/page.tsx`.
- **API:** no new endpoint; behaviour change on `GET /events`, `GET /events/:id`.
- **Acceptance:** member token `GET /visitors` → 403; member `GET /events` returns no `status='draft'`; past events excluded from portal.
- **Tests:** API unit for role matrix; route test in `apps/web/tests`; negative auth assertions.
- **Risks:** staff leaders relying on member-role visitor access (confirm with DEC owner).

### S1 — Announcement authoring suite
- **Goal:** staff can author, preview, schedule, approve and send long-form announcements to verified contacts, and members see only what applies to them.
- **Story:** As a communications officer, I draft a long announcement with an image, preview it per channel, submit for approval, schedule it in Tanzania time, and see its delivery result. As a member, I see announcements for my audience in my feed and inbox.
- **In:** draft → review → approved → scheduled/sent/cancelled; channels `email` (verified only), `sms` (verified, opted-in), `in_app` (inbox); body up to a limit as sanitized Markdown or plain text (no raw HTML); image via existing private storage; audience chips (zones, genders, marital status); confirm dialog listing recipient counts and skipped reasons; dedicated permission `publish:announcements`; optional approval (toggle per church).
- **Out:** rich-text WYSIWYG beyond bold/italic/links/lists; push notifications; paid sending; scheduled recurring.
- **Pages/components:** `app/[churchId]/dashboard/communications/announcements/{page,new,[id]}`, `components/communications/announcement-editor.tsx`, `announcement-preview.tsx`, `audience-picker.tsx`, `contact-readiness.tsx`; `actions/announcements.ts`; reuse `communications/campaigns` shape behind an adapter.
- **API needs:** `POST/PUT /communications/announcements` (draft), `POST :id/submit`, `POST :id/approve` (separate permission), `POST :id/schedule` with offset-aware ISO, `GET /communications/announcements/:id/readiness` (counts of verified/skipped per channel), member feed filtered by audience and `published`. Schema: `verified_at` on contact, consent flag, `approved_by/at`, channel `in_app`.
- **Acceptance:** unverified email never a recipient; approver ≠ author when approval on; scheduled time round-trips to the same local wall time; retry after failure does not double-send; member sees only audience-matched items; EN/SW labels in catalogue.
- **Tests:** API service tests (readiness, skipped reasons, idempotent send); server-action tests (WD-03 pattern); Playwright: draft → preview → approve → schedule.
- **Risks:** sending activation (DEC-05) blocks email/SMS; consent policy decision; retention of recipient lists.

### S2 — Server-action redirect and error-state hardening (WD-03, WD-24, WD-31)
- **Goal:** success and failure are reported truthfully on every mutation.
- **In:** move success `redirect` after `try`; add `unavailable` result type for list loaders; route `loading.tsx` for dashboard and portal; `dashboard/layout.tsx` distinguishes API unavailable from not-found.
- **Files:** `communications/campaigns/new/page.tsx`, `campaigns/[campaignId]/page.tsx`, `attendance/check-in/page.tsx`, `check-in/[token]/page.tsx`, `actions/portal.ts`, `dashboard/layout.tsx`, new `loading.tsx` files.
- **Acceptance:** after a successful create/send/cancel/check-in, no `err` query param; API 500 shows retry, not empty list.
- **Tests:** unit tests of action wrappers with mocked `redirect` (throws NEXT_REDIRECT, must not be caught); smoke e2e.
- **Risks:** low; touches many pages (coordinate with S1 lane).

### S3 — Token and sign-in hardening (WD-04, WD-25, WD-27, WD-33c)
- **Goal:** refresh and access tokens never reach browser JavaScript; post-login redirect is same-origin only.
- **In:** remove tokens from `session()`; server-side credential and OAuth completion; use `isSafeInternalPath` in NextAuth `redirect` and OAuth callback; move refresh rotation state out of process memory before multi-replica.
- **Files:** `apps/web/auth.ts`, `actions/auth.ts`, `app/auth/callback/page.tsx`, `app/auth/signin/page.tsx`, `lib/auth-refresh.ts`, `proxy.ts`; API side belongs to R-SEC-01 owner.
- **API needs:** none new if the web server performs login (`/auth/login` server-to-server).
- **Acceptance:** `GET /api/auth/session` JSON has no `accessToken`/`refreshToken`; `callbackUrl=//evil.example` ends on member Home; two concurrent refreshes produce one valid session.
- **Tests:** auth-refresh unit (exists, extend); route test for `redirect`; manual check of session JSON.
- **Risks:** changes OAuth flow; must be sequenced with R-SEC-01.

### S4 — Password recovery UI (WD-12)
- **Goal:** users can request and complete a reset.
- **In:** "Forgot password" link; `app/auth/forgot/page.tsx`, `app/auth/reset/page.tsx`; neutral confirmation; no auto sign-in.
- **API:** existing `POST /auth/password-recovery`, `POST /auth/password-reset`; verify response shape.
- **Acceptance:** identical message for known and unknown email; reset page clears token from URL after read; delivery-disabled state says "contact support", not "email sent".
- **Tests:** component tests; e2e with in-memory delivery adapter only.
- **Risks:** DEC-05 delivery capability; never enable live sending from this task.

### S5 — Library publishing workflow (WD-09, WD-13)
- **Goal:** staff create, edit, submit, publish, unpublish and archive library resources.
- **In:** list grouped by draft/review/published/archived; editor (title, description, type, language, author/speaker, cover, categories, file); transitions with confirm and actor/time shown; upload client validation (allow-list, size); preview of member view.
- **Files:** `app/[churchId]/dashboard/library/**` (new), `actions/library-resources.ts` (extend; lane C owner), `components/library/resource-editor.tsx`, `resource-transition-dialog.tsx`; keep `dashboard/content` for personal/staff documents, or redirect to it.
- **API:** existing `PATCH /library/resources/:id`, `POST /library/resources/:id/status`; add upload-type allow-list if missing (R-API-01).
- **Acceptance:** draft invisible to members; repeat publish is idempotent; unpublish revokes new access; invalid type shows actionable error.
- **Tests:** API transition tests; web action tests; e2e publish → member sees → unpublish → gone.
- **Risks:** blocked by R-LIB-01 network model and DEC-06 on who may publish.

### S6 — Church profile and public publishing (WD-10)
- **Goal:** authorized staff edit the church profile (name, location, lead pastor, About, service times, leadership, image) and choose what the public site shows.
- **In:** `dashboard/settings/church` editor (new); publish toggle for `public_church_profiles`; event `publicPublishedAt` control in `components/event/event-form.tsx`; member portal Church page reads the same profile.
- **API needs:** `PUT /churches/:id` exists (`churches.controller.ts:61`, `manage:churches`) — extend or add `PUT /public/churches/:publicId/profile` with publish flag (publisher role decision).
- **Acceptance:** unpublished fields absent from `GET /public/churches/:publicId`; no pastor or member data in projection; EN/SW fallback shown clearly.
- **Tests:** API projection tests; web form validation; visual check against DESIGN.md tokens.
- **Risks:** privacy of leadership fields; website duplication (R-PUB-01 boundary).

### S7 — User administration and invitations (WD-11, WD-28)
- **Goal:** admins manage staff memberships and invite staff by email.
- **In:** `dashboard/users` list (search, role, status, pagination); change role (guarded), suspend/restore, remove; invite by email with role and expiry; accept flow stays out of scope until DEC.
- **API:** existing `GET /users`, `PATCH /users/:userId/membership`, `DELETE`, `PATCH restore`; invitation endpoints do not exist — new schema + API (serialize with schema owner).
- **Acceptance:** cannot grant a role above own; last admin cannot be removed; every change writes an audit row.
- **Tests:** API role-escalation tests; web action tests; e2e admin invites and suspends.
- **Risks:** privilege escalation; platform-admin conflation (R-SEC-02).

### S8 — Data-quality import flow (WD-14)
- **Goal:** importing members is reviewable and recoverable.
- **In:** file upload (CSV, XLSX) with format detection; column-mapping step with required fields and `email`; preview table with per-row errors and duplicates; commit confirm; result page.
- **Files:** `dashboard/data-quality/page.tsx` (rewrite), new `data-quality/imports/new/`, `components/data-quality/*`; `actions/data-quality.ts`.
- **API:** existing `imports/preview`, `:id/commit`; add upload size limit.
- **Acceptance:** preview errors visible; commit blocked until preview has no blocking errors; re-submit is idempotent.
- **Tests:** action tests; fixture CSV with bad rows (synthetic data only).
- **Risks:** personal data in fixtures — use synthetic data.

### S9 — Notification and inbox text (WD-15)
- **Goal:** inbox titles and bodies render from `templateKey` + `templateData`.
- **In:** add catalogue keys for `events.created`, `library.document_published`, announcement keys with placeholders; render via `translate(key, data)`; allowlist `target` route types.
- **Files:** `packages/config/src/i18n/messages/wiring-web.ts` (lane F owns), `apps/web/app/[churchId]/portal/inbox/page.tsx`, `actions/notifications.ts`.
- **Acceptance:** every emitted `templateKey` has EN and SW entries (parity test already exists in `packages/config/src/i18n/i18n.test.ts`); no generic "Notification" for known types.
- **Tests:** extend parity test to iterate producer keys.
- **Risks:** shared catalogue file — one owner only.

### S10 — Design system and accessibility pass (WD-22, WD-23, WD-33a)
- **Goal:** all screens use semantic tokens, labelled forms, and pass automated a11y on key journeys.
- **In:** codemod raw palette classes to tokens (54 files); replace raw `<input>` with `Label`+`Input` in sign-in, campaigns, data-quality, check-in; card layout for staff tables under 768 px; per-route `metadata`; add `eslint-plugin-jsx-a11y`; axe checks on sign-in, member Home, Library, Content.
- **Files:** `app/globals.css`, `tailwind.config.ts`, `components/ui/*`, `components/layout/**` (lane G only), route files (touch per lane).
- **Acceptance:** no raw palette classes (grep gate); axe zero serious violations on listed pages; contrast ≥ 4.5:1 for body text in light and dark.
- **Tests:** axe via Playwright; screenshots at 320/390/768/1280 px (non-sensitive fixtures).
- **Risks:** large diff; split by lane to avoid merge conflicts.

### S11 — Space switching and staff-only gating (WD-16, WD-30)
- **Goal:** "Switch to staff" on member Home/Profile (authorised only) and "Switch to member" in staff More; dashboard layout gated on staff role.
- **In:** control components; `dashboard/layout.tsx` uses `isStaffRole`; denied state with return-to-member.
- **Files:** `components/layout/space-nav.tsx`, `lib/shell/navigation.ts`, `app/[churchId]/dashboard/layout.tsx`, `portal/profile/page.tsx`, `portal/more/page.tsx`, `dashboard/more/page.tsx`.
- **Acceptance:** member direct URL to `/dashboard/members` → denied state (not records); unauthorised users never see the switch.
- **Tests:** shell-navigation tests exist — extend; Playwright login→member→staff→member.
- **Risks:** navigation regressions; depends on S10 shell contract.

### S12 — Families and member assignment (WD-18, WD-19)
- **Goal:** family detail/edit/delete and member zone/family linking from the web.
- **Files:** `app/[churchId]/dashboard/families/[id]/page.tsx` + edit; `components/family/*`; member detail panel in `dashboard/members/[memberId]/page.tsx`; `actions/family.ts`, `actions/member.ts`.
- **API:** existing `families/:id` CRUD; `members/:id/assign-zone`, `link-family`.
- **Acceptance:** delete family asks for confirm and does not delete members; member can be linked to one family per policy.
- **Tests:** action tests; e2e create family → link member.
- **Risks:** household privacy policy unresolved (screen spec: "household access policy unresolved").

### S13 — Export and money formatting (WD-17, WD-21)
- **Goal:** exports cover the full filtered set; money shows TZS and locale formatting.
- **In:** server CSV endpoint for members/visitors/giving filtered by query; formula-injection escape; `formatMoney` accepts locale and default `TZS`; `GivingGoalForm` default `TZS`.
- **Files:** `lib/export.ts`, `lib/utils.ts`, `components/form/GivingGoalForm.tsx`, `OfferingForm.tsx`; new API export endpoints (lane I).
- **Acceptance:** export of 25 members yields 25 rows; cell beginning `=` is escaped; SW screen shows `TSh`/`TZS` with SW number format.
- **Tests:** unit tests for escape and formatter; API export test.
- **Risks:** exports are personal data — gate with `view:*` permission and audit.

## 5) Parallel work lanes (file ownership)

Rule: one owner per file. Shared files are owned by a single lane and touched only through that lane.

| Lane | Owns (exclusive) | Specs | Notes |
|---|---|---|---|
| 0 — Hotfix (first, serialized) | `packages/config/src/permissions.ts`, `apps/api/src/events/events.controller.ts`, `events.service.ts`, `apps/api/src/visitors/visitors.controller.ts`, `apps/web/config/routes.ts`, `apps/web/app/[churchId]/portal/events/page.tsx` | S0 | Must land before other lanes change the permission map |
| A — Auth/session | `apps/web/auth.ts`, `actions/auth.ts`, `app/auth/**`, `proxy.ts`, `lib/auth-refresh.ts`, `lib/api-client.ts`, `lib/api/apiBase.ts` (delete), `env.mjs` | S3, S4, WD-26 | Coordinate with R-SEC-01 owner; no one else edits these |
| B — Communications | `app/[churchId]/dashboard/communications/**`, `actions/communications.ts`, `actions/portal.ts` (announcements fn), `components/communications/*` (new), API `apps/api/src/communications/**` | S1, S2 (campaign pages) | Schema changes go to lane I only |
| C — Library and content | `app/[churchId]/dashboard/library/**` (new), `dashboard/content/**`, `actions/library.ts`, `actions/library-resources.ts`, `portal/library/**`, `components/library/*` | S5 | Legacy `/api/files` stays until R-LIB-01 migration |
| D — Church and public profile | `actions/church.ts`, `dashboard/settings/**` (new), `portal/church/**`, `components/event/event-form.tsx` (publish field only), `app/churches/**` | S6 | Event form shared with lane H — H edits other fields after D merges |
| E — Users and roles | `app/[churchId]/dashboard/permissions/**`, `dashboard/users/**` (new), `components/permissions/*`, `actions/users.ts` (new) | S7 | Role-matrix decision (WD-28) before merge |
| F — Data quality and inbox | `app/[churchId]/dashboard/data-quality/**`, `actions/data-quality.ts`, `portal/inbox/**`, `actions/notifications.ts`, `packages/config/src/i18n/messages/wiring-web.ts` (only lane owning message files for inbox keys) | S8, S9 | Message files are shared — F owns the inbox keys only |
| G — Design system and shell | `app/globals.css`, `tailwind.config.ts`, `eslint.config.mjs`, `components/ui/**`, `components/layout/**`, `app/[churchId]/dashboard/layout.tsx` | S10, S11 (shell part), WD-16, WD-31 | Only lane G edits layout/nav files; other lanes request changes |
| H — People, families, events | `app/[churchId]/dashboard/families/**`, `dashboard/members/**`, `components/member/*`, `components/form/*`, `dashboard/events/**`, `components/event/event-form.tsx` (non-publish fields) | S12, WD-18/19 | After lane D releases event-form |
| I — API, schema, shared packages | `apps/api/src/**` except lane 0 files, `packages/db/**`, export endpoints, invitation schema | S1 API, S7 API, S13 API, S5 API | Single writer for migrations; `pnpm db:generate`, no hand SQL |
| J — Money and export | `lib/export.ts`, `lib/utils.ts`, `components/form/GivingGoalForm.tsx`, `OfferingForm.tsx` | S13 | Small; can run alongside H |

Sequencing: Lane 0 → (A, I in parallel) → (B, C, D, E, F, G in parallel, each on its own paths) → H and J last. Lane G merges before any lane restyles pages. Verification per lane: targeted tests only (`vitest`/`node --test` for changed files; `pnpm --filter web type-check`), one full run per release candidate.

## Appendix — verification notes

- Read-only audit. No `pnpm` install, build, test, or database command was run. All evidence is from code reads and `grep`.
- Four concept boards were viewed (`desktop.png`, `staff.png`, `library-ai.png`). They show invented branding, figures, and prices (e.g. TSh 15,000 on books). Per `visual-audit.md`, none of their figures or prices may be implemented as real data. Their layout direction (five-tab bottom nav, staff sidebar, Church Overview cards, library shelf) is what R-DES-01 and S10–S11 target.
- Not checked: `member.png`, Swahili copy quality, dark mode rendering, device behaviour, the AI page internals.
