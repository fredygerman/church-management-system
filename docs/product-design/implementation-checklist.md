# Implementation acceptance checklist

Use this to review the final vision against an accepted candidate. All boxes remain unverified until observable evidence is recorded; existing code/builds do not check them automatically. Current baseline `81de7d2` has substantial implemented features and 21 specified deltas in the [remediation register](../shipwave/platform/remediation-plan.md). R-DES-01 owns visual implementation; R-UX-01 owns shells/mode policy; R-QA-02 and Fredy own final human evidence. Accepted DEC-01–16 override older concept copy.

This is an acceptance inventory, not an authorization to build every illustrated feature. Commerce, sending/store activation, full offline and managed download storage remain deferred; native browser reading remains accepted. AI entry and deterministic renderer checks are distinct from deferred provider activation/live tests.

## Identity and content

- [ ] Product identity reads **Mito Ya Baraka Church**; official logo and any expanded lockup are verified.
- [ ] HQ is the initial context; every other branch, contact, service time, name, image, metric, date, title, and price is verified or clearly marked sample in a non-production environment.
- [ ] No AI-board faces, church buildings, logos, schedules, statistics, or generated text are represented as real church data.
- [ ] English and Swahili copy is reviewed by fluent speakers; dates/times and text expansion work in both.

## Information architecture and context

- [ ] Member navigation is Home / Church / Events / Library / Profile on phone and desktop.
- [ ] Staff navigation is Dashboard / People / Services / Content / More on phone and desktop.
- [ ] Branch switching applies only to accessible membership contexts; public branch browsing is a separate action and never silently switches membership.
- [ ] Branch-specific operations and AI answers show context and enforce server-side permissions.
- [ ] Account and shared library remain available across branch contexts subject to item access rules.
- [ ] Authorized staff can switch from member Home/Profile and return from staff More in the same account.
- [ ] AI is beside notifications in the top bar and opens a dedicated conversation page.

## UI system and responsive behavior

- [ ] Proposed semantic color, type, spacing, and radius tokens are used consistently and pass WCAG AA contrast.
- [ ] Phone layouts use readable single-column content, safe-area-aware bottom navigation, and 44 px minimum touch targets.
- [ ] Desktop layouts use matching information architecture, with readable content widths and keyboard-accessible side navigation.
- [ ] Tables, dialogs, menus, search, and filters remain usable at narrow widths and browser zoom.
- [ ] No essential copy is truncated; dynamic type, text expansion, and reduced motion are supported.

## States, accessibility, and policies

- [ ] Each data-driven screen has loading, empty, failure/retry, and offline behavior where relevant.
- [ ] Protected screens/actions explain denied access without exposing private records.
- [ ] Forms identify errors, preserve safe user input, and announce asynchronous results to assistive technology.
- [ ] Keyboard focus is visible and logical; dialogs trap/restore focus; icon-only controls have accessible names.
- [ ] Prayer, household, visitor contact, staff roles, content review, and AI data handling follow approved privacy and consent policies.
- [ ] AI indicates uncertainty and source links where available; it cannot bypass the user's branch or role permissions.
- [ ] Browser-based eligible signed-resource access handles expiry/retry honestly. Managed downloads/storage/removal and full offline are explicitly deferred rather than implied as implemented.
- [ ] Store accounts, agreements, publishing, and unapproved commerce flows remain deferred.
