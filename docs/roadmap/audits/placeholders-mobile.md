# Mobile app placeholder audit

Date: 2026-11-27
Scope: `apps/mobile/app`, `apps/mobile/components`, `apps/mobile/lib` (tests and `*.test.ts` excluded).
Checked against: `apps/api/src` controllers and services, `packages/config/src/i18n/messages`, `packages/config/src/types/ai-components.ts`, `packages/db`.

Working tree at audit time: branch `design/mito-ya-baraka-concepts` (not `main`). Uncommitted edits exist in `app/(member)/(tabs)/index.tsx`, `app/(member)/_layout.tsx`, `app/(staff)/(tabs)/index.tsx`, `components/home/home-cards.tsx`. New untracked files include `app/(member)/announcements*`, `app/(staff)/verses.tsx`, `components/announcements/`, `components/rich-text/`, `components/verses/`. Findings on those files describe the working tree as audited and may change when it is committed.

Impact scale: **high** = a member or staff user acts on data or a feature that looks complete or working and is not. **medium** = a feature or data set is hidden, unreachable, or looks complete when it is not. **low** = dead, hidden, or minor path.

## 1. Placeholder table (sorted by impact)

| ID | File:line | Screen | What is placeholder | Real backing | Impact | Effort | Owner lane |
|---|---|---|---|---|---|---|---|
| PH-MOB-01 | `app/(staff)/(tabs)/people.tsx:15`; `app/(staff)/attendance.tsx:61` | Staff People tab; Staff check-in | Directory and batch check-in list look complete, but the request is capped. `people` calls `/members` with no paging UI. `attendance` asks for `limit=200`. The API clamps every member list to 100 (`members/members-list.ts:4,86`), so members 101+ never appear. | `GET /members` with `limit` and `offset` (`members/members.controller.ts:47`). The mobile client does not page. | medium | S | staff people / attendance |
| PH-MOB-02 | `components/church-switcher/church-switcher.tsx:40,124`; `app/join.tsx:19` | Join church by code (`/join`) | The join screen is complete, but nothing renders `ChurchSwitcher`, so the only push to `/join` is dead code. A member cannot reach join-by-code from the app. | `POST /churches/join` (`invitations/invitations.controller.ts:62`), `GET /auth/memberships` | medium | S | mobile member / onboarding |
| PH-MOB-03 | `app/(member)/inbox.tsx:14` (comment), `:56-66` (`markRead`), `:104,:113` (row `onPress`) | Inbox | Each row is a tappable card. Tapping only marks it read and never opens the notification's target. The code comment says "Targets are not followed yet". | Notifications return `target` (`targetType`, `targetParams`) (`notifications/notifications.service.ts:11-12,27-28,94`). `NotificationItem.target` is typed in `lib/library-api.ts:51`. | medium | M | mobile member / notifications |
| PH-MOB-04 | `app/(auth)/sign-in.tsx:34` | Sign-in title | Hard-coded church name `"Mito Ya Baraka Church"` (not translated, not from data). It shows as the app's identity for any church using the app. Capitalisation also differs from the dev seed name `"Mito ya Baraka Church"` (`packages/db/demo.ts:47`). | NONE in mobile. The name could come from build config or the public church endpoint (`public/public-church.controller.ts`). | medium | S | mobile shell / branding |
| PH-MOB-05 | `components/events/model.ts:74-89` (`"Every {day}"`), used at `app/(member)/events.tsx:67-73`; `app/(member)/(tabs)/church.tsx:30-41` (`summariseServices`) | Member Events → Services; Member Church → service times | A recurring schedule is asserted from one data point: the weekday of the next session. The label says "Every Sunday" even if sessions fall on other days. | NONE for recurrence. `service_types` has no schedule field (`packages/db/tables/attendance.ts:27-33`). Sessions have only a date. | medium | M | attendance (API) / mobile member |
| PH-MOB-06 | `app/(member)/(tabs)/church.tsx:17` (`PLACEHOLDER_DESCRIPTION = "Demo church data"`), `:102` | Member Church tab (About card) | Seed placeholder text used as a filter. It is hidden on mobile, so no user sees it here. The constant's existence implies live church rows hold demo text. Not verified against the live DB or the web portal. | `churches.description` (`packages/db/tables/churches.ts:18`) | low | S | data/ops (check live rows) + mobile |
| PH-MOB-07 | `app/(member)/announcements.tsx` (whole file); missing link at `app/(member)/(tabs)/index.tsx:180` | Member announcements list | Screen is reached from nowhere. The Home "Announcements" header has no "See all" action, and nothing else links to the list. Home already shows every announcement, so the list is redundant but unreachable. | `GET /announcements` (`announcements/announcements.controller.ts:35`) | low | S | mobile member |
| PH-MOB-08 | `app/(member)/library-catalog.tsx:61-68`, chips `:91-94` | Resources catalogue | Category chips look like a catalogue-wide filter. They filter only the pages already loaded. A category can show "no matches" while matching items sit on later pages. The code comments this. | Partial: `resourceType` filter exists (`library/library.controller.ts:25`, `lib/library-api.ts:66`). No category filter. | low | S (hide chips until loaded) / M (server filter) | library |
| PH-MOB-09 | `app/(member)/(tabs)/library.tsx:63` (`/api/files/library`) vs `app/(member)/library-catalog.tsx` via `lib/library-api.ts:67` (`/library/resources`) | Library tab vs Resources screen | Two "library" surfaces read two different backends. They may show different content, and both appear in the app (tab and More). Not confirmed as a bug; parity is unverified. | Both exist: `file-upload/file-upload.controller.ts:441` and `library/library.controller.ts:25` | low | M | library |
| PH-MOB-10 | `components/ai/ai-response.tsx:62-78` (disabled `form` and `confirm_action`, `onPress={() => undefined}`), copy `final.ai.notAvailable` (`packages/config/src/i18n/messages/final-sweep.ts:338`) | AI assistant answers | Form and confirm buttons are permanently disabled with "This action is not available yet". Not reachable today: the server drops every `form` and `confirm_action` because the action registry is empty (`packages/config/src/types/ai-components.ts:200`, `apps/api/src/ai/ai.service.ts:318-331`). | NONE. No AI action endpoint exists; `ai/ai.controller.ts` exposes only `chat` and `feedback`. | low | L (build write actions) | AI |
| PH-MOB-11 | `components/ai/ai-response.tsx:12` (`APP_ROUTES` includes `/people`, `/services`, `/content`) | AI list items and link buttons | Members can be sent to staff-only screens. They see a permission-denied state. Not a fake feature, only a misleading link. | Staff endpoints return 403 to members (`StaffReadScreen` handles it) | low | S | AI |

Count: high 0, medium 5 (PH-MOB-01 to 05), low 6 (PH-MOB-06 to 11).

Also checked, no placeholder found: no "coming soon" copy in the app; no `onPress` that only logs or shows a toast (the only no-op handlers are the two disabled AI buttons in PH-MOB-10); `useToast` has no callers; verse-of-the-day, events, RSVP, announcements, library, prayer, profile name save, avatar, check-in and the staff dashboard all call real endpoints that exist in `apps/api/src`.

## 2. Screen inventory (`apps/mobile/app`)

| File | Reachable from | Real data |
|---|---|---|
| `_layout.tsx` (root) | App entry (layout) | n/a |
| `(auth)/sign-in.tsx` | Session gate when signed out | yes (`/auth/login`); title hard-coded (PH-MOB-04) |
| `(member)/_layout.tsx` | Layout (Stack) | n/a |
| `(member)/(tabs)/_layout.tsx` | Layout (Tabs) | n/a |
| `(member)/(tabs)/index.tsx` | Tab: Home | yes (members/me, announcements, churches, attendance sessions, events, verse of the day) |
| `(member)/(tabs)/church.tsx` | Tab: Church | yes (`/churches/:id`, `/attendance/sessions`); constant hidden (PH-MOB-06); "Every" labelling in PH-MOB-05 |
| `(member)/(tabs)/library.tsx` | Tab: Library | yes (`/api/files/library`); parity open (PH-MOB-09) |
| `(member)/(tabs)/profile.tsx` | Tab: Profile | yes (`/users/me` GET/PATCH, avatar, church name) |
| `(member)/(tabs)/more.tsx` | Tab: More (hub) | n/a (navigation links only; all targets exist) |
| `(member)/events.tsx` | More tab; Home quick action; Home "See all" | yes (`/events`, `/events/me`, `/attendance/sessions`); schedule label in PH-MOB-05 |
| `(member)/events/[id].tsx` | Events list row; Home upcoming card | yes (`/events/:id`, RSVP `PUT /events/:id/rsvp`) |
| `(member)/announcements.tsx` | NONE (no link exists) | yes (`/announcements`), but unreachable (PH-MOB-07) |
| `(member)/announcements/[id].tsx` | Home announcement cards; announcements list (unreachable) | yes (`/announcements/:id`, attachments) |
| `(member)/inbox.tsx` | More tab; Home quick action | partly: list and mark-read are real; targets not followed (PH-MOB-03) |
| `(member)/prayer.tsx` | More tab; Home quick action | yes for submit (`POST /prayer-requests`); write-only, no view of own requests |
| `(member)/library-catalog.tsx` | More tab; Home quick action | yes (`/library/resources`); chip filter partial (PH-MOB-08) |
| `(member)/library-detail.tsx` | Library catalogue row | yes (detail, access URL, progress) |
| `ai.tsx` | AI header button on all member and staff screens | yes (`/ai/chat`, `/ai/feedback`); form and confirm dead path (PH-MOB-10) |
| `join.tsx` | NONE (only pushed by unrendered `ChurchSwitcher`) | yes (`/churches/join`), but unreachable (PH-MOB-02) |
| `(staff)/_layout.tsx` | Layout (Stack) | n/a |
| `(staff)/(tabs)/_layout.tsx` | Layout (Tabs; hides tabs by permission) | n/a |
| `(staff)/(tabs)/index.tsx` | Tab: Dashboard | yes (`/dashboard/stats`) |
| `(staff)/(tabs)/people.tsx` | Tab: People | partly: real, but capped at 100 (PH-MOB-01) |
| `(staff)/(tabs)/services.tsx` | Tab: Services | yes (`/attendance/service-types`, `/attendance/sessions`); check-in button when permitted |
| `(staff)/(tabs)/content.tsx` | Tab: Content | yes (`/api/files/user`) |
| `(staff)/(tabs)/more.tsx` | Tab: More | yes for settings (language, spaces, sign out) |
| `(staff)/attendance.tsx` | Services tab button (when `manage:attendance`) | yes (sessions, members, manual and QR check-in); batch list capped (PH-MOB-01) |
| `(staff)/verses.tsx` | Staff Dashboard button | yes (`/verses/*`, role-gated writes) |

Summary: 23 screens and 5 layouts. Reachable from a tab, link or route: 21 screens. Unreachable: `(member)/announcements.tsx` and `join.tsx`. Real data: 20 yes, 2 partly (`inbox`, `staff people`), 0 no, 1 navigation-only (`(member)/(tabs)/more.tsx`).

## 3. Counts by impact

- High: 0
- Medium: 5 (PH-MOB-01, 02, 03, 04, 05)
- Low: 6 (PH-MOB-06, 07, 08, 09, 10, 11)

## 4. Ten most important items

1. **PH-MOB-01**: Staff people directory and check-in batch list silently stop at 100 members (API cap; `limit=200` is clamped).
2. **PH-MOB-02**: Join-by-code screen exists and works against the API, but nothing links to it.
3. **PH-MOB-03**: Inbox rows look tappable and only mark read; targets are never followed.
4. **PH-MOB-04**: Sign-in shows a hard-coded church name as the app identity.
5. **PH-MOB-05**: "Every {day}" service schedule is asserted from a single next session. There is no recurrence data.
6. **PH-MOB-07**: Member announcements list is unreachable; Home has no "See all".
7. **PH-MOB-06**: `"Demo church data"` filter constant; live DB rows may hold demo text (verify).
8. **PH-MOB-08**: Resource category chips filter only the pages already loaded.
9. **PH-MOB-09**: Library tab and Resources screen read two different backends; parity unverified.
10. **PH-MOB-10**: AI form and confirm components are permanently disabled. Unreachable today, but ships as "not available yet" copy.

## 5. Not verified and out of scope

- Live database contents (church description, church name, real member counts). Repo-only evidence.
- The web portal's handling of the same data (for PH-MOB-06 and PH-MOB-04).
- Full role-by-role permission matrix. Only the guards visible in the controllers listed were checked.
- Hard-coded bilingual copy outside the i18n dictionaries (`copy(locale, {...})` in `components/events/*` and `app/(member)/events*.tsx`, 13 call sites). This is a localisation gap, not placeholder content, so not counted.
- Prayer requests are write-only: the screen never shows a member their own submitted requests, though `GET /prayer-requests/me` exists. A feature gap, not a placeholder, so not counted.
- Test files were excluded as instructed.
