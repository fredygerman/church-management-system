# Programme backlog

Programme ledger. Implementation is under way; all decisions DEC-01 to DEC-11 were accepted on 2026-11-24 (see [decisions.md](decisions.md)). Row states below are the older per-slice notes; the **Status 2026-11-24** section at the end is the current summary.

| ID | Group | Owning specification | Outcome | State | Dependencies |
|---|---|---|---|---|---|
| D-01 | Design | [staff-operations.md](specs/staff-operations.md), [screen-specification.md](../../product-design/screen-specification.md) | Reconcile responsive member/staff journeys, brand/content, accessibility and observable states. Acceptance artifact committed (`80790cf`, [d-01-acceptance.md](design/d-01-acceptance.md)); design review pending | Awaiting human verification | None |
| W-01 | Web/API | [foundations.md](specs/foundations.md) | Validate refresh-token lifecycle and guard tests (commit 9a4eae1; 7 local auth tests pass; revocation not implemented) | Code complete | None |
| W-02 | Web/API | [foundations.md](specs/foundations.md) | Fix dashboard false-zero behavior and define truthful states (commit 17d46ca; web type-check no new errors; no test setup). Note: the page calls `GET /dashboard/stats`, which the API does not implement, so it always shows its unavailable state until DEC-01 is decided | Code complete | DEC-01 for API composition only; independent UI error fix can proceed |
| W-03 | Web/API | [member-experience.md](specs/member-experience.md) | Member Home/Church/Events/Profile, RSVP, prayer and profile states on web. Slice 1 committed (`a113b93`): Home states, Church page, Library honest unavailable state, sidebar entries. Slice 2 committed (`5b9e32d`): Events with RSVP outcomes, Profile edit with validation, Prayer form with validation and privacy note. Type-check passes; build passes with placeholder build-only env values (exit 0; real environment values not verified). Library now lists documents and downloads via signed URLs (`a3da295`, depends on `e505188`). Denied state added (`9688b84`: portal pages show a denied message on 403). Switch confirmation added to `ChurchSwitcher` (confirms before switching; copy is the default English line). Still open: Swahili translations pending review; offline skipped by owner | In progress | D-01 for shared navigation; DEC-02 for expanded sensitive behavior |
| W-04 | Web/API | [staff-operations.md](specs/staff-operations.md) | Staff dashboard/People/Services/Content/More, reports, communication and role settings. Slice 1 committed (`29e6555`): loading, empty, error/retry states on Service types, Sessions and Members. Slice 1b (`8d59f20`): member list shows an unavailable state instead of an empty list. Content and More pages added (`7a8127a`; Content lists documents under `manage:files`, More has placeholders for role settings and space switching). Sidebar entries added. Still open: Dashboard and reports (blocked on DEC-04) | In progress | D-01; DEC-04/05/06 only for affected capability |
| W-05 | Web/API | [content-and-ai.md](specs/content-and-ai.md) | Durable document workflow and shared free library/reader/eligible downloads. Slice 1 committed: `documents` table and generated migration `0010_faithful_blue_blade` (`fc98c6b`), real list/update/delete with church scoping and visibility (`263d9f2`); API type-check and file-upload tests pass. **Migration NOT applied; needs Fredy's approval.** Slice 2 committed: member library list and 300-second signed download URL (`e505188`, read:self, 404 for non-visible documents); web Library list and download (`a3da295`). Runtime needs migration 0010 applied. Reader added (`985f12c`: PDF and image inline, other types download, expired link shows retry). Offline skipped by owner. Runtime still needs migration 0010 applied | In progress | DEC-09 accepted (private bucket); serialized schema/contracts lane |
| W-06 | Web/API | [content-and-ai.md](specs/content-and-ai.md) | AI policy and capability gate; implementation only after DEC-08 | Not started | DEC-08 |
| M-01 | Mobile | [mobile.md](specs/mobile.md) | Mobile stack/toolchain and API capability inventory; member and staff journeys. M0 skeleton (`fc1b831`) and M1 member core (`552dfcf`: sign-in with SecureStore tokens, read-only Home/Church/Events/Profile, Library and staff placeholders) committed; typecheck and Android export pass. API inventory: [mobile-api-inventory.md](specs/mobile-api-inventory.md) (`23ff450`). M1b member actions committed (`5be3d28`): event detail with RSVP, prayer request form, profile edit; endpoints verified against the users PATCH handler. M1b member actions (`5be3d28`) and M2 library list with signed downloads (`74e3eb4`; route paths corrected to `/api/files/library` in `90637f3`) committed. No runtime or device test yet; migration 0010 must be applied before the library returns data; staff read-only People, Services and Content screens committed (`6381577`); Staff Dashboard shows `GET /dashboard/stats` (`totalMembers`, `activeZones`); staff More has the space switcher and sign-out; signed-in users are routed to the staff or member area by their active role | In progress | DEC-03 accepted 2026-11-19; refresh-token rotation not implemented (inventory risk 1) |
| M-02 | Mobile | [mobile.md](specs/mobile.md) | Mobile library/search/reader and eligible downloads | In progress: list, client-side search and signed download committed; in-app reader not built (needs a WebView dependency decision; signed document opens in the device browser) | M-01, W-05 contracts; no commerce |
| M-03 | Mobile | [mobile.md](specs/mobile.md) | Mobile staff space and AI entry/conversation capability gate | Code complete: role routing sends staff to the staff area; staff Dashboard, People, Services, Content and More; Assistant entry for signed-in users with server-side read:self and tool-level permission checks | M-01; AI policy DEC-08 |
| Q-01 | Integration | [RUN-POLICY.md](RUN-POLICY.md) | Serialized schema/contracts/generation, integration and one bounded correctness/complexity review | Code complete: foundation lane reviewed earlier; the wave of this batch reviewed by three read-only reviewers (API, web, mobile), confirmed findings fixed (`29b1cf7`, `1b45fd8`, `d1ca9eb`). No CI baseline: Coolify auto-deploys on push, per Fredy | Each task's contract/migration edges |
| Q-02 | Human verification | [human-verification.md](human-verification.md) | Perform named product/device/accessibility checks on accepted build | Not started | Code complete, DEC-10 |

Detailed file ownership, exclusions and proposed paths are in the linked specs and [allocation manifest](allocation-manifest.md). **Not started** describes implementation; unresolved decision-gated slices may become **Blocked** only when dispatched. Cross-link design, web/API, mobile and shared foundation waves here as the global ledger.

## Status 2026-11-24 (code work, before human verification)

Verified once for this batch: frozen install, `@church/config` build and tests (34), `@church/db` build, API type-check and full jest (129 tests, 16 suites), web type-check, mobile type-check and Android export. No runtime run against a live API or device yet.

| Area | Done (commits on `design/mito-ya-baraka-concepts`) | Open |
|---|---|---|
| W-01 auth | Refresh-token rotation with reuse detection, 10-second grace window, atomic rotation, refresh tokens rejected as Bearer, expired-row purge (`cdc3054`, `fda351a`, `c7d954d`, `226e468`, `871eb80`); migration `0011_exotic_stick` generated, not applied | Web session cookie is refreshed in `apps/web/proxy.ts` 60 seconds before the access token expires (`applyRotatedTokens` shared with the jwt callback); verified against a stub API with a built app. Known gap: two requests holding the old cookie across a server restart can still lose the session (10-second grace, process memory) |
| W-02 dashboard | `GET /dashboard/stats` returns `totalMembers` and `activeZones` only (`4e46b1a`); web shows only those (`4b140d9`) | `pendingVisitors` and `recentActivities` have no verified source and are omitted |
| Contracts | Verified endpoint contracts and mismatch list (`d5fc31d`); M1 to M6 fixed (`b83d9ff`, `adc5975`, `93566df`, `4b140d9`, `e472c55`, `01da216`, `0f2c6a3`, `edb64c1`) | Mail and SMS body DTOs lack `churchId` (DEC-05: no sending work this release) |
| Memberships | `GET /auth/memberships` active only, reachable without church context (`77cfe74`, `1aba2c1`, `773cedc`) | Mobile space switcher built on Profile (member) and More (staff): `SpacesSection` lists `GET /auth/memberships` and switches with `POST /auth/switch-church` |
| W-05 library | API, web list and reader, mobile list, search and signed download; migration `0010_faithful_blue_blade` | Apply migrations; in-app mobile reader uses the device browser |
| W-06 AI | Shared component contract (`6aa0ba4`), `POST /ai/chat` with read-only tools and 30-day store (`e53dd6b`, `8aff5ef`), web Assistant (`6169488`, `92a7bb5`), mobile Assistant (`0eca1f4`, `c428f79`, `0cc3e6c`); migration `0012_swift_mesmero` generated, not applied | Provider settings (`AI_API_FORMAT`, `AI_API_KEY`, `AI_MODEL`, `AI_BASE_URL`, `AI_API_SECRET`) in Coolify, provider-neutral adapters (anthropic and openai formats); action registry empty so forms and confirm buttons are disabled; daily retention job built (`RetentionService`, 03:00: documents past 30 days, expired refresh tokens and AI conversations) |
| W-03/W-04 | Denied state, switch confirmation, reader, staff Content and More, mobile staff read-only screens | Reports (DEC-04: only metrics with a verified source); role settings (DEC-06: unchanged); Swahili copy review |
| Q-01 | Integration | [RUN-POLICY.md](RUN-POLICY.md) | Serialized schema/contracts/generation, integration and one bounded correctness/complexity review | Code complete: foundation lane reviewed earlier; the wave of this batch reviewed by three read-only reviewers (API, web, mobile), confirmed findings fixed (`29b1cf7`, `1b45fd8`, `d1ca9eb`). No CI baseline: Coolify auto-deploys on push, per Fredy | Each task's contract/migration edges |
| Q-02 | Not started | Fredy performs the checks after the push and migrations (DEC-10) |

## Status 2026-11-24 (second batch, code work)

Done on `develop` (`ce5a753`, `d2eb14f`, `29b1cf7`, `1b45fd8`, `d1ca9eb`, plus the More page change):

- Web session: the proxy rotates the refresh token 60 seconds before expiry and writes the cookie (`1d168c6`). Known gap: two requests holding the old cookie across a restart can still lose the session.
- Retention (DEC-09 and DEC-08): daily 03:00 job removes documents soft-deleted for 30 days (object first, row second, a failure keeps the row), expired refresh tokens and expired AI conversations (`ba97470`).
- Reports (DEC-04): Reports hub lists only reports whose every required permission the caller holds, each with its definition. Attendance trends shows an unavailable notice instead of zero and drops the Branch option (the API groups it by zone). Giving summary shows an error instead of an empty list. Definitions are in `api-contracts.md`.
- Mobile: space switcher on Profile and More; members and staff routed by active role; switching restores the previous space if it fails; startup keeps the session when the API is unreachable; staff Dashboard shows `totalMembers` and `activeZones`.
- Web More: role settings link to the existing Permissions page (DEC-06: no redesign); space switching points to the sidebar switcher, which asks for confirmation.

Decisions taken on the recommendation, without a new question to Fredy:

- M-02 in-app reader: no WebView dependency. Signed downloads open in the device browser.
- W-06 AI actions: the action registry stays empty, so this release has no AI write actions. Forms and confirm buttons stay disabled.
- Logout revokes every session of the user (the approved revocation behaviour); per-device logout is not built.
- Mail and SMS DTOs: no `churchId` work, since no sending is enabled (DEC-05).

Not code, still for Fredy after all code work (DEC-10): Q-02 human verification, the Swahili copy review, and the D-01 design review.

## Status 2026-11-25 (third batch, code work)

Verified once for this batch: `@church/config` and `@church/db` build, API type-check and jest (19 suites, 143 tests), web type-check and `next build` (placeholder build-only env values), mobile type-check. Not run: mobile Android export, any live API or device run.

- Member scope (`getLeaderScope`): members see only their own record on list, search (403), zone (403) and single-member reads. Zone and department leaders see only members they lead on list, search, zone, single member and dashboard stats. Other roles are unchanged.
- Member services: `GET /attendance/sessions` returns only open or upcoming, non-draft sessions to members (`id, title, sessionDate, status, serviceType`). Web portal and mobile Home show the next three.
- Staff documents (web): upload (visible-to-members is set at upload) and soft delete with confirm, under `manage:files`.
- Web library search by title, description and file name. Mobile staff tabs are hidden by role, using a copy of the permission grants.
- AI answers carry `sources` and `uncertain` in the contract; clients show them. No feedback control or endpoint.

Open:
- Visibility toggle after upload needs `PATCH /api/files/:id` to accept visibility (backend change).
- Leader scope does not yet cover member update and delete routes.
- `ai-api.md`, `api-contracts.md` and `ai-components.md` do not yet describe the new response fields.
- The mobile permission copy will drift if `PERMISSION_MAP` changes.
- No automated test harness for web or mobile (W-02: no test setup).
- Rebuild `packages/config` before the web and mobile type-checks.

## Status 2026-11-25 (fourth batch, code work)

Verified for this batch: `@church/config` build and copy tests (parity and placeholders), `@church/db` build, API type-check and jest (19 suites, 143 tests), web type-check, web tests (13) and `next build` with placeholder build-only env values, mobile type-check, mobile tests (12) and Android export. Not run: iOS export, any live API or device run, the dev deploy.

Done:
- Member scope: members see only their own record on list and single-member reads; search and zone listing return 403 to members. Zone and department leaders are scoped on list, search, zone, single-member reads, dashboard stats, and member edit and delete.
- Member services: `GET /attendance/sessions` returns only open or upcoming, non-draft sessions to members. Web portal and mobile Home show the next three.
- Staff documents (web): upload, soft delete, and a Visible to members toggle that sends `visibleToMembers` to `PATCH /api/files/:id`.
- Web library search. Mobile staff tabs are hidden by role, using a copy of the permission grants (checked by tests).
- Language switch on web (cookie) and mobile (device). Swahili copy covers the member portal, staff dashboard, mobile screens, navigation, shared states, error messages and permission labels. Keys live in `packages/config/src/i18n/messages/`; the type-checker and the copy test enforce parity. Claude wrote and reviewed the copy.
- Migrations 0010 to 0012 applied on dev through a one-off scheduled task (DEC-12).
- Fixes found by tests: library size rounding near 1 MB; a permission lookup that matched inherited object names; the mobile bundle importing the database package (now `@church/config/i18n`).

Open, code (deferred by decision, DEC-14):
- AI configuration, AI testing and the AI feedback route (needs a table). The AI answer sources and uncertainty fields are implemented and displayed.

## Status 2026-11-26 (sixth pass, finish code work)

Verified for this pass: `@church/db` build, `@church/config` build and copy tests (38), API type-check and jest (19 suites, 146 tests; three new feedback tests, no provider calls), web type-check, web tests (13) and `next build` with placeholder build-only env values, mobile type-check, mobile tests (12) and Android export. Migration 0013 (`ai_feedback`) applied on dev on 2026-11-26 after the dev deploy of `f91f10f` finished: one-off task on the backend container, status success, task deleted afterwards (DEC-12).

Done:
- AI feedback: `POST /ai/feedback` with table `ai_feedback` (migration 0013). Web and mobile show Helpful and Not helpful under each answer. Owner-only, ratings only, answer text kept with the rating. Feedback is accepted while the answer is in the stored history (the last 12 messages).
- Dashboard: `pendingVisitors` (non-deleted visitors with no linked member and no follow-up marked converted or dropped), sent only to roles with `view:visitors`. Shown on web and mobile staff dashboards.
- Mobile staff tabs read `PERMISSION_MAP` through `@church/config/permissions` (done in the previous commit, verified again here).

Closed without code, by decision (DEC-15):
- Mobile in-app reader: the device browser stays. No WebView dependency added.
- AI action registry: stays empty this release.
- Mail and SMS DTO `churchId`: unchanged, sending work is off (DEC-05).
- `recentActivities`: no verified source, not sent.
- Logout revocation: already implemented.
- Reports (DEC-04): the two reports with a verified source are built.

Still open, human only (after all code work):
- Q-02 device and accessibility checks, including a mobile device run.
- D-01 design review.
- Native-speaker review of every `sw` string in `packages/config/src/i18n/messages/`.
- Visibility toggle check: a staff toggle changes what members see in the Library.
- Production migrations need Fredy's approval (dev only so far).
- AI configuration and AI testing stay deferred (DEC-14).

## Status 2026-11-26 (fifth pass, code cleanup)

Done:
- Deleted unused web files with no importers: `lib/member.ts`, `components/form/PrayerRequestForm.tsx`, `components/event/rsvp-buttons.tsx`, `components/date-range-picker.tsx`, `components/workspace/church-card.tsx`, `components/ui/sidebar.tsx`. Their English strings are gone with them.
- Web type-check and web tests (13) pass after the deletions.
- Mobile staff tabs now read `PERMISSION_MAP` directly, through a new client-safe `@church/config/permissions` subpath. The copied grants are gone, so they cannot drift. Staff-only guard kept: members have self-service grants in the map but no staff tabs. Mobile type-check, tests (12) and Android export pass.

Left as is, on purpose:
- `apps/mobile/lib/api.ts` "API is not configured" message stays in English. It is a developer message for a missing `EXPO_PUBLIC_API_BASE_URL`, which a correct build never shows to a member.

Open, human, after all code work (DEC-10, DEC-13):
- Q-02 device and accessibility checks, including a mobile device run.
- D-01 design review.
- Native-speaker review of every `sw` string in `packages/config/src/i18n/messages/`.
- Visibility toggle check: a staff toggle changes what members see in the Library.
- Production migrations need Fredy's approval (dev only so far).

