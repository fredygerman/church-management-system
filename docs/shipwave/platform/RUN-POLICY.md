# Programme run policy

## Authorization now and accepted prior policy

The present request authorizes audit documentation and specifications. It does not dispatch the proposed remediation implementation, accept new design/security/product decisions, deploy, migrate, publish or push. Earlier implementation waves were authorized and occurred; do not describe the whole programme as never authorized.

Preserve accepted DEC-01–16. In particular DEC-03 accepts Expo; DEC-11 accepts shared checkout/disjoint paths and Haiku frontend/Luna backend/review preferences, with push only at the end of a major authorized wave. Verify requested model availability/capacity at any future dispatch; do not silently substitute. DEC-12 records a specific authorized dev-migration workflow; it does not authorize production migrations or require this documentation task to apply anything. Production requires Fredy's approval.

## Parallel ownership

- Shared checkout, exact disjoint owned paths, one writer per file. Group leaders allocate bounded slices, and record active owners before dispatch.
- Serialize schema, migrations, contracts/shared exports, lockfiles/manifests/global configuration, generators, shared full checks and commits. Research/test-design can run before those integration windows; mutation waits for ownership.
- One auth integrator owns overlapping R-SEC-01/02 paths. One mobile session integrator owns R-MOB-01/02/03 shared session/routing paths. One design-shell owner integrates common header/sidebar/token changes. Other workers send patches/requirements to the owner instead of concurrent editing.
- No automatic monitors, schedules, worktrees, extra providers or infrastructure actions are implied. Follow the active harness's delegation/wait requirements. Implementation worker counts and exact model assignments are recorded at dispatch rather than invented here.
- Keep changes minimal/reversible; no secrets in prompts, docs or logs. No source implementation in this documentation-only run. No commit while other documentation writers are active; coordinator-authorized final integration/commit is a separate gate.

## State vocabulary

| State | Meaning |
| --- | --- |
| Specified; not started | Documented remediation, implementation has not begun |
| Decision-gated | A named proposal needs acceptance before its dependent slice |
| In progress | Assigned implementation has an evidence-bearing checkpoint |
| Code complete | Agreed code and automated evidence recorded, human checks may remain |
| Awaiting human verification | Named observable product/device/accessibility checks remain |
| Verified | Named human recorded result against a revision/environment |
| Complete | Accepted scope, review, automation and required human checks finished |
| Deferred | Deliberately outside accepted scope; record rationale/revisit condition |

## Gates and worker contract

Use [remediation-plan](remediation-plan.md) and [allocation manifest](allocation-manifest.md). Confirm baseline drift, current decisions, exact paths, exclusions, dependencies and test commands before each dispatch. New platform-admin trust, shared-catalog model and recovery-delivery choices are proposals, not accepted decisions. Security containment and existing behavior must be reviewed explicitly.

Every worker reports ID, observed versus proposed behavior, owned/changed paths, baseline and resulting commit if authorized, exact commands/exit/test counts, schema/contract impact, deferred checks and unresolved gates. A clean tree or a passing mocked unit suite is not proof of end-to-end correctness.

One independent bounded reviewer checks correctness, scope, complexity, privacy and source/spec agreement. Coordinator fixes small issues only within authorized implementation scope; this documentation task leaves source untouched. Schema owner generates Drizzle migrations, never hand-written normal migration SQL; inspect before application and stop for manual repair approval under AGENTS.

Full checks use actual package scripts. Human tests happen after all code work per DEC-10/13/14 and remain unperformed until evidence exists. Distinguish deterministic mocked AI tests from deferred real-provider activation/testing. Push is not evidence of live deployment; verify the actual environment/revision before any operational change or release claim. Never push main without explicit approval.
