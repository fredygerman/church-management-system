# Mito Ya Baraka Church — product design and screen specification

Status: **concept for review**, 2026-11-16. These screens describe a proposed product, not verified existing functionality. Names, people, branches other than HQ, prices, metrics and content in visual concepts are illustrative. The first intended user is Mito Ya Baraka HQ; the design should accommodate other branches. The church's [public website](https://www.mitoyabarakachurch.org/en) describes services in Dar es Salaam and provides English and Swahili versions.

## Product shape

A member-facing app and desktop experience serves visitors and members. Authorized staff switch to a separate staff space in the same account, with its own navigation and permissions. HQ starts first; the model supports members registered with multiple Mito Ya Baraka branches. Church operations remain scoped to the selected branch; shared content and account data remain available across branches where authorized.

## Navigation

These five-tab groupings are a proposed information architecture for review, rather than a claim that every feature has been implemented.

| Member tab | Contents |
| --- | --- |
| Home | Selected branch's next services, announcements, shortcuts and staff-space entry if authorized |
| Church | Branch profile, service information, ministries, contact and branch exploration |
| Events | Services, events, event details and registration |
| Library | Shared books, sermons and resources, search, purchases and downloaded items |
| Profile | Personal information, household, prayer requests, account settings and staff-space entry if authorized |

| Staff tab | Contents |
| --- | --- |
| Dashboard | Branch overview, upcoming work and role-appropriate shortcuts |
| People | Members, families, visitors, follow-ups and departments |
| Services | Schedule, events and attendance |
| Content | Create, review and publish resources |
| More | Communications, giving reports, settings, permissions and return to member space |

Mobile uses a consistent bottom bar within each space; desktop uses a corresponding sidebar. Staff-only tabs and actions require server-enforced permissions. The switch to staff appears on member home and profile for authorized users; switch to member appears in staff More. The same account remains signed in.

## Branch context

- Branch-specific screens show the active branch and provide a selector; HQ is the initial launch context. A member registered at several branches can switch among their memberships.
- Browsing another branch's public profile is distinct from switching an active membership or staff context. Make the branch being viewed clear and never silently grant access or change membership.
- Services, announcements, attendance, people and operational reports reflect the selected branch and its permissions. The library, purchases and account are generally shared; do not display a branch selector on a shared library heading unless a branch-specific filter is needed.
- Confirm whether visiting another branch should persist as a temporary viewing mode and how users return. Confirm rules for joining and approving memberships, and handling users with different staff roles across branches.

## Screen inventory

| Area | Screens and key states |
| --- | --- |
| Access | Welcome, sign in, register, password recovery, errors and signed-out access to public information |
| Member | Home, branch selector, branch profile, service and event list/detail, registration, announcements and notifications |
| Personal | Profile view/edit, family/household, prayer request and privacy controls, settings and staff switch |
| Library | Search/filter, free and paid resources, book detail/sample, sermon player, purchase outcome, personal library, downloads and reader settings |
| Staff | Dashboard, member directory/detail/edit, visitors and follow-up, departments, schedule and attendance, content draft/publish, giving reports, communications, roles and settings |
| AI | Conversation with text and relevant interactive cards; indicate branch on branch-specific answers, link to source content and allow asking about another branch |
| Shared states | Loading, empty, offline, failed requests, permission denied, confirmation, search with no results and accessibility settings |

These are a product inventory, not a commitment to deliver all screens in the first release. Actual privacy and membership policies need decisions before detailed implementation.

## AI assistant

The agreed direction is an AI button in the top bar beside notifications, opening a dedicated conversation page rather than a floating control that covers content. It can provide answers with contextual cards such as a service, event or book. Use selected branch context when relevant and make that context visible; shared-library questions need not be branch-specific. Staff answers must be limited by the user's current branch and actual permissions, with source attribution where possible. Handle uncertainty, unavailable data and sensitive personal or pastoral questions explicitly. Which sources, actions, retention and AI provider are authorized remains open.

## Offline and content

Full offline operation is not required. People may explicitly download selected eligible content for later reading or listening; show download status, available storage, removal and clear offline errors. Paid resources require access checks and defined handling of refunds and lost access. Exact formats, protection, access expiry, payment provider and purchase rules are undecided. Neither example prices nor purchase flows in images are approved commercial terms.

## Work to validate before implementation

1. Audit existing church API and web flows, including mobile-compatible session handling, branch memberships, permissions, shared types and content capabilities. Do not assume a new token implementation or contracts package is necessary.
2. Resolve durable storage and verify isolation, authenticated workflows and CORS, as tracked in the operations backlog.
3. Define first-release scope, membership and branch switching, public/private content, staff permissions, supported languages and accessibility.
4. Define content ownership, publishing, purchases, refunds and downloadable-file protection. Review current app-store digital content rules before finalizing mobile purchase design.
5. Define AI sources, privacy, retention, permissions, user-visible uncertainty and whether it can take actions.
6. Create detailed interaction designs and test member and staff journeys on phones and desktop, including error, empty and permission states.

Store accounts, store agreements and publishing are explicitly deferred for now. Expo and Expo Router are an earlier recommendation, not an approved implementation decision; verify stack and existing repository conventions before building.

## Visual concept boards

These AI-generated boards illustrate direction, not final artwork or an authoritative UI specification. The church logo, people, buildings, locations, dates, statistics, prices and text are fictional; some labels and schedules are inconsistent. Follow the navigation and branch rules above when implementing. Verify church identity, translations and all real content with the church.

- [Member: home, branch selector, profile and events](images/member.png)
- [Shared library, books, downloads and AI](images/library-ai.png)
- [Staff: dashboard, people, services, content and switching](images/staff.png)
- [Desktop: member home, shared library and staff](images/desktop.png)

The boards do not depict every state in the screen inventory. Detailed interaction designs, responsive layouts and accessibility review remain to be completed.
