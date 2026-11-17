# Screen specification

Proposed behavior for review, not a statement of existing implementation. All screens need loading, failure, and empty states where applicable; protected actions also need a permission-denied state. Branch context is visible on operational screens. HQ is the initial context.

| Screen | Core behavior | Required states / notes |
| --- | --- | --- |
| Welcome / public Church | Explain church, services, public branches, sign-in entry | Loading, unavailable, no public branches; do not require an account for public information |
| Sign in / register / recovery | Authenticate, validate, recover account | Invalid fields, pending, network error, success; accessible labels and password visibility |
| Member Home | Selected-branch highlights, next service, announcements, shortcuts | No upcoming items, offline, branch context, authorized staff switch |
| Branch selector | Choose an accessible membership context | HQ default; pending/error; public branch preview is a separate route/action |
| Branch profile | Public details, verified contacts and services | Missing/unpublished fields; viewing does not alter active membership |
| Events / services | Search/filter list, detail, registration where supported | No results, full/cancelled, registration confirmation/failure; display verified local time/location |
| Member profile | View/edit personal details and account | Validation, save/error; staff switch only when authorized |
| Family / household | View/manage linked household subject to policy | No household, invite/pending, restricted member; privacy and consent rules unresolved |
| Prayer requests | Submit and manage own requests with explicit visibility choice | Empty, submitted, failed; sensitive content, consent, and staff access policy must be decided |
| Library | Shared search, categories, resource details and access | Empty/search no results, loading/error; do not imply branch-scoped inventory by default |
| Resource detail / sample | Show verified metadata, preview and access status | Free/owned/restricted; no fabricated price; commerce action remains deferred |
| Media player | Play eligible sermon/audio with accessible controls | Buffering, paused, unavailable, offline; transcript/captions when available |
| Personal library / downloads | List owned and downloaded items, remove download | Downloading, paused, failed, storage limit, offline; explicit eligible downloads only |
| Reader | Read accessible text, adjust type size/theme, resume position | Loading/error/offline availability; preserve progress and accessible navigation |
| Notifications | Read and navigate to relevant content | Empty, unread/read, permission disabled; do not expose private details in previews by default |
| Staff Dashboard | Branch-scoped operational overview and shortcuts | Permission-filtered cards, no metrics, loading/error; fabricated board metrics never used |
| People directory | Search/filter members and visitors, open record | Empty/no results, restricted fields, error; server-authorized access and pagination |
| Person / family detail | View or edit permitted records and follow-up | Read-only, validation, save/error, audit-sensitive actions; household access policy unresolved |
| Visitor follow-up | Track permitted follow-up tasks | Empty, due, completed; contact consent and assignment rules unresolved |
| Services / attendance | Manage schedule and record attendance | No services, date/service filter, duplicate prevention, save/error; branch-scoped |
| Content | Draft, review, schedule or publish authorized content | Draft/scheduled/published/failed; approval roles and content ownership unresolved |
| Communications | Prepare and send authorized announcements | Draft/preview/confirm/sent/error; audience and consent controls; avoid accidental broad sends |
| Reports | View permitted branch-scoped summaries | No data, date filter, loading/error; label definitions and export permissions required |
| Staff settings / roles | Manage permitted branch, account, notifications, roles | Read-only for unauthorized users, confirmation for consequential changes, audit trail |
| AI conversation | Ask questions; show source links and contextual event/service/resource cards | Empty, generating, unavailable, uncertain, no sources; show branch for branch answers, enforce permissions, provide report/feedback path |
| Member/staff switch | Change space within same signed-in account | Only for authorized staff; preserve return path; deny unauthorized access without leaking staff data |

## Responsive behavior

Phone uses member bottom tabs Home/Church/Events/Library/Profile and staff bottom tabs Dashboard/People/Services/Content/More. Desktop uses matching sidebar navigation. Search, filters, and table actions remain available at narrow widths. Reader and media views prioritize content and may suppress global navigation while focused. AI is always discoverable from the top bar beside notifications and opens a dedicated page.
