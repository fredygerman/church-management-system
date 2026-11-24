# Programme decisions

No decision is accepted by this planning package. Recommended defaults are proposals for explicit human acceptance.

| ID | Decision | Recommended default | Status |
|---|---|---|---|
| DEC-01 | Dashboard metrics, activity semantics and API composition | Truthful unavailable/error state; decide endpoint vs existing composition after source audit | Accepted 2026-11-24 by Fredy (recommendation): add read-only `GET /dashboard/stats` with only fields that have a verified source; web and mobile share it |
| DEC-02 | Prayer/family privacy and consent | Enforce existing authorization; no expanded sensitive-data use without policy | Accepted 2026-11-19 by Fredy: existing rules only; no new sensitive uses |
| DEC-03 | Mobile framework and first-release scope | Inspect repository/toolchain; Expo is a candidate, not approved | Accepted 2026-11-19 by Fredy: Expo (React Native) |
| DEC-04 | Analytics/report metrics | Define source and meaning before displaying totals | Accepted 2026-11-24 by Fredy ("do as you recommend"): every displayed metric uses the existing query behind its endpoint, with a one-line definition recorded in `specs/api-contracts.md`; a metric without a verified source is not shown |
| DEC-05 | Email provider, consent and supported workflows | Describe current capability accurately; no sending until approved | Accepted 2026-11-24 by Fredy (recommendation): describe current capability only; no provider or sending work until a provider is approved |
| DEC-06 | Staff role/settings policy | Preserve server authorization; no broad redesign without evidence | Accepted 2026-11-24 by Fredy (recommendation): keep server authorization as is; no role redesign |
| DEC-07 | Payments, purchases, refunds and access expiry | Defer commerce pending product and current platform-policy review | Accepted 2026-11-24 by Fredy (recommendation): deferred; no commerce in this release |
| DEC-08 | AI sources, provider, privacy, retention and actions | No integration or sensitive data use until explicit policy/provider approval | Accepted 2026-11-24 by Fredy: AI is wanted on web and mobile, answering with generated interactive components (cards, tables, forms, buttons), not long text. Defaults taken from the recommendation: Anthropic Claude API as provider (key in Coolify env only, never in the repo); read-only over data the signed-in user's role can already read; prayer requests and family details excluded (DEC-02); any action is proposed as a confirm button and run by the existing API with the user's own permissions; conversations kept 30 days then deleted |
| DEC-09 | Document storage, retention and access | Select after requirements/security review; no credentials in repo | Accepted 2026-11-19 by Fredy: private S3-compatible bucket with access checks; retention: recommended 30 days for soft-deleted documents (matches the 30-day backup window), accepted 2026-11-24, daily purge job built (`RetentionService`, 03:00: removes the stored object, then the row) |
| DEC-10 | Human verification owner/evidence | Named human records observable results | Accepted 2026-11-24 by Fredy: Fredy performs the human verification, only after ALL code work in ALL waves is done; results are recorded in `human-verification.md` |
| DEC-11 | Future checkout, capacity and dispatch | Shared checkout, disjoint scopes, capacity/harness/model checked at dispatch | Accepted 2026-11-24 by Fredy (recommendation): shared checkout, disjoint file scopes, haiku for frontend, Luna for backend and review; push only at the end of a major wave |

Decision IDs are stable programme references. No proposal implies approval.
