# Mobile implementation group

Status: proposed; not dispatched. Product design remains under review. Owning spec: [mobile.md](../specs/mobile.md).

## Outcome and execution model

Deliver a mobile client for **Mito Ya Baraka Church**, HQ first, with member and authorized staff spaces in one signed-in app. This is a separate group in the existing monorepo. There is no current mobile app: `apps/mobile/` and Expo/Expo Router are proposals requiring approval. Member tabs: Home, Church, Events, Library, Profile. Staff tabs: Dashboard, People, Services, Content, More. AI opens a dedicated conversation from the top bar beside notifications.

One human-approved group leader owns the ledger, contracts, integration, gates and findings triage. Each wave has a lead and bounded workers; IDs are logical task IDs, not runtime IDs. User preference: Luna high. Verify harness/model availability and capacity and obtain human approval before any dispatch. This plan launches no workers.

Default checkout is the existing shared checkout; no worktrees absent approval. Concurrent tasks require disjoint file ownership. Serialize manifests/lockfile, contracts, shared navigation/theme, generated files, dependency installation, generators, schema/migrations, repository-wide checks and commits. One writer per shared file; one generator/manifest writer per operation. No automatic monitoring. No mobile worker owns schema/migrations. A required API/schema capability blocks until separately authorized and assigned.

| Wave | Lead | Parallel task IDs and bounded ownership | Dependencies and gate |
|---|---|---|---|
| M-01 Foundation | Group leader | M0-01 app shell/config; M0-02 API contract inventory/adapters; M0-03 tokens/accessibility primitives | Stack decision. Contract inventory before API work. Serialize manifests. Proposed checks after package exists: focused tests, lint, typecheck, Expo export/build. |
| M-01 Member journeys | M1 wave lead | M1-01 auth/session; M1-02 member tabs/Home/branch context; M1-03 Church/Events/RSVP; M1-04 Profile/family/prayer | M-01 contracts. Assign shared nav/context files to one worker at a time; map actual API support first. |
| M-02 Shared library | M2 wave lead | M2-01 catalog/search/detail; M2-02 audio player; M2-03 reader/progress; M2-04 eligible downloads/storage states | M-01 contracts. No commerce; library shared across branch context. Serialize shared media primitives. |
| M-03 Staff and assistance | M3 wave lead | M3-01 staff switch/nav; M3-02 staff dashboard/people; M3-03 services/content; M3-04 AI/notifications | Auth and permission contracts. AI awaits policy/provider decision; staff awaits API capability and server auth. Do not disguise blocked capability with production mocks. |
| Q-01/Q-02 Readiness | Group leader | M4-01 regression/contracts; M4-02 accessibility/localization; M4-03 release-readiness evidence | Integrated prior waves. Leader runs expensive checks serially. Simulator/device human verification remains pending. No store account or publishing task. |

At wave boundaries, leader reviews owned-file diffs, findings, scope and contract status, then updates the ledger/spec before dispatching the next wave. One bounded reviewer per batch checks correctness, scope and complexity together; leader owns integration gate. No push or production changes.

Every API-backed task labels readiness `contract-only/mock` or `integrated`, cites verified endpoint/schema and auth/branch behavior, and never represents a mock as integrated. Triage all incidental findings to fix, assign or decision. Full offline, store setup and publishing are excluded.
