# Web and API group

Status: Not started; no workers dispatched. Stable tasks and dependencies are in [backlog](../backlog.md); exact dispatch fields are in [allocation manifest](../allocation-manifest.md). Owning specs: [foundations](../specs/foundations.md), [member experience](../specs/member-experience.md), [staff operations](../specs/staff-operations.md), [content and AI](../specs/content-and-ai.md).

The group owns W-01 through W-06. W-01 refresh validation and W-02 dashboard UI error-state correction can progress independently; do not make all work wait for a blanket W0. W-03/W-04 cover both member and staff web surfaces. W-03 also owns web library and AI entry/unavailable surfaces; AI capability remains gated by DEC-08. W-05 owns durable document workflow and shared library capability. W-06 is AI policy/capability gate, not an assumption to implement a provider.

Default future execution is shared checkout with disjoint file ownership. Serialize sidebar ownership, contracts/OpenAPI, schema plus generated migration, manifests/install, generators, full checks and commits. A migration requires one named owner and generated/inspected Drizzle migration per AGENTS.md; application is separately authorized. No pushes, production changes or store setup. Luna preferred; capacity/model/harness/effort checked at dispatch, no fallback or monitor.

Q-01 establishes baseline CI and runs integration checks. One bounded reviewer checks correctness, scope and complexity together; do not create separate correctness and complexity reviewers. Verify exact source facts and tests at dispatch. All work remains Not started until authorized.
