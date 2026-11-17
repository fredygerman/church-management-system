# Staff operations and design system

Status: Not started. Planning only.

## Facts checked against code
- Existing staff dashboard and modules are under `apps/web/app/[churchId]/dashboard/**`; current navigation lives in `apps/web/config/sidebar.ts` and routes in `config/routes.ts`.
- Existing members, visitors, events, attendance, departments, zones, communications and reports have API/actions; `apps/web/app/[churchId]/dashboard/analytics/page.tsx` is documented as Coming Soon.
- `apps/web/components/permissions/permissions-viewer.tsx` exists; do not add a top-level Permissions tab from concept boards.
- Proposed staff tabs Dashboard/People/Services/Content/More and AI beside notifications are in product design docs, not current behavior.

## Acceptance rows
| State | Result | Proof |
|---|---|---|
| Staff user with scoped role opens module | Only authorized branch data/actions shown | route and API permission tests |
| Unauthorized user enters staff URL/action | Denied without private data leakage | guard tests |
| Reports have no data/error/date filter | Clearly labeled empty/error and stable filter results | page/service tests |
| Staff switches space | Same account preserved; unauthorized switch denied | auth/navigation test |
| Narrow screen/keyboard/EN-SW | IA remains usable, focus visible and labels translated | responsive/accessibility/localization checks |

## Work split
S1 dashboard/report content and error states: dashboard pages/actions only after foundations decision; separate analytics endpoint decision PLAT-DEC-04. S2 staff navigation and More/space switch: `apps/web/config/sidebar.ts` and shell components, exclusive writer. S3 staff communications: existing `apps/web/actions/communications.ts` and communications pages, with email capability decision PLAT-DEC-05; no promise of email delivery. S4 staff settings/role management: existing permission UI/routes, policy decision PLAT-DEC-06. Exclude payment/giving expansion and broad permission redesign.

## Design implementation
Design task D1 owns proposed `apps/web/app/globals.css` token definitions only. D2 owns proposed `apps/web/components/layout/**` responsive primitives. D3 owns isolated feature adoption only after D1/D2 complete. Design references are `docs/product-design/DESIGN.md`, screen spec and implementation checklist. Require contrast, 44px touch targets, safe areas, zoom, focus, reduced motion, dynamic text, EN/SW parity and state coverage.

## Migration/checks/handoff
No migration unless role or report data model gap is proven; schema lane serialized. Verify changed permission/locale keys across tests, API permission/tenant tests, route smoke, OpenAPI, accessibility and responsive human review. Not started; no source changes. D1 precedes D2; S groups can work independently once shared navigation owner is scheduled.
