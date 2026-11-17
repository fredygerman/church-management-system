# Mobile product and delivery specification

Status: proposed; blocked on stack/product decisions; implementation not started. Design sources: `docs/product-design/{README.md,DESIGN.md,screen-specification.md,implementation-checklist.md,visual-audit.md}`. Group plan: `docs/shipwave/platform/groups/mobile.md`.

## Objective and boundaries

Proposed mobile client for **Mito Ya Baraka Church**, HQ first. Repository currently has API and web packages, no mobile app. `apps/mobile/` with Expo/Expo Router is a recommendation, not an approved stack. Member and authorized staff spaces share one account with explicit switching. Member nav: Home, Church, Events, Library, Profile. Staff nav: Dashboard, People, Services, Content, More. AI is beside notifications in the top bar and opens a dedicated page.

Public branch browsing is distinct from selecting an active membership. Operational views/actions use an authorized selected membership and show context; public browsing never silently changes membership. HQ is initial context. Library and account are shared where item access permits. Do not call the old common guard a proven tenant leak: verify each endpoint/service. The checked `ChurchContextGuard` extracts church context and allows super_admin; membership-aware behavior requires route-specific verification.

## Facts checked against code

- Root `package.json` uses pnpm/Turbo and filters builds to API/web; no mobile package exists.
- Web portal routes exist for events, profile, family, prayer, announcements and giving goals. They do not prove mobile support.
- Swagger setup exists in `apps/api/src/main.ts`.
- `apps/web/actions/dashboard.ts` calls `/dashboard/stats`; no corresponding API controller was found. The action masks errors as zero-like values. Verify before mobile dashboard integration.
- `JwtRefreshStrategy` checks refresh token type and user existence/deletion. End-to-end mobile session compatibility still needs a contract check.
- Upload controller/service exist; document metadata methods are stubs per existing plans and need verification before mobile use.
- Communications has campaign concepts; email capability is incomplete. Do not promise mobile sending without verified contract/capability.
- Current audit found no CI/web test suite. Mobile commands are proposals until an app package exists.
- No mobile app, member home, mobile profile edit, library/reader or AI implementation was evidenced in inspected paths.

## Acceptance matrix

| Input/state | Visible result | Proof |
|---|---|---|
| Signed-out user opens app | Sign-in and permitted public church info; clear errors/retry | Auth-flow test and API session contract |
| User has multiple memberships | Selector lists only authorized memberships and shows active context | Context test including denied membership |
| User browses another public branch | Public profile without changing active membership | Navigation/context test |
| Member opens Home/Church/Events/Profile | Correct context, loading/empty/error states, no fabricated metrics | Screen and endpoint contract tests |
| User submits supported RSVP/prayer/profile change | Success confirmation; validation/permission/network errors preserve safe input | Focused endpoint tests; unsupported action visibly unavailable |
| User opens Library | Shared search/resources and honest access state; no invented price | Contract and empty/error tests |
| User downloads eligible item | Progress/failure/storage/removal/offline states | Download lifecycle tests; no blanket offline claim |
| Staff switches spaces | Same account; staff actions only when authorized; return path works | Positive and negative permission/route tests |
| AI/notification unavailable | Clear unavailable/permission state; no fabricated answer/data | Contract/error tests; AI blocked without policy approval |
| Any device size/state | Safe areas, text scaling, keyboard/focus, names, contrast, no essential truncation | Accessibility checks and human device review |

## Delivery sequence

See group plan for M0-M4 IDs, leads, dependencies and concurrency. Foundation/contracts precede member journeys and shared library; staff/AI/notifications follow auth/permission contracts; readiness follows integration. No assumption mobile requires API changes. Contract gaps need separately approved ownership. Mobile has no migration ownership.

## Decisions required before dispatch

| Decision | Recommended default | Status |
|---|---|---|
| Native stack/path | Expo + Expo Router at `apps/mobile/` | Blocked pending human acceptance and toolchain review |
| First release | Member core first, staff/library behind capability gates | Blocked pending approval |
| Branch and membership rules | HQ context; public preview distinct from membership | Proposed in design; confirm membership and temporary browsing policy |
| Household/prayer privacy | Do not exceed existing authorized API behavior | Expanded flows blocked on policy owner |
| Staff roles | Server authorization authoritative; UI reflects branch permissions | Verify actual contracts; no assumed role matrix |
| AI sources/provider/retention/actions | No integration before policy/provider decision | Blocked |
| Languages | English and Swahili planned, fluent review required | Confirm launch languages/reviewers |
| Library commerce/access | No purchase flow/price promise; eligible free/owned content only if API supports | Commerce deferred; access policy open |
| Offline | Explicit selected downloads only; full offline excluded | Proposed design direction |
| Store setup/publishing | Deferred | Out of scope |
| Checkout/monitoring | Shared checkout, disjoint ownership; coordinator only, no automatic monitor | Planning default |

## Checks, migration and release

No mobile package exists, so lint/typecheck/focused-test/Expo export commands must be defined after M0 and are proposals, not currently runnable scripts. Run focused task checks; one serialized full mobile typecheck/export per integration batch. Inspect package scripts before selecting API/OpenAPI checks. No repo-wide formatter or concurrent installation/generator. Search all tests referencing changed routes, components, contracts or permission keys. Human verification must cover signed-out/member/multiple-membership/staff-denied journeys on simulator/device, EN/SW, accessibility and verified real content.

Mobile owns no schema, migrations, production deployment or store credentials. A required schema change stops that slice for separately assigned migration ownership. No production changes or publishing.
