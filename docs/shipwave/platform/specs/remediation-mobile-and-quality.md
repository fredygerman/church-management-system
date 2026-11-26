# Mobile and verification remediation specification

Status: **proposed implementation work; not started**. Written against `81de7d2` (2026-11-26 static audit). This document specifies remaining work; it does not certify runtime behavior or supersede accepted programme decisions. No device, accessibility, live API or production verification was performed by the audit.

## Ownership and boundaries

The mobile leader owns R-MOB-01–05 in `apps/mobile/`. The quality leader owns R-QA-01–02 and coordinates tests across API, web and mobile; package owners approve edits in their packages. One integration leader serializes shared package exports, dependency/lockfile edits and full integration checks. Concurrent workers use disjoint files or wait for the owner to integrate their changes. They must not edit this specification while implementing another slice without the documentation owner's coordination.

Product ownership stays with [the product and design remediation specification](remediation-product-and-design.md): R-UX-01 for the same-account member/staff space policy, R-PUB-01 for public access, R-AUTH-01 for account recovery, R-NOT-01 for notifications, R-LIB-01 for the shared catalog and R-CNT-01 for content workflows. Native design ownership stays with R-DES-01, including tokens, header/tab components, scroll-safe layouts and visual acceptance. This document supplies mobile behavior and verification requirements, not competing product or design decisions. Server security and contract remediation belongs to [the security and API specification](remediation-security-and-api.md), including R-SEC-01/02, R-API-01/02 and R-DEP-01; coordinate its accepted contracts before changing client assumptions.

No schema change is anticipated for R-MOB-01–04. R-MOB-05 must first inventory existing contracts. Any missing endpoint is separately assigned to the API owner. Any required schema work goes through the single migration-owner lane: change Drizzle schema, generate with `pnpm db:generate`, inspect the generated migration, and apply only within the currently authorized environment. Never hand-write SQL, repair history, seed production or apply production migrations under this specification.

Preserve DEC-02 privacy boundaries, DEC-05 sending deferral, DEC-06 authorization policy, DEC-07 commerce deferral, DEC-10 human verification ownership, DEC-14 AI activation/testing deferral, DEC-15 browser reader and empty AI action registry, and DEC-16 locale formats. Full offline support and managed download storage were skipped by the owner. Neither becomes an implicit prerequisite here. App-store accounts, publishing, payments, new sensitive household behavior and AI provider configuration remain outside this work.

## Baseline and execution order

| ID | Priority | Depends on | Effort | Fix risk |
| --- | --- | --- | --- | --- |
| R-MOB-01 | P0 | Existing auth/refresh contract audit | M | MED: credentials and rotation lifecycle |
| R-MOB-02 | P0 | R-MOB-01 session generation contract | M | MED: mounted screens and branch scoping |
| R-MOB-04 | P1 | None | S | LOW: local request state |
| R-MOB-03 | P1 | R-UX-01; R-MOB-02; R-DES-01 shell | M | MED: routing and permission gates |
| R-MOB-05 | P2 | Product prioritization; R-MOB-03; verified API contracts; R-DES-01 | L, phased | MED/HIGH: operational mutations and privacy |
| R-QA-01 | P0, incremental | Runs alongside each corresponding remediation | M/L | LOW for isolated tests; MED if test infrastructure changes |
| R-QA-02 | Release gate | Integrated code; R-DES-01; R-QA-01; Fredy's final verification stage | M/L | LOW for read-only checks; configuration changes require separate ownership |

R-MOB-04 can run independently while the session owner implements R-MOB-01. R-MOB-02 follows the session contract and owns dependent screen invalidation. R-MOB-03 must not race either owner in `lib/session.tsx`. Staff workflow slices can then run in parallel by screen/feature, using the serialized API/schema lane when necessary. Tests are part of each slice, not postponed wholesale until the end. Human checks remain at the end of all code work under DEC-10.

## R-MOB-01 — Survive temporary API and storage failures without losing the session

### Evidence and observable reproduction

`apps/mobile/lib/api.ts:103-108` catches every refresh error and calls `expireSession()` if no other request replaced the stored refresh token. A network failure or HTTP 500 during refresh therefore clears a valid stored session. `apps/mobile/lib/session.tsx:60-62` clears stored credentials for any HTTP error while loading `/users/me`, including a temporary server error. `lib/session.tsx:55-66` has no rejection handler around the initial secure-storage read, so a storage read failure can leave initialization unresolved.

In an isolated mocked test, start with a stored token pair, make the first protected request require renewal, and return a temporary refresh failure. Observe local credentials being deleted. Separately return 503 from `/users/me` at startup. These are defensive regression fixtures; do not alter live services or accounts to reproduce them.

### Required state machine and implementation

1. Define typed authentication outcomes: authenticated; definitive rejection; temporarily unavailable; storage unavailable. Classify only contractually definitive authentication responses as rejection. Network errors, 5xx and malformed successful responses must not silently delete credentials. Inspect the current API's refresh grace response so a transient rotation race is not classified as reuse/expiry.
2. Preserve single-flight renewal and rotated-token persistence. A successful renewal must store the new pair before retrying. Retry the original request at most once; do not create refresh loops. Make an interrupted or failed credential write explicit and recoverable.
3. Model startup as `initializing → authenticated | signed-out | retryable-unavailable`. Settle initialization even when SecureStore fails. Do not convert retryable unavailability into a claim that the user has no account. Provide an explicit retry path and safe sign-out/reset path without exposing token contents.
4. Bind renewal to a session generation so a late refresh response cannot repopulate credentials after sign-out or a different sign-in. Coordinate the generation with R-MOB-02 church changes. Do not revive a deliberately cleared session.
5. Keep API authorization authoritative. A genuine invalid/revoked session clears credentials and routes to sign-in once. Retain existing explicit sign-out behavior; do not promise server revocation when offline.

### Ownership, tests and acceptance

Files: `apps/mobile/lib/api.ts`, `lib/session.tsx`, `lib/storage.ts` only as needed, and focused tests under `apps/mobile/tests/`. New UI uses R-DES-01 shared states. Exclude API token-policy redesign, server refresh-cookie work, new authentication providers and password recovery.

Regression fixtures must cover successful renewal, concurrent 401 single flight, temporary network failure, refresh 500/503, definitive rejection, startup `/users/me` 503, SecureStore rejection, sign-out while renewal is pending, and failed rotated-token persistence. Verify credentials survive temporary failures, errors are retryable, definitive rejection signs out once, and late responses cannot restore a cleared session. Tests use injected storage/transport or an approved test seam rather than real secrets/network.

Done means the above state transitions have observable assertions; focused and package checks below pass; retry wording is translated in EN/SW; no tokens appear in logs or snapshots. Effort M; risk MED; audit confidence HIGH for the reported failure paths. Storage/write and late-response cases are preventive acceptance coverage, not claims of a demonstrated live incident.

## R-MOB-02 — Reset branch-scoped screens and reject obsolete responses

### Evidence and observable reproduction

`apps/mobile/app/(member)/index.tsx:32-53` loads member/announcement/service data without an active church dependency. `apps/mobile/components/staff-read-screen.tsx:40-51` also omits church context; People/Services/Content use stable module-level loaders (`app/(staff)/people.tsx:8-13`, `services.tsx`, `content.tsx`). Switching between two memberships with the same role can retain mounted tab data from the previous branch. This is a client display/state finding; it does not establish an API tenant-isolation bypass.

With mocked memberships A/B, load Home or a staff tab in A, switch to B, then revisit the mounted tab. Also delay A's response until B's response completes. Verify that A's rows cannot remain or overwrite B's rows.

### Required state machine and implementation

1. Expose a stable authorized context key/generation from the session owner. It includes active membership/church and changes when that context changes. Distinguish it from selected member/staff presentation mode.
2. Inventory every branch-scoped mobile fetch, including Home, Church, events/details/RSVP, prayer, staff dashboard/People/Services/Content and AI conversation state. Account-level and genuinely shared data follow their actual contract; do not indiscriminately erase all local preferences.
3. On context change, clear old scoped rows, errors, selection, pending mutations and conversation identifiers, then enter loading for the new context. Cancel obsolete work or ignore its result using the captured generation. Old request failures must not replace current success state.
4. Invalidate/reload mounted tab screens even when their path and role remain unchanged. A keyed context boundary or explicit dependency is acceptable if tested. Do not rely on an incidental tab unmount.
5. Before operational mutations, ensure the intended record and current membership context still agree; cancel obsolete forms or require review rather than submitting a record opened in the previous branch. Server checks remain mandatory.

Files: mobile session context contract (coordinated with R-MOB-01), branch-scoped routes and shared read loader. No new tenant policy, broader branch browsing or backend authorization relaxation. Public browsing is separately owned by the product spec.

Acceptance: A→B same-role switch reloads every mounted scoped surface; old rows are absent during B loading; delayed A results are discarded; failed B switch retains a consistent A session/UI; changed role immediately removes unauthorized staff destinations; no prior-branch AI history is relabeled as B. Add focused state/loader integration tests and run mobile checks. Effort M; risk MED; confidence HIGH for missing dependencies, runtime manifestation to be verified.

## R-MOB-03 — Add an explicit member/staff presentation mode

Evidence: `apps/mobile/lib/session.tsx:118-120` redirects staff away from all member routes. `apps/mobile/app/(staff)/more.tsx:21-28` contains language, membership switch and sign-out but no return-to-member control. This fails the explicit same-account switching direction in `docs/product-design/screen-specification.md:32`; R-UX-01 owns product policy.

Implement the accepted R-UX-01 behavior as a presentation state independent of the membership role. Authorized staff can select member mode and return to staff without changing church or signing out. Member Home and Profile expose the staff entry; staff More exposes return to member. Staff routes remain gated by actual current-role permissions; choosing member mode never grants or rewrites an API role. Integrate discoverable controls and current branch/mode labels through R-DES-01.

State transitions: `signed-out → permitted signed-in space per R-UX-01`; authorized user can choose `member ↔ staff`; unauthorized staff deep links resolve to a safe permitted screen; role downgrade while in staff exits staff; changing church recomputes authorization before restoring any presentation preference. R-UX-01 must define initial and remembered mode; if policy is not yet specified, implement only after that owner records it rather than inferring a new approval.

Files: session/routing contract, member Home/Profile, staff More, shell and focused tests. Exclude membership-role editing and new staff privileges. Acceptance covers member/staff switches in the same church, back navigation, cold start policy, multi-branch different-role switch, denied deep links and sign-out/re-sign-in without leaked previous preferences. Effort M; risk MED; confidence HIGH.

## R-MOB-04 — Clear Church load errors when retry succeeds

Evidence: `apps/mobile/app/(member)/church.tsx:16-19` never resets `error` on a successful request, so ErrorState persists after a recovered load.

Own only Church's local load/error state and its regression test; coordinate R-MOB-02 if both edit the loader. Represent `loading → ready | failed`, clear obsolete error state before/successfully after retry, and preserve context-generation protection. A mocked request fails once and succeeds on retry; the church details must replace the error. Also cover a missing church and delayed previous-branch response without an endless loading state. No API/schema change. Effort S; risk LOW; confidence HIGH.

## R-MOB-05 — Deliver useful staff workflows beyond read-only lists

Evidence: `apps/mobile/app/(staff)/people.tsx:13-21` renders names only; `services.tsx` renders service types/sessions; `content.tsx:13-19` renders document metadata. The staff concept board and screen specification describe search/detail/follow-up, attendance recording and content management. Existing native read-only slices are real implemented functionality; this is additional product delivery, not a claim those slices are broken.

Before dispatch, product/operations owners choose the first mobile workflows. Recommended sequence is directory search/detail, attendance/check-in for an existing session, then visitor follow-up. Content creation/edit/publication follows only after the content owner specifies supported resource types and publication states. No blanket native parity requirement is implied. Use existing endpoint behavior and verified permission keys; do not infer capabilities from web controls or route existence alone.

Each chosen slice requires its own bounded contract row (method, input/output shape, permission, tenant/ownership, pagination, error semantics), route ownership, read/write state machine and tests. Paginate/search server-backed collections; preserve validation errors and safe input; prevent duplicate submission; show explicit save success/failure; handle session expiry, context change and permission changes. Display verified fields only. Family/prayer data may not be broadened under DEC-02. Communications sending, commerce, role redesign and report metrics without verified sources remain excluded.

Acceptance is per approved slice: an authorized role completes its named operation; an unauthorized role receives an honest denied state and no forbidden data; validation and transient failures preserve appropriate input; branch change cannot submit stale records; success is reflected after reload. Contract and API regression tests precede client mutation delivery. Effort L overall, subdivided into S/M tasks; risk MED/HIGH depending on mutation; confidence HIGH that current staff screens are read-only, product priority pending.

## R-QA-01 — Establish regression coverage for complete authorized journeys

Baseline: `apps/mobile/tests/claims.test.ts` covers claims and tab permission helpers. It does not cover transport/session/screens. Existing API and web tests are useful but do not establish complete deployed workflows; passing type checks and Android export are not runtime or accessibility evidence.

Quality owner first maps existing tests and runnable scripts. Add deterministic integration coverage for the remediation boundaries, reusing meaningful existing tests. Do not test generated markup snapshots in place of state and authorization outcomes. Add only the test infrastructure necessary for the selected layer; dependency/lockfile changes are serialized and require the repository's normal approval policy.

Required journey matrix:

| Journey | Positive assertions | Negative/recovery assertions |
| --- | --- | --- |
| Sign-in, startup, refresh, sign-out | Pair persisted, authenticated request, single-flight renewal, deliberate sign-out | Invalid credentials, revoked token, temporary API/storage failure, delayed renewal after sign-out |
| Membership switch | Authorized A→B and correct active role/data | Denied membership, same-role mounted tabs, stale request completion, failed switch consistency |
| Space switch | Same account/church can reach permitted member and staff screens | Plain member denied; role downgrade exits staff; deep-link/back-stack checks |
| Profile, prayer and RSVP | Valid mutation reflected after read | Invalid fields, duplicate pending submit, denial, transient failure, context change mid-form |
| Free library | List and signed URL request use supported shapes and access scope | Hidden/deleted resource, expired URL retry, network error; no commerce or offline-manager claim |
| Staff chosen slice | Contract-correct authorized read/write and result reload | Cross-church denial on API, field validation, permission denial and duplicate-safe handling |
| Dashboard and unavailable data | Verified metrics render accurately | Backend failure is unavailable, never fabricated zero success |

API tenant tests must assert representative same-tenant success and cross-tenant denial at the handler/service boundary. Use isolated fixtures and disposable test infrastructure, never production accounts/data. Do not add an exploit walkthrough to documentation. AI provider/runtime calls remain deferred; existing schema/renderer/feedback tests may run without activating a provider.

Acceptance: focused tests fail before the corresponding regression fix and pass after it; fixtures reset cleanly; no real network/provider/production mutations; results identify exact commit, command and limitations. Root one-command verification or CI is not already present merely because individual scripts exist. Effort M/L; risk LOW for isolated coverage, MED if infrastructure changes; confidence HIGH.

## R-QA-02 — Collect device, accessibility, visual and release evidence

R-DES-01 owns final visual direction, reusable UI and scroll-safe implementation. This quality lane verifies it with approved real church content, not invented people, branches, metrics or prices from the boards. Capture exact build revision, device/platform, viewport/text scale, locale, active role/branch and observed result for each check. Redact personal data and credentials from evidence.

Check the integrated release on available Android and iOS targets, explicitly recording unavailable platforms. Use the host's approved device tools and shared device panel for interactive control; do not substitute an Android export for a device run. Fredy owns final human evidence under DEC-10, including fluent Swahili review. Automated work prepares reproducible cases and artifacts before that handoff.

Required checks: sign-in and error recovery; branch/mode transitions; member and chosen staff journeys; small/large screens; large text; keyboard avoidance and focus; screen-reader names/order; touch targets; contrast; safe areas; tabs and contextual header; long announcements/names; loading/empty/denied/retry states; EN/SW switching and dates/numbers; signed-link opening/return-to-app; app lifecycle restart; low connectivity without claiming full offline. Explicitly test Home and other long content can scroll to the last action. Compare representative member Home/Church/Profile/Events, Library/AI and staff screens with approved R-DES-01 acceptance, allowing documented differences required by accepted scope.

Release readiness here means evidence and checks, not publishing: environment URL correctness, no embedded credentials, reproducible build/export, production-only secrets absent from bundles, and known limitations recorded. Store accounts, signing/publication, paid-content compliance and production deployment remain separately authorized work. AI activation/testing remains deferred.

**CI proposal, not an existing gate:** the current programme records a no-CI policy. Prepare a minimal proposed verification workflow/command map for approval; do not silently introduce `.github/workflows`, alter deployment triggers or assert checks are enforced. Approved future CI should run relevant deterministic tests/type checks, cache dependencies, and avoid production/provider secrets. Until approved, a named integration owner runs and records the commands below manually. Any claim that a push auto-deploys must be verified against current deployment behavior, not copied from stale handoff text.

Acceptance: all available-platform evidence is linked to the tested commit; failures create open tracked work; unavailable checks remain explicitly unverified; no unchecked checklist is converted into completion. Human/native-language checks remain pending until Fredy records them. Effort M/L; risk LOW; confidence HIGH that this evidence was not established by the static audit.

## Exact verification commands and limitations

Run from the repository root, inspect package scripts again if HEAD has changed, and serialize shared builds. These are implementation gates to execute later, **not commands run by this documentation task**.

```bash
pnpm --filter @church/db build
pnpm --filter @church/config build
pnpm --filter @church/config test
pnpm --filter api type-check
pnpm --filter api test -- --runInBand
pnpm --filter web type-check
pnpm --filter web test
pnpm --filter @church/mobile typecheck
pnpm --filter @church/mobile test
pnpm --filter @church/mobile exec expo export --platform android --output-dir /tmp/church-mobile-remediation-android
git diff --check
```

The mobile script is `typecheck`, **not** `type-check`. The API/web `lint` scripts currently use `--fix`; they are not read-only audit checks and must not be invoked as such. A web production build is `pnpm --filter web build`; use only the documented safe build environment, never copy credentials into commands or treat placeholder build variables as live configuration evidence. An iOS export can be run with `pnpm --filter @church/mobile exec expo export --platform ios --output-dir /tmp/church-mobile-remediation-ios` when that platform validation is in scope; export success still does not prove simulator/device behavior. Existing `test:e2e` scripts/configuration must be inspected before selection; this specification does not assert a working E2E harness.

For every slice record: baseline/result commit, changed paths, focused test command, full relevant package check result, migration requirement (normally none), observable acceptance evidence, remaining limitations and rollback. Local code rollback is the reviewed slice's revert; do not roll back data or infrastructure under that shorthand. No task is complete solely because a child agent reports completion or the documentation says “code complete.”
