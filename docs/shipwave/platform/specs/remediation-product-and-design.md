# Product and design remediation specification

Status: implementation specification, not implemented work. Evidence baseline: `81de7d2`, 2026-11-26. This file owns product contracts and web design details for the IDs below; the mobile remediation specification owns native implementation details. The programme leader assigns shared contract/schema changes to one serialized owner before dependent workers start. Related owners: [security and API remediation](remediation-security-and-api.md) owns R-SEC-01/02, R-API-01/02 and R-DEP-01; [mobile and quality remediation](remediation-mobile-and-quality.md) owns R-MOB-01–05 and R-QA-01/02. Product requirements here must be traced to those native/security/test slices rather than duplicating their technical ownership. No statement here authorizes a deployment, production migration, provider purchase, commerce, or a broader privacy policy. Authorization to write this document does not accept proposed implementation policies: network ownership/audience, publication approval transitions, public-field ownership, recovery channel/account-linking, notification sources/retention and any new provider remain explicit decision gates. Existing DEC-01–16 remain authoritative.

## Authority and source material

Follow [programme decisions](../decisions.md), DEC-01–16, over older planning prose or concept copy. The [screen specification](../../../product-design/screen-specification.md), [visual language](../../../product-design/DESIGN.md), and [visual audit](../../../product-design/visual-audit.md) establish the intended experience, while this file records the remaining delta verified against code.

Reviewed concept boards:

- [Member](../../../product-design/images/member.png): Home, branch selection/profile, events and Profile/staff entry.
- [Library and AI](../../../product-design/images/library-ai.png): discovery, resource detail, downloads, reader and contextual answers.
- [Staff](../../../product-design/images/staff.png): Dashboard, People, Services, Content and More.
- [Desktop](../../../product-design/images/desktop.png): corresponding member, library and staff composition.

These boards are illustrative, not approved assets or factual church records. Use **Mito Ya Baraka Church**, HQ first; do not copy invented people, branch names, buildings, schedules, statistics, titles, prices, geography or generated translations. Missing verified content receives a truthful empty state. Obtain approved logo/photography and consent before production use.

## Existing, required and deferred scope

| Area | Existing at baseline | Required by this specification | Explicit boundary |
|---|---|---|---|
| Member/staff experiences | Portal routes, staff modules, Expo client, membership switching and role-aware APIs | Reachable five-destination shells and explicit same-account space switching | Changing presentation does not grant permissions or change membership |
| Library | Branch-scoped visible documents, private storage, signed URLs, search, web PDF/image preview | Network-shared versus branch-restricted catalogue and resource metadata | Never remove tenant restrictions without a replacement access model |
| Content | Staff upload, visibility toggle and soft deletion | Metadata editing, draft/review/publish lifecycle and eligible free media | Commerce, entitlements, payment/refund flows remain deferred |
| AI | Conversation routes, source/uncertainty display, feedback | Discoverable top-bar entry beside notifications | Provider activation/testing, new providers, AI write actions remain deferred |
| Public access | Existing external public website; app routes require authentication | Explicit public branch/service projection and app discovery flow | Confirm boundary with existing website; expose only published public fields |
| Authentication | Password registration/login, OAuth route, token refresh/revocation | Account recovery and correct role/space destination | Recovery delivery needs an approved provider/capability; no new sending activation |
| Notifications | Announcements and communications infrastructure | Persisted private inbox, read state and safe links | Push/email/SMS delivery and provider changes are separate gates |
| Design | Generic component system and translated copy | Consistent semantic theme, responsive layouts and accessibility | Native-speaker and human design/device acceptance remain human work |
| Reader/downloads | Browser opens signed native downloads; web inline PDF/image | Preserve supported behavior; add progress/media only where specified | Embedded native reader and full offline remain deferred; no background offline sync |

## Shared product invariants

1. **Mode is not membership.** `member` and `staff` are presentation spaces within one account. Changing space keeps the same selected authorized membership and its role. Switching membership obtains server-authorized church context and may change effective role; refresh capabilities and route choice afterwards. Public browsing changes neither.
2. A user can enter staff space only if the active membership exposes a supported staff capability. A `read:member` grant alone does not establish staff status: ordinary members have it for their own profile. Derive visible destinations from the shared permission map and explicit staff-role/capability policy; preserve current server authorization (DEC-06).
3. Branch-specific screens show active church context. Shared account and shared library headings do not present an active-branch selector. Resource restrictions still apply on the server.
4. All client links are convenience only. Every API read, mutation, file URL, notification and publication transition authenticates and checks role, ownership and scope server-side.
5. English and Swahili message keys stay in the shared typed catalogue with parity. Dates/numbers use the accepted formatter (DEC-16). Human native review remains required; placeholders are never labels.
6. Every async screen distinguishes loading, empty, denied, unavailable and retryable failure. A request failure is never a valid-looking zero, an empty success, or an implicit privilege change. Preserve safe form input on failure.
7. Prayer, family and private pastoral information remain outside AI and public projections (DEC-02/08). This work does not add household invitations or expand sensitive-data use.

## R-WEB-01 — Repair the scoped staff profile route

**Evidence:** active `apps/web/components/layout/dashboard/dashboard-header.tsx:90` links to `/dashboard/profile`; the actual route is `apps/web/app/[churchId]/dashboard/profile/page.tsx`. The active dashboard layout imports this header.

**Work:** obtain the current `churchId` from route params or an explicit typed header prop; generate `/{churchId}/dashboard/profile` using the same route helper as other navigation. Missing context must disable/omit the contextual link, never construct `undefined` paths. Keep the localized accessible menu name.

**Acceptance:** from HQ and a second authorized membership, clicking My Profile opens that branch's profile; neither URL is `/dashboard/profile`. Keyboard selection works and focus returns normally when menu closes. A focused route helper test plus the staff navigation smoke journey proves the result.

Effort S; fix risk LOW. No schema/API change. Can execute independently.

## R-WEB-02 — Remove invented zero branch counts

**Evidence:** `apps/web/app/(home)/page.tsx:49` supplies `totalMembers={0}` to every `ChurchCard`; `components/church-management/church-card.tsx` renders that number as a real count.

**Work:** make count optional and omit the count region when no authorized verified source exists. Do not fetch staff-only totals for ordinary users merely to fill a card. If a later authorized source is adopted, distinguish `undefined`/unavailable from an actual numeric zero and document its metric definition under DEC-04.

**Acceptance:** fixture with no count renders no member statistic; real `0` can render only when explicitly supplied as verified data. Failed stats do not render zero. Card remains readable with long branch names in EN/SW. Test all three states.

Effort S; risk LOW. No schema/API change; independent of R-WEB-01.

## R-UX-01 — Complete shells, mode switching and sign-in routing

**Evidence:** portal `layout.tsx:19-29,67-82` has nine horizontally scrolling destinations and omits Home/Church/Library/AI. `apps/web/config/sidebar.ts` remains a large module tree. Member Home and Profile contain no staff entry; staff `more/page.tsx:44-49` has help text rather than a member-space control. `app/auth/signin/page.tsx:73` defaults all church-linked accounts to dashboard.

### Information architecture and interaction

| Space | Primary destinations | Secondary destinations |
|---|---|---|
| Member | Home / Church / Events / Library / Profile | Profile groups family, prayer, attendance history, giving, departments and settings, subject to existing permissions |
| Staff | Dashboard / People / Services / Content / More | People groups members, families, visitors, zones and departments; Services groups schedules, events and attendance; More groups reports, communications, data quality, existing roles/settings, account and return to member space |

Phone web uses persistent labeled bottom navigation with safe-area padding; desktop uses matching primary sidebar groups. Do not delete existing routes to achieve five labels. Nested destinations expand or appear on their hub page; active state includes child routes and `aria-current`. Permission filtering can remove an unsupported staff destination; never show a dead tab. If a staff user has no allowed destination, show an explanatory state and return-to-member control.

Member Home and Profile show **Switch to staff** only when current membership permits staff work. Staff More has **Switch to member**. Switch changes URL/space preference, not auth tokens or membership. Preserve the last authorized destination per space and current membership; validate it before reuse and fall back to the relevant home. Direct unauthorized staff navigation returns a truthful denied state without exposing records.

Membership selector lists accessible active memberships only and retains confirmation. On success replace authoritative role/capabilities and navigate to a valid destination in the desired space; if staff access is absent, choose member Home. Failure preserves old membership, space and data. Public **View another church** is a separate action/route with explicit public-view context. Never label membership switching as generic public browsing.

Sign-in accepts a safe internal authorized return destination, otherwise chooses saved valid space or member Home for ordinary members and a permitted staff landing for staff. Do not infer staff from `read:member`; use the shared policy. Reject external/untrusted return destinations. Account with no active membership gets an explicit no-membership/help/public-discovery state; do not imply ordinary users can create a church. Existing administrator setup remains permission-gated.

**API/schema edges:** reuse memberships/switch-church and existing auth claims; no new role model. A local space preference may be stored per user/membership; it is never authorization. Route helpers and navigation contracts must be shared before web/native work branches diverge. Native details belong to the mobile spec.

**Acceptance:** member and staff five-destination navigation, child-route active state, both mode directions, differing roles across two memberships, suspended/inaccessible membership, failed switch, direct denied URL, no-membership account, safe/unsafe callback paths and restart all have deterministic outcomes. Browser smoke covers login → branch → member → staff → member without a second login. EN/SW and narrow-screen navigation remain usable.

Effort L; risk MED (navigation regressions). Depends on shared capability/route contract; can proceed before new catalogue/public/notification APIs using honest unavailable states.

## R-DES-01 — Implement visual language, responsive layouts and accessibility

**Evidence:** `apps/web/app/globals.css:57-90` retains neutral primary/accent tokens instead of the proposed navy/cobalt/violet system. Portal horizontal navigation differs from all boards. Staff Content `page.tsx:59-97` renders a six-column table without card adaptation. Portal header `layout.tsx:58-61` and staff header `dashboard-header.tsx:57-60` have unnamed home icon actions; sign-in inputs rely on placeholders.

**Design contract:** use semantic ink/brand/strong/accent/canvas/surface/tint/muted/border/status tokens from the visual language, with validated contrast rather than literal colors copied into pages. Align native/web token names and intent while allowing platform typography/safe-area differences. Use the documented spacing and radius scale, readable text, restrained cards and verified church identity; gradients and generated hero artwork are not requirements. Keep dark theme contrast functional if currently offered.

**Responsive contract:** at 320, 390, 768 and 1280 px, no global horizontal scrolling or obscured primary action. Staff tables become labeled cards where appropriate; if a genuine comparison table must scroll, isolate and label its scroll region and keep actions reachable. Long file names, branch labels, Swahili expansion, 200% browser zoom and large native text wrap without deleting essential meaning. Header, keyboard and bottom navigation cannot cover form save actions or final list rows. Native scrolling, keyboard avoidance and token application are owned by the mobile spec under this same ID.

**Accessibility contract:** semantic landmarks/headings; explicit visible form labels and associated errors; accessible names on icon buttons; minimum 44×44 touch targets; `aria-current` navigation; meaningful progress/status announcements; visible keyboard focus; focus trap/restoration and Escape in overlays; no color-only states; reduced-motion support. Native controls use corresponding accessibility roles/labels and dynamic type. Do not claim WCAG conformance from static review alone.

**Acceptance:** component-level token audit, automated a11y checks on sign-in/member Home/Profile/Library/staff Content, keyboard navigation and focus checks, screenshots at agreed widths, EN/SW expansion and dark/light contrast review. Capture only non-sensitive fixtures. Approve layout against the four boards' composition and corrected navigation, not their invented content. Human D-01 and device review remain open until recorded.

Effort L; risk MED. Depends on R-UX-01 shared shell contract; labels/targets can run independently. No schema needed.

## R-LIB-01 — Define shared and branch-restricted resource access

**Evidence:** `apps/api/src/file-upload/file-upload.service.ts:349-355,369-378` filters library list/download by exact `documents.churchId`. Portal layout always shows the branch selector. This implements branch document sharing, not the explicitly requested general library.

**Proposed contract to approve before migration:** catalogue resources have `scope: network | branch`, an immutable owning church/network boundary, optional restricted branch, visibility/publication state, creator and timestamps. Network means the Mito Ya Baraka organization/network, never all unrelated tenants in the platform. Establish whether an existing parent organization relation reliably identifies that network; if not, stop the schema slice for explicit network-ownership design. Do not infer a network by matching names.

Legacy documents remain branch-scoped by default. An authorized publisher explicitly promotes/migrates a resource to the network catalogue; existing visibility toggles cannot silently broaden audience. Separate operational documents from published resources or define an unambiguous resource subtype so personal/staff documents never enter discovery accidentally.

List/search/detail/download evaluate publication and audience on the server. A signed URL is minted only after resource-level authorization and remains short-lived. Changing active membership must not hide an otherwise authorized network-shared resource; losing all qualifying memberships/access must deny new access. Branch-restricted resources remain restricted after mode/context changes. Do not expose titles, file names, counts, search snippets or existence to unauthorized viewers.

**Interface proposal:** `GET /library/resources` accepts validated pagination, query, type/category and explicit optional branch filter; returns minimal authorized metadata and a cursor. `GET /library/resources/:id` and `POST /library/resources/:id/access` return metadata or a short-lived access URL only after authorization. Final paths/DTOs must be reconciled with existing `/api/files/library` rather than introducing duplicate public contracts. Existing routes remain compatible until both clients migrate. No raw storage keys or permanent public URLs in client metadata.

**Screen:** shared Library heading has no active branch selector, but optional labeled scope filters and resource-level branch badges are permitted. Search clears/retries; no-results differs from empty catalogue and failure. Detail shows title, description, author/speaker, file/media type, eligibility and a clear View/Listen/Download action. Missing metadata is omitted. Permission loss during access yields a safe unavailable/denied state.

**Acceptance:** same network resource reachable from two authorized branches; branch-only item denied from the other; unrelated organization denied; unpublished/deleted item absent from list/search/detail/access; stale client IDs cannot bypass checks. Test pagination and query validation. Test old documents retain original scope after generated migration. Test Library header/context and client transition compatibility.

Effort L; risk HIGH (audience broadening). Requires serialized schema/API owner and network model decision; R-CNT-01 consumes this contract. Generate Drizzle migrations only after schema approval; inspect before applying; production remains approval-gated.

## R-CNT-01 — Complete publishing metadata, media and progress

**Evidence:** `dashboard/content/page.tsx:58-98,116` exposes upload/visibility/delete only; library reader `library-reader.tsx:15-19,103-160` supports PDF/image/fallback. The concept and screen spec describe books, sermons, categories, samples, media and publication workflow.

**Phases:** (1) free resource metadata and publishing; (2) audio/video delivery and progress for eligible resources. Do not implement purchases, ratings from fictional boards, arbitrary web embeds or an embedded native reader.

**Metadata:** title, description, resource type, language, author/speaker display text, optional cover asset, categories, optional verified duration/page count, and publication timestamps. Validate lengths/types; derive file sizes from actual stored object metadata. Covers and files use existing private storage controls; never accept executable HTML as a resource preview. Accessible transcript/caption links are optional where provided, with availability clearly stated.

**Lifecycle proposal:** draft → review → published, with explicit unpublish/archive. Scheduled publishing may be a later bounded subtask once timezone/idempotent-job semantics are specified. Drafts/review items never appear to members. Keep current `manage:files` staff access until DEC-06 owner approves any separate review/publish grants; do not invent a new staff role policy. With one permitted publisher, review is an explicit workflow state, not an unsupported claim of independent approval. Record actor/time on every transition. Confirm before publish/unpublish/delete and report success or failure; retries cannot duplicate publications.

**Screens:** Content hub groups draft/review/published with search and type filter. Editor validates metadata and upload status, preserves safe input, previews actual metadata and audience, and exposes only permitted transitions. Resource detail uses real metadata; samples only when a distinct eligible sample exists. Media player supports native/browser controls, play/pause/seek, buffering/error and source unavailable, with keyboard and screen-reader names. Progress stores position per user/resource and resumes explicitly, clamped to media bounds; do not count it as attendance or disclose it to staff by default. PDF browser view may retain supported behavior; no claim of accessible reflow or offline progress until implemented/tested.

**API/schema edges:** serialize resource metadata/publication additions with R-LIB-01. User progress model is private and independently scoped by user/resource with validated numeric bounds and monotonic update timestamps; update checks resource authorization. Do not store signed URLs as durable progress. Retention/deletion follows DEC-09 and existing jobs; resource deletion must not leave accessible published files.

**Acceptance:** draft absent to members; permitted publication visible in appropriate scope; unpublish revokes new access; missing/invalid metadata and unsupported file types are actionable; repeated publish idempotent; different users cannot read each other's progress; revoked resource cannot mint playback URL. A real permitted audio fixture plays and resumes; no unsupported format pretends to play. No purchase controls or prices appear.

Effort L; risk MED/HIGH. Depends on R-LIB-01 contracts; independent metadata UI can start against fixtures after DTO freeze. Mobile owns platform playback interactions.

## R-PUB-01 — Public church and service discovery

**Evidence:** app home requires sign-in (`app/(home)/page.tsx:14-23`), and Church is inside authenticated portal layout. The public website already exists; coordinate its information source rather than duplicating inconsistent schedules.

**Work:** define a public projection, explicitly published by authorized church staff, containing approved church/branch name, verified location/contact, about text, approved image and published service/event information. No member counts, people directory, private staff contacts, memberships, pastoral/family records or internal operational IDs beyond a public identifier. Existing records are not public merely because their fields are populated.

**Interface proposal:** unauthenticated read-only `GET /public/churches` (validated paginated search) and `GET /public/churches/:publicId` with published service/event projection. Use generic not-found for unpublished/deleted records, bounded payload/rate limiting and caching that never includes authenticated data. Require a serialized API contract/privacy review before exposing existing church entities. If the website owns the public CMS, consume or link that approved source instead of writing a second publisher.

**Screens:** guest Welcome → branch directory → public branch detail → service/event detail; explicit sign-in/register for RSVP or personal actions. Signed-in **Browse churches** opens the same public view with a return-to-current-church action; browsing does not call switch-church. Joining/requesting membership is out of scope until its approval/consent policy is specified. Show missing/unpublished details truthfully and EN/SW fallback clearly; no fabricated HQ schedule.

**Acceptance:** signed-out visitor reads only approved published fields; unpublished record absent; authenticated public browsing preserves activeChurchId and role; RSVP directs through sign-in with safe return URL; website and app do not display conflicting independently hard-coded schedules.

Effort L; risk MED (accidental data publication). Depends on public-field/ownership contract; no provider required.

## R-AUTH-01 — Safe account recovery

**Evidence:** sign-in exposes email login/register and Google only; no recovery/reset routes surfaced under web/auth API at baseline. This is an undelivered proposed access feature.

**Contract proposal:** `POST /auth/password-recovery` accepts normalized email and always returns the same accepted response for valid-shaped input, independent of account existence. Per-IP and account-key rate limits apply. Generate a cryptographically random single-use token, persist only its hash with expiry/consumption timestamp and user association, and deliver through an approved out-of-band channel. Never return the token in API response/logs or place it in durable documentation. Use configured allowlisted application origins for reset links, never caller-supplied redirect origins.

`POST /auth/password-reset` accepts token and new password, validates the same password policy as registration, atomically consumes a live token and changes the credential, revokes outstanding recovery tokens and existing sessions through the established revocation mechanism. Invalid/expired/used tokens have the same safe error class. Concurrency must permit only one successful consumption. Do not reset OAuth-only identities into password accounts without an explicitly approved account-linking policy; return generic request acceptance regardless.

**Screens:** Forgot password from sign-in → labeled email form → neutral check-your-channel confirmation → token reset screen with labeled new/confirm password and visibility controls → explicit success/sign-in. Expired/used/invalid state links to a new request. Network failure preserves email but does not preserve passwords longer than necessary. Do not auto-sign-in after reset. Reset route must not load third-party analytics or leak token in referrers; consume token into short-lived local state where feasible and clear URL history safely. Never echo token in UI.

**Delivery gate:** define a small delivery adapter accepting a recipient, approved template and opaque reset link. Test adapter is in-memory only and never enabled in production. Provider choice, credentials, verified sender, consent/operational delivery capability and live sending remain blocked on approved provider under DEC-05; no new dependency or sending activation is implied. A disabled capability displays an honest contact-support alternative and must not claim a reset email was delivered. Do not ship a fake successful recovery path as operational.

**Schema/tests:** serialized recovery-token migration, generated through Drizzle. Tests cover enumeration-neutral responses, rate limits, expiry, replay, concurrent consumption, same password validation, session revocation, OAuth-only policy and failed delivery without token leakage. Test safe reset URL origin and no external callback redirect. Native reset/deep-link handling is owned by the mobile spec and must use the same token contract.

Effort L; risk HIGH (account takeover/session lifecycle). Depends on auth owner and approved delivery capability. Provider-independent core/tests may proceed before activation.

## R-NOT-01 — Private inbox and top-bar AI entry

**Evidence:** portal header `layout.tsx:52-65` and active staff header `dashboard-header.tsx:55-106` have no AI/notification entry; no inbox route surfaced. AI pages already exist, so entry placement is independent of provider activation.

**Header work:** AI button beside notification entry on member/staff web and native headers, opening the dedicated existing conversation page, never a content-obscuring floating button. Give both actions localized accessible names; show AI unavailable capability honestly without enabling a provider. Shared Library header does not acquire branch context merely because AI is present. Branch-specific AI answers preserve explicit context and existing read-only/source/feedback behavior.

**Inbox model proposal:** per-recipient notification ID, user ID, optional authorized branch context, type, minimal localized template/data, createdAt/readAt and an allowlisted internal target descriptor. Do not persist arbitrary executable links or raw private message bodies in previews. Audience resolution occurs server-side against current permissions/membership, not from client-supplied recipient lists. Existing announcement events may be the first source once recipient and publication semantics are verified. Avoid implicit fan-out to every tenant.

**Interface proposal:** authenticated paginated `GET /notifications` and `PATCH /notifications/:id/read` (idempotent), plus optional bounded mark-all-read action scoped to the caller. Server always derives owner from session. Filter inaccessible/revoked-context items or return a safe unavailable detail. Targets are typed route descriptors resolved by the client and reauthorized at destination, not arbitrary URLs. Publish/event handlers use idempotency keys to prevent duplicate notifications on retries. Validate unread count definition and use true unavailable state when it cannot load.

**Screens/states:** inbox All/Unread, chronological list with safe title/time/context, unread marker plus semantic label, empty/loading/retry/denied, detail/deep-link. Opening an item marks it read without blocking access if the mark request fails; failed mutation reports/retries safely. Cross-branch target explicitly requests an authorized context switch with confirmation; failure leaves current context intact. If content was deleted or access revoked, show unavailable rather than leaking a cached preview. Notification permission-disabled state is relevant only when optional device push exists; inbox does not require OS push permission.

**Delivery boundary:** persisted in-app inbox is independently implementable. Push, email, SMS, platform tokens and provider configuration remain deferred; do not create provider accounts, request device push permission, or promise external delivery in this task. Future push previews default to generic non-sensitive copy; prayer/family data is excluded.

**Acceptance:** two-user ownership denial, unrelated tenant denial, revoked membership, safe target validation, duplicate-source event, pagination, unread/read retry and deleted target all tested. AI/inbox header entries keyboard accessible, correctly routed in both spaces and no overlap at narrow widths. No live AI calls or external notifications required for these checks.

Effort M for entries, L for inbox; risk MED. Shared shell contract first; inbox schema/API serialized independently from content metadata where no shared files overlap.

## Execution dependencies and ownership

| Slice | Prerequisites | Can run concurrently |
|---|---|---|
| R-WEB-01 / R-WEB-02 | Baseline verification | Each other and API research, disjoint files |
| R-UX-01 | Frozen capability/route/space contract | Native shell detail and web shell in separate paths |
| R-DES-01 | Shared tokens and shell contract | Labels/a11y fixes independent; full layouts after shell merge |
| R-LIB-01 | Explicit organization/network scope and serialized schema/API owner | Resource UI with contract fixtures; no concurrent migration writer |
| R-CNT-01 | R-LIB-01 DTOs/access semantics | Editor and player after non-overlapping allocation |
| R-PUB-01 | Published public-field ownership/privacy decision | Shell and notification work |
| R-AUTH-01 | Auth-token owner; approved delivery adapter for activation | Provider-independent core/tests; not concurrent edits to shared auth files |
| R-NOT-01 | Shell entry contract; notification source/audience contract | Inbox UI against frozen DTOs; serialized schema lane |

Do not allocate two workers to the same navigation, token, permission, contract barrel, schema export or migration file. Leader integrates shared files once. Native-specific acceptance and task decomposition belong to the mobile spec; this file owns cross-platform product behavior and web details.

## Verification and completion evidence

At dispatch inspect actual scripts; commands below describe the baseline, not proof already run for this remediation:

- Fresh shared preparation: `pnpm --filter @church/db build` first, then `pnpm --filter @church/config build` and `pnpm --filter @church/config test` for copy/token/route contracts. Config imports the built DB exports; do not reverse this order on a fresh checkout.
- Web: `pnpm --filter web type-check` and `pnpm --filter web test`. Its baseline `lint` mutates via `--fix`; use a check-only invocation such as `pnpm --filter web exec eslint <changed files>` after confirming current config. Do not run the mutating lint script as a read-only check.
- API owner: inspect API package scripts, run type-check and focused auth/resource/notification tests; full API suite once per integration batch. No live provider calls or database mutation in unit tests.
- Add focused browser journey tests for the acceptance matrix; baseline web tests cover utilities/auth-refresh/report catalogue only and do not prove rendered navigation. Use the approved test harness; do not claim browser/device success from a build.
- Shared contracts: generated OpenAPI/DTO changes reviewed once by owner; one generated Drizzle migration lane, inspection before application, production requires Fredy's approval.
- Human evidence after code completion: D-01 layout/identity review, Q-02 role/branch/device/accessibility journeys, native Swahili review, verified real content, and the staff visibility change observed in member Library. Record date, commit, environment, role and observable result without credentials or personal data.

Completion means code, contracts, meaningful negative tests and acceptance evidence are linked to each stable ID. Distinguish code-complete, awaiting provider/decision, human-unverified and deferred. A historical checklist or passing export does not establish that the final design has shipped.
