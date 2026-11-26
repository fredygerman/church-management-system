# Lane 02: storage-config-and-ci

Covers the requested `storage-and-config` and `ci-and-release` lanes (same files: config, Dockerfiles, compose, workflows, `app.json`).

- **Waves:** 0 (phase A), 1 (phase B), 3 (phase C).
- **Backlog IDs:** A: RM-005, 006, 007, 008, 015, 016, 018. B: RM-041, 042, 043, 044, 045, 046. C: RM-129, 130, 131, 142, 143.
- **Decisions:** D-07 (bucket layout), D-30, D-33, D-10 (phase C), V-01, V-02, V-04, V-06.
- **Depends on:** nothing for A. B needs A merged. C needs RM-045 and D-12/D-10. **Blocks:** lanes 05 (attachments), 09 (avatar), 08 (library open), all lanes (CI gate).
- **Model:** Luna medium per phase; server and Coolify steps (RM-008) are owner or Haiku work (Luna has no SSH).

## Goal

Make storage work on Garage, make config fail safe, and give every lane a CI gate and a reproducible build.

## Owned files (exclusive)

```
apps/api/src/config/**
apps/api/src/file-upload/**           (incl. controller diagnostics route)
apps/api/src/library/**
apps/api/src/retention/**
apps/api/src/helpers/**
apps/api/src/health/**
apps/api/src/main.ts
apps/api/src/database/**              (orphan migration tree and schema shims, RM-044)
apps/api/src/payment/**               (RM-142)
apps/api/.env.example, apps/api/Dockerfile, apps/web/Dockerfile
apps/api/eslint.config.* or .eslintrc*   (lint rule only)
docker-compose.coolify.yml, turbo.json, .gitignore, README.md (root), .example.env (delete)
.github/**                             (workflows, copilot-instructions.md)
apps/mobile/app.json, apps/mobile/eas.json (new)
docs/ops/**                            (new: storage runbook, CI notes)
```

Not owned: `package.json` files and `pnpm-lock.yaml` (integrator), `apps/web/env.mjs` (lane 14), `auth.service.ts` (lane 04: must read `config.jwt.accessTokenExpiresIn` instead of the hard-coded `3600` at `auth.service.ts:165-167`, request to lane 04 under RM-035).

## Tasks (in order)

### Phase A (Wave 0)

1. **RM-006** `config/index.ts:6` loads only the root `.env`. Load `apps/api/.env` first, then root `.env`, never overriding values already set (dotenv `override: false`). Pure function so it is unit-testable.
2. **RM-005** Remove the hard-coded fallbacks for `JWT_SECRET` and `SESSION_SECRET` (`config/index.ts:46-57`). Add `assertProductionConfig(env)` in `helpers/util.ts` (the existing `validateConfiguration()` at `:134` is never called): in `NODE_ENV=production` throw at boot if `JWT_SECRET` or `SESSION_SECRET` is missing, empty or equals the old default string; in other environments warn and generate a per-process random secret. Call it from `main.ts` before `NestFactory`. Do not log values. Do **not** deploy this to PROD before V-01 confirms the secrets exist (boot would fail).
3. **RM-007** Config contract (names only; fallbacks to the old names for one release): `S3_ENDPOINT`, `S3_REGION` (default `auto` if unset, set `garage` for Garage), `S3_ACCESS_KEY_ID` (fallback `S3_ACCESS_KEY`), `S3_SECRET_ACCESS_KEY` (fallback `S3_SECRET_KEY`), `S3_BUCKET_NAME`, `S3_FORCE_PATH_STYLE` (default true), `S3_PUBLIC_URL` (optional, to be dropped), `S3_INSECURE_TLS` (default false). `file-upload.service.ts:153-176` uses `region`, `forcePathStyle` and the TLS flag from config (replaces the `NODE_ENV === 'development'` TLS bypass). When credentials are missing, presign and upload raise `ServiceUnavailableException({ code: 'STORAGE_NOT_CONFIGURED' })` with no SDK text. Production boot throws if required storage vars are empty; other environments warn.
4. **RM-015** `main.ts`: `app.set('trust proxy', hops)` with `TRUST_PROXY_HOPS` (default 1; verify Cloudflare plus Traefik hop count with a two-IP test and report); mount Swagger only when `NODE_ENV !== 'production'` or `ENABLE_DOCS=true` (`main.ts:72`); in `file-upload.controller.ts` gate `POST /api/files/diagnostics` behind `ENABLE_STORAGE_DIAGNOSTICS=true` and never return key material.
5. **RM-016** `docker-compose.coolify.yml`: pass every runtime variable the API reads (`S3_*`, `RESEND_API_KEY`, `EMAIL_FROM`, `GOOGLE_*`, `SMS_API_*`, `AUTO_MIGRATE`, `MAX_FILE_SIZE_MB`, `ALLOWED_DOCUMENT_TYPES`, `AI_*`, `APP_URL`/`API_BASE_URL` consistent with config); remove `NEXTAUTH_SECRET` and `JWT_SECRET` from dashboard build args (`:44-45`) and the matching `ARG`/`ENV` in `apps/web/Dockerfile` builder stage after confirming (read only) that `apps/web/env.mjs` needs no secret at build. Report which variables Coolify must define.
6. **RM-018** Add `apps/mobile/.expo/` to `.gitignore`.
7. **RM-008** Write `docs/ops/storage-garage.md` from the runbook in `infra-ops.md` section 3.1 (owner gates, rollback, acceptance). Infra steps (DNS, Traefik route, bucket and key creation, Coolify env, DEV round trip) are run by the owner or a Haiku agent with access; the Luna agent only writes the doc and the code.

### Phase B (Wave 1)

8. **RM-041** Upload hardening in `file-upload.service.ts` and controller: allow-list MIME and extension, detect type from magic bytes (PDF, JPEG, PNG, WebP; reject SVG and HTML), derive the stored extension from the detected type (`:307-310` today uses the client filename), `directory` must be an enum (`:161,309`), stop returning `${S3_PUBLIC_URL}/${bucket}/${key}` as `fileUrl` (`:328`; first grep web and mobile for readers: IO-05 found none). Add an internal `putPrivateObject(key, buffer, contentType)` and `getSignedGetUrl(key, ttl)` for lanes 05 and 09 (avatar and announcements use it; keys `avatars/{userId}/...`, `announcements/{churchId}/{announcementId}/...`, D-07).
9. **RM-042** `GET /health/live` (static, no detail) and `GET /health/ready` (`SELECT 1` with 1 s timeout; `headBucket` with 2 s timeout when storage is configured; returns `{ status }` only). Keep the container `HEALTHCHECK` on liveness so a database blip does not restart the container; external monitors use `/health/ready` (deviation from IO-17, owner may override).
10. **RM-043** Lint rule in the API ESLint config forbidding object-literal types on `@Body()` parameters (BE-10). Document: each lane applies the built-in `ParseUUIDPipe` on `:id` params of its own modules (BE-32). Do not add a global pipe: it would break `status/:status` and token routes.
11. **RM-044** List the orphan files in `apps/api/src/database/migrations` (`0001_create_otp_table.sql`, second `0002_*`), confirm nothing imports them, and delete only after the owner approves. `AUTO_MIGRATE` stays off in prod.
12. **RM-045** `.github/workflows/ci.yml`: Node 22, pnpm 9.12.3, `--frozen-lockfile`; jobs `static` (type-check; lint in check mode: use `eslint .` without `--fix` directly), `unit` (api jest, web and mobile node tests, config tests), `build` (api, web, plus `docker build` without push), `migrations` (run `db:generate` and fail on a diff in `packages/db/migrations`). Mobile: `expo export` on PR. No secrets in CI. Document in `docs/ops/ci.md` that deploy gating is a Coolify setting for the owner (D-33).
13. **RM-046** Docs and env drift: README (add `apps/mobile`, Node 22, env files), `turbo.json` env names (`SMS_API_*` as read by config), delete `.example.env`, update `apps/api/.env.example` names, fix `.github/copilot-instructions.md` (Next.js 16).
14. In `apps/mobile/app.json` (integrator dependency batch): add the `expo-image-picker` plugin with camera and photo permission strings (English and Swahili in one sentence each) for lane 09.

### Phase C (Wave 3)

15. **RM-129** `eas.json` profiles `development`, `preview`, `production` (APK or AAB, channels, `EXPO_PUBLIC_API_BASE_URL` per profile); `app.json` bundle IDs (D-10), icon and splash (D-12), `runtimeVersion: { policy: 'appVersion' }`, notification plugin. Owner gates for accounts and credentials.
16. **RM-130** Sentry for API, web, mobile with PII scrubbing; DSN per environment (D-10).
17. **RM-131** `apps/web/Dockerfile` non-root user; API and web images from `pnpm deploy --prod` output.
18. **RM-142** Remove or wire the unused payment module (D-26, recommend remove). **RM-143** sermon and media model is deferred; do not start.

## Contracts

- Env contract table in D-07 and task 3. Errors: `503 { code: "STORAGE_NOT_CONFIGURED" }`.
- `GET /health/live` 200 `{ "status": "ok" }`; `GET /health/ready` 200 `{ "status": "ok" }` or 503 `{ "status": "unavailable", "failed": ["database"] }` (PROPOSED; no detail beyond names).
- Storage keys: `documents/` (existing), `avatars/{userId}/{uuid}.jpg`, `announcements/{churchId}/{announcementId}/{uuid}.{ext}`, `temp/` (24 h sweep); one private bucket per environment.

## Acceptance (testable)

- Unit: `assertProductionConfig` throws for missing, empty and default secrets in production, passes otherwise; env loader reads `apps/api/.env` when root `.env` lacks keys.
- Unit: presign with empty credentials returns `STORAGE_NOT_CONFIGURED`, never the SDK message.
- DEV (owner OK): `POST /library/resources/:id/access` returns a signed URL; upload, presigned download and delete round trip succeed; anonymous GET of an object returns 403.
- `/docs` returns 404 with `NODE_ENV=production` and no `ENABLE_DOCS`; two requests from different source IPs are throttled separately behind the proxy.
- Upload of a renamed `.svg` or HTML file as `.png` is rejected.
- CI is green on the branch; a deliberately broken migration fails the `migrations` job.

## Test plan (targeted)

`pnpm --filter api test -- src/config src/file-upload src/health src/library`; for CI changes run the workflow's commands locally once. One final `pnpm --filter api type-check`. Skip web and mobile suites in phase A.

## Risks

- Phase A secrets change can stop the API booting in PROD if the env is missing: confirm V-01 first, deploy to DEV first, and note rollback (restore previous image).
- Region mismatch silently breaks signing; test on DEV before PROD. Existing objects under `uploads/` and `documents/` must stay readable.
- Coolify may or may not inject UI-only vars into containers (IO-04): the owner verifies after deploy.
- Production media must not be stored before the Garage off-host snapshot proof (V-06).

## Agent brief (phase A)

```
ROLE: build agent, lane 02 storage-config-and-ci, phase A (Wave 0). Leaf worker: start no subagents.
REPO: /Users/upstairs/Personal/builds/church/church-management-system  BRANCH: design/mito-ya-baraka-concepts (stay on it)
READ FIRST: docs/roadmap/README.md (ground rules), docs/roadmap/specs/lane-02-storage-and-config.md (tasks 1-7), docs/roadmap/audits/infra-ops.md IO-01..04, IO-06, IO-15, IO-25, IO-28, IO-29.
OWN (may edit): apps/api/src/{config/**, file-upload/**, helpers/**, health/**, main.ts}; apps/api/.env.example; docker-compose.coolify.yml; apps/web/Dockerfile (ARG/ENV secrets only); .gitignore; docs/ops/**.
DO NOT TOUCH: package.json, pnpm-lock.yaml, auth.service.ts, apps/web/env.mjs, any other file; never read or print secret VALUES from env files (key names only).
RULES: no commits/push; no pnpm add; no db commands; no deploys; no SSH.
GOAL: API loads the right env, refuses to boot with default secrets in production, and talks to Garage with a configurable region; CI-independent hardening of main.ts.
STEPS:
1. Verify: config/index.ts:6 (loads only root .env), :46-57 (secret fallbacks), :83-102 (S3 block); file-upload.service.ts:153-176 (region 'auto', TLS bypass); main.ts:26,72-80; file-upload.controller.ts diagnostics route (~:82-135).
2. RM-006 env loader: apps/api/.env first, then root .env, override false. Pure function + unit test.
3. RM-005 remove secret fallbacks; add assertProductionConfig(env) in helpers/util.ts; call from main.ts before NestFactory; non-production: warn + random per-process secret. Unit tests: missing/empty/default => throws in production.
4. RM-007 S3 vars: S3_REGION, S3_FORCE_PATH_STYLE, S3_ACCESS_KEY_ID/S3_SECRET_ACCESS_KEY with fallbacks to S3_ACCESS_KEY/S3_SECRET_KEY, S3_INSECURE_TLS; STORAGE_NOT_CONFIGURED 503 on missing creds; production boot check.
5. RM-015 trust proxy (TRUST_PROXY_HOPS default 1), Swagger only outside production or ENABLE_DOCS=true, diagnostics route behind ENABLE_STORAGE_DIAGNOSTICS and no key material in the response.
6. RM-016 compose: pass all runtime vars; remove JWT_SECRET/NEXTAUTH_SECRET build args and web Dockerfile ARG/ENV after reading apps/web/env.mjs (read only) to confirm no build-time need.
7. RM-018 .gitignore apps/mobile/.expo/. RM-008 write docs/ops/storage-garage.md (owner steps, rollback, acceptance).
VERIFY: pnpm --filter api test -- src/config src/file-upload src/health ; ONE pnpm --filter api type-check.
REPORT (max 15 lines): files changed; RM IDs done/partial; tests run + result; env var names Coolify must define (names only); owner actions needed (V-01, V-02, D-07); open risks.
```
