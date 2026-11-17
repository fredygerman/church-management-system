# Implementation acceptance checklist

Use this to review a proposed implementation. It is not evidence that any item is already implemented.

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
- [ ] Offline downloads are explicit, eligible-content-only, removable, and show storage and failure states; full offline use is not implied.
- [ ] Store accounts, agreements, publishing, and unapproved commerce flows remain deferred.
