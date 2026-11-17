# Programme backlog

Planning inventory only; implementation is not authorized. Every task is **Not started** until a future approved run; blocked capabilities remain blocked at dispatch until decisions/contracts are resolved.

| ID | Group | Owning specification | Outcome | State | Dependencies |
|---|---|---|---|---|---|
| D-01 | Design | [staff-operations.md](specs/staff-operations.md), [screen-specification.md](../../product-design/screen-specification.md) | Reconcile responsive member/staff journeys, brand/content, accessibility and observable states | Not started | None |
| W-01 | Web/API | [foundations.md](specs/foundations.md) | Validate refresh-token lifecycle and guard tests | Not started | None |
| W-02 | Web/API | [foundations.md](specs/foundations.md) | Fix dashboard false-zero behavior and define truthful states | Not started | DEC-01 for API composition only; independent UI error fix can proceed |
| W-03 | Web/API | [member-experience.md](specs/member-experience.md) | Member Home/Church/Events/Profile, RSVP, prayer and profile states on web | Not started | D-01 for shared navigation; DEC-02 for expanded sensitive behavior |
| W-04 | Web/API | [staff-operations.md](specs/staff-operations.md) | Staff dashboard/People/Services/Content/More, reports, communication and role settings | Not started | D-01; DEC-04/05/06 only for affected capability |
| W-05 | Web/API | [content-and-ai.md](specs/content-and-ai.md) | Durable document workflow and shared free library/reader/eligible downloads | Not started | DEC-09 and serialized schema/contracts lane |
| W-06 | Web/API | [content-and-ai.md](specs/content-and-ai.md) | AI policy and capability gate; implementation only after DEC-08 | Not started | DEC-08 |
| M-01 | Mobile | [mobile.md](specs/mobile.md) | Mobile stack/toolchain and API capability inventory; member and staff journeys | Not started | DEC-03; no app creation before approval |
| M-02 | Mobile | [mobile.md](specs/mobile.md) | Mobile library/search/reader and eligible downloads | Not started | M-01, W-05 contracts; no commerce |
| M-03 | Mobile | [mobile.md](specs/mobile.md) | Mobile staff space and AI entry/conversation capability gate | Not started | M-01; AI blocked on DEC-08 and staff contracts |
| Q-01 | Integration | [RUN-POLICY.md](RUN-POLICY.md) | Serialized schema/contracts/generation, CI baseline, integration and one bounded correctness/complexity review | Not started | Each task's actual contract/migration edges; no blanket W0 gate |
| Q-02 | Human verification | [human-verification.md](human-verification.md) | Perform named product/device/accessibility checks on accepted build | Not started | Code complete, DEC-10 |

Detailed file ownership, exclusions and proposed paths are in the linked specs and [allocation manifest](allocation-manifest.md). **Not started** describes implementation; unresolved decision-gated slices may become **Blocked** only when dispatched. Cross-link design, web/API, mobile and shared foundation waves here as the global ledger.
