# Security, API correctness and dependency remediation

Status: specified, not implemented. Baseline: `81de7d2`, audited 2026-11-26. This document supplements the programme [decisions](../decisions.md), [API contracts](api-contracts.md) and [AI API](ai-api.md); it does not replace accepted release exclusions. Evidence below is repository-static unless marked otherwise. Line numbers are baseline anchors and must be rechecked before implementation.

The audit freshly ran `pnpm --filter api test -- --runInBand`: 19 suites and 146 tests passed. These mostly isolated service/guard tests do not prove controller composition, production configuration or database concurrency. No live attack, credential collection, infrastructure change or migration was performed.

## Allocation and dependencies

| ID | Outcome | Severity / priority | Effort | Fix risk | Dependencies |
| --- | --- | --- | --- | --- | --- |
| R-SEC-01 | Verified OAuth identity, including the web relay | Critical / first | M | Medium: existing Google sign-in callers change | Inventory all OAuth callers; coordinate API and web contract |
| R-SEC-02 | Trusted platform administration separated from church provisioning | Critical / first | M–L | High: shared tenant authorization | Explicit administrator trust policy and privileged-account review |
| R-API-01 | Bounded multipart reception and diagnostics | High availability / next | S | Low–medium: legitimate upload sizes | Existing configured file-size policy; R-DEP-01 for multipart dependency patch |
| R-API-02 | No lost AI conversation turns under concurrency | Medium correctness / next | M | Medium: API/client conflict handling | Serialized schema lane only if selected strategy requires it |
| R-DEP-01 | Advisory reachability ledger and bounded dependency updates | High-priority investigation; individual severity unconfirmed | M–L | Medium–high: framework compatibility | One lockfile owner; current official advisory verification |

Cross-group dependencies: account recovery and shared content direction belong to [product/design remediation](remediation-product-and-design.md) (`R-AUTH-01`, `R-LIB-01`, `R-CNT-01`); mobile session/client behavior and integration coverage belong to [mobile/quality remediation](remediation-mobile-and-quality.md) (`R-MOB-01`–`R-MOB-05`, `R-QA-01`, `R-QA-02`). R-SEC-01/02 must be included in those integration gates before a release is described as secure.

Effort includes implementation and focused regression tests, not calendar promises. Separate workers may research these tasks concurrently. R-SEC-01 and R-SEC-02 both touch auth controllers/services/tests: one auth integrator owns those shared paths; do not dispatch overlapping mutations. Dependency worker alone owns package manifests/lockfile during its integration window. Schema/contracts owner alone changes `packages/db`, generates migrations and reconciles contract changes. Other workers submit requirements rather than editing those files.

## R-SEC-01 — Verify identity before OAuth token issuance

### Observed evidence and impact

- `apps/api/src/auth/auth.controller.ts:111–112,148–168`: public OAuth login accepts request-supplied email/name and issues a token pair.
- `apps/api/src/auth/auth.service.ts:454–474`: OAuth account selection uses that email without provider verification in this method.
- `apps/web/app/api/auth/callback/route.ts:4–29`: public web handler forwards the same supplied fields to the API.
- `apps/api/src/auth/auth.controller.ts:261,277–285`: the separate Google authorization flow does not generate/check a bound OAuth state in the inspected path.

High-confidence static finding: identity assertions reaching token issuance are not authenticated provider evidence. This can compromise account ownership. The finding is pre-existing at this baseline, not attributed to the latest locale commit. Live exposure and external proxy restrictions were not verified.

### Scope and exclusions

Own the API OAuth ingress, shared verification helper, account-linking rules, affected web callback/provider integration and focused tests. Inventory callers in `apps/web/auth.ts`, auth actions and callback routes before changes. Preserve password login, refresh rotation, revocation and existing member permissions. Do not introduce Apple login, paid content, a replacement auth framework, secret-bearing logs or an unrestricted service synchronization endpoint.

### Proposed contract and steps

1. Map every caller of `/auth/oauth-login` and both Google flows. Identify which component owns authorization-code exchange, state/nonce and callback cookies; retain a single documented flow or explicitly distinguish supported flows.
2. Replace public email/name assertions with verifiable provider proof. Recommended API ingress is `{ provider: 'google', idToken: string }`; verify signature using supported provider verification APIs and validate issuer, configured audience, expiry and verified email. If authorization-code exchange is selected instead, document the exact code, redirect URI, state and PKCE contract before implementation. Never accept profile fields as identity proof.
3. Derive immutable provider subject and verified profile from verification output. Reject inactive/deleted accounts before token generation. Define account linking for existing password accounts explicitly: matching email alone must not silently link an identity unless the approved verification/linking policy permits it. Unknown provider and unsupported audience fail closed.
4. Remove the public web assertion relay or make it forward only verified proof under the same API contract. A trusted frontend origin, hidden URL or CORS policy is not authentication. Do not add a browser-exposed shared secret.
5. For browser authorization, generate state bound to the initiating session and validate it on callback; validate nonce/PKCE as applicable to the selected flow. Require a verified provider response before any user/profile mutation.
6. Keep the existing successful token/user envelope for authorized clients, and preserve generic 401 responses for invalid proof. Use 400 for malformed request shape, 401 for verification failures and existing 503-style configuration failure where appropriate. Do not echo provider tokens or upstream response bodies.
7. Update OpenAPI and caller tests in the same integrated release. Retire the old identity-assertion body completely; a compatibility fallback would preserve the defect.

### Acceptance and verification

Tests must exercise actual controller/guard routing in a Nest test application as well as the verifier boundary. Use a mocked verifier or locally generated test keys; never production credentials or live provider calls. Cover missing/invalid/expired proof, wrong issuer/audience, unverified email, provider subject mismatch, inactive/deleted account, valid proof success, safe linking, and legacy body rejection. Web relay tests must show that supplied profile fields alone never return tokens. State/nonce tests cover missing/mismatched state without mutating an account.

Run from repository root. On a fresh checkout first run `pnpm --filter @church/db build`, then `pnpm --filter @church/config build`; config imports built DB exports:

```sh
pnpm --filter api test -- --runInBand
pnpm --filter api type-check
pnpm --filter web test
pnpm --filter web type-check
```

Expected: all relevant suites pass; new negative controller tests assert no token issuance and no account mutation. Update `api-contracts.md` with chosen body, errors and compatibility break. Do not claim success based solely on helper-unit tests.

### Decision, rollout and rollback

Gate: choose supported Google flow and safe account-linking policy; a temporary disabled OAuth ingress is an acceptable containment proposal, not permission to disable password sign-in. Provider credentials stay in runtime secret configuration. Deploy API fail-closed verification before or atomically with updated callers; communicate that legacy OAuth clients must update. If verification integration fails, disable affected OAuth entry points while preserving password login; never roll back to assertion-only token issuance. Revoke relevant sessions and review account changes if a trusted operational investigation finds misuse; do not assume compromise from static evidence alone.

## R-SEC-02 — Separate church owners from platform-wide administrators

### Observed evidence and impact

- `apps/api/src/auth/auth.service.ts:92–108`: public registration creates an authenticated account without a church.
- `apps/api/src/auth/auth.controller.ts:setupChurch` (the `POST /auth/setup` handler): the eligibility check only rejects a user already assigned a church.
- `apps/api/src/auth/auth.service.ts:531–552`: setup grants `super_admin` both globally and on the new membership.
- `apps/api/src/auth/guards/church-context.guard.ts:99–112`: active memberships constrain ordinary roles; absent membership is allowed for `SUPER_ADMIN` at lines 105–112.

High-confidence static finding: public provisioning can confer a role that the global guard treats as cross-church authority. This is distinct from a general bypass by existing ordinary members. An ordinary member's valid branch membership checks must be preserved.

### Scope and exclusions

Own registration/setup eligibility, authoritative platform administrator identity, context guard, token-claim handling, setup transaction and auth/guard tests. Inventory role editing in `apps/api/src/users/users.service.ts` so church-scoped role management cannot recreate global authority. Do not broaden the task into a general staff-role redesign (DEC-06), silently revoke every account, delete churches or rewrite production data without an approved remediation plan.

### Proposed steps and contracts

1. Document the trust distinction: network/platform operator can administer across churches; church owner/admin has power only in an authorized membership. Choose how legitimate platform operators are provisioned out of band. Public registration/setup must never set platform-wide authority.
2. Recommended immediate contract: `POST /auth/setup` requires trusted provisioning authorization, or creates only a church-scoped administrative membership under an approved self-service tenant policy. Choose this gate before changing behavior. Return 403 for disallowed setup and preserve ordinary registration if approved.
3. Make platform authority server-derived from a separately controlled source. A church membership named `super_admin`, caller-provided role or stale token claim must not establish global authority. If a dedicated field/table or new role is required, request the schema owner rather than editing migrations directly.
4. Update the guard so its non-membership exception uses the authoritative platform-admin predicate; retain existing active/suspended/invited membership rules and role selection for normal users. Recheck token generation, refresh and role update paths for re-elevation.
5. Make church creation, allowed account assignment and membership creation atomic; ensure repeated/concurrent setup cannot leave orphan churches or grant duplicate unintended privileges.
6. Produce a reviewable inventory/query specification for existing global administrators and their provisioning history. Classify legitimate operators versus church-scoped owners with Fredy; never automatically infer legitimacy from current `super_admin` text alone. Apply any data correction through the approved schema/data lane and revoke stale sessions for corrected accounts.
7. Keep existing success envelope if setup remains supported. Document eligibility and explicit 403/409 outcomes in API contracts and web onboarding. Remove unavailable setup UI when provisioning is invite/operator-only.

### Tests and acceptance

Add route-level tests proving public registration creates no platform privilege, unauthorized churchless setup is rejected or yields only the approved scoped role, church-scoped owners cannot access another church, legitimate provisioned operators follow the approved exception, invited/suspended/deleted memberships fail, stale JWT role claims cannot grant global power, role editing cannot manufacture platform authority, and concurrent setup is atomic/idempotent according to the chosen contract.

```sh
pnpm --filter api test -- --runInBand
pnpm --filter api type-check
pnpm --filter web test
pnpm --filter web type-check
```

Expected: new controller plus guard tests pass and existing refresh/member-boundary tests remain passing. Schema-dependent tests must use an isolated migrated test database; never production. No production bootstrap/data migration is implied by this spec.

### Rollout, rollback and ownership

This changes authority semantics and therefore needs an explicit provisioning decision, trusted-operator inventory and locked shared auth integration window. Apply additive schema changes before code requiring them; only the schema owner generates migrations with `pnpm db:generate`, inspects output and records affected deployments. Dev migration permission follows DEC-12; production requires Fredy's approval. Roll back broken onboarding by disabling setup, not by restoring public global-role assignment. Preserve legitimate operator recovery through an approved out-of-band mechanism; do not commit credentials or bootstrap secrets.

## R-API-01 — Limit multipart reception before buffering

### Evidence, impact and scope

`apps/api/src/file-upload/file-upload.controller.ts:77,162` uses `FileInterceptor('file')` without receiver limits; `306–312` checks file size only after the multipart interceptor has accepted/buffered the upload. The public-upload handler uses the same interceptor pattern. No global Multer size limit was found. Oversized input can consume memory before the application rejects it. Diagnostics also buffers optional files.

Confidence: high. Scope: shared multipart policy, all upload interceptors including diagnostics, exception normalization and HTTP-layer tests. Preserve current maximum size and allowed content policy unless deliberately revised. Exclude media transcoding, public anonymous uploads, storage-provider changes and content-commerce work.

### Implementation and acceptance

1. Centralize configured maximum bytes and apply Multer receive-time `fileSize`, one-file and bounded fields/parts/field-size limits to every relevant interceptor. Bound diagnostics or disable it outside controlled operator use. Do not rely on the controller's later `file.size` check.
2. Retain service/controller validation as defense in depth. Return documented 413 for an oversized file and stable 400 for malformed multipart/unsupported fields as appropriate; do not surface raw parser/storage internals.
3. Verify unsupported types are rejected and content-type policy does not treat caller MIME declarations as a full content safety guarantee. Any stronger format detection is a separately sized follow-up, not a silent scope expansion.
4. Test HTTP multipart boundary cases: just below/at/above configured limit, excess files/fields/parts and interrupted input. Assert storage upload/persistence are not invoked for receiver rejection; authorized valid files retain metadata and tenant rules. Cover diagnostics and public-upload as well as normal upload.

```sh
pnpm --filter api test -- --runInBand
pnpm --filter api type-check
```

Acceptance: consistent receive-time limits on all routes, no unbounded file buffering path among those handlers, valid uploads unchanged. R-DEP-01 must separately triage and patch Multer advisories; size limits do not prove parser advisories resolved. No schema change. Roll out on dev with representative allowed files, monitor rejected sizes without file contents, then production through normal approval. Rollback should retain a safe upper bound; increasing limits is a deliberate resource decision.

## R-API-02 — Preserve conversation history under concurrent questions

### Evidence and impact

`apps/api/src/ai/ai.service.ts:124,127–138` reads conversation history, calls the provider, then replaces the array. `apps/api/src/ai/ai-conversation.store.ts:55–59` updates by ID without revision comparison. Two requests can read the same history and overwrite each other's stored turns; an answer shown to a user may subsequently be missing when rated. Confidence: high. Existing ownership checks and 12-message/30-day retention rules remain required.

### Proposed approach, contract and boundaries

Prefer optimistic concurrency with an explicit conflict rather than holding a database transaction/row lock across a remote model call. Use an owner/church/expiry-aware compare-and-swap revision or equivalent atomic predicate. At question start capture revision; after provider response append only if it still matches, otherwise return 409 `conversation_conflict` and do not return a successful `answerId` for unstored output. Clients show a localized retry notice and preserve the user's question; do not blindly retry paid provider calls. If a different strategy is selected, show that it works across API instances, not only process memory.

1. Add store conditional-append semantics including owner, branch and non-expired conversation predicates; cap history atomically. If adding a revision field, schema owner generates the migration.
2. Make missing/expired/unowned conversation return generic 404; conflict is 409. Prevent a conversation purged while the provider is running from producing a success-shaped response without a stored turn.
3. Update web/mobile API clients and assistant views for conflict retry, preserving prior turns. Keep response validation, feedback ownership and retention behavior unchanged.
4. Test two concurrent requests from the same baseline, different conversations, expiry/purge during completion and feedback against the committed answer. Assert one stored append plus one conflict, or both preserved in the explicitly chosen serial model; never last-write-wins loss.
5. Use mocked providers and an isolated database/store concurrency test. No real provider key or paid request is required.

```sh
pnpm --filter api test -- --runInBand
pnpm --filter api type-check
pnpm --filter web test
pnpm --filter web type-check
pnpm --filter @church/mobile test
pnpm --filter @church/mobile typecheck
```

Acceptance: concurrent requests cannot silently lose committed turns; no successful response refers to an answer absent because the save failed; ownership/retention tests pass. AI provider configuration, live-provider testing and write actions stay deferred under DEC-14/15. This task is deterministic code correctness only. Additive schema before API, then conflict-aware clients; rollback must not reintroduce an unguarded writer. If necessary temporarily reject concurrent questions rather than reverting data integrity protection.

## R-DEP-01 — Triage advisory reachability and upgrade bounded dependency groups

### Observed evidence and uncertainty

The audit produced `/tmp/church-audit-dependencies.json` from the baseline dependency graph. Its metadata reports 9 critical, 100 high, 84 moderate and 16 low advisory findings. These are package/advisory/path counts, not confirmed exploitable application vulnerabilities, and the temporary file is not a durable artifact or guaranteed to exist for a future worker.

Examples requiring investigation include the installed `next` 16.1.2 path under `apps__web>next`, `multer` paths under API uploads and `fast-xml-parser` paths under the AWS S3 SDK. The report includes GHSA-p293-qw3h-jr36 and GHSA-2xp9-vwfh-vxw4 (Next), GHSA-q7qp-rjg7-q26m (Multer), and GHSA-m7jm-9gc2-mpf2 (fast-xml-parser). These identifiers are triage leads, not independent confirmation of vulnerable application behavior. Advisory details and patched versions must be verified against current primary maintainer/advisory sources at implementation time.

Manifests and `pnpm-lock.yaml` are authoritative for dependency paths; manifest ranges alone do not establish the installed version. API includes build tools in runtime dependencies, so an audit `dev:false` marker is not proof that vulnerable logic is reachable over HTTP. Next/Expo/React compatibility must be assessed per application.

### Worker steps and ownership

1. Reproduce `pnpm audit --json` read-only and record timestamp, baseline SHA, tool version and exit code. Nonzero status means advisories were reported or the registry failed; distinguish these cases. Keep full raw output outside the repository if it contains excessive registry data; persist a concise reviewed ledger with identifiers and primary links, not exploit examples.
2. For every critical/high result, record package/version, dependency/importer path, advisory ID and title, runtime/build/dev usage, preconditions, application call sites, reachable/not reachable/unknown classification, confidence, proposed patched range, compatibility constraints and owner. Reachability unknown remains open; never label all counts as exploitable.
3. Prioritize reachable web/server/upload issues and build/distribution exposures. Inspect Next configuration/routes, multipart handlers and actual XML usage before deciding applicability. R-API-01 does not replace a Multer patch.
4. Propose smallest compatible update groups: web framework with matching configuration dependencies; API runtime/parser group; build tooling; Expo-supported packages. Prefer direct parent updates that select safe transitives; document any constrained override with its removal condition. Never run a blind `audit fix --force` or upgrade all packages together.
5. The dependency integrator alone edits manifests and lockfile, uses the root package manager version, reviews peer compatibility and records package-specific release notes. Coordinate an exclusive integration window so concurrent workers do not regenerate the lockfile.
6. Run frozen installation and affected app checks in the implementation environment, with ephemeral build-only values where documented. Never copy real deployment secrets into build logs. Record remaining advisories and why each is accepted/deferred, including an owner and revisit date; do not require zero advisories regardless of reachability.

### Verification and acceptance

Discovery commands (no package changes):

```sh
pnpm --version
pnpm audit --json
pnpm --filter web why next
pnpm --filter api why multer
pnpm --filter api why fast-xml-parser
```

After an approved bounded update:

```sh
pnpm install --frozen-lockfile
pnpm --filter @church/db build
pnpm --filter @church/config build
pnpm --filter @church/config test
pnpm --filter api type-check
pnpm --filter api test -- --runInBand
pnpm --filter api build
pnpm --filter web type-check
pnpm --filter web test
pnpm --filter web build
pnpm --filter @church/mobile typecheck
pnpm --filter @church/mobile test
pnpm --filter @church/mobile exec expo export --platform android --output-dir /tmp/church-remediation-mobile-export
pnpm audit --json
```

Only broaden platform checks when the updated group affects that platform; a web-only patch need not rebuild unchanged mobile dependencies. Web production build needs the documented build-only environment setup; a missing environment variable is not a dependency regression. Do not start real provider integrations for this gate.

Acceptance: every critical/high result has a documented disposition supported by dependency and application evidence; chosen reachable findings resolve or have explicit risk acceptance; frozen lockfile and affected app tests/builds pass; no unexplained peer overrides. A passed audit is not a substitute for the auth fixes above.

Roll out bounded groups through dev first and compare authentication, signed downloads and affected routes; infrastructure mutations are separate authorized operations. Roll back a failed update using the prior reviewed lockfile/package set while retaining independent auth containment and upload guards. Record any temporarily restored vulnerable dependency as an open risk, never silently mark it fixed. Schema changes are not expected for dependency work.

## Integration handoff

Each worker reports exact changed files, final SHA, test commands/results, schema/contract effects, unresolved decisions and user-visible behavior. Before integration rerun affected negative auth cases, multipart receiver cases and concurrent conversation cases. Reconcile source changes with this spec rather than leaving baseline evidence phrased as current implementation.

Commerce/payment integration, email/SMS sending enablement, AI provider configuration and real-provider testing remain deferred. Production migrations, real operator-account correction and deployment are not authorized by this documentation task. Human device/design/native-language review remains tracked separately; it cannot replace these automated security and correctness acceptance gates.
