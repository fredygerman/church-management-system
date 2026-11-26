# Mobile staff space audit

- **Scope:** `apps/mobile` staff space (`app/(staff)/*`, `components/staff-read-screen.tsx`, `app/ai.tsx`, `components/ai/*`, `lib/checkin.ts`, `lib/claims.ts`, `lib/session.tsx`, `components/spaces-section.tsx`) and the API that staff can call (`apps/api/src`).
- **Baseline:** branch `design/mito-ya-baraka-concepts`, commit `4e0710f`, audited 2026-11-26.
- **Method:** read-only static audit. No source, database, server or dev-environment change. No tests were run and no live requests were made. Every "verify" item below needs a check before it is acted on.
- **Cross-references:** existing IDs from `docs/shipwave/platform/backlog.md`, `remediation-plan.md` (R-MOB-01..05, R-QA-01..02, R-UX-01, R-DES-01), `specs/remediation-mobile-and-quality.md`, `specs/mobile-api-inventory.md`, and accepted decisions in `decisions.md` (DEC-02, DEC-04, DEC-05, DEC-06, DEC-08, DEC-13, DEC-14).
- **Product reference:** `docs/product-design/images/staff.png` (Dashboard, People, Services, Content, More; AI beside notifications), `DESIGN.md`, `screen-specification.md`, `implementation-checklist.md`.

## 1. Summary

1. **The staff space is mostly read-only lists.** Staff can see Dashboard counts, a People search, Services and session lists, a Content list, and a working check-in screen. Check-in needs a typed member UUID. Visitor capture, contact actions, roll-call, prayer follow-up, giving and announcements are absent on mobile.
2. **Most missing jobs already have API endpoints.** Batch check-in (`attendance.controller.ts:167`), headcount (`attendance.controller.ts:92`), event roster, RSVP and attendance (`events.controller.ts:148-199`), visitor create and follow-up (`visitors.controller.ts`), and the giving summary (`offerings.controller.ts:119`) all exist. Most of the work is mobile work. The real blockers are server gaps and policy decisions.
3. **P0, verify first: visitor data is readable by members.** The MEMBER role holds `view:visitors` (`packages/config/src/permissions.ts:191`), and `GET /visitors` and `GET /visitors/:id` apply no scope (`visitors.controller.ts:52-70,84-96`). A member token would likely return every visitor's name, phone and email. One read-only GET on dev confirms it.
4. **P1: member payloads and search are too broad.** Member list and search select every column, including `notes`, date of birth and occupation (`members.service.ts:157-165,227-245`). Search has no limit (`members.service.ts:227-245`).
5. **P1: no least-privilege role for ushers.** Check-in needs `manage:attendance`, which only SUPER_ADMIN, ADMIN and BRANCH_ADMIN hold (`permissions.ts:120,137,153`). Ushers would need admin-level rights. DEC-06 forbids a role redesign, so this needs a new decision.
6. **P1: check-in is not built for connectivity or scale.** There is no fetch timeout (`apps/mobile/lib/api.ts:153-163`), no queue, a per-member request loop (`attendance.tsx:116-121`) that ignores the batch endpoint, and a silent 100-member cap (`members-list.ts:4`).
7. **AI enforcement is sound on the server.** Membership is checked per request (`church-context.guard.ts:80-115`), conversations are scoped to user and church (`ai-conversation.store.ts:36-50`), and each tool re-checks its permission (`ai-tools.ts:116-133`). The gaps are client-side: a stale conversation after a church switch (MS-21), titles-only citations (MS-23), and too few staff tools to answer staff questions (MS-22).
8. **Swahili users see English server text** in lists, errors and AI messages (MS-25).

## 2. What exists today (verified in code)

- Staff tabs: Dashboard, People, Services, Content, More (`apps/mobile/app/(staff)/_layout.tsx:21-25`). `attendance` is a hidden route (`_layout.tsx:27`). Tab visibility uses a client copy of `PERMISSION_MAP` (`lib/claims.ts:34-39`); the server enforces every call.
- Dashboard: `GET /dashboard/stats` shows `totalMembers`, `activeZones` and `pendingVisitors` (`(staff)/index.tsx:42-46`). `pendingVisitors` is also sent to MEMBER (see MS-01).
- People: `GET /members` or `GET /members/search?q=` as a name-only list (`(staff)/people.tsx:14-41`). Search runs only on submit.
- Services: service types and sessions, read-only (`(staff)/services.tsx:11-41`).
- Content: `GET /api/files/user` document list, read-only (`(staff)/content.tsx:9-22`).
- Check-in: open sessions, manual check-in by member UUID, a "QR token" text field, and a batch of selected members (`(staff)/attendance.tsx:61-173`). Outcomes are mapped in `lib/checkin.ts:7-35`.
- Space switch: member Home and Profile offer "to staff" for staff accounts (`app/(member)/index.tsx:173`, `profile.tsx:121-124`); More offers "to member" and the church switcher (`(staff)/more.tsx:28-29`). The space choice is in memory only (`lib/session.tsx:69-70,101-115`).
- AI: `app/ai.tsx` is a chat screen with feedback, sources and an uncertain flag. Forms and confirm actions render disabled (`components/ai/ai-response.tsx:62-78`), which matches the empty action registry in backlog W-06.
- Mobile tests: 5 files (`apps/mobile/tests/{api-session,checkin,claims,request-gate,restore}.test.ts`). None renders a staff screen.

## 3. Findings

Severity: P0 security or privacy exposure now; P1 blocks a core staff job, or a data or accessibility failure; P2 important quality; P3 polish. Effort: S under a day, M a few days, L a sprint or more.

| ID | Sev | Area | Evidence | Recommendation | Effort | Depends on |
|---|---|---|---|---|---|---|
| MS-01 | P0 | API authz | `packages/config/src/permissions.ts:191` gives MEMBER `view:visitors`; `apps/api/src/visitors/visitors.controller.ts:52-70,84-96` list and get with no scope; `visitors.service.ts` `getVisitorsByChurch` has no role input. Also exposes `pendingVisitors` (`dashboard.service.ts:27`) | Verify with one GET `/visitors` using a member token on dev. Then remove `view:visitors` from MEMBER, and add API tests: member gets 403 on `/visitors`, `/visitors/:id`, `/visitors/status/:s`; `pendingVisitors` absent for members | S | Owner confirms it is a grant bug (not intended) |
| MS-02 | P1 | API authz | `getLeaderScope` is used only in members and dashboard (`members.service.ts:101`). Visitors, families (`families.controller.ts:59-75`), attendance sessions and trends (`attendance.controller.ts:74-84,119`), events, prayer and offerings have no scope. ZONE_LEADER and DEPARTMENT_LEADER hold `view:visitors`, `view:families`, `read:visitation` (`permissions.ts:161-185`) | Decide per resource: church-wide or leader-scoped (DEC-02). Apply scope to visitors and families first; add leader-scope tests | M | DEC-02 decision |
| MS-03 | P1 | API privacy | `members.service.ts:157-165` `db.select().from(members)` returns all columns, including `notes` (`packages/db/tables/members.ts:43`), `dateOfBirth`, `dateOfSalvation`, `occupation`. `searchMembers` (`:227-245`) does the same | Staff projection for list and search (id, names, phone, zone, department). Full record only on `GET /members/:id` with a field list. Document in `api-contracts.md` | S-M | DEC-02; serialized contract lane (L2) |
| MS-04 | P1 | API perf | `members.service.ts:227-245` returns every match. `members.controller.ts:68-87` accepts a one-character `q`. Phone search is `ILIKE %x%`, which `idx_members_phone` (`members.ts:50`) cannot serve | Add `limit`/`offset` with the same `meta` as `/members`; minimum two characters; the mobile client pages. Consider a trigram index later | S | L2 contract lane |
| MS-05 | P1 | Mobile people | `people.tsx:15,34-41` loads `/members`, which the server caps at 100 (`members-list.ts:4,86`); no load-more. Search fires on submit only (`people.tsx:18`). `staff-read-screen.tsx:76` renders every row in a ScrollView | Paged `FlatList` with `onEndReached`; search as typed, debounced 300 ms, min two characters; show `meta.total` | M | MS-04 |
| MS-06 | P1 | Mobile check-in | `attendance.tsx:151-152` takes a typed "Member ID" UUID (`wiring-mobile.ts:15`). The copy "Search member by name or phone" (`staff-attendance.ts:32`) is not used on mobile. Results show the raw UUID when the member is outside the first 100 (`attendance.tsx:85-88,105`) | Search-first check-in (F-01) | M | MS-04 |
| MS-07 | P1 | Mobile check-in | `attendance.tsx:154-156` takes a hand-typed "QR token". No camera package in `apps/mobile/package.json`. The QR path still needs a member ID (`attendance.controller.ts:113-117`), so no member-side code exists | Scanner (F-02) and a product decision on member self check-in. Do not ship the typed token field to users | M-L | Product decision (new DEC) |
| MS-08 | P1 | Mobile batch | `attendance.tsx:116-121` posts one request per member in a loop. The batch endpoint exists (`attendance.controller.ts:167-172`, `attendance.service.ts:398-460`) and returns per-member reasons. `attendance.tsx:61` asks `limit=200`; the server clamps to 100 without saying so | Call `/sessions/:id/checkins/manual/batch`; map `failed[].reason`; show the clamp through `meta.total` | S | none |
| MS-09 | P1 | Connectivity | `apps/mobile/lib/api.ts:153-163` `fetch` has no timeout. `attendance.tsx:98-103,113-122` keep `busy` until the promise settles, so a stalled network freezes the screen. `lib/checkin.ts:16` labels network failures "unavailable" with no retry control. Nothing is queued or persisted | Per-request timeout (about 15 s) raised as a `network` error; retry; offline queue (F-10). Replay is safe: a repeat check-in returns 400 "already checked in" (`attendance.service.ts:192`), which the client treats as success on replay | M | MS-11 |
| MS-10 | P1 | Data quality | `visitors.service.ts:14-33` inserts with no duplicate lookup. `visitors.service.ts:116-140` converts to a member without checking phone. `members.ts:35` phone is not unique and not normalised; the only dedupe is on import (`data-quality.service.ts:133-135`) | Duplicate candidates on visitor create and before convert; E.164 (+255) normalisation on write; reuse the import matcher. Decide whether convert blocks or asks | M | Data-model decision; L2 |
| MS-11 | P2 | Errors | `lib/checkin.ts:12-13` matches English server text. The unique index (`packages/db/tables/attendance.ts:102`) turns a concurrent double insert into a 500, which the client shows as "unavailable" | Stable error codes from the API (`code: "CHECKIN_DUPLICATE"`); client maps codes; treat a 500 on duplicate as duplicate | S | L2 error contract |
| MS-12 | P1 | Mobile visitors | No visitor capture or follow-up on mobile. API: `POST /visitors` (`visitors.controller.ts:34-48`), follow-ups (`:137-175`). Web copy exists (`staff-people.ts:112-133`) | F-03 | M | MS-10 |
| MS-13 | P1 | Mobile contact | `members.phone` is in every list response (`members.ts:35`), but staff screens have no `tel:` or `sms:` action. `people.tsx:38` `ListRow` has no `onPress`. `Linking` is used only in the member library (`app/(member)/library.tsx:82`) | Call and text links on a member card (device apps; no server sending, so DEC-05 is unaffected) | S | MS-03 projection |
| MS-14 | P1 | Mobile roll-call | No event roster or RSVP UI. API ready: `events.controller.ts:148-199` under `manage:events`, which only SUPER_ADMIN, ADMIN and BRANCH_ADMIN hold (`permissions.ts:125,142,158`). Ministry leaders (DEPARTMENT_LEADER) cannot take roll | F-06; DEC-06 decision for leaders | M | DEC-06 |
| MS-15 | P1 | Mobile headcount | `PUT /attendance/sessions/:id/headcount` (`attendance.controller.ts:92-104`) has no mobile form | Headcount sheet in F-01 | S | none |
| MS-16 | P1 | Roles | Roles are SUPER_ADMIN, ADMIN, BRANCH_ADMIN, ZONE_LEADER, DEPARTMENT_LEADER, MEMBER (`permissions.ts:15-22`). No usher, secretary or pastor role. Ushers need admin-level grants, which include delete member and settings (`permissions.ts:128-158`) | New decision: scoped attendance-operator bundle (F-12). DEC-06 needs reopening | M | DEC-06 reopened |
| MS-17 | P1 | Mobile giving | No giving summary on mobile. API `GET /offerings/reports/summary` (`offerings.controller.ts:119-124`) is `view:giving-reports`, held by SUPER_ADMIN, ADMIN and BRANCH_ADMIN only | F-07 | S-M | DEC-04 definition (`api-contracts.md`, verify) |
| MS-18 | P2 | Announcements | Drafts and lists exist (`communications.controller.ts:12-50,84-110`). Send and schedule need `send:communications` (`:111-122`). No mobile UI | F-08, draft only | M | DEC-05 (no sending) |
| MS-19 | P2 | Prayer | No staff prayer endpoint. `prayer.controller.ts:20-60` offers only `POST /prayer-requests` and `GET /prayer-requests/me` | F-09 is blocked. Do not build until DEC-02 names who may read prayer | L | DEC-02 policy |
| MS-20 | P2 | Pastoral notes | Visitor follow-up notes exist (`visitors.controller.ts:137-175`) for leaders with `create:visitation` and `read:visitation`. Member `notes` (`members.ts:43`) are editable only with `update:member` | Use visitor follow-up for F-03. Member notes need a DEC-02 decision | M | DEC-02 |
| MS-21 | P1 | AI state | `app/ai.tsx:29` keeps `conversationId` across church switches. The AI screen sits outside the keyed tabs (`specs/remediation-mobile-and-quality.md:174`). After a switch the server returns 404 "Conversation not found" (`ai.service.ts:121-124`). The screen shows it in English and retries with the same stale ID (`ai.tsx:63-65,121`) | Reset AI state on `contextKey` change (R-MOB-02) | S | R-MOB-02 |
| MS-22 | P2 | AI capability | Staff-relevant tools are limited to `member_count`, `upcoming_events`, `library_documents`, `service_types` (`ai-tools.ts:43-104`). No attendance, visitor or roster data, so a staff question such as "who was absent" cannot be answered | F-11 scoped tools. Each re-checks permission and leader scope | M | DEC-14 (AI config deferred); DEC-08 |
| MS-23 | P2 | AI citations | Sources are tool names only (`ai.service.ts:290-296`, `ai.tsx:22,99`). No link to the record, no "as of" time | `href` on an allow-listed route and `asOf` on each source; render as links | S-M | Contract (`packages/config/src/ai`) |
| MS-24 | P2 | AI routes | `components/ai/ai-response.tsx:12` allows staff routes for every role. A member who taps one gets the denied screen | Pass the caller's capabilities into the allow-list | S | none |
| MS-25 | P1 | Swahili | Server messages are shown as sent: `staff-read-screen.tsx:56`, `ai.tsx:65,85`, `spaces-section.tsx:29,43`, `api.ts:97`. Swahili users see English | Map error codes (MS-11) to `mobile.*` keys; keep the server text only for logs | M | MS-11 |
| MS-26 | P2 | Accessibility | Announcements use `accessibilityLiveRegion` only, which is Android-only (`attendance.tsx:175-182`). No `AccessibilityInfo.announceForAccessibility` anywhere. Results come as one line per member | Announce the summary once on iOS; group results into one accessible list | S | none |
| MS-27 | P2 | Touch targets | `components/ai/ai-header-button.tsx:19` is 40 px high. DESIGN.md requires 44 px | Hit slop to 44 px | S | none |
| MS-28 | P2 | Performance | `attendance.tsx:159-172` maps every member into a ScrollView. `staff-read-screen.tsx:76` does the same for lists | `FlatList` with stable keys, `initialNumToRender` | S | MS-05 |
| MS-29 | P2 | API guard | `church-context.guard.ts:64` uses `request.path.includes('/profile')` and `'/users/me'`. Any route containing those strings skips the church check. Each route still runs its permission check | Exact path match; add a guard test. Verify which routes match | S | none |
| MS-30 | P3 | Security hygiene | `attendance.service.ts:85` builds the QR token from churchId, serviceTypeId, `Date.now()` and `Math.random()`. `listSessions` returns full rows including `qrToken` to every `view:attendance` role (`attendance.service.ts:99-109`) | Use a 32-byte random token; omit `qrToken` unless the caller has `manage:attendance` | S | none |
| MS-31 | P2 | Session claims | `lib/session.tsx:54` falls back to `user.role` when the token has no `activeRole`. The API always sets it (`auth.service.ts:149-160`), so risk is low | Remove the fallback; treat a missing claim as no staff space | S | L3 |
| MS-32 | P3 | Tab gating | Hidden tabs stay reachable by URL (`(staff)/_layout.tsx:14`). Gating uses a client copy of `PERMISSION_MAP` (`lib/claims.ts:34-39`). The server enforces, and the screens show a denied state after the request | Keep. Add a test that each staff screen shows the denied state for a role without its permission | S | none |
| MS-33 | P2 | Dashboard | Three counts only (`(staff)/index.tsx:42-46`). No today's service, no visitor follow-up count for the operator, no quick actions (the mock shows Add member, Log visitor, Create content) | Add quick actions that link to F-01, F-03 and F-08 once built | S | F-01, F-03 |
| MS-34 | P2 | Test coverage | 5 mobile test files; none renders a staff screen. No API test that a member is denied visitors or that a leader is scoped on visitors or families | Tests in each lane (section 6) | M | none |
| MS-35 | P2 | Test accounts | `packages/db/demo.ts:48-50` creates only a platform `super_admin`. `packages/db/seeds/mobile-demo-data.sql:36-37` has one member test user. No staff role user on dev | Section 5 | S-M | Owner approval (dev write) |
| MS-36 | P2 | Space switch | Choice is in memory; default is staff for staff accounts (`lib/session.tsx:101-103`). No return-path test. R-MOB-03 is partial | Track under R-MOB-03; no new work now | S | R-UX-01 |
| MS-37 | P3 | Consistency | Mixed key namespaces (`staff.*`, `wiring.*`, `mobile.staff.*`). `spaces-section.tsx:2` imports the native `Button`. `attendance.tsx:11` sits between imports | Tidy while touching each file | S | none |

## 4. Feature specs (12)

Ordered by value for a church operator. Each spec assumes the findings it depends on are fixed first.

### F-01 Search-first attendance check-in with headcount

- **Goal:** an usher checks in a person in under 10 seconds, with no UUID typing.
- **User story:** As an usher on duty, I search a name or phone, tap the person, and see "checked in" or the reason. At the end I enter the headcount.
- **In scope:** open-session picker; debounced search (MS-04); single and multi-select check-in through the batch endpoint; per-person outcome with name; headcount sheet (men, women, children, visitors) with `PUT .../headcount`.
- **Out of scope:** QR (F-02), offline (F-10), creating members.
- **Screens and files:** `app/(staff)/attendance.tsx` (keep the route, move the body into `components/checkin/*`); new `components/checkin/member-search.tsx`, `components/checkin/headcount-sheet.tsx`; `lib/checkin.ts` (batch call, code mapping).
- **API needs:** `GET /members/search?q&limit&offset` (MS-04); `POST /attendance/sessions/:id/checkins/manual/batch` (exists); `PUT /attendance/sessions/:id/headcount` (exists); error codes (MS-11).
- **Acceptance:**
  - Search returns at most 25 rows with a total; "mw" matches names and phones.
  - Success, duplicate and closed outcomes show the member's name, never a UUID.
  - A batch of 30 sends one request; failures are listed with reasons.
  - A closed session disables submit and explains why; no request is sent.
  - Headcount saves once and reloads with the saved values.
  - VoiceOver and TalkBack announce the outcome once.
- **Test plan:** API search paging and minimum length; batch with mixed outcomes; headcount permission. Mobile: classification (extend `tests/checkin.test.ts`), debounce, and a screen test with a mocked `api`.
- **Risks:** two devices checking in the same person (unique index; handled by MS-11). Operators see names and phones; confirm this fits DEC-02.

### F-02 Session QR scanner and member code

- **Goal:** scan the session once, then scan each person's card at the door.
- **User story:** As an usher at the entrance, I scan the session code, then each member's code, and see "checked in" in under two seconds.
- **In scope:** camera scanner (`expo-camera`); session code parsing; scanned member code resolved to a member; invalid or foreign codes rejected.
- **Out of scope:** member self check-in until the product decision (MS-07) is made.
- **Screens and files:** new `app/(staff)/attendance/scan.tsx`, `components/checkin/qr-scanner.tsx`; `lib/checkin.ts`; `apps/mobile/app.json` camera text in EN and SW; `apps/mobile/package.json` (integration lane L7).
- **API needs:** a member code must not be a raw member UUID. Add a short-lived signed member token endpoint (new, L2). Existing `POST /attendance/checkins/qr/:token` (`attendance.controller.ts:113`) takes a session token and a member ID; change it to accept the signed member token. Harden the session token (MS-30).
- **Acceptance:**
  - Camera permission explains the use in EN and SW; a denied state offers search (F-01) instead.
  - A code from another church returns "not found", with no member data.
  - An expired member code is "invalid" and is not checked in.
- **Test plan:** code parsing; foreign-church and expired codes (API); permission denied (mobile).
- **Risks:** printed codes leaking; QR tokens currently guessable (MS-30); legal and consent position for member codes.

### F-03 Visitor capture and follow-up

- **Goal:** log a first-time guest in under a minute and set a follow-up.
- **User story:** As a secretary or usher, I add a visitor with name, phone and source, see possible duplicates before I save, and set a follow-up date.
- **In scope:** create form; duplicate candidates by phone and name (MS-10); visitor list with status filter and paging; visitor detail with follow-up history and a new follow-up.
- **Out of scope:** convert to member (admin and branch admin only, later); messages to visitors (DEC-05).
- **Screens and files:** new `app/(staff)/visitors/index.tsx`, `visitors/new.tsx`, `visitors/[id].tsx`; `components/visitors/*`; `lib/claims.ts` (tab and entry permissions); `app/(staff)/more.tsx` entry; i18n keys in `packages/config/src/i18n/messages` (L8).
- **API needs:** `POST /visitors`; `GET /visitors?limit&offset&q` (add `q`); `GET /visitors/:id`; `POST /visitors/:id/followup`; `GET /visitors/:id/latest-followup`; new `GET /visitors/duplicates?phone=` (L1 and L2). MS-01 must be fixed first.
- **Acceptance:**
  - A phone that matches an existing visitor or member shows candidates before save.
  - Follow-up status values come from the API.
  - A failed save keeps the typed values.
  - A MEMBER account gets the denied state.
- **Test plan:** API duplicate endpoint; member denied (MS-01); form validation on mobile.
- **Risks:** visitor contact details reach every leader (MS-02); consent and retention for visitor data (DEC-02).

### F-04 Member directory and contact card

- **Goal:** find any permitted member and call or text them in two taps.
- **User story:** As a zone leader, I search my members and call one from the list.
- **In scope:** paged list; search as typed; member card with name, zone, department, phone; call and text actions; card reads `GET /members/:id`.
- **Out of scope:** editing members; notes and date of birth until DEC-02 allows them.
- **Screens and files:** `app/(staff)/people.tsx` (rewrite on `FlatList`); new `app/(staff)/people/[id].tsx`; new `components/member-card.tsx`; `components/staff-read-screen.tsx` stays in L5 only.
- **API needs:** `GET /members?limit&offset&q` (leader scope already applied, `members.service.ts:101`); projection (MS-03); `GET /members/:id` with a field list.
- **Acceptance:**
  - A zone leader sees only own-zone members, enforced by the server.
  - Call opens the dialer; text opens the messages app with no body.
  - The list keeps loading on scroll past 100 members.
  - No notes or date-of-birth field appears on the card.
  - The denied state still shows for a role without `read:member`.
- **Test plan:** API projection (no `notes` or `dateOfBirth` in list responses); paged list with a mocked API; denied route.
- **Risks:** phone formats in older records (MS-10); scope bugs in other modules (MS-02).

### F-05 Prayer request follow-up and pastoral notes (blocked by policy)

- **Goal:** pastors see new prayer requests they may read and record that they followed up.
- **Status:** blocked. No staff endpoint exists (MS-19). DEC-02 accepted "existing rules only; no new sensitive uses", so nothing may be built until a policy names the readers.
- **Next step:** Fredy records the policy: which roles read which requests; whether visibility can be changed; retention; whether reads are logged. Pastoral notes on members follow the same decision (MS-20).
- **After the decision:** `GET /prayer-requests` (scoped), `PATCH /prayer-requests/:id` (status and note); mobile list with a status filter and a follow-up note. No export.
- **Acceptance (after decision):** only permitted roles see requests; a member's own list is unchanged; AI tools still exclude prayer (`ai.service.ts:56`).
- **Test plan:** scope tests; regression test that the AI tool list has no prayer tool.
- **Risks:** privacy breach; wrong recipients; the AI prompt rule is the only text-level guard.

### F-06 Event roll call and RSVPs for ministry leaders

- **Goal:** a ministry leader takes roll for a practice or event on the phone.
- **User story:** As a department leader, I open my event, see the roster, and mark who attended.
- **In scope:** events list (upcoming, paged); roster with RSVP status; set attendance; add a staff RSVP.
- **Out of scope:** creating or editing events.
- **Screens and files:** new `app/(staff)/services.tsx` section or `app/(staff)/events/index.tsx` and `events/[id].tsx`; reuse `components/events/*` where possible; `lib/claims.ts`.
- **API needs:** `GET /events/:id/rsvps`, `POST /events/:id/rsvps`, `PUT /events/:id/attendance` (exist). Scope for leaders (MS-02). Permission decision for DEPARTMENT_LEADER (MS-14).
- **Acceptance:**
  - Roster loads in two requests or fewer.
  - Attendance marks persist after reload.
  - A role without `manage:events` sees the denied state.
  - Roster rows show names only, not contact details, unless F-04 is also granted.
- **Test plan:** API permission and scope; mobile roster rendering.
- **Risks:** roster includes personal data; ministry leaders need a permission decision.

### F-07 Giving summary for branch leadership

- **Goal:** an admin or branch admin reads this period's giving totals by category on the phone.
- **User story:** As a branch admin, I see this month's giving by category and compare it with last month.
- **In scope:** summary card with period filter (week, month, year); definition line from `api-contracts.md` (DEC-04); loading, empty and error states.
- **Out of scope:** per-member amounts; the `memberId` filter on `GET /offerings`; exports.
- **Screens and files:** new `app/(staff)/more/giving.tsx`; `app/(staff)/more.tsx` entry; `lib/claims.ts`.
- **API needs:** `GET /offerings/reports/summary` (exists). Verify the response shape before building.
- **Acceptance:**
  - Hidden for roles without `view:giving-reports`.
  - Amounts use the approved currency format (DEC-16 keeps currency en-US).
  - No individual giving record appears.
- **Test plan:** API permission; mobile denied state; formatter test.
- **Risks:** definitions (DEC-04); accidental per-member view.

### F-08 Announcement drafting (no sending)

- **Goal:** draft a church announcement on the phone for an admin to review on the web.
- **User story:** As a ministry leader with communications access, I write an announcement in English or Swahili and save it as a draft.
- **In scope:** create and edit drafts; list drafts with status; preview with a template; a visible note that delivery is not available yet.
- **Out of scope:** send, schedule and cancel (DEC-05). There is no send control.
- **Screens and files:** `app/(staff)/content.tsx` (add an announcements section); new `app/(staff)/content/announcement/[id].tsx`; `components/communications/*`.
- **API needs:** `POST /communications/campaigns`, `PUT /communications/campaigns/:id`, `GET /communications/campaigns`, `POST /communications/templates/preview` (exist; `manage:communications`).
- **Acceptance:**
  - A failed save keeps the text.
  - Drafts show their status.
  - There is no send or schedule control, and the screen says delivery is unavailable.
- **Test plan:** API draft lifecycle; mobile has no send control.
- **Risks:** staff may assume messages are sent; wording must not promise delivery.

### F-09 Staff dashboard quick actions

- **Goal:** the dashboard shows what needs attention now.
- **User story:** As an usher, I open the app and see the current service, my check-in button, and visitor follow-ups due.
- **In scope:** open session card with check-in count; quick actions (Check in, Log visitor, Create announcement) shown by permission; counts only where a verified source exists (DEC-01).
- **Out of scope:** new metrics without a source.
- **Screens and files:** `app/(staff)/index.tsx`; `components/ui/quick-action.tsx` (exists).
- **API needs:** `GET /dashboard/stats` plus sessions (exists); an optional `openSession` field needs L1 approval.
- **Acceptance:** each action is shown only when the role holds the permission; the layout matches the staff.png quick-action row; EN and SW labels fit.
- **Test plan:** permission-filtered rendering with mocked claims.
- **Risks:** low; depends on F-01 and F-03 routes.

### F-10 Offline check-in queue

- **Goal:** keep checking in when venue Wi-Fi drops.
- **User story:** As an usher, I check people in with no signal; the app shows "3 waiting to send" and sends them when the connection returns.
- **In scope:** queued manual check-ins per session; replay on reconnect; idempotent replay (a 400 duplicate counts as sent); queue survives an app restart; queue cleared when the session closes or after 24 hours; visible count.
- **Out of scope:** offline search across all members; offline headcount.
- **Screens and files:** new `lib/offline-queue.ts`; `lib/checkin.ts`; `lib/api.ts` (timeout and `network` kind, L3); `components/checkin/*` (L4).
- **API needs:** none new. Uses the unique index and the duplicate code (MS-11).
- **Acceptance:**
  - Airplane mode shows "saved, will send" and nothing is lost.
  - Reconnect sends each entry once.
  - A restart keeps the queue.
  - A 403 on replay is shown to the user, not dropped silently.
  - Logs and the queue hold member ID and name only, no contact details.
- **Test plan:** queue replay with a fake API; restart persistence; duplicate-as-success; closed-session replay.
- **Risks:** personal data at rest on the device (minimise and clear); a session closed by another operator before replay.

### F-11 Staff AI assistant v2

- **Goal:** a staff member asks a practical question and gets an answer with tappable sources.
- **User story:** As a branch admin, I ask "how many visitors need follow-up this week?" and tap the result to open the list.
- **In scope:** scoped read tools (`attendance_summary` per session, `visitor_followups_due` counts, `events_roster_counts`); sources with routes and an "as of" time (MS-23); church switch resets the conversation (MS-21); role-aware route allow-list (MS-24).
- **Out of scope:** any write action (the registry stays empty, DEC-08); prayer, family and giving records (existing hard rule).
- **Screens and files:** `apps/api/src/ai/ai-tools.ts`, `ai.service.ts` (prompt, tool list); `packages/config/src/ai/*` (source href, asOf); `apps/mobile/app/ai.tsx`; `components/ai/ai-response.tsx`.
- **API needs:** the tools above, each checking permission and leader scope in `execute`.
- **Acceptance:**
  - A MEMBER asking for attendance gets a notice, not data.
  - A zone leader's answer counts only their members.
  - A prayer question gets a notice.
  - Switching church clears the conversation.
  - A 20-question evaluation set in EN and SW passes with the expected tool calls.
- **Test plan:** tool unit tests; `ai.service.spec.ts` additions; mobile screen test for reset and links.
- **Risks:** AI configuration and live testing are deferred (DEC-14), so this cannot be demonstrated end to end yet; model answers can overstate, so counts must show their source; absence lists are personal data and stay out of v2.

### F-12 Scoped attendance-operator role (decision first)

- **Goal:** ushers check in and record headcount without admin rights.
- **Options:** (a) a new `usher` role with `manage:attendance`, `manage:headcount` and member search; (b) a per-membership permission bundle; (c) status quo (admin-level grants). Recommendation: (b), because it avoids an enum migration. Option (a) needs a schema change through the migration lane.
- **Decision needed:** Fredy reopens DEC-06 for this one bundle and says which fields operators may see (names and phones only, or more).
- **Acceptance (after decision):** an operator is denied settings, member delete and giving; check-in and headcount work; `PERMISSION_MAP` parity test passes; mobile tab gating uses the same map.
- **Test plan:** permission matrix test in `packages/config`; API denial tests; mobile tab test.
- **Risks:** a role enum change needs a serialized migration (AGENTS.md: no hand-written SQL); role labels need EN and SW keys.

## 5. Test accounts and seed data (dev only)

No staff user exists on dev. `demo.ts:48-50` creates a platform `super_admin`, and `super_admin` skips membership checks (`church-context.guard.ts:106-112`). Do not use it as a staff test user, because it hides scope bugs.

**Accounts to create (one per role, plus a control):**

| Account | Church role | Scope to set | Used for |
|---|---|---|---|
| staff.admin | admin | HQ | Full staff tabs, giving, communications drafts |
| staff.branch | branch_admin | HQ, plus a second branch membership | Branch switching, branch scope |
| staff.zone | zone_leader | One zone via `memberZones` and `assignedZoneId` | Leader scope (MS-02, F-04) |
| staff.ministry | department_leader | One department via `memberDepartments` | Scope; RSVP roll-call denial until F-06 decision |
| staff.usher | branch_admin until F-12 | HQ | Check-in and headcount; flagged as over-privileged |
| member.control | member | Own record | Negative tests (MS-01) |

**Method, in order of preference:**
1. **Seed script (recommended).** New `packages/db/seeds/staff-test-users.ts`, modelled on `demo.ts`. It is idempotent (`onConflictDoNothing`), needs `DEMO_SEED_CONFIRM=true`, refuses `NODE_ENV=production`, checks `DATABASE_URL` against a dev-host allow-list, and reads passwords from environment variables. Passwords live only in the team password manager, never in the repo.
2. **API only.** `POST /auth/register` creates a member (`auth.service.ts:117`). An existing admin then adds the membership through the users or memberships endpoints. Verify those endpoints before relying on them.
3. **Direct SQL.** Not recommended. `AGENTS.md` requires Fredy's explicit confirmation for manual SQL.

**Seed set (dev, relative dates):**
- Service types, one open session for today, one closed session, one draft (check-in and closed-state tests).
- 25 or more members with +255 phone numbers, including two sharing a phone (duplicate test), two with notes, one soft-deleted.
- Three zones and three departments, each with a leader; members spread across zones for scope tests.
- Three visitors, one with a phone matching a member, one converted.
- One event with an RSVP roster and one practice for roll-call.
- One prayer request from `member.control` (staff must not see it until F-05).
- One giving summary period with categories; one draft announcement.
- Staff accounts set to English and Swahili to test copy.

**Checks after seeding (read-only):** each account logs in on the API; `GET /auth/memberships` returns the expected roles; `member.control` gets 403 on `/visitors`.

## 6. Parallel work lanes and file ownership

Rule: one owner per file. Lanes L2, L7 and L8 are shared, so they run serialized. Each lane lists the files it may edit.

| Lane | Owner | Edits (exclusive) | Work | Wave |
|---|---|---|---|---|
| L1 API authz and privacy | API authz | `packages/config/src/permissions.ts` (MEMBER and scope grants only); `apps/api/src/visitors/**`; `apps/api/src/families/**`; `apps/api/src/members/members.service.ts`, `members.controller.ts`; matching `*.spec.ts` | MS-01, MS-02, MS-03, MS-29 | 0 |
| L2 API contracts (serialized) | Contracts | `apps/api/src/common/**` error codes; `apps/api/src/attendance/**`; new member-token endpoint; `docs/shipwave/platform/specs/api-contracts.md`; schema only via the migration owner | MS-04, MS-11, MS-30, duplicate endpoint, member token | 0-1 |
| L3 Mobile transport and session | Mobile core | `apps/mobile/lib/api.ts`, `lib/session.tsx`, `lib/restore.ts`, `lib/request-gate.ts`, `app/_layout.tsx`, `lib/claims.ts` | MS-09 timeout, MS-21 reset, MS-25 code mapping, MS-31 | 0-1 |
| L4 Mobile check-in | Check-in | `app/(staff)/attendance.tsx`, `app/(staff)/attendance/**`, `lib/checkin.ts`, `lib/offline-queue.ts`, `components/checkin/**` | F-01, F-02, F-10, MS-08, MS-26 | 1-3 |
| L5 Mobile people and contact | People | `app/(staff)/people.tsx`, `app/(staff)/people/**`, `components/member-card.tsx`, `components/staff-read-screen.tsx` | F-04, MS-05, MS-13, MS-28 | 1 |
| L6 Mobile leadership features | Leadership | `app/(staff)/visitors/**`, `app/(staff)/events/**` or services section, `app/(staff)/more/giving.tsx`, `app/(staff)/content*`, `components/visitors/**`, `components/communications/**`; sole editor of `app/(staff)/_layout.tsx` and `more.tsx` | F-03, F-06, F-07, F-08, F-09 | 2-3 |
| L7 AI | AI | `apps/api/src/ai/**`; `packages/config/src/ai/**`; `apps/mobile/app/ai.tsx`; `components/ai/**` | MS-22, MS-23, MS-24, F-11 | 3 (after DEC-14) |
| L8 Copy and accessibility | Copy and design | `packages/config/src/i18n/messages/**` (other lanes send key lists); `components/ui/**`; `theme` | MS-26, MS-27, MS-37, all new EN and SW keys | Continuous |
| L9 QA | QA | Test files only: `apps/mobile/tests/**`, API `*.spec.ts` files outside the lanes above | MS-34; tests for each lane | Continuous |
| Integration | One person | `apps/mobile/package.json`, lockfile, `app.json`, build order (`@church/db` before `@church/config`) | Dependency edits such as `expo-camera` and the storage package for F-10; one typecheck and one test run per batch | Each batch |

**Sequencing rules:**
- L1 and L2 land before any screen that consumes the new endpoints (L4, L5, L6).
- L3 lands before L4, because the timeout changes the network error that L4 maps.
- L8 keys merge before UI changes that use them.
- Only one lane edits `app/(staff)/_layout.tsx` (L6). Other lanes request tab changes from it.
- Decisions (DEC-02, DEC-06, product for MS-07) gate L1 role changes, F-05, F-06 and F-12. Lanes not gated keep going.

**Wave plan:**
- **Wave 0 (security and privacy):** MS-01, MS-03, MS-21, MS-08. Verify MS-01 on dev with one read-only request first.
- **Wave 1 (core check-in and directory):** F-01, F-04, MS-04, MS-09, MS-11.
- **Wave 2 (leadership tasks):** F-03, F-06 (after DEC-06), F-07, F-10.
- **Wave 3 (after decisions):** F-02, F-08, F-09, F-11 (after DEC-14), F-12, F-05 last.

## 7. Verification and limits

- **Checked:** every file and line above was read in this commit. Policy claims were checked against `packages/config/src/permissions.ts` and the API guards.
- **Not checked:** no live request, no device, no test run, no iOS build, no Swahili review (DEC-13), no check of whether a member token really returns visitor rows. MS-01 rests on static evidence until the single read-only GET is done.
- **Commands to run after changes (not run now):** `pnpm --filter @church/mobile typecheck`; `pnpm --filter @church/mobile test`; API jest for the touched modules; `pnpm --filter @church/mobile exec expo export --platform android` for one final check.
- **Human checks (DEC-10):** device run, VoiceOver and TalkBack on the check-in and people screens, a Swahili review of every new key, and a visitor-privacy review before F-03 ships.
