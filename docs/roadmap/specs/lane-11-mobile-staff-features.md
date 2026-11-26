# Lane 11: mobile-staff-features

- **Waves:** 0 (RM-019 staff navigation fix), 1 (RM-057), 2 (check-in, directory, visitors, offline), 3 (extras).
- **Backlog IDs:** RM-019, RM-057; RM-097, 098, 099, 100; RM-133, 134, 135, 136, 137, 138, 139, 149, 151.
- **Decisions:** D-15 (usher and publisher roles), D-17 (prayer follow-up blocked), D-26, D-34 (no member self check-in), DEC-14 (AI work deferred), V-03.
- **Depends on:** lane 03 (RM-021 roles, RM-023 projection and paging, RM-024 error codes, RM-027 test accounts, RM-101 duplicates); lane 07 transport (RM-052: timeout and `network` error kind) and `lib/claims.ts` entries (request); lane 12 namespaces; lane 13 primitives; lane 04 phone util.
- **Blocks:** nothing.
- **Model:** Luna medium; split per task. RM-133 (camera) and RM-137 (AI) are the likeliest to need a smaller slice.

## Goal

Ushers check people in by name in seconds, with headcount, even on bad networks; leaders find members and visitors and call them; staff screens are reachable, role-gated, Swahili-first and accessible.

## Finding added by this synthesis (RM-019)

`app/(staff)/_layout.tsx` hides `attendance` with `<Tabs.Screen name="attendance" options={{ href: null }} />` (last entry in that file). It is the same pattern that makes member hidden routes bounce to the first tab (MM-01, `useVisibleTabsWithRedirect.js:43,76-84`). The staff audit did not flag it and states the check-in screen "works"; it was read statically, not run (MS section 7). Verify on a device with the future staff account; if it bounces, fix like RM-010 (Stack outside Tabs, `(tabs)` group). Role-gated tabs with `href: null` (`tabHref(...)`) are intentionally hidden and fine.

## Owned files (exclusive)

```
apps/mobile/app/(staff)/**          (incl. _layout.tsx, more.tsx; restructured under (tabs))
apps/mobile/app/ai.tsx
apps/mobile/components/{checkin/**, visitors/**, communications/**, ai/**, member-card.tsx, staff-read-screen.tsx}
apps/mobile/lib/{checkin.ts, offline-queue.ts, staff-api.ts (new)}
apps/mobile/tests/{checkin,staff,offline-queue,visitors}-*.test.ts   (incl. existing checkin.test.ts)
apps/api/src/ai/**                   (Wave 3 only, after DEC-14)
packages/config/src/i18n/messages/staff-mobile.ts   (new, pre-registered by lane 12)
```

Not owned: `lib/api.ts`, `lib/session.tsx`, `lib/claims.ts` (lane 07; ask for new tab permissions such as visitors), `components/ui/**` (lane 13), existing `messages/staff-*.ts` (lane 12), API modules for members, visitors, attendance (lane 03).

## Tasks (in order)

### Wave 0-1
1. **RM-019** Verify and fix the staff hidden `attendance` route: Stack around the staff tabs, `(tabs)` group, the `attendance` screen as a Stack screen reached from Services and Dashboard; extend lane 07's static route test pattern with a staff variant in `tests/staff-nav-routes.test.ts`. Device check with the first available staff account (RM-027) or an ADMIN token.
2. **RM-057** AI: reset `conversationId` and messages when `contextKey` changes (`app/ai.tsx:29,63-65,121`; the AI route sits outside keyed tabs); pass the caller's capabilities into the route allow-list so members never get staff links (`components/ai/ai-response.tsx:12`); AI header button `minHeight` 44 and `hitSlop` (`ai-header-button.tsx:19`).

### Wave 2
3. **RM-097 check-in.** Keep `app/(staff)/attendance.tsx` as the route; body moves to `components/checkin/*`. Flow: pick an open session (closed or draft disabled with an explanation, no request sent); search by name or phone (debounced 300 ms, at least 2 characters, `GET /members/search`, 25 rows with total); multi-select; submit with **one** `POST /attendance/sessions/:id/checkins/manual/batch` (not a per-member loop, `attendance.tsx:116-121`); results list names, not UUIDs, with reasons mapped from codes (`CHECKIN_DUPLICATE` counts as success on replay). Headcount sheet (men, women, children, visitors) with `PUT /attendance/sessions/:id/headcount`. Remove the typed "Member ID" and "QR token" fields (`attendance.tsx:151-156`). Announce the summary once with `AccessibilityInfo.announceForAccessibility` (iOS) plus the live region (Android).
4. **RM-098 directory.** `people.tsx` on `FlatList`, paged 25 with `onEndReached`, search as typed (debounced, min 2), shows `meta.total`; `people/[id].tsx` card with name, zone, department, phone; Call (`tel:`) and Text (`sms:`, no body) actions through device apps; no notes or date of birth; denied state for roles without `read:member` or `search:members`.
5. **RM-099 visitors.** `visitors/index.tsx` (status filter, paging), `visitors/new.tsx` (name, phone, source; phone normalised `+255`; duplicate candidates before save through `GET /visitors/duplicates` PROPOSED), `visitors/[id].tsx` (follow-up history, add follow-up). Entry from More and Dashboard by permission; a MEMBER gets the denied state. Failed save keeps typed values.
6. **RM-100 offline queue.** `lib/offline-queue.ts`: queue manual check-ins per session when the request fails with `network` or `timeout`; shows "3 waiting to send"; replays on reconnect and app foreground; a 409 `CHECKIN_DUPLICATE` counts as sent; a 403 or closed session is shown, not dropped; survives restart (persistent storage; the package needs the Wave 2 dependency batch); cleared when the session closes or after 24 h; stores member id and display name only, no contact details.

### Wave 3
7. **RM-133** QR scanner (`expo-camera`, EN and SW camera text in `app.json` via lane 02): scan the session, then each member's signed code (needs the signed member-token endpoint from lane 03, PROPOSED); camera denied falls back to search. **RM-134** event roll call for leaders (existing `events.controller.ts:148-199`, permission decision D-15). **RM-135** giving summary (`GET /offerings/reports/summary`, hidden without `view:giving-reports`, no per-member amounts). **RM-136** dashboard quick actions by permission (Check in, Log visitor). **RM-151** screen for staff-assisted phone verification (API in lane 04). **RM-139** announcement drafting on mobile only if the owner wants it (web is primary). **RM-149** show `avatarUrl` in lists. **RM-137** AI tools v2 (attendance summary, visitor follow-ups due; sources with routes and `asOf`) only after DEC-14. **RM-138** prayer follow-up stays blocked on D-17.

## Contracts consumed

Existing: `GET /attendance/sessions`, `POST /attendance/sessions/:id/checkins/manual/batch` (`attendance.controller.ts:167-172`; confirm the body shape before coding), `PUT /attendance/sessions/:id/headcount` (`:92-104`), `POST /visitors`, `GET /visitors`, `POST /visitors/:id/followup`, `GET /visitors/:id/latest-followup`, `GET /offerings/reports/summary`. PROPOSED (lane 03): `GET /members/search?q&limit&offset`, `GET /visitors/duplicates`, signed member code endpoint. Error codes from lane 03: `CHECKIN_DUPLICATE`, `SESSION_CLOSED`, `MEMBER_NOT_FOUND`, `QUERY_TOO_SHORT`.

## Acceptance (testable)

- Check-in: typing "mw" lists at most 25 matches with a total; a batch of 30 sends one request; failures list name and reason; closed session sends nothing; a result never shows a UUID; headcount saves once and reloads with the saved values.
- Airplane mode: check-in shows "saved, will send"; reconnect sends each once; restart keeps the queue; 403 on replay is visible.
- Directory: list keeps loading past 100 members; zone leader sees only own zone (server-enforced); no notes or date of birth anywhere.
- Visitors: a phone matching an existing visitor or member shows candidates before saving; MEMBER account sees the denied state.
- AI: switching church clears the conversation; a member never sees a staff link.
- VoiceOver and TalkBack announce the check-in outcome once; touch targets at least 44 px; all strings `en` and `sw`, no raw server text.
- Staff hidden routes (attendance) open from Services and Back returns (RM-019).

## Test plan (targeted)

`pnpm --filter mobile test` for `checkin|staff|offline-queue|visitors` tests (extend `tests/checkin.test.ts`: batch mapping, duplicate as success, offline replay with a fake API; screen test with a mocked `api`). One final `pnpm --filter mobile typecheck`. Device checks with the seeded staff accounts (RM-027), usher account for check-in, `staff.zone` for scope, on the panel `agent-device`. API tests are lane 03's.

## Risks

- Depends on lane 03 endpoints; do not start RM-097 before RM-023 and RM-024 are merged.
- Operators see names and phones: confirm D-15 field list; offline queue keeps data on device (minimise and clear).
- Two ushers checking in the same person: handled by the unique index and the duplicate code.
- Camera plugin needs a native rebuild (development build), not Expo Go.
- Staff screens are statically audited only: verify behaviour on a device first (RM-019).

## Agent brief (A: RM-019 and RM-057)

```
ROLE: build agent, lane 11 mobile-staff-features, brief A (RM-019 staff nav, RM-057 AI). Leaf worker: start no subagents.
REPO: /Users/upstairs/Personal/builds/church/church-management-system  BRANCH: design/mito-ya-baraka-concepts (stay on it)
READ FIRST: docs/roadmap/README.md (ground rules), docs/roadmap/specs/lane-11-mobile-staff-features.md (finding + tasks 1-2), docs/roadmap/audits/mobile-staff.md MS-21, MS-24, MS-27, mobile-member.md MM-01 (mechanism).
OWN (may edit): apps/mobile/app/(staff)/**, apps/mobile/app/ai.tsx, apps/mobile/components/ai/**, apps/mobile/tests/staff-nav-routes.test.ts (new).
DO NOT TOUCH: lib/api.ts, lib/session.tsx, lib/claims.ts, app/(member)/**, components/ui/**, package.json, lockfile, API, web.
RULES: no commits/push; no pnpm add; never force-stop Expo Go; Metro --clear if stale.
GOAL: staff check-in screen is reachable and Back works; AI chat resets on church switch and never offers staff links to members.
STEPS:
1. Read app/(staff)/_layout.tsx (note the last Tabs.Screen name="attendance" href:null) and where attendance is opened (grep router.push in app/(staff) and components).
2. Device check first (panel agent-device; load device_list/device_open/device_screenshot via ToolSearch): sign in as a staff/admin account and tap through Services to check-in. Record whether it bounces to the first tab. If no staff account exists, report that and apply the fix by the documented mechanism anyway.
3. Fix: app/(staff)/_layout.tsx becomes a Stack; new app/(staff)/(tabs)/_layout.tsx holds the Tabs (keep tabHref permission gating); git mv index/people/services/content/more into (tabs)/; attendance.tsx stays in app/(staff)/ as a Stack screen; fix relative imports. Keep contextKey keying.
4. tests/staff-nav-routes.test.ts: every router target under app/(staff) resolves; no Tabs.Screen has href:null for a screen that other screens navigate to.
5. app/ai.tsx: clear conversationId/messages on contextKey change (useSession); components/ai/ai-response.tsx:12 take the caller's capabilities into the route allow-list; ai-header-button.tsx minHeight 44 and hitSlop.
VERIFY: pnpm --filter mobile test (staff-nav-routes + checkin tests); ONE pnpm --filter mobile typecheck.
REPORT (max 15 lines): files moved/changed; whether the bounce reproduced (yes/no/unverified); RM IDs done/partial; tests run/skipped; requests (lane 07: claims entries; lane 12: keys); open risks.
```

Briefs B (check-in, task 3), C (directory and visitors, tasks 4-5), D (offline queue, task 6) reuse this header with their tasks.
