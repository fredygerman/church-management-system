# Design system and UX audit: Mito Ya Baraka Church

Date: 2026-11-26 · Branch: `design/mito-ya-baraka-concepts` · Baseline reviewed: working tree on that branch
Method: read-only static review of source, concept boards (`docs/product-design/images/*.png`), `DESIGN.md`, and existing `docs/product-design/*` and `docs/shipwave/platform/remediation-plan.md`. The app was not run, no device or simulator was used, no screenshots of the running app were taken, and no tests were executed. Contrast ratios were hand-computed from sRGB values and must be confirmed with a contrast tool. Swahili copy in this document is a draft for native review, not approved copy.

## 1. Summary

- The concept boards set a clear bar: a branded hero with photography, a visible logo, a branch context chip, rich segmented navigation, and a warm editorial tone. Today's mobile app is functional but reads as a generic utility app. Average fidelity across the 18 concept screens is **3.1 / 10**.
- The foundation is sound in several places: en/sw key parity is complete (1,707 keys each, none missing, `packages/config/src/i18n`), touch targets are mostly 44 px+, screen-level roles and live regions are used, and the Services/Events segmented control already exists (`apps/mobile/components/events/segmented-control.tsx`).
- The biggest gaps are not cosmetic. They are: no logo or brand asset kit; no photography slot anywhere; Swahili Bible text served as English (DX-01); Events hidden from the member tab bar, contrary to `DESIGN.md:37`; sign-in with no registration, recovery or invite path even though the API has them; no branch selector; announcements are not readable in-app.
- Tokens exist twice (mobile hex in `apps/mobile/theme/index.ts`, web hex in `apps/web/app/globals.css`) with no generator. A single `packages/ui-tokens` source plus a generator is the first lane to start.
- Recommended first milestone: DX-01, DX-02, DX-03, DX-04 (P0/P1 content and navigation fixes that need no new design), then the token package, then the member journeys in §4.5.

## 2. Findings

Severity: P0 = wrong content or release-blocking; P1 = major gap against concept or policy; P2 = notable; P3 = polish. Effort: S ≤ 1 day, M ≤ 1 week, L > 1 week.

| ID | Sev | Area | Evidence | Recommendation | Effort | Depends on |
|---|---|---|---|---|---|---|
| DX-01 | P0 | i18n content | `packages/config/src/i18n/messages/mobile-member.ts:153` (sw) repeats the English text of `:25`. All 7 verse texts and 7 references are identical across locales (17 identical keys in total), and references are English book names ("Psalm 118:24") | Replace with the church-approved Swahili Bible text and book names; add a parity check that flags identical en/sw values outside an allow-list | S | DX-30 |
| DX-02 | P0 | Brand asset | No `apps/mobile/assets`; `apps/mobile/app.json` has no `icon`, `splash` or adaptive icon; `apps/mobile/app/(member)/church.tsx:44-50` draws a CSS-style cross; `apps/web/public/logos` holds only `google-logo.png` | Obtain logo vectors and lockups (§4.4); wire into app icon, splash, sign-in, header and church screen | S / M | Church approval |
| DX-03 | P0 | Brand and legal content | Concept boards show invented branches (Kimara, Mbezi, Tegeta), leaders, statistics, prices and Kilimanjaro/Arusha imagery; `docs/product-design/visual-audit.md` forbids seeding these | Do not seed any board data. Use clearly labelled sample fixtures in non-production only | S | None |
| DX-04 | P1 | Navigation | `apps/mobile/app/(member)/_layout.tsx:22` sets `href: null` on Events; `:20` puts More in the bar. `DESIGN.md:37` and `visual-audit.md` require Home / Church / Events / Library / Profile | Make Events a tab; move More destinations into Profile | S | None |
| DX-05 | P1 | Auth and onboarding | `apps/mobile/app/(auth)/sign-in.tsx` posts only `/auth/login` (email and password). No register, password recovery, invite code or Google sign-in. API exposes `register`, `password-recovery`, `password-reset`, `oauth-login` and `/auth/google` (`apps/api/src/auth`); web sign-in calls `register` (`apps/web/app/auth/signin/page.tsx:55`) | Build journey J1 (§4.5) | L | Self-registration policy (D2) |
| DX-06 | P1 | Brand presence | Sign-in title is a hard-coded literal (`sign-in.tsx:34`). Tab header is title plus AI pill only (`(member)/_layout.tsx:15`): no logo, no notification bell | Brand header: logo, AI pill, bell with unread badge | M | DX-02 |
| DX-07 | P1 | Branch context | No branch selector on mobile. Context is `user.churchId` (`(member)/index.tsx:43`). Memberships appear only in `apps/mobile/components/spaces-section.tsx:27`, inside Profile and More. Public church list exists only on web (`apps/web/app/churches`) | Context chip on Home; sheet of accessible memberships; separate "View branch" action (J2) | M | R-UX-01 |
| DX-08 | P1 | Church profile | `(member)/church.tsx` is text and icons only. No call, directions or share actions; no leadership photo; hides the about text when it equals the literal `"Demo church data"` (`church.tsx`, `PLACEHOLDER_DESCRIPTION`) | Action row (call, directions, share) and leadership card from verified data; replace string match with a server flag or null (see DX-37) | S | Verified church data |
| DX-09 | P1 | Imagery | No photo in mobile: `components/library-media.tsx:3` says "no photos are shipped or fetched". `apps/web/public/images` holds only `shadcn-avatar.jpg`. `components/home/home-hero.tsx:17-18` is decorative circles | Photo kit and slot components with alt text and fallbacks (§4.4) | M | Photo consent |
| DX-10 | P1 | Announcements | `components/home/home-cards.tsx` `AnnouncementCard` has no `onPress` and no detail route. `(member)/index.tsx` `plainText()` strips all HTML, so rich text and images are lost | Announcement detail with sanitised rich-text renderer and images (J3) | M | API detail endpoint check |
| DX-11 | P1 | Profile photo | Profile photo is a free-text URL field (`(member)/profile.tsx:102`). No camera or gallery. `expo-image-picker` is not in `apps/mobile/package.json` | Picker, crop, size and type limits, metadata strip, server upload (J7) | M | Upload endpoint and privacy review |
| DX-12 | P1 | Prayer | `(member)/prayer.tsx` has one textarea and no visibility choice. `docs/product-design/screen-specification.md` requires an explicit visibility choice | Add visibility options after policy decision (J5) | S | D6 |
| DX-13 | P1 | Library reading | `(member)/library-detail.tsx:3` documents "device-browser access (DEC-15: no WebView)"; reading is `Linking.openURL`. Progress is a typed number (`setPosition(String(...positionSeconds))`) | Decide DEC-15 scope; progress as a bar; reader only if approved (J6) | L | D10 |
| DX-14 | P1 | Motion | No animation or haptics. No Reanimated, Animated or expo-haptics in deps. Press feedback is opacity only (`components/ui/button.tsx`, `card.tsx`) | Motion and haptics spec (§4.3) | M | None |
| DX-15 | P1 | Dark mode | Mobile colours are constants (`apps/mobile/theme/index.ts:3-16`). `app.json` sets `userInterfaceStyle: "automatic"` but nothing reads the scheme. Web has `.dark` tokens (`globals.css:133,202`) but only 3 files use `dark:` | Dark palette in the token source (§4.3); test both | M | DX-16 |
| DX-16 | P1 | Token duplication | Hex values duplicated: `apps/mobile/theme/index.ts:3-16` and `apps/web/app/globals.css:8-18`. shadcn HSL variables are separate. `apps/web/tailwind.config.ts` is not referenced by `globals.css` (Tailwind v4 CSS-first config); confirm whether it is dead code | One token source and generator (§4.1) | M | None |
| DX-17 | P1 | Component parity | Mobile has 8 UI primitives (`components/ui/index.ts`). Web has about 45 shadcn files (`apps/web/components/ui`). Mobile lacks sheet, dialog, switch, select, avatar, skeleton, toast, checkbox and tabs (segmented control is ad hoc) | Parity matrix (§4.2) | M–L | DX-16 |
| DX-18 | P1 | Loading and empty states | `components/screen-state.tsx:3-5`: loading is the text "Loading…". Empty is plain text with no action or illustration | Skeletons; empty-state component with copy and next action (§4.9) | S / M | DX-17 |
| DX-19 | P1 | i18n outside catalogue | Inline bilingual strings: `(member)/events.tsx:72,81,88` and `components/events/format.ts:13` `copy()`. `formatClock` hard-codes "AM/PM" in both languages. `components/ai/ai-header-button.tsx:12` literal "AI". Web: `apps/web/app/[churchId]/portal/offerings/page.tsx:29` "My Giving History"; `giving-goals/page.tsx:15` "Giving Goals" | Move to catalogue; lint rule for literals (§4.8) | S | None |
| DX-20 | P1 | Contrast | Input border `colors.border` #E2E8F0 on white is about 1.2:1 (`theme/index.ts:12`, `components/ui/text-field.tsx`), below WCAG 1.4.11's 3:1 for input boundaries. Warning pill text #A16207 on #FEF3C7 is about 4.4:1 (`components/ui/pill.tsx`), below 4.5:1 at 12 px. Hand-computed | Add `inputBorder` token at ≥3:1; darken warning text ramp; verify with tool | S | None |
| DX-21 | P1 | Staff dashboard | `(staff)/index.tsx:44-47`: three stat cards only. No HQ selector, no quick actions, no hero | Staff dashboard per concept, permission-filtered (§3) | M | R-MOB-05 |
| DX-22 | P2 | Staff lists | `(staff)/people.tsx` shows names only (no avatar, call or message). `(staff)/content.tsx` shows text rows with no status or thumbnail. `(staff)/services.tsx` has no Attendance / Services / Reports segments | Read-only first, per concept (§3) | L | R-MOB-05 |
| DX-23 | P2 | Typography | `components/home/verse-card.tsx` sets verse text as italic sans. `DESIGN.md:30` reserves a serif for scripture reading. Mobile loads no font; web loads Red Hat Display (`apps/web/app/layout.tsx:9`) | Decide font pair; serif only for reading (§4.3) | S | Font licence |
| DX-24 | P2 | Plurals | 18 keys use manual suffixes, e.g. `packages/config/src/i18n/messages/staff-groups.ts:12-14,128-130` (`leaderCountPlural`). No `Intl.PluralRules` | `plural(key, n)` helper using `Intl.PluralRules` per locale | S | None |
| DX-25 | P2 | i18n organisation | 16 message files named by sweep or lane: `final-sweep.ts` (747 lines), `staff-sweep-a.ts`, `staff-sweep-b.ts`, `wiring-mobile.ts`, `wiring-web.ts`. Imported in `packages/config/src/i18n/index.ts:3-18` | Regroup by feature namespace; keep parity test | M | None |
| DX-26 | P2 | Swahili time and date | `formatClock` returns "9:00 AM" in sw. Concept board shows "Saa 9:00 Asubuhi", which does not follow the Swahili clock convention. `sw-TZ` on Hermes is unverified (`components/events/format.ts:6`) | Native review of time format; device check of Intl output | S | DX-19 |
| DX-27 | P2 | Iconography | Mobile uses Ionicons (`components/ui/button.tsx` and others). Web uses `lucide-react` in 34 files | Choose one set (recommend Lucide, §4.3) | S | None |
| DX-28 | P2 | Feedback | Success and error are inline text (`(member)/profile.tsx`, `prayer.tsx`). No toast or snackbar | Toast for async success; inline for validation | S | DX-17 |
| DX-29 | P2 | Notifications | No bell in mobile header (`(member)/_layout.tsx:15`). Inbox reached only from Home and More. No push package in `apps/mobile/package.json` | R-NOT-01: bell with badge now; push later (J8) | M | R-NOT-01 |
| DX-30 | P2 | Scripture policy | No approved Bible translation or scripture-use rule in the repo | Church decision (D3) | S | Church |
| DX-31 | P2 | Commerce in concepts | Boards show prices, "Add to cart" and "Nunua na Kupakua" (`library-ai.png`, `desktop.png`). `DESIGN.md:48` and `docs/product-design/implementation-checklist.md` defer commerce. `apps/api/src/payment/payment.service.ts` is 0 lines | Remove commerce from the design system; keep no price slots | S | D9 |
| DX-32 | P2 | Giving | Concept member quick action "Toa Sadaka". No mobile giving. `apps/api/src/offerings` holds records and goals only; no provider adapter | Decision and phased plan (§4.6) | L | D4 |
| DX-33 | P2 | Church switching | Context change remounts all tabs (`(member)/_layout.tsx:14` keyed by `contextKey`). No "join another church" or invite-code flow. Switch lives only in `spaces-section.tsx` | Journey J2 | M | DX-05 |
| DX-34 | P2 | Web portal visual | `apps/web/app/[churchId]/portal/page.tsx` renders bordered cards with no hero or imagery. Shared sidebar exists (`apps/web/components/layout/dashboard-layout.tsx:7`) | Desktop composition per `desktop.png` (§3) | M | DX-09 |
| DX-35 | P2 | QA tooling | No Storybook or gallery in web or mobile. Test scripts are `node --test` only (`apps/web/package.json`, `apps/mobile/package.json`). No visual or Playwright baselines | §4.10 | M | None |
| DX-36 | P2 | Fixed sizes | Tab bar fixed `height: 56 + insets.bottom` (`(member)/_layout.tsx:15`). Tab label `fontSize: 12` is hard-coded, not a token. AI pill `minHeight: 40`. Date block 56 px (`home-cards.tsx`). No font-scale tests | Test at 200% (§4.7); use min heights | M | DX-16 |
| DX-37 | P2 | Placeholder data | `church.tsx` string-matches `"Demo church data"` to hide the about card | Server flag or null | S | API |
| DX-38 | P3 | Header duplication | Tab header shows "Home" plus the hero greeting on the same screen (`(member)/index.tsx`) | Hide tab header on Home or use brand header | S | DX-06 |
| DX-39 | P3 | Quick actions | Member quick actions are Prayer, Library, Inbox, Events. Concept shows Sunday, Omba pamoja, Vikundi vya Nyumbani, Toa Sadaka | Re-derive from decisions D1 and D4 | S | D1, D4 |

## 3. Fidelity gap by concept screen

Score = 1–10 fidelity to the concept, today versus target after the lanes in §5 land. Target scores assume approved photography and logo; without them, cap targets at 6.

| Board | Screen | Today | Target | Top gaps (ranked) |
|---|---|---|---|---|
| member.png | M1 Home | 4 | 8 | No hero photo or logo (DX-09, DX-06); no branch chip (DX-07); quick actions differ (DX-39); tab header duplicates greeting (DX-38) |
| member.png | M2 Branch selector | 1 | 7 | Does not exist (DX-07). Target: sheet of accessible memberships, HQ default, public "View branch" separate |
| member.png | M3 Church branch profile | 3 | 8 | No photo, no call or directions, no leadership photo (DX-08); circle cross instead of logo (DX-02) |
| member.png | M4 Services and Events | 6 | 8 | Segmented control matches; Events hidden in tabs (DX-04); no service icons; inline bilingual labels (DX-19) |
| member.png | M5 Profile and switch to staff | 4 | 8 | Initials, not photo; URL field for photo (DX-11); switch card present (keep); no camera badge |
| staff.png | S1 Dashboard | 2 | 7 | No HQ selector, no quick actions, no hero, no trend (DX-21) |
| staff.png | S2 People | 3 | 7 | Names only; no segmented Members / Visitors; no avatar or call action (DX-22) |
| staff.png | S3 Services | 3 | 7 | Flat list; no segments; no attendance trend (DX-22) |
| staff.png | S4 Content | 2 | 6 | Text rows; no status (Published / Draft / Scheduled) or thumbnail; create action absent (DX-22; R-MOB-05) |
| staff.png | S5 More | 6 | 8 | Space switch and language present; needs staff identity header and brand (DX-06) |
| desktop.png | D1 Web member home | 3 | 7 | No hero; plain cards (DX-34); sidebar exists; no branch chip |
| desktop.png | D2 Web library | 2 | 6 | No shelf grid or covers; commerce shown (DX-31) |
| desktop.png | D3 Web staff dashboard | 3 | 6 | Text cards; no welcome banner; quick actions absent |
| library-ai.png | L1 Shared library | 4 | 7 | Search and chips present (`(member)/library.tsx`); covers are icons (DX-09); no shelves |
| library-ai.png | L2 Book detail and sample | 2 | 6 | Detail shows open-in-browser only (DX-13); no sample; no description block |
| library-ai.png | L3 Downloads and offline | 1 | 4 | Does not exist. Target stays limited: eligible content only, full offline deferred (`DESIGN.md:48`) |
| library-ai.png | L4 Reader | 1 | 5 | Browser open only (DX-13). Target depends on D10 |
| library-ai.png | L5 AI conversation | 6 | 8 | Chat and sources render (`app/ai.tsx`, `components/ai/ai-response.tsx`); no contextual service card in concept style |

Average: today **3.1**, target about **7.1**. Lowest scores are the new surfaces (branch selector, downloads, reader), which are the most reliant on decisions D1 to D10.

## 4. Proposed specs

### 4.1 Shared tokens package

New package `packages/ui-tokens` (no runtime dependency on React or Tailwind).

- `src/tokens.ts`: one `as const` object with `color.light`, `color.dark`, `space`, `radius`, `type` (size, line height, weight, family role), `shadow`, `motion` (durations, easings). Semantic names only: `canvas`, `surface`, `ink`, `muted`, `brand`, `brandStrong`, `onBrand`, `accent`, `tint`, `border`, `inputBorder`, `focusRing`, `success`, `warning`, `danger`, `overlay`.
- `src/generate.ts` writes:
  - `apps/web/app/tokens.generated.css`: `@theme` variables, `.dark` overrides, and the shadcn bridge (`--background: var(--color-canvas)`, `--primary: …`). Imported from `globals.css`.
  - `apps/mobile/theme/tokens.generated.ts`: `colors` (light and dark), `spacing`, `radii`, `type`, `shadow`, `motion`. `apps/mobile/theme/index.ts` re-exports it and selects the scheme via `useColorScheme`.
- `src/contrast.test.ts`: asserts every declared text-on-surface and control-on-surface pair meets 4.5:1 (text) and 3:1 (boundaries), for both schemes. This is how DX-20 stays fixed.
- Turbo: `ui-tokens#build` precedes `web#build`, `mobile#typecheck`. CI fails if generated files differ from a fresh build.
- Migration: map existing `colors.*` names in `apps/mobile/theme/index.ts` 1:1 so screens need no edits in the first PR. Remove the hex copy in `globals.css:8-18` only after the generated file is imported.
- Open question: whether `apps/web/tailwind.config.ts` is loaded at all (no `@config` in `globals.css`). Confirm, then delete if dead.

### 4.2 Component parity matrix

| Need (concept) | Web (shadcn, `apps/web/components/ui`) | Mobile today (`apps/mobile/components/ui`) | Action |
|---|---|---|---|
| Button | `button.tsx` | `button.tsx` (primary, secondary, ghost, destructive) | Keep; add `size` and icon-only with accessible name |
| Card | `card.tsx` | `card.tsx` (pressable variant) | Keep |
| Section header | (ad hoc) | `section-header.tsx` | Keep |
| List row | (table rows) | `list-row.tsx` | Add avatar and trailing action slots |
| Pill / badge | `badge.tsx` | `pill.tsx` | Fix warning contrast (DX-20) |
| Text field | `input.tsx`, `form.tsx`, `label.tsx` | `text-field.tsx` | Fix border (DX-20); add error association |
| Segmented control | `toggle-group.tsx`, `tabs.tsx` | ad hoc `events/segmented-control.tsx` | Promote to `ui/segmented.tsx` |
| Bottom sheet (branch selector) | `sheet.tsx`, `drawer.tsx` | none | Build; focus trap, drag handle plus explicit close button |
| Dialog / confirm | `dialog.tsx`, `alert.tsx` | none | Build for destructive confirmations (sign-out is not destructive) |
| Switch | `switch.tsx` | none | Build; use for staff switch |
| Avatar | `avatar.tsx` | none (initials only) | Build with photo and initials fallback |
| Hero banner | (none) | `hero-banner.tsx`, `components/home/home-hero.tsx` | Replace with photo-capable hero; one component |
| Skeleton | `skeleton.tsx` | none (text) | Build |
| Toast | `sonner.tsx`, `toaster.tsx` | none | Build |
| Empty state | `unavailable-state.tsx` | `screen-state.tsx` (text) | Build with icon and action |
| Select / picker | `select.tsx` | none (LanguagePicker is ad hoc) | Build |
| Checkbox / radio | `checkbox.tsx`, `radio-group.tsx` | radio in `language-picker.tsx` only | Build |
| Table to cards (staff) | `table.tsx` | none | Build responsive list (§3) |
| Icons | `lucide-react` | `@expo/vector-icons` Ionicons | Single set (§4.3) |

### 4.3 Iconography, motion, haptics, dark mode, text scaling, typography

- **Icons:** adopt Lucide on both platforms. On mobile use `lucide-react-native`, so the same names and stroke weight apply. Ionicons is removed after parity. Icon-only controls require `accessibilityLabel`.
- **Motion durations:** micro 120 ms (press, toggle), standard 200 ms (tab and segment change), sheet 280 ms with spring, exit 160 ms. Enter: ease-out; exit: ease-in. Animate only `transform` and `opacity` on mobile; use Reanimated on the UI thread. No looping motion on content screens.
- **Reduced motion:** check `AccessibilityInfo.isReduceMotionEnabled()` and the web `prefers-reduced-motion` query. Replace slides with fades; disable parallax and hero motion.
- **Haptics:** `selection` on segment and tab change; `success` on RSVP saved, prayer submitted, profile saved; `warning` on destructive confirmation; no haptics on routine taps or scroll. Respect the device setting.
- **Dark mode:** derive dark values in the token source. Proposed starting point (verify contrast in the contrast test): canvas `#0B1220`, surface `#111A2E`, ink `#E5EDFF`, muted `#94A3B8`, brand `#60A5FA`, accent `#A78BFA`, border `#24314D`. Photography keeps a 12 % scrim on dark surfaces.
- **Text scaling:** keep the `type` scale in px (`apps/mobile/theme/index.ts:20-28`) but remove fixed heights for text containers. Verify at iOS largest accessibility sizes and Android 200 % font scale. Essential labels wrap; do not truncate titles that carry meaning (`numberOfLines` only on secondary metadata).
- **Typography:** interface in the platform sans (or one licensed sans chosen with the church). Serif only for scripture and long reading (`DESIGN.md:30`). Red Hat Display is already loaded on web (`apps/web/app/layout.tsx:9`); decide whether mobile matches it.

### 4.4 Brand asset kit checklist (what the church must supply)

Owner: church communications, with Fredy for approval. Nothing below may be inferred from concept boards.

- [ ] Logo as SVG: full colour, single-colour ink, single-colour white. Cross-and-wave mark as in the board is confirmed as the official mark, or replaced.
- [ ] Lockups: horizontal with name, stacked with name, icon only. Confirm whether "Tanzania" is part of the official lockup (`visual-audit.md` says omit unless approved).
- [ ] App icon 1024 px PNG (iOS, no transparency), Android adaptive foreground and background layers, splash artwork, monochrome icon for Android 13 themed icons.
- [ ] Colour confirmation: accept or replace `#1D4ED8` (brand), `#172554` (ink), `#7C3AED` (accent). Confirm the violet is acceptable for a church brand.
- [ ] Typeface: licensed family for web and mobile, or confirmation to use system fonts.
- [ ] Photography: list of approved images with consent records. Minimum set: HQ building (daylight, no people), worship (consented adults), leadership portraits (consented), one photo per approved branch. No image of children without guardian consent and a named policy.
- [ ] Branch data: verified names, addresses, phone numbers, service times, leaders for each branch that appears in the product. HQ first; others only when verified.
- [ ] Scripture: approved Bible translation for English and Swahili, and the permission to quote it (D3).
- [ ] Swahili copy sign-off for all shipped strings (§4.8) and for the glossary.
- [ ] Privacy and consent text for profile photos, prayer requests and visitor contact (linked to J5 and J7).
- [ ] Sample-content policy: which fixtures may exist in non-production and how they are labelled.

### 4.5 Member journey redesign specs

Each journey lists goal, user story, scope, screens and components, acceptance criteria and test plan. Decisions are in §4.5.0.

**4.5.0 Decisions needed (block the specs marked ⛔)**
- D1 Events as a bottom tab (recommended yes; replaces More in the bar).
- D2 Self-registration: open, invite-code only, or staff-approved? (⛔ J1)
- D3 Approved Swahili Bible translation and quotation permission. (⛔ J3, Home verse)
- D4 Giving: in scope for this phase or deferred? (⛔ §4.6)
- D5 Photo use and consent for each branch. (⛔ M1, M2, M3)
- D6 Prayer visibility: private to pastoral team, shared with group, anonymous option? (⛔ J5)
- D7 Terminology: "Huduma" means both services (concept staff.png) and ministries (member.png). Pick one per concept.
- D8 Brand name: "Mito Ya Baraka Church" with or without "Tanzania" in product copy.
- D9 Confirm commerce is removed from the design (DX-31).
- D10 Reading: keep browser open (DEC-15) or approve an in-app reader. (⛔ J6)

**J1 Onboarding, sign-in and registration** ⛔ D2
- Goal: a new member can create an account or join with a code, and a returning member can recover access, without help from staff.
- User story: As a new member, I want to join my church with an invite code or sign up, so that I can see my church's events and library.
- In scope: sign-in (email or phone + password), register (name, email or phone, password, church or invite code), email or phone verification, password recovery, Google sign-in if approved, language choice before sign-in, branding on the first screen.
- Out of scope: staff approval workflow, payment.
- Screens and components: `app/(auth)/sign-in.tsx` (split into welcome, sign-in, register, verify, recover); `ui/text-field.tsx` (error association, `autoComplete`, `textContentType`); `ui/button.tsx`; brand header; language segmented control.
- Acceptance: each field has a visible label and error text; invalid credentials return one neutral message and do not reveal whether the account exists; the form keeps the email on error; keyboard does not cover the focused field; verification code field accepts paste; the church name appears before sign-in; all strings are in the catalogue in both languages.
- First-run empty states: no events → "No events yet. Your church will post events here." plus "Notify me" if approved; no announcements → short reassurance; no membership → explain how to join with a code.
- Test plan: unit tests for validation and error mapping (`apps/mobile/tests`); API contract test for register and recover; device test on Android 8–13 at 360 dp with keyboard open; VoiceOver and TalkBack walk-through; sw locale walk-through with native reviewer.

**J2 Finding my church, joining a second church, switching** ⛔ none (depends on D5 for photos)
- Goal: a member with several memberships can see which branch is active, switch safely, and browse another branch without changing membership.
- User story: As a member of two branches, I want to switch between them, so that I see the right services and announcements.
- In scope: context chip on Home (active branch, tap opens sheet); sheet lists only accessible memberships with HQ default; "View branch" opens the public profile and does not switch context; join with invite code (from J1); switching shows a confirmation toast and resets tab data (uses the existing `contextKey` remount, `(member)/_layout.tsx:14`).
- Out of scope: creating new churches; managing branch data.
- Screens and components: `components/branch/branch-sheet.tsx` (new, `ui/sheet`), `components/home/context-chip.tsx` (new), `church.tsx` (public branch view), `spaces-section.tsx` retired for member context.
- Acceptance: the active branch is always visible on Home and Events; a switch refreshes Home, Events and Announcements without stale rows (R-MOB-02); a branch the user cannot access is not listed; public browsing never changes `activeChurchId`; sheet closes on Android back and has a visible close button.
- Test plan: state tests for context switch (extend `tests/request-gate.test.ts`); manual switch between HQ and a second branch with different events; screen-reader order check; check that the server rejects an inaccessible switch.

**J3 Announcements: reading detail, rich text, images**
- Goal: a member can read a full announcement, with formatting and pictures, in the language it was written in.
- User story: As a member, I want to open an announcement and read all of it, so that I do not miss dates or instructions.
- In scope: announcement card with `onPress`; detail screen with title, date, branch, body (sanitised rich text: headings, lists, links, images); share; unread indicator tied to the inbox.
- Out of scope: comments, reactions, audience editing (staff side).
- Screens and components: `app/(member)/announcements/[id].tsx` (new); `components/content/rich-text.tsx` (new, allow-list renderer, no HTML `WebView`); `components/home/home-cards.tsx` `AnnouncementCard` becomes pressable.
- Acceptance: no HTML is shown as raw text; images have alt text or are decorative; links open in the browser after a confirmation for external domains; long titles wrap; Swahili and English text both display with no clipped lines at 200 % font scale; the screen reads top-to-bottom for a screen reader.
- Test plan: renderer unit tests with malicious markup (script tags, `javascript:` links); visual baseline at 360 dp and 390 dp; API check that body is delivered as sanitised or plain text.

**J4 Events and RSVP**
- Goal: a member can see the next service and events, and say whether they are coming, in two taps.
- User story: As a member, I want to RSVP to an event, so that the church can plan seating and food.
- In scope: Services / Events segmented control (exists, keep); tab bar Events (D1); event card with date block, place, time and RSVP pill; detail with RSVP segments (Going, Maybe, Can't go); success haptic and toast; offline-safe retry.
- Out of scope: ticketing, payments, capacity management.
- Screens and components: `(member)/events.tsx`, `events/[id].tsx`, `components/events/*`; `ui/segmented.tsx` (promoted).
- Acceptance: RSVP changes are visible immediately and rolled back with a message on failure; past events are hidden or labelled; time shown in Dar es Salaam time with the locale's time format (DX-26); service schedule uses catalogue strings only (DX-19).
- Test plan: `apps/mobile/tests` for RSVP mapping (extend existing `model.ts` tests); API integration for `PUT /events/:id/rsvp`; manual check with a past event and a cancelled event.

**J5 Prayer request** ⛔ D6
- Goal: a member can ask for prayer with clear control over who sees it, and know what happens next.
- User story: As a member, I want to share a prayer need privately, so that I get support without sharing it publicly.
- In scope: visibility choice (private to pastoral team, shared with my group, anonymous), character limit, confirmation with expected follow-up time (only if the church commits to one), submitted state and list of own requests (if approved).
- Out of scope: public prayer wall, prayer counting.
- Screens and components: `(member)/prayer.tsx` restructured; `ui/segmented` or `ui/radio-group`; confirm dialog before submit is optional.
- Acceptance: the visibility choice is required and defaults to the most private option; the copy states who can see the request; the text is kept on failure; success is announced to screen readers.
- Test plan: unit test for empty and too-long input; API test that anonymous requests omit identity; privacy copy reviewed by church before release.

**J6 Library: finding, reading and listening**
- Goal: a member can find a resource, understand its access status, and open or play it in a way that suits them.
- User story: As a member, I want to find a sermon or book and open it, so that I can read or listen when I am at home or travelling.
- In scope: library list with search and category chips (exists), covers with real artwork when approved, detail with description and access status, open (browser per D10), progress shown as a bar, sermon audio playback with transcript when available. Limited offline only for explicitly downloaded eligible content.
- Out of scope: store, purchases, prices, managed download storage (deferred, `DESIGN.md:48`).
- Screens and components: `(member)/library.tsx`, `library-catalog.tsx`, `library-detail.tsx`; `components/library-media.tsx` (covers from approved art, fallback to the existing tone icons); progress bar component.
- Acceptance: unavailable and expired items explain why and offer a retry; search has an empty state with a clear reset; progress saves when the user leaves the screen; audio controls have labels and 44 px targets; no price or cart appears.
- Test plan: `apps/mobile/tests/restore.test.ts` covers progress restore; manual test with an audio file and a PDF on Android 8 and iOS; screen-reader pass on controls.

**J7 Profile: photo, details and language**
- Goal: a member can keep their details and photo up to date and change language, in one place.
- User story: As a member, I want to take or choose a photo of myself, so that staff recognise me.
- In scope: avatar with camera badge; choose from camera or gallery; crop to square; size and type limits; remove photo; name, email and phone edit; language segmented control; staff switch (authorised users only, D5 consent for any sample imagery).
- Out of scope: family or household linking (policy unresolved, `screen-specification.md`).
- Screens and components: `(member)/profile.tsx`; `ui/avatar.tsx`; picker and crop component (new); `spaces-section.tsx` for staff switch.
- Acceptance: the URL text field is gone; a failed upload keeps the previous photo; the photo is stripped of location metadata; language change applies without restart; the save button shows progress and a success toast.
- Test plan: unit test for file size and type checks; API test for upload limits; device test for permission denial (camera and photos), both platforms.

**J8 Notifications**
- Goal: a member sees what is new and can act on it without digging.
- User story: As a member, I want to see unread messages from my church, so that I do not miss important notices.
- In scope: bell in the brand header with unread badge (count only, no content in the badge); inbox list with unread and all filters (exists); mark-as-read on open (exists); empty state; deep link to announcement or event when target is supported.
- Out of scope: push notifications (later phase, needs device-token design and consent); sound and vibration settings.
- Screens and components: `(member)/inbox.tsx` (exists); brand header; `components/events/model.ts` `describeNotification`.
- Acceptance: badge count matches server `unreadCount`; the bell is a labelled button; unread state is announced; read state changes without a full reload.
- Test plan: existing inbox logic with extended tests for badge; manual check of mark-all failure path.

### 4.6 Giving in Tanzania (research and recommendation; decision D4)

Scope note: this is research from general knowledge, not verified against current provider documentation or contracts. Confirm every point below before any build.

- Common channels for mobile money: M-Pesa (Vodacom), Tigo Pesa (Mixx by Yas), Airtel Money, Halopesa (Halotel), plus bank transfers and cards. Most members will use mobile money from a basic phone or smartphone.
- Typical flow: the app collects a phone number in the international format (+255 7XX or 6XX), the provider or aggregator sends a push prompt to the handset (STK push) or the member dials a USSD code and enters an amount, then enters a PIN on the handset. Confirmation arrives by SMS and by webhook.
- Aggregators commonly used in Tanzania include Selcom, AzamPay and ClickPesa. Compare fees, settlement time, webhook reliability and whether they support branch-level merchant accounts. Verify current coverage.
- Constraints: amounts in whole TZS (no decimals, "TSh 15,000"); the church needs a registered merchant or business account; transactions are asynchronous, so the app must show "pending" and reconcile by webhook and polling; refunds and reversals need a process; the app must never store card or PIN data; receipts must be issued for tax and audit.
- Recommendation: phase 1 (low risk) shows giving categories, the church's official merchant numbers and instructions, and the member's own history from the existing `offerings` records. Phase 2 adds an aggregator STK push with idempotent webhook handling, after a pilot with the finance team. No store, cart or price display (DX-31).
- Acceptance for phase 2 (when approved): duplicate webhooks do not create duplicate records; pending state is visible for up to 10 minutes; a failed push offers a retry that does not double-charge; the receipt is shown and sent by SMS; Swahili prompts reviewed by a native speaker.

### 4.7 Accessibility: WCAG 2.2 AA review criteria and test plan

Review criteria (status from this audit):

- 1.4.3 / 1.4.11 contrast: fail on input borders (DX-20); pass on primary button (about 6.7:1 white on `#1D4ED8`); warning pill near miss (DX-20); verify all pairs with the generated contrast test (§4.1).
- 1.4.4 / 1.4.10 resize and reflow: untested. Fixed heights in tab bar and date block (DX-36). Web at 320 CSS px and 400 % zoom to test.
- 1.3.1 / 4.1.2 names, roles, values: good baseline (roles on buttons, tabs, radios). Gaps: `TextField` label is a separate `Text` (`text-field.tsx`); verse card speaks as one block (acceptable).
- 2.4.6 / 2.4.7 headings and focus: headings set on several screens (`accessibilityRole="header"`); web focus visibility untested; mobile has no focus concept.
- 2.5.5 / 2.5.8 target size: 44 px minimum is mostly met; the AI pill is 40 px minimum (`ai-header-button.tsx`); fix.
- 2.5.7 dragging: any bottom-sheet drag must have a button (J2).
- 2.3.3 motion: no reduced-motion handling (not needed while there is no motion; required once §4.3 lands).
- 3.3.1 / 3.3.3 error identification and suggestion: sign-in gives one generic message (good) but does not say which field is wrong.
- 3.3.7 / 3.3.8 redundant entry and accessible authentication: verify that the password field allows paste and password managers (`sign-in.tsx`).
- 3.3.2 labels: placeholders duplicate labels (`sign-in.tsx:36-37`); keep labels visible.

Test plan:
1. Automated: contrast unit test (§4.1); eslint-plugin for React Native accessibility on `apps/mobile`; `@axe-core/playwright` on web portal and sign-in pages.
2. Manual screen reader: VoiceOver (iOS) and TalkBack (Android) on sign-in, Home, Events, one library item, profile edit and inbox; record reading order.
3. Font scale: Android 200 % font, iOS largest accessibility size, at 360 dp and 390 pt widths; no clipped essential text.
4. Motion: reduced motion on, check no slides or looping motion.
5. Web: keyboard only (Tab order, Esc closes sheets, focus returns to trigger), zoom 200 % and 400 %, Lighthouse accessibility score recorded.
6. Colour vision: simulate protanopia and deuteranopia on Pills (RSVP states, unread vs read). Never encode state by colour alone (`DESIGN.md:26`).
7. Evidence: record results per criterion in `docs/roadmap/audits/` in a follow-up; R-QA-02 owns the device evidence.

### 4.8 i18n workflow spec and Swahili glossary

Workflow:
1. Keys: `surface.screen.element` (for example `mobile.member.events.empty`). Vars in `{name}`. No concatenated sentences.
2. Source: English first. Swahili translator writes in the same PR; native reviewer approves before merge (label `sw-review-pending` until approved).
3. Gates (CI): key parity (existing test, keep); no identical en/sw values unless allow-listed (catches DX-01); no string literal in JSX (lint rule, DX-19); plural keys go through `plural()` (DX-24); length budget: Swahili strings may be up to 30 % longer; screenshot tests in both locales.
4. Reviewer: one named fluent speaker per church area (worship, admin, technical). Reviews run in batches of 50 keys with the screen screenshot beside them.
5. Glossary file `docs/i18n/glossary.sw.md` (new) is the only source for church terms; translators cite it.
6. Freeze: product copy freezes for release; changes after freeze need reviewer sign-off.

Glossary (draft; every row needs native review; flagged rows need a decision):

| English | Proposed Swahili | Notes for reviewer |
|---|---|---|
| Church | Kanisa | Common |
| Branch | Tawi | Concept uses "Tawi (Branch)" |
| Headquarters | Makao Makuu | Concept uses "Tawi Kuu"; confirm which the church uses |
| Pastor | Mchungaji | Common |
| Lead pastor | Mchungaji Kiongozi | Confirm title used by church |
| Worship service | Ibada | Common |
| Ministry | Huduma | See D7 (conflicts with "services") |
| Events | Matukio | Concept term |
| Upcoming events | Matukio yajayo | Draft |
| Service schedule | Ratiba ya ibada | Draft; current code uses "Ratiba ya huduma", which conflicts with D7 |
| Small group / home group | Vikundi vya Nyumbani | Concept term |
| Prayer | Maombi | Common |
| Prayer request | Ombi la maombi | Draft |
| Offering | Sadaka | Common |
| Tithe | Fungu la Kumi | Reviewer to confirm. "Zaka" is common in some Tanzanian churches but is the Islamic term, so do not default to it |
| Pledge | Ahadi | Draft |
| Announcements | Matangazo | Draft |
| Sermon | Mahubiri | Draft |
| Attendance | Hudhurio | Draft |
| Visitor | Mgeni | Draft |
| Follow-up | Ufuatiliaji | Draft |
| Member | Mwanachama / Wanachama | Singular and plural |
| Leader | Kiongozi / Viongozi | Draft |
| Library | Maktaba | Concept term |
| Book | Kitabu | Concept term |
| Register | Jisajili | Draft |
| Sign in | Ingia | Draft |
| Sign out | Toka | Draft |
| Welcome | Karibu | Concept term |
| Join | Jiunge | Concept term |
| RSVP ("I'm coming") | Thibitisha ushiriki | Draft; reviewer may prefer a shorter phrase |
| Notification | Arifa | Draft |
| Offline | Nje ya mtandao | Draft |
| Download | Pakua | Concept term |
| Bible | Biblia Takatifu | Version per D3 |

Time and date conventions (for reviewer): Dar es Salaam is UTC+3 with no DST (`components/events/format.ts:5` uses a fixed offset: correct). Swahili clock hours count from sunrise and dawn; confirm whether to show 24-hour time, "saa 3 asubuhi" style, or both. Currency: "TSh 15,000"; check the church's preferred separator.

### 4.9 Content design

Tone: warm, plain and respectful; short sentences; no jargon ("sync", "endpoint"); scripture quoted accurately and never paraphrased as if it were quoted; no exclamation marks in errors.

Error copy pattern: what happened, then what to do. Never blame the user; never expose server codes.

| Situation | English (draft) | Swahili (draft, for review) |
|---|---|---|
| Wrong email or password | "That email and password don't match. Check them and try again." | "Barua pepe au nenosiri si sahihi. Hakikisha na ujaribu tena." |
| No connection | "You're offline. We'll try again when you're connected." | "Hakuna mtandao. Tutajaribu tena ukiunganishwa." |
| Prayer request empty | "Write your prayer request before sending." | "Andika ombi lako la maombi kabla ya kutuma." |
| No upcoming events | "No events yet. Your church will post them here." | "Hakuna matukio bado. Kanisa lako litayaweka hapa." |
| Library item unavailable | "This item isn't available to you right now. Ask your church office if you think this is wrong." | "Kitabu hiki hakipatikani kwako kwa sasa. Wasiliana na ofisi ya kanisa ukiona kuna kosa." |
| Save failed | "Your changes weren't saved. Your details are still here. Try again." | "Mabadiliko yako hayakuhifadhiwa. Taarifa zako bado zipo. Jaribu tena." |

Rule: server messages are shown only after they are translated or approved; generic fallback otherwise (sign-in currently shows `apiError.message` raw, `(auth)/sign-in.tsx`).

### 4.10 Design QA setup

- **Web visual tests:** Playwright `toHaveScreenshot` in `apps/web/tests/visual/`. Viewports 360×800, 390×844 and 1280×800. Locales en and sw. Light and dark. Freeze the clock (Playwright clock API) so the verse of the day, "Yesterday" and relative times are stable. Mask avatars and any live data.
- **Mobile gallery:** a dev-only route `apps/mobile/app/__gallery.tsx` that renders every `components/ui` primitive and every state (loading, empty, error, offline, pill tones) in both schemes and both locales. Gate with `__DEV__` and exclude from release builds. Owner: QA lane.
- **Mobile flows:** Maestro flows in `apps/mobile/.maestro/` for sign-in, Home, Events RSVP, Library open, Profile edit. Screenshot at each step; compare against baselines per device.
- **Storybook:** optional. Use the gallery first; add Storybook only if component count grows past the gallery's maintenance cost.
- **Device matrix (verify minimum API against SDK 58 before promising Android 8):**
  - Android low-end (about 2 GB RAM): Android 8 or 9, Android 10, Android 13.
  - Android narrow: 360 dp width.
  - iOS: smallest supported iPhone (for 375 pt), current iPhone for regression.
  - Font: Android 200 %, iOS largest accessibility size.
  - Network: throttled 3G and airplane mode.
  - Locale: device language en and sw.
- **Baselines:** store in git LFS or a CI artifact store, not inline. A visual change needs a designer's approval in the PR.
- **Evidence:** links to screenshots and results go in the follow-up audit record (R-QA-02).

## 5. Suggested parallel work lanes

File ownership is exclusive within a lane. Shared files (`components/ui/**`, `theme/**`) belong to Lane 1 only; other lanes request changes through Lane 1.

| Lane | Scope (owned files) | Start condition | Notes |
|---|---|---|---|
| 1. Tokens and UI kit | `packages/ui-tokens/**` (new); `apps/mobile/theme/**`; `apps/mobile/components/ui/**`; `apps/web/app/globals.css`; `apps/web/tailwind.config.ts` (confirm and remove if dead) | None | Blocks lanes 2, 4, 8. Fix DX-20 here |
| 2. Member mobile journeys | `apps/mobile/app/(member)/**` except sign-in; `components/home/**`; `components/events/**`; `components/library-media.tsx`; `components/branch/**` (new); `components/content/**` (new) | Lane 1 PR merged | Owns `(member)/_layout.tsx` (DX-04) |
| 3. Auth and onboarding | `apps/mobile/app/(auth)/**`; `apps/mobile/lib/session.tsx`; `apps/mobile/lib/api.ts`; `apps/mobile/components/spaces-section.tsx`; `apps/api/src/auth/**`; `apps/web/app/auth/**` | D2 decided | J1 and J2 context; R-MOB-01 interacts with session code |
| 4. Staff mobile | `apps/mobile/app/(staff)/**`; `components/staff-read-screen.tsx` | Lane 1 PR merged | R-MOB-05 scope; read-only first |
| 5. i18n | `packages/config/src/i18n/**`; `docs/i18n/**` (new glossary); `packages/config/.eslintrc.cjs` (literal rule) | None | String moves in other lanes go through this lane's PR or are coordinated |
| 6. Brand and assets | `apps/mobile/assets/**` (new); `apps/mobile/app.json`; `apps/web/public/**`; `docs/brand/**` (new) | Church supplies kit (§4.4) | Blocks DX-02, DX-09 wiring |
| 7. QA and gallery | `apps/web/playwright.config.ts` (new); `apps/web/tests/visual/**`; `apps/mobile/.maestro/**` (new); `apps/mobile/app/__gallery.tsx` (new, dev-only) | Lane 1 for gallery content | Runs after lanes 1–2 have first screens |
| 8. Web portal | `apps/web/app/[churchId]/portal/**`; `apps/web/components/portal/**`; `apps/web/components/layout/**` | Lane 1 | DX-34, DX-19 web strings |

Recommended order: (a) Lane 5 and DX-01 content fix in parallel with Lane 1; (b) Lane 1 token package; (c) Lane 2 nav, header and branch chip; (d) Lane 3 J1 after D2; (e) Lanes 4 and 8; (f) Lane 6 wires assets as they arrive; (g) Lane 7 baselines once screens settle.

Decisions to request from the owner before lanes 2 and 3 start: D1, D2, D5, D6, D10. D3 and D4 can wait until their journey starts.
