# Roadmap: Mito Ya Baraka Church platform

Synthesis of six read-only audits (baseline commit `4e0710f`, branch `design/mito-ya-baraka-concepts`, 2026-11-26) into one deduplicated backlog, owner decisions, wave plan and launchable lane specs.

Status: **planning only**. Nothing here is implemented. Endpoints marked PROPOSED do not exist yet. Existing programme IDs (`R-*`, `DEC-*`, `W-*`, `D-01`, `Q-*`) live in `docs/shipwave/platform/` and are referenced, not duplicated.

## Files

| File | Purpose |
|---|---|
| [backlog.md](backlog.md) | Master backlog `RM-001..` with severity, wave, lane, dependencies, source audit IDs, decision links. Also lists where audits disagreed and how it was resolved. |
| [decisions.md](decisions.md) | Owner decisions `D-01..` and owner-only verifications `V-01..`, each with options, recommendation, what it unblocks. |
| [waves.md](waves.md) | Dependency graph, launch order, merge order for shared files, migration batches, exit criteria per wave. |
| [specs/](specs/) | 14 lane specs with exclusive file ownership and a paste-ready agent brief each. |
| [audits/](audits/) | Source audits (read-only): `MM-` mobile-member, `MS-` mobile-staff, `WD-` web, `BE-` backend, `IO-` infra, `DX-` design. |

## Lanes

| Lane | Spec | Wave(s) | Model start (policy) |
|---|---|---|---|
| 01 security-hotfixes | [lane-01](specs/lane-01-security-hotfixes.md) | 0, then follow-ups | Luna medium |
| 02 storage-config-and-ci | [lane-02](specs/lane-02-storage-and-config.md) | 0, 1, 3 | Luna medium (infra, split by phase) |
| 03 rbac-and-roles | [lane-03](specs/lane-03-rbac-and-roles.md) | 1, 2 | Luna medium |
| 04 verification-and-consent | [lane-04](specs/lane-04-verification-and-consent.md) | 1, 2, 3 | Luna medium, split by task |
| 05 announcements-api-and-schema | [lane-05](specs/lane-05-announcements-api-and-schema.md) | 1, 2 | Luna medium, split T1..T5; Sonnet only after a smaller model failed |
| 06 announcements-web-authoring | [lane-06](specs/lane-06-announcements-web-authoring.md) | 1, 2 | Luna medium |
| 07 mobile-navigation-and-shell | [lane-07](specs/lane-07-mobile-navigation-and-shell.md) | 0, 1, 2 | Luna medium |
| 08 announcements-mobile-reader (and member content screens) | [lane-08](specs/lane-08-announcements-mobile-reader.md) | 2, 3 | Luna medium |
| 09 mobile-profile-and-avatar (and prayer, inbox, push) | [lane-09](specs/lane-09-mobile-profile-and-avatar.md) | 2, 3 | Luna medium |
| 10 church-join-and-switching | [lane-10](specs/lane-10-church-join-and-switching.md) | 2 | Luna medium, split API / web / mobile |
| 11 mobile-staff-features | [lane-11](specs/lane-11-mobile-staff-features.md) | 0, 1, 2, 3 | Luna medium |
| 12 i18n-and-swahili | [lane-12](specs/lane-12-i18n-and-swahili.md) | 1, 3 | Luna low/medium |
| 13 design-system-and-brand | [lane-13](specs/lane-13-design-system-and-brand.md) | 1, 3 | Luna medium |
| 14 web-dashboard-quality | [lane-14](specs/lane-14-web-dashboard-quality.md) | 1, 3 | Luna medium |

Merge note: the requested `ci-and-release` lane is folded into lane 02 (same files: workflows, Dockerfiles, `app.json`, `eas.json`, config). `web-dashboard-quality` stays separate (lane 14). Push notifications are split: API and client in lane 09, EAS credentials and builds in lane 02.

## Model policy (from owner instructions)

GPT-6 Luna via codex for most workers (reasoning effort low or medium). Luna often fails on large tasks and on sandbox paths: keep each brief to one task group, list exact files, and relaunch with a smaller slice if it stalls twice. Fall back to Claude Haiku (`claude-haiku-5-5`) when Luna is unavailable or stalled twice on the same task. Sonnet only if a smaller model already failed on that task or it is genuinely extremely hard. Never Opus for workers. Luna has no SSH: server, devbox, deploy and remote-check work goes to Haiku or the owner.

## Ground rules for every agent

1. Work in the existing checkout `/Users/upstairs/Personal/builds/church/church-management-system` on branch `design/mito-ya-baraka-concepts`. No worktrees, no new branches unless the coordinator says so.
2. Touch only the files your lane owns (globs in your spec). Need a change elsewhere? Write it in your final report under "Requests to other lanes". Never edit another lane's file, even for a one-line fix.
3. No `git commit`, no `git push`, no `git stash`. The coordinator reviews the diff and commits one commit per lane task. No `Co-Authored-By` or AI attribution trailers.
4. Never run `pnpm add`, `pnpm install`, or edit `pnpm-lock.yaml` or any `package.json`. Required dependencies are listed in each spec under "Dependencies to add"; the integrator installs them in the wave's dependency batch.
5. Never run `pnpm db:generate`, `db:push`, `db:migrate`, or any migration command. Lanes edit table TypeScript only; the integrator generates one migration per batch (see [waves.md](waves.md)). Never write migration SQL by hand.
6. No servers, databases, Garage, Coolify or deploys unless the brief says so. Prod: never, without explicit owner approval in this session. Dev deploy and dev migration apply: only with the owner's OK for this session.
7. No secrets in files, docs, logs or chat. Env files: report key names only.
8. Targeted tests first: run only tests for files you changed. Run **one** final `tsc`/typecheck and **one** targeted test pass at the end, not after every edit. Say what you ran and what you skipped.
9. After editing `packages/config/src/i18n/**` run `pnpm --filter @church/config build` (mobile and web read `dist`). After editing `packages/db/tables/**` run `pnpm --filter @church/db build`.
10. Mobile device checks: use the T3 panel `agent-device` tools (load `device_list`, `device_open`, `device_screenshot` via ToolSearch), never raw `simctl` or `adb` for driving the UI. Never force-stop Expo Go. If Metro serves stale code, restart Metro with `--clear`.
11. Swahili first: every user-visible string needs `en` and `sw` keys in the lane's own message file; Swahili is written by the agent and flagged `sw-review-pending` for the native reviewer (DEC-13, D-13).
12. Do not end your turn while waiting on a long step. Run long steps in the foreground (timeout 10 min or less) or poll with a bash loop until a result prints.

## Agent brief template

Every spec ends with a filled copy of this template (60 lines or fewer). Paste it as the whole task prompt.

```
ROLE: build agent for lane <NN> <name>. You are a leaf worker: start no subagents.
REPO: /Users/upstairs/Personal/builds/church/church-management-system  BRANCH: design/mito-ya-baraka-concepts (stay on it)
READ FIRST: docs/roadmap/README.md (ground rules), docs/roadmap/specs/lane-NN-*.md (this spec), docs/roadmap/backlog.md rows RM-xxx.
OWN (may edit): <globs>
DO NOT TOUCH: everything else (esp. pnpm-lock.yaml, package.json, packages/db/migrations, other lanes' files).
GOAL: <one sentence>
STEPS: 1.. 2.. 3..   (verify each cited file/line before editing; audits can drift)
VERIFY: <targeted test commands>; one final type-check: <command>
REPORT FORMAT (max 15 lines): files changed; RM IDs done / partial; tests run + result; tests skipped; requests to other lanes; open risks.
```

## Environment facts agents need

- Monorepo: `apps/api` (NestJS), `apps/web` (Next.js 16), `apps/mobile` (Expo SDK 58, expo-router 58), `packages/db` (Drizzle), `packages/config` (shared i18n and permissions).
- DEV test member: `mobile.test@mitoyabarakachurch.org` (role member) with realistic data from `packages/db/seeds/mobile-demo-data.sql`. There is no staff test account until RM-027.
- Storage is S3-compatible via AWS SDK (path style); Garage runs on the shared host. Members cannot upload today (`manage:files` only).
- Existing mobile tests: `apps/mobile/tests/{api-session,checkin,claims,request-gate,restore}.test.ts`; web `apps/web/tests/*` (node test runner); API jest (`apps/api`, 28 spec files).
- Stale planning docs: `specs/mobile-api-inventory.md` and the remediation register still list library detail, membership list, R-MOB-01/03/04 as missing or not started; code has them (MM-42, WD-30). Tracked as RM-064.

## How the coordinator launches a lane

1. Check the lane's "Depends on" in its spec and `waves.md` (merge order). Confirm the dependency lanes are merged.
2. Confirm open decisions the lane needs (spec header, `decisions.md`) are answered or the spec's default applies.
3. Run the integrator's dependency batch for the wave (installs deps, one lockfile commit).
4. Paste the spec's "Agent brief" as the prompt (Luna first). One lane = one agent at a time. Lanes in the same wave may run in parallel only if `waves.md` says so.
5. Review the diff against the lane's owned globs (any file outside = reject). Run the lane's targeted tests. Commit locally, one commit per task.
6. Follow `waves.md` merge order for shared files; run the migration baton when a lane changed `packages/db/tables/**`.
7. Dev deploy only with the owner's OK for the session; prod migrations and deploys always need explicit owner approval.
