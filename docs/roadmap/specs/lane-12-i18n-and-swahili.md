# Lane 12: i18n-and-swahili

Owns the shared catalogue, its gates, the error-code to message mapping, the Swahili glossary and the review workflow. Feature lanes own their own new message files (pre-registered here) so nobody edits the same i18n file.

- **Waves:** 1 (first in the wave: namespaces and gates), 3 (plurals, regroup, glossary, formatters).
- **Backlog IDs:** RM-050, RM-051 (W1); RM-126, RM-127, RM-128 (W3). Supports RM-054.
- **Decisions:** D-13 (named Swahili reviewers), D-23 (approved scripture), D-27 (terminology), DEC-13 and DEC-16 (existing).
- **Depends on:** lane 01 RM-009 (error `code` field) for the code table. **Blocks:** lanes 04, 06, 07, 08, 09, 10, 11 (they consume the stubs and the error table); merge first in each wave.
- **Model:** Luna low or medium; tasks are mechanical but wide, so split W3 regroup from the rest.

## Goal

No English leaks for Swahili users: every string lives in the catalogue with `en` and `sw`, identical en/sw values are flagged, server messages are mapped through codes, and a named native reviewer can approve Swahili in batches.

## Facts (verified)

- `packages/config/src/i18n/index.ts` spreads 16 message files; `sw` is typed `Record<MessageKey, string>`, so a missing Swahili key is a compile error. There is no fallback: `translate` reads the locale's dictionary only.
- 17 keys are identical between `en` and `sw` (verses and references, DX-01); `mobile-member.ts` `sw` repeats English verse text.
- 18 call sites show raw server text (MM-23); 13 inline `copy()` calls bypass the catalogue (MM-24); `formatClock` hard-codes AM/PM (`apps/mobile/components/events/format.ts:56-62,77-83`); 18 plural keys use manual suffixes (`staff-groups.ts:12-14,128-130`); locale loads asynchronously (`apps/mobile/lib/locale.tsx:20-24`), so first paint can flash English (MM-22).
- Mobile and web import the **built** catalogue: after any edit run `pnpm --filter @church/config build`. Test script: `tsc && node --test dist/types/ai-components.test.js dist/i18n/i18n.test.js` (`packages/config/package.json:45`).

## Owned files (exclusive)

```
packages/config/src/i18n/index.ts, format.ts, i18n.test.ts, plural.ts (new), error-codes.ts (new), scripture.ts (new)
packages/config/src/i18n/messages/{common,member,staff,mobile-member,mobile-staff,components,mobile-shared,staff-attendance,staff-people,staff-groups,staff-events-giving,staff-sweep-a,staff-sweep-b,final-sweep,wiring-mobile,wiring-web}.ts
packages/config/src/i18n/messages/errors.ts (new)
packages/config/src/i18n/{hardcoded.test.ts, hardcoded-baseline.json, identical-allowlist.ts}   (new)
docs/i18n/**   (new: glossary.sw.md, review-workflow.md, sw-approved.json)
apps/mobile/lib/locale.tsx, apps/mobile/components/language-picker.tsx
```

Namespace stubs created here (empty `export const xMessages = { en: {}, sw: {} }`, registered in `index.ts` in one edit), then **owned by the named lane**: `auth-onboarding.ts` (04), `announcements-web.ts` (06), `mobile-shell.ts` (07), `announcements-mobile.ts` and `member-content.ts` (08), `profile.ts` and `prayer-inbox.ts` (09), `join.ts` (10), `staff-mobile.ts` (11).

Not owned: any component or screen file (read-only scans only).

## Tasks (in order)

### Wave 1 (merge first)

1. **Stubs and registration (RM-050).** Create the nine stub files and register them in `index.ts` (explicit spreads, same style). Publish a short note in the PR: key naming `surface.screen.element`, variables `{name}`, no concatenated sentences, Swahili marked `sw-review-pending` in the PR description.
2. **Gates (RM-050).** In `i18n.test.ts` keep the parity test and add: (a) a test that fails when `en[key] === sw[key]` unless the key is in `identical-allowlist.ts` (brand names, "AI", numbers); (b) `hardcoded.test.ts`: scan `apps/mobile/app`, `apps/mobile/components`, `apps/web/app`, `apps/web/components` (read-only) for JSX text literals, `placeholder="..."`, `accessibilityLabel="..."` and `Alert.alert('...')` with English text, compared with `hardcoded-baseline.json`; the count per file may only go down (ratchet), new files must have zero. (c) placeholders `{name}` must match between `en` and `sw`.
3. **Error table (RM-050).** `messages/errors.ts` plus `error-codes.ts` exporting `ERROR_CODE_KEYS: Record<string, MessageKey>`. Seed with the codes defined in the specs: `EMAIL_CHANGE_REQUIRES_VERIFICATION, STORAGE_NOT_CONFIGURED, CHECKIN_DUPLICATE, SESSION_CLOSED, MEMBER_NOT_FOUND, QUERY_TOO_SHORT, INVALID_CODE, CODE_EXPIRED, TOO_MANY_ATTEMPTS, TOO_MANY_REQUESTS, INVALID_PHONE, PHONE_IN_USE, EMAIL_IN_USE, PASSWORD_REQUIRED, ANNOUNCEMENT_BODY_INVALID, ANNOUNCEMENT_NOT_EDITABLE, SELF_APPROVAL_FORBIDDEN, ALREADY_PUBLISHED, AUDIENCE_EMPTY, SMS_TOO_LONG, AVATAR_MISSING_FILE, AVATAR_TOO_LARGE, AVATAR_TYPE_UNSUPPORTED, AVATAR_DECODE_FAILED, PRAYER_EMPTY, PRAYER_TOO_LONG, INVITATION_NOT_FOUND, INVITATION_EXPIRED_OR_USED, EMAIL_NOT_VERIFIED, EMAIL_MISMATCH, ALREADY_MEMBER, ROLE_CEILING, LAST_ADMIN, INVALID_PUSH_TOKEN` plus generic keys `network, timeout, forbidden, notFound, validation, server`. Lanes that add codes report them; this lane adds the key. Each message is a calm sentence that says what to do (DX 4.9 patterns); Swahili drafts from DX 4.9.
4. **RM-051 scripture interim.** Export `SCRIPTURE_SW_APPROVED = false` from `scripture.ts`; lane 07's Home hides the verse card in Swahili while false (request). When D-23 supplies the approved text, replace `mobile.member.home.verseText.*` and references in `sw` with book names in Swahili and flip the flag. Add the identical-value gate so this cannot regress.
5. **Locale flash (MM-22).** `lib/locale.tsx`: initial state from the device locale (`expo-localization`, already used) before the stored preference loads; unit test that the first value is not forced to English.

### Wave 3

6. **RM-126.** `plural.ts`: `plural(locale, baseKey, n)` with `Intl.PluralRules`, keys `*.one` and `*.other`; convert the 18 manual-suffix keys (`staff-groups.ts:12-14,128-130` and others); regroup the 16 sweep/wiring-named files into feature namespaces without changing any key name (diff test: set of keys and values identical before and after). Do this in a quiet window after feature lanes merge.
7. **RM-127.** `docs/i18n/glossary.sw.md` from `design-system-ux.md` section 4.8 (35 rows, flagged rows for D-13, D-27); `docs/i18n/review-workflow.md` (English first; Swahili in the same PR; reviewer approves in batches of 50 keys with screenshots; `sw-approved.json` stores a hash per approved key and a script lists keys changed since approval; freeze before release). Formatter: `formatClock(locale, date)` in `format.ts` with Swahili day-period words (asubuhi, mchana, jioni, usiku) behind a style switch the reviewer can flip; lane 08 replaces `format.ts:56-62,77-83` with it.
8. **RM-128.** Provide catalogue keys for the 13 inline `copy()` strings and the unused keys cleanup (`mobile.member.home.intro`, `home.servicesHeading`, `profile.edit`, `events.detail.startsLabel`, `events.detail.locationLabel`, MM-24); web hard-coded strings (`portal/offerings/page.tsx:29`, `giving-goals/page.tsx:15`) get keys here and are applied by lane 14.

## Contracts

- Key format `surface.screen.element`, variables `{name}`. Error responses carry `code` (lane 01); clients call `ERROR_CODE_KEYS[code] ?? genericKeyFor(status)` and never render `message`.
- Swahili wording: draft by the agent, listed under `sw-review-pending`; the native reviewer's edits are the only change allowed after approval (D-13).

## Acceptance (testable)

- `pnpm --filter @church/config build` and `pnpm --filter @church/config test` pass; the identical-value gate fails on a copied English string; the hard-coded ratchet fails on a new literal and passes on the baseline.
- Every code in the seed list resolves to a key with `en` and `sw`; unknown codes fall back to the status-based generic key.
- With `SCRIPTURE_SW_APPROVED = false` the Swahili verse text is not shown as if approved (lane 07 test).
- `plural('sw', 'staff.groups.leaderCount', 1|2)` returns the right form; regroup leaves all key/value pairs unchanged (snapshot).
- First render of the mobile app on a Swahili device uses Swahili.

## Test plan (targeted)

`pnpm --filter @church/config test` only (includes parity, gates, plural). One final `pnpm --filter @church/config build` and a `pnpm --filter mobile typecheck` plus `pnpm --filter web type-check` to confirm importers still compile (type check only). Skip device runs; the native review is human work (Q-02).

## Risks

- A wide regroup collides with feature lanes: schedule it as the last Wave 3 task, never in parallel with them.
- The hard-coded scan is heuristic; keep a baseline file and review false positives before tightening.
- Swahili clock convention and "Tithe" terms are unsettled (D-13, D-27): ship behind switches and flags.
- Stale `dist` in mobile or web after an i18n edit causes missing keys at runtime: always rebuild.

## Agent brief (Wave 1 tasks 1-5)

```
ROLE: build agent, lane 12 i18n-and-swahili, Wave 1 tasks 1-5. Leaf worker: start no subagents.
REPO: /Users/upstairs/Personal/builds/church/church-management-system  BRANCH: design/mito-ya-baraka-concepts (stay on it)
READ FIRST: docs/roadmap/README.md (ground rules), docs/roadmap/specs/lane-12-i18n-and-swahili.md, docs/roadmap/audits/design-system-ux.md DX-01, DX-19, DX-24, 4.8, 4.9; packages/config/src/i18n/index.ts and i18n.test.ts.
OWN (may edit): packages/config/src/i18n/** (incl. new messages stubs, errors.ts, error-codes.ts, scripture.ts, hardcoded.test.ts, hardcoded-baseline.json, identical-allowlist.ts); docs/i18n/**; apps/mobile/lib/locale.tsx; apps/mobile/components/language-picker.tsx.
DO NOT TOUCH: any screen or component outside those files (read only for scanning), package.json, lockfile, API.
RULES: no commits/push; no pnpm add; after EVERY i18n edit run pnpm --filter @church/config build before type-checking apps; Swahili strings are your own drafts, say so in the report.
GOAL: namespace stubs, parity/identical/hard-coded gates, error-code message table, scripture interim flag, no locale flash.
STEPS:
1. Read index.ts (explicit spreads, typed sw Record) and one message file for the shape { en: {...}, sw: {...} }.
2. Create stubs auth-onboarding, announcements-web, mobile-shell, announcements-mobile, member-content, profile, prayer-inbox, join, staff-mobile as export const <name>Messages = { en: {}, sw: {} }; register in index.ts with the same spread style for en and sw.
3. Extend i18n.test.ts: identical en/sw gate with identical-allowlist.ts (start by listing current legitimate identicals: brand, AI; the 17 scripture keys go to a TEMPORARY list marked until D-23), placeholder parity.
4. hardcoded.test.ts + hardcoded-baseline.json: scan the four directories for English JSX literals/placeholder/accessibilityLabel/Alert.alert text; record the current counts per file as the baseline (ratchet: may only decrease).
5. messages/errors.ts + error-codes.ts with the seed codes and generic keys from the spec (en + sw drafts, calm wording, say what to do).
6. scripture.ts SCRIPTURE_SW_APPROVED=false; locale.tsx initial state from the device locale (no English flash) + unit test.
VERIFY: pnpm --filter @church/config build ; pnpm --filter @church/config test ; then pnpm --filter mobile typecheck and pnpm --filter web type-check once (compile check only).
REPORT (max 15 lines): files changed; RM IDs done/partial; tests run/skipped; list of Swahili strings pending review (count + file names); requests (lane 07: hide verse card in sw while the flag is false; lane 14: web hard-coded strings keys); open risks.
```
