# Audit remediation plan and coverage register

Baseline: `81de7d2`, audited 2026-11-26. **Documentation completed here specifies future work; no implementation dispatch or new product decision is authorized.** This register contains exactly 21 stable findings: 5 security/API/dependency, 9 product/design/web and 7 mobile/quality. Historical W-01–06, M-01–03, D-01 and Q-01/02 IDs remain historical implementation references in [backlog](backlog.md); do not rename them or infer that newly found R-* work is already complete.

## Evidence and interpretation

Repository evidence distinguishes confirmed bugs, proposed product gaps and intentionally deferred scope. Each owning spec gives full paths, baseline line anchors, impact, effort/risk, implementation steps, tests/acceptance, boundaries and rollback. Short evidence labels in this register resolve through that owning spec. The four concept boards were reviewed as visual direction; invented identities, numbers and prices are not production requirements or facts. Current source is not proof of live deployment.

The audit freshly passed API 19 suites/146 tests earlier in this session; the documentation-writing step did not rerun application tests. Historical web 15/mobile 12 tests, builds and Android export are recorded prior evidence, not new validation. Human/device/native-Swahili checks remain unperformed. Dependency audit counts are advisory/path findings, not a count of exploitable product vulnerabilities. No live exploitation or production mutation was performed.

## Coverage register

| ID | Outcome | Accountable owner role | Evidence anchor (see owning spec) | Owning specification | Dependencies/gates | Current status |
| --- | --- | --- | --- | --- | --- | --- |
| R-SEC-01 | Verified OAuth identity and web relay | Auth/API | `auth.controller.ts:111–168; web api/auth/callback/route.ts:4–29` | [security-and-api](specs/remediation-security-and-api.md) | OAuth proof/linking decision; exclusive auth owner | Critical; specified, decision-gated |
| R-SEC-02 | Trusted platform admin versus church owner | Auth/API | `auth.service.ts:531–552; auth/guards/church-context.guard.ts:99–112` | [security-and-api](specs/remediation-security-and-api.md) | Trusted operator/provisioning decision; schema lane if needed | Critical; specified, decision-gated |
| R-API-01 | Receive-time multipart limits | API files | `file-upload.controller.ts:77,162,306–312` | [security-and-api](specs/remediation-security-and-api.md) | Multipart policy; dependency patch coordination | Specified; not started |
| R-API-02 | Concurrent AI history integrity | API AI | `ai.service.ts:124–138; ai-conversation.store.ts:55–59` | [security-and-api](specs/remediation-security-and-api.md) | Store concurrency contract; schema lane if needed | Specified; not started; live AI deferred |
| R-DEP-01 | Dependency advisory reachability and bounded updates | Dependency integrator | `pnpm-lock.yaml; baseline audit report; Next/Multer/S3 dependency paths` | [security-and-api](specs/remediation-security-and-api.md) | Primary-source verification; exclusive manifests/lockfile | Specified investigation; exploitability unconfirmed |
| R-WEB-01 | Scoped staff profile link | Web page | `dashboard-header.tsx:90 and [churchId]/dashboard/profile route` | [product-and-design](specs/remediation-product-and-design.md) | Exact header writer assignment | Specified; not started |
| R-WEB-02 | Truthful branch card counts | Web page | `app/(home)/page.tsx:49 and church-card.tsx` | [product-and-design](specs/remediation-product-and-design.md) | No unapproved metric/source | Specified; not started |
| R-UX-01 | Five-item shells, explicit spaces and sign-in landing | Product/shell | `portal/layout.tsx:19–29,67–82; signin/page.tsx:73` | [product-and-design](specs/remediation-product-and-design.md) | Space/route contract; auth security integration | Specified; proposal details gated |
| R-DES-01 | Design tokens, responsive UI and accessibility | Design shell | `Four boards; DESIGN.md; current web/native components` | [product-and-design](specs/remediation-product-and-design.md) | R-UX-01 shell contract; approved church assets | Specified; human acceptance unperformed |
| R-LIB-01 | Network-shared and branch-restricted catalogue | Content/API | `file-upload.service.ts:349–378; documents table` | [product-and-design](specs/remediation-product-and-design.md) | Network ownership/access decision; schema/contracts lane | Specified; decision-gated |
| R-CNT-01 | Publishing metadata, media and progress | Content/API + clients | `Existing staff upload/visibility and document schema versus screen inventory` | [product-and-design](specs/remediation-product-and-design.md) | R-LIB-01; publication policy/contracts | Specified; decision-gated; commerce deferred |
| R-PUB-01 | Public church/service discovery | Public API/web | `Authenticated app branch routes versus public screen specification` | [product-and-design](specs/remediation-product-and-design.md) | Approved published-field projection; website boundary | Specified; decision-gated |
| R-AUTH-01 | Account recovery | Auth/API + clients | `Recovery screen requirement; no recovery routes found` | [product-and-design](specs/remediation-product-and-design.md) | R-SEC-01/02 auth owner; delivery/linking decision | Specified; activation delivery-gated |
| R-NOT-01 | Private inbox and top-bar AI entry | Notifications/shell | `Notification screen intent; announcements vs inbox; AI entry placement` | [product-and-design](specs/remediation-product-and-design.md) | Audience/source/retention contract; R-UX-01/R-DES-01 | Specified; source/policy-gated |
| R-MOB-01 | Preserve session on temporary failures | Mobile session | `lib/api.ts:103–108; lib/session.tsx:55–66` | [mobile-and-quality](specs/remediation-mobile-and-quality.md) | Definitive rejection contract; auth integration | Specified; not started |
| R-MOB-02 | Invalidate branch data and discard stale responses | Mobile session/screens | `(member)/index.tsx:32–53; staff-read-screen.tsx:40–51` | [mobile-and-quality](specs/remediation-mobile-and-quality.md) | R-MOB-01 context generation | Specified; not started |
| R-MOB-03 | Same-account member/staff mode | Mobile shell | `lib/session.tsx:118–120; (staff)/more.tsx:21–28` | [mobile-and-quality](specs/remediation-mobile-and-quality.md) | R-UX-01, R-MOB-02, R-DES-01 | Specified; not started |
| R-MOB-04 | Clear Church error after successful retry | Mobile Church | `(member)/church.tsx:16–19` | [mobile-and-quality](specs/remediation-mobile-and-quality.md) | Coordinate Church loader with R-MOB-02 | Specified; not started |
| R-MOB-05 | Useful prioritized native staff workflows | Mobile feature | `(staff)/people.tsx,services.tsx,content.tsx read-only slices` | [mobile-and-quality](specs/remediation-mobile-and-quality.md) | Product prioritization; R-MOB-03; verified API contracts | Specified; workflow choice gated |
| R-QA-01 | Complete regression journey coverage | Quality + package owners | `Current service/helper tests; mobile/tests/claims.test.ts` | [mobile-and-quality](specs/remediation-mobile-and-quality.md) | Incremental with each corresponding remediation | Specified; not started |
| R-QA-02 | Device, visual, accessibility and release evidence | Quality; Fredy final human | `No recorded device/design/native-language acceptance` | [mobile-and-quality](specs/remediation-mobile-and-quality.md) | Integrated code; R-QA-01/R-DES-01; final human stage | Specified; unperformed; CI proposal only |

## Future groups and waves — allocation proposal

| Wave | Leaders/work | Parallel lanes | Hard integration edges |
| --- | --- | --- | --- |
| A: prove and contain | Auth/API leader: R-SEC-01/02; dependency leader: R-DEP-01 triage; quality maps R-QA-01 | Web R-WEB-01/02, API R-API-01, mobile R-MOB-01, product/design research can proceed in disjoint files | OAuth/provisioning decisions before auth behavior changes; auth files exclusive; patches do not wait on unrelated catalogue policy |
| B: context and shell foundations | Mobile leader: R-MOB-02/04; product/design leader: R-UX-01/R-DES-01 shell contract; API leader: R-API-02 | Web/native shell work in separate paths after contract; deterministic tests with each fix | Mobile session.tsx/api.ts single owner; Church loader shared with R-MOB-04; schema/contract changes serialized |
| C: complete priority journeys | Product/API: R-LIB-01/R-CNT-01/R-PUB-01/R-AUTH-01/R-NOT-01; mobile: R-MOB-03/05 | Independent accepted product slices after their own decisions, not a blanket wave barrier | Shared catalogue model before publication/client integration; auth owner before recovery; shell contract before native mode; feature contract before staff mutations |
| D: integration and evidence | Integration leader + one independent bounded reviewer; R-QA-01/02 | Package-focused tests may run in safe isolated scopes; human stage after all code | Serialize full checks/commits; final source/spec review; Fredy's human checks last; deployment is separate authorized work |

Waves express dependency order, not a demand to build every proposed feature in one release. Decision-gated product enhancements can be accepted, narrowed or deferred explicitly. Confirm scope and exact worker allocation before dispatch. Do not postpone critical security corrections until every product proposal is decided.

## Serialized lanes and ownership

- Auth owner integrates overlapping registration/OAuth/setup/guard/recovery edits. Product workers specify requirements instead of editing shared auth files.
- Mobile session owner integrates transport/session/context/mode state. Page workers own disjoint screens only after session contract freeze.
- Design shell owner owns common tokens, header, sidebar, tab primitives and their shared styles. Content/notification workers coordinate entry points through that owner.
- Schema/contract owner exclusively edits shared DTOs/exports, Drizzle tables/schema and generated migrations. Generate with `pnpm db:generate`, inspect output; never hand-write normal migration SQL. Apply dev only within actual DEC-12 authority; production requires Fredy. No migrations in this documentation task.
- Dependency integrator exclusively edits manifests/lockfile/global tool configuration and runs installation/generators in its reserved window. API runtime/build usage must be triaged rather than blindly upgrading from audit counts.
- Integration owner serializes shared full checks, documentation reconciliation and commits. No concurrent writers during staging/commit. A push alone never establishes live deployment.

## Prompt and handoff contracts

Leader prompt: “Read current remediation register, owning spec, DEC-01–16 and AGENTS; confirm baseline drift and decision gates. Allocate exact disjoint files to named workers; reserve auth, mobile-session, schema/contracts, lockfile and commit ownership. Do not dispatch unresolved policy slices or infer deployment authority. Collect observable tests/evidence and send one bounded review package.”

Worker prompt: “Implement only ID(s) assigned after explicit implementation authorization. State baseline, permitted files, forbidden files, dependencies and accepted policy before editing. Preserve identity, privacy, authorization and release exclusions. Add specified regression tests; run exact relevant checks; report changed paths, resulting SHA if commit authorized, command/exit/count, schema/contract impact, rollback and unperformed human checks. Stop the affected slice for an unresolved gate; continue independent assigned work. No provider activation, production changes or extra workers unless explicitly authorized.”

Reviewer prompt: “Independently inspect final diff and cited source against assigned IDs. Check correctness, scope, complexity, tenant/ownership boundaries, real test assertions and design/decision agreement. Reject completion based on file existence, worker claims, mocked success alone or stale historical tests. Return blocking/nonblocking findings with file/line evidence; no feature expansion.”

## New proposal gates and retained exclusions

Pending: trusted platform-operator provisioning versus church ownership; OAuth proof/linking flow; organization/network catalogue ownership/access/publication; public-field ownership; recovery delivery/account linking; presentation-mode persistence; notification sources/audience/retention; first native staff mutations. The owning specs state recommendations, not accepted decisions. Existing DEC-01–16 remain unchanged.

Retain: commerce/payments/refunds, email/SMS sending activation, store accounts/publishing, full offline and managed download storage are outside accepted release scope. Native signed resources use the device browser (DEC-15); do not introduce WebView as a mandatory gap. AI configuration/live-provider testing/write actions stay deferred. Deterministic integrity/permission/renderer tests do not activate the provider.

## Verification and completion

Commands are in owning specs and [allocation manifest](allocation-manifest.md). On a fresh checkout build `@church/db` before `@church/config` (config imports DB dist), then affected API/web/mobile checks. Package `lint` currently mutates through `--fix`; do not call it a read-only check. Tests added must assert negative auth, stale branch/session, retry and mutation outcomes, not mirror markup.

Completion requires accepted scope, implemented changes, review, fresh automated evidence, and named human checks where required. Unavailable platforms, provider activation and live operational facts stay explicitly unknown/deferred. [Human verification](human-verification.md) records the candidate/environment, owner and outcomes. This documentation package itself is complete only after local Markdown links/coverage/whitespace checks and a documentation-only reviewed commit; no source implementation or push is implied.
