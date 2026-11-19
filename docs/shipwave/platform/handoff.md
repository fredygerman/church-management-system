# Portable programme handoff

- Programme: Church Management System platform/design audit follow-through
- Status: Foundation wave (W-01, W-02, navigation consistency) code complete locally; not pushed; no CI (Coolify auto-deploys on push)
- Owning ledger: [backlog](backlog.md); dispatch map: [allocation manifest](allocation-manifest.md)
- Checkpoint: local commits on `design/mito-ya-baraka-concepts`: `9a4eae1` W-01 refresh validation (+ review fixes in the following commit), `17d46ca` W-02 dashboard unavailable state, navigation consistency commit
- Next safe step: confirm and apply migration `0009_parched_maverick` (adds `users.token_version`), then human verification
- Branch/base/commit: `design/mito-ya-baraka-concepts`; nothing pushed
- Completed: W-01 refresh validation (deleted and missing users rejected; server errors surface as 500); W-02 dashboard unavailable state; sidebar links for missing pages removed; shared `UnavailableState`; token revocation on logout via `token_version` (access and refresh tokens carry `tv`); web sign-out calls `POST /auth/logout`; route matching now uses the most specific route, so child permission keys are enforced (analytics, offerings, events, event add/edit added)
- Remaining: migration 0009 not applied (needs confirmation); refresh-token rotation with reuse detection not implemented; Documentation and Contact Us are open to any signed-in role (no key chosen); DEC-01–11 pending; mobile and AI not started
- Checks: API type-check 0 errors; API auth Jest 11/11 passing; web type-check 0 errors; route impact checked for all six roles with a throwaway script outside the repo
- Review: one bounded integration review before the revocation and route changes; those later changes have no independent review
- Migration: `packages/db/migrations/0009_parched_maverick.sql` generated and committed, not applied
- Human verification: [backlog](human-verification.md); dashboard unavailable state, sidebar, sign-out, and role access changes not yet checked by a person
