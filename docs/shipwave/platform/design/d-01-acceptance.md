# D-01 design acceptance artifact

Current correction baseline: `81de7d2`, 2026-11-26. DEC-01–16 are accepted as individually recorded in [decisions](../decisions.md). Expo, AI read-only integration, private storage and dashboard metrics are implemented in code; AI provider activation/live testing remain deferred. Human design acceptance has not been performed. Current design/shell ownership is R-DES-01/R-UX-01 in [product/design remediation](../specs/remediation-product-and-design.md), coordinated with [mobile/quality](../specs/remediation-mobile-and-quality.md).

The matrix below is a **historical acceptance-planning snapshot**, not a current implementation inventory. Its pending-decision, missing-source and unavailable-AI cells describe the original checkpoint. Preserve its intended state/permission questions, but use the current specs and [21-ID register](../remediation-plan.md) for implementation dispatch. Four visual boards remain illustrative; commerce and invented copy remain excluded.

## Surface acceptance matrix

| Screen | Purpose | Data source | States required | Permission/context rule | AI/library/payment gating | Open questions |
|---|---|---|---|---|---|---|
| Member Home | Selected-branch highlights, next service, announcements, shortcuts, and authorized staff switch. | `getMyAnnouncements(churchId)` in `apps/web/actions/portal.ts`; next-service/highlights source not verified. | Loading; empty/no upcoming items; error/retry; offline; denied where protected; switch confirmation. | HQ first. Branch browsing is distinct from switching membership; only memberships authorize operational context. | AI unavailable while DEC-08 is pending. Shared library may be linked; no payment or price claims. | Define verified Home composition and next-service source; confirm staff-switch permission. |
| Church | Public church/branch profile, contacts, and services; browsing must not change active membership. | `getChurches()`/`getChurchById()` in `apps/web/actions/church.ts`; public profile fields not verified. | Loading; unavailable/missing fields; empty public branches; error/retry; denied only for protected data; browse confirmation if needed. | HQ first for signed-in context. Public branch preview is a separate route/action and never silently switches membership. | AI unavailable. Library is shared by default; no payment or price claims. | Confirm public-field contract, verified contacts, and branch-preview route. |
| Events | Search/filter events and support RSVP where available. | `getEvents()`, `getMyEventRsvps()`, `setMyRsvp()` in `apps/web/actions/event.ts`; existing portal route is `portal/events`. | Loading; no results; full/cancelled; error/retry; offline where cached; denied; RSVP confirmation/failure and duplicate/repeat validation. | Show active branch on branch-scoped events; network events remain explicitly network-scoped. Membership authorizes operational actions. | AI unavailable. No paid-event or price claims; library unrelated unless linked by verified content. | Confirm search/filter and local-time contract; verify event capacity/closed semantics. |
| Library | Shared search, categories, resource details, reader/media, and eligible downloads. | Not verified in `apps/web/app/[churchId]/portal` or `apps/web/actions`. | Loading; empty/search no results; error/retry; offline for eligible downloads/reader; denied/restricted; download/remove confirmation. | Shared across branch contexts unless an item is explicitly branch-restricted; access checks are server-side. | AI unavailable. No payment, purchase, price, store-account, or commerce claims; DEC-09 storage is private bucket only. | Identify W-05 content actions and verified metadata/access contract. |
| Profile | View/edit personal details and account; offer authorized staff switch. | `getMyProfile(churchId)` in `apps/web/actions/portal.ts`; update action not verified in the portal page. | Loading; missing/unlinked profile; validation; save/error/retry; denied for another member; offline; save confirmation. | Own profile only. HQ first; staff switch is authorization-gated and preserves account/context. | AI unavailable. Account/library access may persist across contexts; no payment or price claims. | Confirm self-update action and fields; confirm switch/return behavior. |
| Staff Dashboard | Branch-scoped operational overview and shortcuts with truthful metrics/states. | `getDashboardStats()` in `apps/web/actions/dashboard.ts`; dashboard route composition not verified. | Loading; no metrics/unavailable; error/retry; denied; offline where relevant; consequential action confirmation. | HQ first, then selected authorized membership context; server filters every card/action. | AI unavailable. No fabricated metrics, library inventory, payment, or price claims. | DEC-01 and metric semantics remain pending; confirm endpoint composition. |
| People | Search/filter members and visitors; open permitted records and follow-up. | `getMembers()`, `searchMembers()`, `getMemberById()`; `getVisitors()`, `getVisitorById()`, `createVisitorFollowup()` in actions. | Loading; empty/no results; pagination; error/retry; denied/restricted fields; offline where relevant; save/delete/follow-up confirmation. | Branch-scoped and role-filtered; only authorized memberships/roles expose operational records. | AI unavailable. No library or payment claims. | Confirm staff routes, pagination, visitor consent, and family-detail policy. |
| Services | Manage service schedule and attendance with duplicate prevention. | `getServiceTypes()`, `getServiceSessions()`, `createServiceSession()`, `manualCheckin()` in `apps/web/actions/attendance.ts`. | Loading; no services; date/service filter; error/retry; denied; offline where relevant; save/attendance confirmation. | Branch-scoped; role permission required for schedule and attendance mutations. | AI unavailable. No payment or price claims; do not imply unverified attendance metrics. | Confirm service route and which attendance fields are displayable. |
| Content | Draft, review, schedule, and publish authorized content. | Not verified in `apps/web/actions`; source/action contract is not present in the audited paths. | Loading; empty drafts; draft/scheduled/published/failed; error/retry; denied; offline draft handling; publish/send confirmation. | Branch and role scoped; approval and ownership checks server-side. | AI unavailable pending DEC-08. Library content/storage must follow W-05 and DEC-09; no commerce claims. | Identify content actions, approval roles, ownership, retention, and publish contract. |
| More | Staff account/settings, notifications, space switch, reports, and authorized communication entry points. | `getTemplates()`, `getCampaigns()`, `previewTemplate()`, `scheduleCampaign()` in `apps/web/actions/communications.ts`; settings/reports sources not verified. | Loading; empty; error/retry; denied/read-only; offline where relevant; send, role, and space-switch confirmation. | Preserve same account. Switch to member space only for authorized staff; branch operations use an authorized membership context. | AI unavailable. Shared library/account remain available; no payment, price, email-delivery, or report-metric claims. | DEC-04/05/06 pending; confirm settings, reports, notification, and switch routes. |

## Global acceptance rules

- English and Swahili copy must have parity; a fluent reviewer must review terminology, dates, times, and expansion before acceptance.
- Meet accessibility basics: text scaling/dynamic type, logical focus order and visible focus, WCAG AA contrast, semantic names/headings, minimum 44 px touch targets, reduced-motion support, and no essential truncation.
- Do not invent church names, people, contacts, schedules, events, metrics, imagery, library metadata, AI answers, or prices. Unverified values are absent or clearly marked non-production sample.
- Loading, empty, error/retry, denied, and offline states apply wherever relevant; protected actions also require clear confirmation/success or validation feedback.
- Branch browsing must never silently change active membership. Operational context is authorized by membership and enforced server-side.

## Facts to verify before build

These statements in the specs could not be confirmed from the audited portal/actions paths:

- Staff operations says: “Existing staff dashboard and modules are under `apps/web/app/[churchId]/dashboard/**`; current navigation lives in `apps/web/config/sidebar.ts` and routes in `config/routes.ts`.” Dashboard route/module wiring was not audited here.
- Staff operations says: “Existing members, visitors, events, attendance, departments, zones, communications and reports have API/actions.” The listed member/visitor/event/attendance/communications actions were found; reports/API coverage was not verified.
- Member experience says: “Active membership and branch authorization are enforced by church-context/permission guards; validate exact routes in implementation.” Guard enforcement and exact route behavior were not verified here.
- Member experience says: “DB has `packages/db/tables/userChurchMemberships.ts`, `members.ts`, `families.ts`, `prayerRequests.ts`, `events.ts`, `eventRsvps.ts`.” Database files were outside this targeted web/actions audit.

## Backlog ownership checklist

- [ ] Member Home — web `W-03`; mobile `M-01`.
- [ ] Church — web `W-03`; mobile `M-01`.
- [ ] Events — web `W-03`; mobile `M-01`.
- [ ] Library — web `W-03` member entry/integration plus `W-05` content contracts; mobile `M-01`/`M-02`.
- [ ] Profile — web `W-03`; mobile `M-01`.
- [ ] Staff Dashboard — web `W-04`; mobile `M-01`/`M-03`.
- [ ] People — web `W-04`; mobile `M-01`/`M-03`.
- [ ] Services — web `W-04`; mobile `M-01`/`M-03`.
- [ ] Content — web `W-04` plus `W-05` for library/document contracts; mobile `M-02`/`M-03` where applicable.
- [ ] More — web `W-04`; mobile `M-03`.
- [ ] AI entry/conversation and unavailable gate — web `W-06`; mobile `M-03`; both remain blocked on DEC-08.
