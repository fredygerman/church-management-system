# Programme run policy (proposed)

**Status: draft for later human acceptance.** This planning authorization covers documentation only. It is not authorization to launch workers or implement the programme. A future run requires explicit approval of checkout, concurrency, harness/model assignments, scope, and any consequential decisions.

## Limits

- No push, deployment, migration application, store account/agreement/publishing setup, or production changes.
- Do not create monitors or schedules. Bounded coordinator waits or manual status checks are the default.
- Do not infer provider, payment, commerce, or mobile-stack approval. Expo is a candidate only.
- No capacity, worker count, harness, effort, or model is assumed. Luna is the requested preferred model; verify its availability and capacity at dispatch. Do not substitute a provider/model without explicit authorization.
- Default checkout is the shared checkout. Parallel writing is allowed only for demonstrably disjoint ownership. Serialize manifests/lockfiles, schema/contracts, global config, generators, shared checks, and commits. Optional worktrees require a later explicit choice.
- A future approved run should use small independent tasks and multiple workers within the approved capacity. Never repeat no-op status tasks: diagnose the blocker, split/reassign recoverable work, or return a concrete decision request.

## State vocabulary

- **Not started**: no implementation begun.
- **In progress**: implementation underway with a current checkpoint.
- **Blocked**: a specific external dependency or decision prevents safe progress; include evidence and next unblocking action.
- **Code complete**: implementation and automated evidence recorded; human checks may remain.
- **Awaiting human verification**: observable product/accessibility/visual steps remain.
- **Verified**: human verification evidence recorded by an authorized person.
- **Complete**: accepted scope, reviews, integration, automated evidence, and required human verification are all complete.
- **Deferred**: intentionally outside accepted scope; record rationale and revisit condition.

## Gates

Before any future implementation run, reconcile group specs and IDs, validate facts against source, define guard tests and acceptance rows, record decisions as pending or accepted, appoint the serialized schema/contract owner, and present the proposed allocation. Each worker reports exact scope, changed paths, commit, clean state, command/exit/fresh log/test counts, migration impact, open human checks, and blockers. Establish the existing CI/testing baseline before changing it. Review is bounded and evidence-first: one reviewer checks correctness, scope and complexity together; coordinator handles small fixes; the serialized integration gate includes contract and migration evidence. No integration based solely on a clean tree or worker claim.

Statuses describe task evidence, not activity or agent liveness.
