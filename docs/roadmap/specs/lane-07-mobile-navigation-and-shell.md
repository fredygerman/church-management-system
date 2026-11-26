# Lane 07: mobile-navigation-and-shell

- **Waves:** 0 (RM-010), 1 (transport, errors, tests), 2 (switcher, Events tab, Home, bell), 3 (RM-123).
- **Backlog IDs:** RM-010 (W0); RM-052, 053, 054, 055, 056 (W1); RM-080, RM-083, RM-088 (tab part), bell part of RM-091 (W2); RM-123 (W3).
- **Decisions:** D-20 (Events tab, More removed; default yes), D-14 (second tenant for switcher tests).
- **Depends on:** nothing for RM-010. W1 needs lane 12 error catalogue (RM-050). RM-083 needs lane 13 `Sheet` primitive (RM-048) and a second church on DEV (RM-028). RM-080 needs lane 08's `announcements/[id]` route.
- **Blocks:** every mobile screen lane (08, 09, 10, 11 member parts) because RM-010 moves files into `(tabs)/`.
- **Model:** Luna medium; RM-010 alone as brief A.

## Goal

Every member destination opens from a visible control and Back works; the app has five concept tabs, a church switcher, a bell, reliable transport on poor networks, and no raw server text.

## Root cause of RM-010 (verified in audit, device repro pending)

`app/(member)/_layout.tsx:22-28` hides six screens with `href: null` inside `Tabs`; expo-router 58's `useVisibleTabsWithRedirect` replaces a focused hidden route with the first visible tab (`expo-router/build/standard-navigation/useVisibleTabsWithRedirect.js:43,76-84`, called from `ui/Tabs.js:198`). `app/ai.tsx` is a root Stack route and works. Fix: real Stack for member screens and a `(tabs)` group holding only visible tabs.

## Owned files (exclusive)

```
apps/mobile/app/_layout.tsx
apps/mobile/app/(member)/_layout.tsx           (becomes Stack)
apps/mobile/app/(member)/(tabs)/_layout.tsx    (new: Tabs)
apps/mobile/app/(member)/(tabs)/index.tsx, more.tsx   (moved)
apps/mobile/components/home/**
apps/mobile/components/{spaces-section.tsx, church-switcher-sheet.tsx (new), screen-state.tsx, not-connected-state.tsx}
apps/mobile/components/header/**               (new: notification bell, offline banner)
apps/mobile/lib/{api.ts, session.tsx, restore.ts, storage.ts, request-gate.ts, claims.ts, query-cache.ts (new), error-messages.ts (new), routes.ts (new)}
apps/mobile/tests/{api-session,restore,request-gate,claims}.test.ts, nav-routes.test.ts (new), support.ts
packages/config/src/i18n/messages/mobile-shell.ts   (new, pre-registered by lane 12)
```

Rename-only exception (Wave 0, before other mobile lanes start): `git mv` of `church.tsx` and `library.tsx` (lane 08 files) and `profile.tsx` (lane 09 file) into `(member)/(tabs)/` with no content change; after merge those lanes own the new paths. Not owned: `app/(staff)/**`, `app/ai.tsx`, `components/ai/**` (lane 11), `components/ui/**` and `theme/**` (lane 13), `lib/locale.tsx`, `components/language-picker.tsx` (lane 12).

## Tasks (in order)

### Wave 0

1. **RM-010** Restructure: `app/(member)/_layout.tsx` becomes a `Stack` (keyed by `contextKey` as today, `lib/session.tsx` still sees `(member)` as the first segment at `:166-171`); new `(tabs)/_layout.tsx` holds the `Tabs` with Home, Church, Library, Profile, More (keep the current five for now; Events moves in W2). Move `events.tsx`, `events/[id].tsx`, `prayer.tsx`, `inbox.tsx`, `library-catalog.tsx`, `library-detail.tsx` **stay** in `(member)/` as Stack screens (remove their `Tabs.Screen href:null` entries). `git mv` `index.tsx`, `church.tsx`, `library.tsx`, `profile.tsx`, `more.tsx` into `(tabs)/`. URLs are unchanged because group names are not in the path; fix any relative imports and any `router.push` that used a group path. Screens set their own header title with `<Stack.Screen options={{ title }} />`; the layout declares no per-screen entries, so other lanes never edit it. Add `tests/nav-routes.test.ts`: scan `app/` and `components/` for `router.push|replace|navigate` and `Link href` targets, build the route set from the file system, assert every target resolves and that no `Tabs.Screen` uses `href: null`. Device check (panel `agent-device`): Home "See all" opens Events and Back returns to Home; Prayer, Inbox, Library catalogue, Library detail, Event detail open and return.

### Wave 1

2. **RM-052 transport.** `lib/api.ts:153-163`: `AbortController` timeout 15 s raising `ApiError` kind `timeout` or `network`; one retry for idempotent GET with jitter; `lib/query-cache.ts` keyed by `contextKey` plus path with stale-while-revalidate and last-good content; clear on sign-out and church switch; offline banner inferred from consecutive network failures (no new dependency); keep single-flight refresh (`api.ts:143-151`); add `api.postForm(path, formData)` (multipart with the Bearer token and the same timeout and error kinds) for lane 09's avatar upload. Preserve R-MOB-01 behaviour (`lib/restore.ts:16-33`).
3. **RM-053** Home: remove `t` from the fetch effect dependencies (`index.tsx:93`) so language change does not refetch; per-section loading and error states (`index.tsx:84-88,153-154`); use the shared cache for `/users/me`, `/members/me`, `/attendance/sessions` (MM-21).
4. **RM-054** `lib/error-messages.ts`: `errorToMessage(err, t)` maps API `code` (lane 01 interceptor) through lane 12's `error-codes.ts` table, with generic fallbacks `network`, `timeout`, `forbidden`, `notFound`, `server`; server `message` never shown. Replace the 18 raw-text call sites in files this lane owns; report the rest to lanes 08, 09, 11.
4b. `lib/session.tsx`: sign-out calls `unregisterPush()` from lane 09 when it exists; `SessionGate` sends a signed-in user with no active membership to `/join` (lane 10) instead of an error state; Home hides the verse card in Swahili while `SCRIPTURE_SW_APPROVED` (lane 12, `scripture.ts`) is false (`components/home/verse-card.tsx`, RM-051 request); `lib/claims.ts` gets staff entries lane 11 requests (visitors, check-in).
5. **RM-055** `lib/storage.ts:41-42`: `keychainAccessible: WHEN_UNLOCKED_THIS_DEVICE_ONLY` only after confirming background refresh does not need locked-device access (note in report).
6. **RM-056** Extend tests: timeout, retry, cache clear on switch, error mapping; screen smoke test for Home with a mocked API.

### Wave 2

7. **RM-083 switcher.** Tappable church pill on Home hero (`components/home/home-hero.tsx:15-19`) opens `church-switcher-sheet.tsx` (lane 13 `Sheet`): memberships from `GET /auth/memberships`, active one marked, confirm, then `POST /auth/switch-church` and `contextKey` remount (no stale rows, R-MOB-02); failed switch keeps the old church with a translated error; single-membership users see the name without a control; "Join another church" row routes to `/join` (lane 10); keep `spaces-section.tsx` on Profile using the same sheet. Rows at least 44 px; visible Close button; Android back closes the sheet.
8. **RM-080** `AnnouncementCard` (`components/home/home-cards.tsx:32-39`) becomes pressable to `/announcements/[id]`; Home shows the latest three with "See all" to `/announcements`.
9. **RM-088 tab part** (D-20): tabs become Home, Church, Events, Library, Profile; More removed; rows move to Profile and Home tiles (language and staff switch already exist on Profile). `events.tsx` moves into `(tabs)/` (rename only, then lane 08 owns it). Concept tile labels on Home (MM-43).
10. **Bell** (`components/header/notification-bell.tsx`, RM-091 part): header right shows AI (lane 11 component) plus bell with unread count from `GET /notifications` (`unreadCount`); badge is a count only, labelled button, routes to `/inbox`.

### Wave 3
11. **RM-123** Dynamic type: tab bar height not fixed (`56 + insets.bottom` at `_layout.tsx:15`), tab label size from tokens, Home chip and card titles wrap; verify at Android 200% font scale.

## Contracts

Uses existing `GET /auth/memberships` (`auth.controller.ts:254`), `POST /auth/switch-church` (`:208-224`), `GET /notifications`. Route table `lib/routes.ts` (single list used by the static test): `/(tabs)/index|church|events|library|profile`, `/events/[id]`, `/prayer`, `/inbox`, `/library-catalog`, `/library-detail`, `/announcements`, `/announcements/[id]`, `/join`, `/ai`. Other lanes ask for new routes in their report.

## Acceptance (testable)

- Static test passes and fails when a `router.push` target does not exist.
- Device: Home "See all", Home tiles, Events row, Prayer, Inbox, Library catalogue all open; Back returns to the previous screen; five paths on Android and iOS.
- A stalled GET shows a retry after 15 s, not an endless spinner; airplane mode shows last good Home content and a banner; changing language makes zero network calls (counted in a test).
- Switching church A to B shows no A rows while B loads; failed switch keeps A.
- No mapped error path shows English server text.

## Test plan (targeted)

`pnpm --filter mobile test` (tests listed in owned files). One final `pnpm --filter mobile typecheck`. Device check on Android (low-end profile if available) via panel agent-device; never force-stop Expo Go; restart Metro with `--clear` if stale. Skip API and web.

## Risks

- File moves break relative imports and deep links; the static test and a device pass are the guard.
- `SessionGate` depends on the `(member)` segment name; keep it.
- expo-router upgrades may change redirect rules; re-run the static test on each upgrade.
- Cache must clear on sign-out and church switch, or members of church A could see B data.
- Lane 08 and 09 start only after RM-010 merges.

## Agent brief (A: RM-010)

```
ROLE: build agent, lane 07 mobile-navigation-and-shell, brief A (RM-010, Wave 0). Leaf worker: start no subagents.
REPO: /Users/upstairs/Personal/builds/church/church-management-system  BRANCH: design/mito-ya-baraka-concepts (stay on it)
READ FIRST: docs/roadmap/README.md (ground rules), docs/roadmap/specs/lane-07-mobile-navigation-and-shell.md (task 1), docs/roadmap/audits/mobile-member.md MM-01 and F1.
OWN (may edit): apps/mobile/app/_layout.tsx, apps/mobile/app/(member)/_layout.tsx, apps/mobile/app/(member)/(tabs)/**, apps/mobile/lib/routes.ts (new), apps/mobile/tests/nav-routes.test.ts (new). Rename-only (git mv, no content edits except import paths): church.tsx, library.tsx, profile.tsx, index.tsx, more.tsx.
DO NOT TOUCH: app/(staff)/**, app/ai.tsx, components/**, lib/api.ts, lib/session.tsx, package.json, lockfile, any API or web file.
RULES: no commits/push; no pnpm add; never force-stop Expo Go; restart Metro with --clear if it serves stale code.
GOAL: Home tiles, See all, Events, Prayer, Inbox, Library catalogue and detail open and Back returns, with no bounce to Home.
STEPS:
1. Read app/(member)/_layout.tsx fully and lib/session.tsx:160-175 (SessionGate segment check).
2. git mv app/(member)/{index,church,library,profile,more}.tsx into app/(member)/(tabs)/ (git mv, not copy). Fix relative imports (../../components -> ../../../components etc.).
3. Create app/(member)/(tabs)/_layout.tsx with the existing Tabs options (keyed by contextKey, same headerRight AiHeaderButton, same five tabs). Remove all Tabs.Screen href:null entries.
4. Rewrite app/(member)/_layout.tsx as a Stack (headerShown false for the (tabs) group, headers on for the other screens, keyed by contextKey). Do not declare per-screen entries; screens set their own titles.
5. grep apps/mobile for router.push/replace/Link href targets that still resolve (group-less URLs stay valid). Write tests/nav-routes.test.ts: build the route set from the app/ directory, assert every target resolves and no Tabs.Screen has href: null. Add lib/routes.ts listing member routes.
6. Device check via the panel (load device_list, device_open, device_screenshot via ToolSearch; drive with the returned agent-device command only): Home See all -> Events -> Back; Prayer; Inbox; Library catalogue; Event detail.
VERIFY: pnpm --filter mobile test (nav-routes + existing 5 test files); ONE pnpm --filter mobile typecheck.
REPORT (max 15 lines): files moved/changed; RM-010 status; tests run + result; device paths checked (pass/fail per path); requests to lanes 08/09 (new paths after move); open risks.
```

Briefs B (transport, tasks 2-6) and C (switcher, Home, Events tab, bell, tasks 7-10) reuse this header with their own task lists.
