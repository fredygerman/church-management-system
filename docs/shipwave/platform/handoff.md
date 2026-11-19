# Portable programme handoff

- Programme: Church Management System platform/design audit follow-through
- Status: Foundation wave (W-01, W-02, navigation consistency) code complete locally; not pushed; no CI (Coolify auto-deploys on push)
- Owning ledger: [backlog](backlog.md); dispatch map: [allocation manifest](allocation-manifest.md)
- Checkpoint: local commits on `design/mito-ya-baraka-concepts`: `9a4eae1` W-01 refresh validation (+ review fixes in the following commit), `17d46ca` W-02 dashboard unavailable state, navigation consistency commit
- Next safe step: human verification of the dashboard unavailable state and sidebar; then decide on the open access-policy question (analytics, offerings and events routes have no middleware permission gate)
- Branch/base/commit: `design/mito-ya-baraka-concepts`; nothing pushed
- Completed: W-01 refresh-token validation (rejects missing, malformed, expired, wrong-secret, wrong-type, deleted and missing users; server errors surface as 500); W-02 dashboard shows an explicit unavailable state instead of zeros; sidebar links removed for pages that do not exist (Church Settings, Users); shared `UnavailableState` component
- Remaining: revocation/rotation of refresh tokens is not implemented; route permission gates for analytics, offerings and events need a decision; Documentation and Contact Us have no permission keys; DEC-01–11 pending; mobile and AI work not started
- Checks: API type-check 0 errors; API auth Jest 9/9 passing; web type-check 0 errors (after building `@church/config` and `@church/db` locally); integration review by one high-effort reviewer, findings fixed (deleted-user refresh bypass; server errors reported as 401)
- Review: one bounded integration review completed; no independent re-review after fixes
- Migration: none; no schema changes in this wave
- Human verification: [backlog](human-verification.md); dashboard unavailable state and sidebar not yet checked by a person
