# Mobile member space audit

- **Scope:** `apps/mobile` member space (`app/(member)/*`, `app/(auth)/sign-in.tsx`, `components/home|events|ui|ai`, `components/library-media.tsx`, `components/spaces-section.tsx`, `components/language-picker.tsx`, `lib/*`, `theme/`), plus the API routes and shared catalogue that members call.
- **Baseline:** branch `design/mito-ya-baraka-concepts`, commit `4e0710f`, audited 2026-11-26.
- **Method:** read-only static audit of source and the installed expo-router 58.0.32 source (`node_modules/.pnpm/expo-router@58.0.32_*/node_modules/expo-router/build`, cited as `expo-router/…`). Ran `pnpm test` in `apps/mobile` (34/34 pass, 10 suites) and `tsc --noEmit` (exit 0). No device or simulator run, no live API or database call, no source change.
- **Cross-references:** existing IDs from `docs/shipwave/platform/remediation-plan.md` (R-MOB-01–05, R-QA-01–02, R-UX-01, R-DES-01, R-NOT-01, R-LIB-01, R-CNT-01, R-AUTH-01, R-PUB-01), `specs/mobile-api-inventory.md`, `specs/member-experience.md`, and `decisions.md` (DEC-02, DEC-05, DEC-07, DEC-15).
- **Product reference:** `docs/product-design/images/member.png` (Home, Branch selector, Church, Events, Profile), `staff.png` (top bar AI plus notification bell), `DESIGN.md`, `screen-specification.md`, `implementation-checklist.md`, `visual-audit.md`.

## 1. Summary

1. **P0 navigation bug, source-confirmed (issue 1).** The member `Tabs` layout hides six screens with `href: null` (`app/(member)/_layout.tsx:22-28`). expo-router's `useVisibleTabsWithRedirect` treats a focused route that is hidden or undeclared as unreachable and replaces it with the first visible tab (`expo-router/build/standard-navigation/useVisibleTabsWithRedirect.js:43,76-84`; invoked by `expo-router/build/ui/Tabs.js:198`). So each `router.push` into Events, Prayer, Inbox, Library catalogue or detail lands and bounces back to Home with no error. The AI button in the same header is not subject to this redirect because `app/ai.tsx` is a root Stack route (`components/ai/ai-header-button.tsx:10`), which fits the mechanism. Not reproduced on a device. The two causes already ruled out (key remount, overlapping circles) are not involved.
2. **Quick check to confirm on a simulator:** tap Home "See all"; the focused route name should flip from `events` back to `index` within one frame (log it with `useNavigationState`).
3. **Consequence:** only Home, Church, the Library tab (documents), Profile and the More screen itself are reachable. Events (a concept tab), RSVP, prayer, inbox, resource detail and the More hub are all dead ends.
4. **API exposure, urgent and independent of the UI:** `GET /events` and `GET /events/:id` pass `publishedOnly = false` for members, so draft events are returned and the app only hides them client-side (MM-02). Announcements return every completed campaign with no audience filter (MM-09).
5. **Concept gaps that are real product work:** no photo upload (issue 2), no church-switch entry on Home and no join path (issue 3), no announcement detail (issue 4), no Events tab (issue 5), no own-prayer list (issue 11), no giving, family or ministry screens (issue 12). Service times cannot be shown structurally (issue 9).
6. **Swahili-first gaps:** 18 call sites in 11 files show raw English server messages; 13 inline `copy()` call sites bypass the catalogue; Swahili verses are English; AM/PM is English in both languages. Theme text colours pass WCAG AA on the 12 pairs computed (lowest 4.55:1, muted text on canvas).
7. **Intermittent networks:** no request timeout (`lib/api.ts:153-163`), Home blocks on three parallel calls (`app/(member)/index.tsx:76-89`), there is no cached last-good content and no offline state, and switching language re-fetches Home (`index.tsx:93`).
8. **Planning docs are stale in places:** `mobile-api-inventory.md` lists library detail, progress and the membership list as missing; they exist (`apps/api/src/library/library.controller.ts:43-106`, `apps/api/src/auth/auth.controller.ts:254`). Code already implements parts of R-MOB-01, R-MOB-03 and R-MOB-04 (see MM-42). Refresh those statuses before dispatch.

## 2. Findings

Severity: P0 blocker, P1 major, P2 minor, P3 polish. Effort: S under 0.5d, M 0.5–2d, L over 2d. Lines are in the cited file. "Lane" letters refer to section 4.

| ID | Sev | Area | Evidence | Recommendation | Effort | Depends on |
|---|---|---|---|---|---|---|
| MM-01 | P0 | Navigation | `(member)/_layout.tsx:22-28` hides events, events/[id], prayer, library-catalog, library-detail, inbox with `href: null`; `expo-router/…/useVisibleTabsWithRedirect.js:43,76-84` redirects a focused hidden route to the first visible tab. Callers: `index.tsx:169-173,178-179`, `more.tsx:15-18`, `events.tsx:82`, `library-catalog.tsx:109`, `index.tsx:128` (`UpcomingCard` route). Root `app/ai.tsx` is unaffected. | Move the six screens into a member Stack outside Tabs; put the five tabs in `app/(member)/(tabs)/` (use `git mv`). Add a static test that every router target resolves to a Stack route or a visible tab. Spec F1. | M | none; blocks MM-03, 04, 07, 08, 11, 14, 37 |
| MM-02 | P1 | Security / API | Member list and detail pass `publishedOnly = false`: `apps/api/src/events/events.controller.ts:85-89,106-111`, `events.service.ts:93` (signature), `:117` (detail). Client filter only: `components/events/model.ts:57-61`. Any member can read a draft's title, description and location by ID; the RSVP route alone checks publication. | Enforce `publishedOnly` for member callers on list and detail; add an API test (draft hidden from member, visible to staff). No live call was made. | S | API lane J |
| MM-03 | P1 | IA / navigation | Concept has five member tabs Home, Church, Events, Library, Profile (`member.png`). App tabs are Home, Church, Library, Profile, More (`_layout.tsx:16-20`); Events is hidden. | Make Events a visible tab (the Services/Matukio segmented control already exists in `events.tsx`). Decide whether More stays as a secondary hub. | S | MM-01 |
| MM-04 | P1 | Events / performance | `events.tsx:30-34` calls `/events` with no `from`, `status` or `limit`; `events.service.ts:97-99` defaults to 200 rows with no `orderBy`. Services use `/attendance/sessions` (`events.tsx:33`) with no date window. The list is a `ScrollView` (`events.tsx:85`). | Request `from=today&status=published&limit=50`; add `orderBy startsAt` on the server; use a `FlatList`. | M | MM-01, MM-02 |
| MM-05 | P1 | Profile / media (issue 2) | Picture is a free-text "Picture URL" field (`profile.tsx:102`; state `:21,33,67`). The avatar shows initials only; `picture` is never rendered (`profile.tsx:83-89`). Upload is staff-only: `POST /api/files/upload` requires `manage:files` (`file-upload.controller.ts:56`), which the member grants do not include (`packages/config/src/permissions.ts:189-198`). `PATCH /users/me` accepts any string (`users.controller.ts:121`, `users.service.ts:100`). | Spec F3: member avatar endpoint and camera or gallery picker. | L | F3 decisions; API lane J |
| MM-06 | P2 | Auth / data | Google sign-in overwrites the stored picture on every login (`apps/api/src/auth/auth.service.ts:494-497,522-527`). A member-set photo would be replaced. | Define precedence (member-set wins) before F3 ships. | S | F3 |
| MM-07 | P1 | Church switching (issue 3) | The only switch is at the bottom of Profile (`profile.tsx:127` renders `SpacesSection`; `spaces-section.tsx:24-27,69-79`), using React Native's unstyled `Button` (`spaces-section.tsx:2,76`). Home's church chip is not interactive (`components/home/home-hero.tsx:15-19`); the concept's branch selector (`member.png`) is absent. No join or invite route exists in `apps/api/src`. | Spec F4: tappable church pill on Home opening a switcher sheet from `GET /auth/memberships`. Join stays gated on a policy decision. | M | R-UX-01, R-MOB-03 (existing); join policy |
| MM-08 | P1 | Announcements (issue 4) | Card shows a two-line excerpt with no tap target (`components/home/home-cards.tsx:32-39`). The API already returns full `subject` and `body` (`apps/api/src/communications/communications.service.ts:211-224`). | Spec F5: list and detail screens. | S | MM-01, F5 |
| MM-09 | P1 | Announcements / privacy | `listPublishedAnnouncements` returns every completed campaign for the church, with no audience or channel filter (`communications.service.ts:211-224`), though campaigns carry `audienceFilters` (`packages/db/tables/communications.ts:71`). A campaign aimed at a subset may appear to every member. Semantics not verified. | Apply the audience rule server-side before adding detail screens. Confirm the intended rule with the content owner. | S-M | decision D2; R-CNT-01 (existing) |
| MM-10 | P2 | Announcements / performance | Home loads all announcements with full bodies on every context change, with no limit or cursor (`index.tsx:76-80`; `communications.service.ts:211-224`). | Add `limit` and `cursor`; show the latest three on Home with "See all". | S | MM-09 |
| MM-11 | P1 | Prayer (issue 11) | `prayer.tsx` only posts (`:21`). `GET /prayer-requests/me` exists (`apps/api/src/prayer/prayer.controller.ts:59-65`, permission `read:own-prayer-requests`). | Spec F6: "My requests" list with status. | S | MM-01 |
| MM-12 | P1 | Prayer / privacy | No visibility choice. Copy says requests "follow the church's existing privacy rules" (`prayer.tsx:29`; key `mobile.member.prayer.privacy`). `prayer_requests` has no visibility column (`packages/db/tables/prayerRequests.ts:13-36`). The screen spec requires an explicit choice. | Decision D1 (PLAT-DEC-02), then a schema change through the migration owner. Until then, the copy must state who can see the request. | M | D1; schema lane K |
| MM-13 | P2 | Prayer / validation | No length limit: `prayer.tsx:31` has no `maxLength`; the controller checks only non-empty (`prayer.controller.ts:28-53`). | Add a limit (suggest 1000 characters) in the DTO and the form with a counter. | S | none |
| MM-14 | P1 | Inbox (issue 10) | Titles come from two template keys only (`components/events/model.ts:94-103`: `events.created`, `library.document_published`). Everything else shows the generic "Notification" label. `target` is returned but never followed (`inbox.tsx:14` comment; `lib/library-api.ts:51`). No notification bell in the top bar; the concept shows AI and a bell (`member.png`, `staff.png`); the member header has AI only (`_layout.tsx:15`). | Spec F7: template registry in EN and SW, `target` to route, header bell with unread count. | M | R-NOT-01 (existing), MM-01 |
| MM-15 | P1 | Service times (issue 9) | `serviceSessions` has `sessionDate` and `title` and no time (`packages/db/tables/attendance.ts:44-51`). Times are scraped from names (`components/events/format.ts:76-83`, used by `model.ts:85`). Church shows weekday only (`church.tsx:30-41,126-135`). | Spec F8: structured time fields on service types (schema lane). | M | D5; schema lane K |
| MM-16 | P2 | Church content (issue 7) | The placeholder is filtered by exact string match only (`church.tsx:17,102`). The stored text is dev-database content, not in repo seeds (not inspected). Other placeholder text would show; a real About text is hidden only if it is identical to the placeholder. | Clean the data and remove the client filter after verification. | S | church data verification |
| MM-17 | P2 | Church actions | Concept actions Call, Directions, Leadership and About (`member.png`) are missing. The data exists: `packages/db/tables/churches.ts:13-17` (`phone`, `email`, `location`); `GET /churches/:id` returns the row (`apps/api/src/churches/churches.service.ts:90-95`). | Spec F8: Call and Directions rows. Confirm which contact fields are public. | S | privacy confirmation |
| MM-18 | P2 | Giving (issue 12) | No giving screen. `GET /offerings/me` (`apps/api/src/offerings/offerings.controller.ts:105-112`, permission `read:own-giving-history`) and `GET /giving-goals/public` (`giving-goals.controller.ts:83`) exist. Online payment is deferred (DEC-07). | Read-only history and goals after F1. No payment UI. | M | MM-01; DEC-07 respected |
| MM-19 | P2 | Family, ministries, directory (issue 12) | `GET /families/me` exists (`families.controller.ts:32`). No member ministries route (the departments controller has no self route). A directory needs a new policy: `read:member` is "Own profile only" (`permissions.ts:189-191`). | Family first. Ministries and directory are gated by DEC-02. | M to L | D6 |
| MM-20 | P1 | Offline / resilience | `lib/api.ts:153-163` sends `fetch` with no timeout. Home blocks on three parallel calls (`index.tsx:76-89,153`), so one stalled request keeps the spinner indefinitely. No last-good content and no offline banner; `LoadingState` is text only (`components/screen-state.tsx:6`). | Spec F10: 15-second timeout, single GET retry, last-good cache per context, offline banner. | M | R-MOB-01 (partly done, see MM-42) |
| MM-21 | P2 | Performance / requests | Duplicate and unused loads: `/users/me` at startup (`lib/session.tsx:60`) and again in Profile (`profile.tsx:38`); `/members/me` is used only as a name fallback (`index.tsx:76`); `/attendance/sessions` is fetched by Home (`index.tsx:101`), Events (`events.tsx:33`) and Church (`church.tsx:89`). | Shared query cache keyed by `contextKey`. | M | MM-20 |
| MM-22 | P2 | Performance / language switch | Home's load effect lists `t` as a dependency (`index.tsx:93`), so a language change re-runs all Home requests. Locale loads asynchronously (`lib/locale.tsx:20-24`), so the first paint can flash English. | Remove `t` from fetch dependencies; translate at render time only. | S | none |
| MM-23 | P1 | i18n / errors | 18 call sites across 11 files show raw server text, which is English (for example `prayer.tsx:23`, `profile.tsx:41`, `library.tsx:68`, `inbox.tsx:37`, `spaces-section.tsx:29,43`, `sign-in.tsx:26`). Server example: `prayer.controller.ts:41-43`. | Return a stable error `code` from the API; map codes to catalogue keys; show server text only in logs. Spec F10. | M | API error-code contract (lane J) |
| MM-24 | P2 | i18n / copy governance | 13 inline bilingual `copy()` call sites bypass the catalogue and review: `events.tsx:72,81,88`, `events/[id].tsx:75,84`, `model.ts:86,97,100`, `format.ts:90-95`. Unused catalogue keys: `mobile.member.home.intro`, `home.servicesHeading`, `profile.edit`, `events.detail.startsLabel`, `events.detail.locationLabel` (`packages/config/src/i18n/messages/mobile-member.ts`). | Move every string into the catalogue; delete unused keys; add a grep test. | S | lane I |
| MM-25 | P2 | i18n / time format | AM and PM are hard-coded in both languages (`format.ts:56-62,77-83`). Swahili users see "9:00 AM". Whether Hermes ships `sw-TZ` date names is unverified (`format.ts:6,40`). | Use Swahili day-period words (asubuhi, mchana, jioni); verify `Intl` on a device. | S | device check |
| MM-26 | P2 | i18n / scripture | Swahili verse text is the English text, marked "until a verified Swahili wording is supplied" (`mobile-member.ts`, `mobile.member.home.verseText.*` in the `sw` block). | Obtain verified Swahili scripture from the church; until then, flag it in the UI copy review. | S | owner (Fredy) |
| MM-27 | P2 | Accessibility / touch | "See all" has no minimum size (`components/ui/section-header.tsx:4`); the AI header button has `minHeight: 40` (`components/ai/ai-header-button.tsx:19`). The design target is 44 px (`DESIGN.md`). | `minHeight: 44` and `hitSlop` on both. | S | lane K (ui owner) |
| MM-28 | P2 | Accessibility / dynamic type | Tab bar height is fixed at `56 + insets.bottom` (`_layout.tsx:15`). The Home chip is one line (`home-hero.tsx:17`); titles clip at two lines (`home-cards.tsx:21-36`). No test at large font scale. | Test at 200% scale; let the tab bar grow; drop line limits on essential labels. | M | R-QA-02 (existing) |
| MM-29 | P2 | Accessibility / state | Inbox unread state sits on an inner `View` (`inbox.tsx:114`), so the pressable card does not announce it. `LibraryMediaRow` labels only the title (`components/library-media.tsx:47`), dropping the type and availability pills. | Put state in the pressable's `accessibilityLabel`. | S | lane F |
| MM-30 | P3 | Accessibility / headings | Section titles have no header role (`components/ui/section-header.tsx:4`); only some screens set `accessibilityRole="header"`. | Add the header role to `SectionHeader`. | S | lane K |
| MM-31 | P2 | Sign-in (R-AUTH-01) | No password visibility toggle (`app/(auth)/sign-in.tsx:37`); no register or recovery entry; brand name hard-coded in English (`sign-in.tsx:34`). | Toggle now; recovery per R-AUTH-01. | S | R-AUTH-01 |
| MM-32 | P2 | Token storage | Tokens sit in SecureStore (`lib/storage.ts:15-49`); no `console` output in the member code; single-flight refresh and rotation (`lib/api.ts:143-151`). Default keychain accessibility is used (`storage.ts:41-42`), so items can move with a device backup. | Set `keychainAccessible: WHEN_UNLOCKED_THIS_DEVICE_ONLY` after checking background refresh needs; test restore on device. | S | device test |
| MM-33 | P3 | Links | Server-provided URLs are opened without a scheme check (`library.tsx:82`, `library-detail.tsx:52`). | Accept only `https:`. | S | lane H |
| MM-34 | P2 | Profile / email | Email is editable and is the login identifier (`profile.tsx:101,64-67`), with no verification step. | Decide whether email changes need verification or are read-only. | S | D4 |
| MM-35 | P2 | Home errors | A failed `/members/me` or announcements call turns all of Home into one error (`index.tsx:84-88,153-154`), while services fail separately. Partial failure handling is inconsistent. | Per-section states, as the services card already does. | S | MM-20 |
| MM-36 | P3 | Events / data | Event detail downloads the whole `/events/me` list to find one RSVP (`events/[id].tsx:34-39`). | Read the RSVP with the event, or add a per-event endpoint. | S | lane J |
| MM-37 | P1 | Library (R-LIB-01 existing) | Two library sources. The Library tab lists `/api/files/library` with snake_case fields (`library.tsx:12-20,63`). The catalogue uses `/library/resources` (`lib/library-api.ts:65-74`, `library-catalog.tsx`), reached only from unreachable Home and More links. | Spec F9: one contract (the catalogue) for the Library tab, with server-side search. | M | R-LIB-01, R-CNT-01 |
| MM-38 | P2 | Library on dev (issue 6) | Items cannot be opened on dev. Dev environment expects S3 keys (`apps/api/.env.example:37-41`, values not inspected). The failure shows as a generic open error (`library.tsx:84-86`, `library-detail.tsx:52-55`). Not reproduced; no live call made. | Fix dev storage credentials; show "temporarily unavailable" separately from "not found". | S | dev infrastructure owner |
| MM-39 | P3 | Dev overlay (issue 8) | The Expo Go dev overlay is not in the repo. The AI button is top-right in the header (`ai-header-button.tsx`). Not reproduced. | Check on a dev build; ignore for release. | S | none |
| MM-40 | P3 | Visual concept | No photography or hero imagery. The concept's church photos (`member.png`) are absent, which fits `DESIGN.md` ("consented photography only"). | Keep absent until the church approves assets. | M | church assets |
| MM-41 | P3 | Dead code / hygiene | `components/ui/quick-action.tsx` and `hero-banner.tsx` are exported but unused by any screen; `publicChurchesApi` (`lib/library-api.ts:76-79`) is unused. `apps/mobile/.expo/` shows as untracked (`git status`). | Delete unused parts; ignore `.expo/`. | S | lane K |
| MM-42 | P2 | Docs drift | `specs/mobile-api-inventory.md` §2 and §5 say the membership list and library detail, read and progress are missing; code has them (`auth.controller.ts:254`, `library.controller.ts:43-106`). The register says R-MOB-01, R-MOB-03 and R-MOB-04 are "not started", but code has the restore and refresh rules (`lib/restore.ts:16-33`, `lib/api.ts:191-201`), the Church retry reset (`church.tsx:64-66`), and staff return to member (`app/(staff)/more.tsx:28`). No test covers a screen or navigation. | Refresh the register and inventory before dispatch. Count R-MOB items as partly done. | S | docs owner |
| MM-43 | P2 | Home tiles vs concept | Concept tiles are Somo la Leo, Omba Pamoja, Vikundi, Toa Sadaka (`member.png`). App tiles are Prayer, Library, Inbox, Events, plus a conditional staff tile (`index.tsx:169-173`). "Send a prayer request" wraps in a narrow tile. | Adopt concept labels after MM-01; Give and Groups depend on MM-18 and MM-19. | S | MM-01 |

## 3. Proposed feature specs

Each spec gives the goal, story, scope, files, API needs, acceptance criteria (testable), test plan and risks. File paths are repo-relative. "Lane" letters match section 4.

### F1. Navigation shell (MM-01, MM-03, MM-43)
- **Goal:** every member destination is reachable from a visible control, with the five concept tabs.
- **User story:** as a member, I tap Events, See all, Prayer or Inbox and the right screen opens; Back returns me to where I was.
- **Scope in:** Stack around the tabs; move `events`, `events/[id]`, `prayer`, `inbox`, `library-catalog`, `library-detail` into the Stack; visible Events tab; More decided (D7). **Out:** staff shell, web, visual redesign.
- **Files (Lane A):** `app/(member)/_layout.tsx` (becomes a Stack); new `app/(member)/(tabs)/_layout.tsx` with the current `Tabs` options; `git mv` of `index.tsx`, `church.tsx`, `library.tsx`, `profile.tsx`, `more.tsx` into `(tabs)/`; `components/home/home-action.tsx` (labels only, Lane D).
- **API:** none.
- **Acceptance:** (a) every `router.push` or `Link` target in `app/(member)` resolves to a Stack route or a visible tab; (b) Home "See all" opens Events with the Events tab focused, and Back returns to Home; (c) the tab bar shows exactly five labelled items in English and Swahili; (d) `SessionGate` still routes member and staff correctly.
- **Test plan:** static Node test under `apps/mobile/tests/` scanning push targets against declared routes; device run on iOS and Android for five paths (Home tile, See all, More row, Events row, Back).
- **Risks:** route paths change, so old deep links need a redirect; the `(tabs)` group name must not break the `(member)` check in `SessionGate` (`lib/session.tsx:166-171`); expo-router upgrades may change redirect rules, so re-run the static test on each upgrade.

### F2. Events and services (MM-02, MM-03, MM-04, MM-36)
- **Goal:** members see upcoming services and published events and can RSVP.
- **User story:** as a member, I see the next services and events for my church with time and place, and I mark going, maybe or can't go.
- **Scope in:** Services and Events segmented tab (exists); detail and RSVP (exists); bounded, ordered, published-only list; RSVP read with the detail. **Out:** capacity, registration forms, staff RSVP rosters, attendance check-in.
- **Files (Lane C):** `app/(member)/events.tsx`, `events/[id].tsx`, `components/events/*` except `describeNotification` (moved in F7); API `apps/api/src/events/events.service.ts`, `events.controller.ts` (Lane J).
- **API:** `GET /events?from&status=published&limit&offset` (exists, `events.controller.ts:85-89`); server-side `publishedOnly` for members (MM-02); `orderBy startsAt` (MM-04); `PUT /events/:id/rsvp` (exists, `:176-195`).
- **Acceptance:** a draft event is absent from the member list and returns 404 from the detail, and is present for staff; the list is ascending and at most 50 rows; an RSVP shows saved state and persists after reload; a failed RSVP keeps the chosen status for retry; Swahili shows Swahili day names and day-period words.
- **Test plan:** API test near `events.service` for draft visibility by role; mobile unit tests for `upcomingEvents` and `serviceSchedule`; device RSVP round trip with a test member.
- **Risks:** members can receive draft events today (MM-02), so the list will shrink after the fix; say so in release notes. The time zone is fixed at UTC+3, which is correct for Tanzania.

### F3. Profile photo (MM-05, MM-06, MM-34)
- **Goal:** a member sets a profile photo from the camera or gallery and sees it wherever the avatar appears.
- **User story:** as a member, I tap my photo, choose camera or gallery, crop, and save; I see it after relaunch.
- **Scope in:** `expo-image-picker`; client resize to 1024 px JPEG; upload; avatar with initials fallback; removal of the URL field. **Out:** staff avatars, moderation tooling beyond type and size checks, public avatar gallery.
- **Files (Lane E):** `app/(member)/profile.tsx`; new `components/profile/avatar.tsx`; `apps/mobile/package.json` (dependency, Lane B); API `apps/api/src/users/*` (Lane J).
- **API:** new `POST /users/me/avatar` (multipart; JPEG or PNG; 2 MB limit after client resize; returns `{ picture }`), permitted by `update:self` rather than `manage:files`; Google sign-in must not replace a member-set picture (MM-06).
- **Acceptance:** upload from camera and gallery works on Android and iOS; over 2 MB is rejected with a translated message; the photo survives relaunch; initials show with no photo or on load error; a Google login keeps the member's photo; the URL field is gone.
- **Test plan:** API tests for type, size, own-user only, and rejection of another user's ID; mobile tests for picker cancel and offline failure keeping the old photo; device run.
- **Risks:** storage cost and retention; strip EXIF location; avatar visibility to other members is a policy choice (D4).

### F4. Church switcher and join (MM-07; R-UX-01, R-MOB-03)
- **Goal:** a member with several memberships switches church in one tap from Home and always knows the active church.
- **User story:** as a member in two churches, I tap the church pill on Home, choose a church, confirm, and Home reloads for it.
- **Scope in:** tappable pill; sheet listing `GET /auth/memberships`; confirmation; single-membership users see the name without a switch control. **Out:** join or invite (gated on D3); public branch browsing (R-PUB-01).
- **Files (Lane D):** `components/home/home-hero.tsx`; new `components/church-switcher-sheet.tsx`; `components/spaces-section.tsx` (keep on Profile, use the new sheet); `lib/session.tsx` (Lane B, read only).
- **API:** `GET /auth/memberships` (exists, `auth.controller.ts:254`); `POST /auth/switch-church` (exists, `:208-224`).
- **Acceptance:** the pill shows the active church; switching A to B shows no A rows during B loading (R-MOB-02); a failed switch keeps A active with a translated error; the sheet traps focus and rows are at least 44 px.
- **Test plan:** extend `tests/api-session.test.ts` for failed-switch restore; device run with a two-membership test account.
- **Risks:** a member who is staff in one church and member in another changes space on switch; keep the existing `contextKey` behaviour.

### F5. Announcements list and detail (MM-08, MM-09, MM-10)
- **Goal:** members read full announcements, and only those meant for them.
- **User story:** as a member, I tap an announcement on Home, read the full text and date, and can open the full list.
- **Scope in:** Home shows the latest three; list with cursor paging; detail with subject, body and sent date. **Out:** push notifications, composing.
- **Files (Lane D):** `components/home/home-cards.tsx`; new `app/(member)/announcements.tsx` and `announcements/[id].tsx` (Stack, after F1); API `apps/api/src/communications/communications.controller.ts:103-109` and `communications.service.ts:211-224` (Lane J).
- **API:** `GET /communications/announcements?limit&cursor` (new params); audience rule (D2). Reuse the list payload for detail if body size is acceptable; otherwise add `GET /communications/announcements/:id`.
- **Acceptance:** tapping opens the full body; body HTML is shown as plain text (the existing `plainText` in `index.tsx:30-33` must also handle entity-encoded markup); lists page 20 at a time; a campaign outside the audience rule is absent.
- **Test plan:** API tests for paging and audience; mobile tests for long bodies and empty state.
- **Risks:** announcement bodies may contain markup; the audience rule is undecided.

### F6. Prayer requests (MM-11, MM-12, MM-13)
- **Goal:** a member sends a prayer request with a clear visibility choice and sees their own requests and status.
- **User story:** as a member, I write a request, choose who can see it, submit, and later see it listed with its status.
- **Scope in:** "My requests" list; 1000-character limit with counter; visibility choice after D1; translated status labels. **Out:** staff prayer board, pastoral follow-up, response notifications.
- **Files (Lane F):** `app/(member)/prayer.tsx`; new `components/prayer/my-requests.tsx`; API `apps/api/src/prayer/prayer.controller.ts` and DTO (Lane J); schema `packages/db/tables/prayerRequests.ts` (Lane K).
- **API:** `GET /prayer-requests/me` (exists, `:59-65`); `POST /prayer-requests` with DTO length limit; visibility column via the schema lane (`pnpm db:generate`, no hand-written SQL).
- **Acceptance:** a submitted request appears in "My requests" with "Open" after refresh; empty and over-limit content is rejected on client and server with translated text; visibility is saved and returned; the privacy line describes the real rule.
- **Test plan:** API tests for length limit and own-only listing (another user's request is absent); mobile tests for empty, error, retry and double-submit guard.
- **Risks:** the privacy rule is undecided (PLAT-DEC-02); keep the copy neutral until D1 is settled; keep request text out of logs.

### F7. Inbox and notification bell (MM-14; R-NOT-01)
- **Goal:** every inbox item has a clear title and opens what it is about; the header shows unread count.
- **User story:** as a member, I see "New event: Youth night", tap it to open the event, and see a bell with an unread count in the top bar.
- **Scope in:** template registry for every template key in use (EN and SW); `target` to route; header bell; mark-all. **Out:** push notifications and sending (DEC-05).
- **Files (Lane F):** new `components/notifications/describe.ts` (moved out of `components/events/model.ts`); `app/(member)/inbox.tsx`; bell in `app/(member)/(tabs)/_layout.tsx` (Lane A); keys (Lane I).
- **API:** `GET /notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all` (all exist); document the `target` shape for each template key (table `inboxNotifications`).
- **Acceptance:** every template key in use has an EN and SW title; an unknown key falls back to a neutral title and the subject; a tap on an item with a target opens that entity or says it is no longer available; the bell badge equals `unreadCount` and updates after mark-read.
- **Test plan:** unit test per template key; API test for target shape; device test of deep links.
- **Risks:** previews may expose private content; screen spec says do not expose details by default.

### F8. Church information and service times (MM-15, MM-16, MM-17)
- **Goal:** members see when and where services are and can call or get directions.
- **User story:** as a member, I see Sunday services with times, and I tap Call or Directions.
- **Scope in:** structured service time fields; times shown on Church and Home; Call and Directions rows; About only when real. **Out:** map embed, website sync.
- **Files:** `packages/db/tables/attendance.ts` (Lane K); `apps/api/src/attendance/*` (Lane J); `app/(member)/church.tsx` (Lane G); `components/events/format.ts` (Lane C, formatting only).
- **API:** `GET /churches/:id` (exists; confirm projection of `phone`, `email`, `location`); `GET /attendance/service-types` (member has `view:attendance`); new time field on service types.
- **Acceptance:** each service shows weekday and time from structured data, never from names; Call opens the dialer only for a valid phone; Directions opens the platform maps app with `location`; placeholder text never appears.
- **Test plan:** API tests for time validation; mobile formatting tests in EN and SW; device check of `tel:` and map links.
- **Risks:** per-session overrides; phone visibility policy; fixed UTC+3.

### F9. Library: one source, search and access (MM-37, MM-38, MM-33; R-LIB-01, R-CNT-01)
- **Goal:** one library list with server-side search, and dependable open.
- **User story:** as a member, I search the library by title or author and open a sermon or document in my browser.
- **Scope in:** Library tab moves to the catalogue; search and cursor paging; `https`-only open; separate "unavailable" and "temporarily unavailable" errors. **Out:** offline downloads, purchases (DEC-07), in-app reader (DEC-15 browser).
- **Files (Lane H):** `app/(member)/library.tsx`, `library-catalog.tsx`, `library-detail.tsx`, `lib/library-api.ts`, `components/library-media.tsx`; API `apps/api/src/library/library.controller.ts` (Lane J).
- **API:** `GET /library/resources?query&cursor` (exists); `POST /library/resources/:id/access` (exists); progress (exists). Decide whether `/api/files/library` stays for staff only.
- **Acceptance:** search matches title, author and description; open launches the browser with the signed URL; an expired URL offers retry; a non-https URL is refused; dev with placeholder keys shows "temporarily unavailable" rather than a generic failure.
- **Test plan:** API test for signed URL expiry; unit tests for `libraryApi`; device open on both platforms.
- **Risks:** dev storage credentials (owner); network-shared catalogue rule (R-LIB-01 decision).

### F10. Reliability, i18n and accessibility pass (MM-20 to MM-29, MM-32)
- **Goal:** intermittent networks and Swahili-first users get usable screens with no English leaks.
- **User story:** as a member on a slow phone, I see my last loaded content with a clear offline note and a retry, and every message is in Swahili when I chose Swahili.
- **Scope in:** 15-second timeout with one GET retry; query cache keyed by `contextKey` with stale-while-revalidate; no refetch on language change; error-code mapping; inline copy moved to catalogue; Swahili day-period words; 44 px targets; 200% font layout; keychain accessibility; inbox and library row labels. **Out:** visual redesign.
- **Files (Lane B for transport):** `lib/api.ts`, `lib/session.tsx`, `lib/storage.ts`, new `lib/query-cache.ts`; `components/screen-state.tsx`; catalogue `packages/config/src/i18n/messages/mobile-member.ts` (Lane I only).
- **API:** stable error `code` on error responses (lane J); nothing else.
- **Acceptance:** a stalled GET shows retry after 15 seconds, not a spinner; in airplane mode Home shows the last loaded content and a banner; switching language makes no network call (counted in a test); no raw server text in the mapped error paths; touch targets at least 44 px; no clipped tab labels at 200% scale.
- **Test plan:** unit tests for timeout and cache; a grep test that forbids inline `copy(` in member files; i18n parity; device checks per R-QA-02 with a fluent Swahili reviewer.
- **Risks:** cache must clear on sign-out and church switch; a storage key change can break restore after upgrade, so migrate keys.

## 4. Parallel work lanes and file ownership

Rule: one writer per file. A lane that needs another lane's file sends a request instead of editing it. Start order: Lane A, Lane J (events visibility, MM-02) and Lane I (new keys) first; then B to H in parallel; then Q.

| Lane | Exclusive files | Specs | Starts |
|---|---|---|---|
| A Shell | `app/_layout.tsx`, `app/(member)/_layout.tsx`, `app/(member)/(tabs)/**` (moves), `components/ai/*` | F1, F7 bell | first; blocks D, E, F, G, H |
| B Transport and session | `lib/api.ts`, `lib/session.tsx`, `lib/restore.ts`, `lib/storage.ts`, new `lib/query-cache.ts`, `tests/api-session.test.ts`, `tests/restore.test.ts`, `apps/mobile/package.json` | F10 transport, F3 dependency | with A; before F10 UI |
| C Events | `app/(member)/events.tsx`, `events/[id].tsx`, `components/events/{format,model,event-card,service-row,segmented-control,date-block}.ts(x)`, new `tests/events*.test.ts` | F2, F8 formatting | after A |
| D Home and announcements | `app/(member)/index.tsx`, `components/home/*`, `components/spaces-section.tsx`, new `components/church-switcher-sheet.tsx`, new `app/(member)/announcements*.tsx` | F4, F5, F1 tile labels | after A |
| E Profile | `app/(member)/profile.tsx`, new `components/profile/*` | F3 | after A; API part in J |
| F Prayer and inbox | `app/(member)/prayer.tsx`, `inbox.tsx`, new `components/prayer/*`, new `components/notifications/describe.ts` | F6, F7 | after A |
| G Church | `app/(member)/church.tsx`, new `components/church/*` | F8 UI | after A and C |
| H Library | `app/(member)/library.tsx`, `library-catalog.tsx`, `library-detail.tsx`, `lib/library-api.ts`, `components/library-media.tsx` | F9 | after A |
| I Catalogue | `packages/config/src/i18n/**` (single writer) | all keys | rolling; merge first in each batch |
| J API and contracts | `apps/api/src/{events,communications,prayer,users,attendance,library,churches}/**` (not schema) | F2, F3, F5, F6, F8, F9 | independent of mobile; start with MM-02 |
| K Schema | `packages/db/tables/**` and generated `packages/db` migrations (generated only via `pnpm db:generate`); dev apply only within DEC-12 authority | F6 visibility, F8 times | after D1 and D5 |
| Q QA | new tests under `apps/mobile/tests/`, device evidence log (R-QA-02) | all | after each lane merges |

Shared components: `components/ui/*` and `theme/` are owned by Lane K (design shell) and changed only through a request. `lib/session.tsx` is owned by Lane B alone.

## 5. Open decisions and verification gaps

- **D1** Prayer visibility rule (PLAT-DEC-02). Blocks F6 visibility and the privacy copy (MM-12).
- **D2** Announcement audience and channel rule for members (MM-09).
- **D3** Join or invite policy for a second church: self-service, invite code or staff approval (MM-07).
- **D4** Avatar visibility, storage and email-change verification (MM-05, MM-34).
- **D5** Structured service time fields and who maintains them (MM-15).
- **D6** Whether members may see a directory or ministries (MM-19; DEC-02).
- **D7** More hub kept or removed after the tab change (MM-03).
- **Not verified:** on-device behaviour (MM-01 bounce, MM-25 `Intl`, MM-28 font scale, MM-32 keychain); dev-only items (MM-38, MM-39); Swahili wording by a fluent reviewer (MM-24 to MM-26); contrast is computed from theme values, not from rendered screenshots. Mobile tests do not cover screens or navigation.
