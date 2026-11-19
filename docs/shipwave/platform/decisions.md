# Programme decisions

No decision is accepted by this planning package. Recommended defaults are proposals for explicit human acceptance.

| ID | Decision | Recommended default | Status |
|---|---|---|---|
| DEC-01 | Dashboard metrics, activity semantics and API composition | Truthful unavailable/error state; decide endpoint vs existing composition after source audit | Pending |
| DEC-02 | Prayer/family privacy and consent | Enforce existing authorization; no expanded sensitive-data use without policy | Accepted 2026-11-19 by Fredy: existing rules only; no new sensitive uses |
| DEC-03 | Mobile framework and first-release scope | Inspect repository/toolchain; Expo is a candidate, not approved | Accepted 2026-11-19 by Fredy: Expo (React Native) |
| DEC-04 | Analytics/report metrics | Define source and meaning before displaying totals | Pending |
| DEC-05 | Email provider, consent and supported workflows | Describe current capability accurately; no sending until approved | Pending |
| DEC-06 | Staff role/settings policy | Preserve server authorization; no broad redesign without evidence | Pending |
| DEC-07 | Payments, purchases, refunds and access expiry | Defer commerce pending product and current platform-policy review | Pending |
| DEC-08 | AI sources, provider, privacy, retention and actions | No integration or sensitive data use until explicit policy/provider approval | Pending |
| DEC-09 | Document storage, retention and access | Select after requirements/security review; no credentials in repo | Accepted 2026-11-19 by Fredy: private S3-compatible bucket with access checks; retention still to be specified |
| DEC-10 | Human verification owner/evidence | Named human records observable results | Pending |
| DEC-11 | Future checkout, capacity and dispatch | Shared checkout, disjoint scopes, capacity/harness/model checked at dispatch | Pending |

Decision IDs are stable programme references. No proposal implies approval.
