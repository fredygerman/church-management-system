# Infra and ops audit: storage, mail/SMS, push, mobile delivery, CI, DX

- Date: 2026-11-26
- Branch audited: `design/mito-ya-baraka-concepts` (HEAD `4e0710f`)
- Mode: read-only. No source, config, server, or database was changed or contacted. Only this file was written.
- Evidence: repo files (cited as `path:line`) and Great Tech Ops docs (`resource-inventory.md`, `todo.md`, `runbooks/`), read from `/Users/upstairs/Personal/projects/Great Tech Ops/docs`.
- Not verified here: live Coolify env values, Resend/SMS vendor consoles, DNS state today, and whether the GTO inventory is current. Each such item is marked "verify".
- Secrets: only key names and set/empty status were checked in env files. No values appear in this document.

Severity: **P0** blocks production safety now; **P1** blocks the next release or a launch-relevant capability; **P2** fix before launch; **P3** hygiene. Effort: S < 1 day, M 1–3 days, L > 3 days.

---

## 1) Summary

- **Dev 500 root cause (IO-02):** the API loads only the root `.env` (`apps/api/src/config/index.ts:6`). The root `.env` has no `S3_*` keys. The S3 keys sit in `apps/api/.env`, which nothing loads. The AWS SDK then throws "Resolved credential object is not valid" because `accessKeyId` is undefined (`node_modules/.pnpm/@smithy+signature-v4@5.7.5/.../index.js:283-286`). Fix is config plus Coolify env, not code logic.
- **Garage will not work as-is (IO-03):** the S3 client hard-codes `region: 'auto'` (`file-upload.service.ts:154`). The Garage signing region used on this estate is `garage` (per `urban-garage-storage.md`). Expect signature mismatches until the region is configurable.
- **Secret fallback is the biggest latent risk (IO-01):** `JWT_SECRET` and `SESSION_SECRET` fall back to public strings (`config/index.ts:46-57`). An empty Coolify value (`docker-compose.coolify.yml` passes `${JWT_SECRET}`) silently selects the public default. `validateConfiguration()` exists (`helpers/util.ts:134`) but nothing calls it.
- **Messaging is half-built:** Resend email works in code but has no bounce/complaint handling, no opt-out, no DMARC, and an unowned default sender domain. SMS talks to an unnamed generic gateway, has no phone normalization, and has no OTP. Password recovery builds a reset link and then discards it (`auth.service.ts:607`).
- **Push and mobile release are absent:** no push token table, no `expo-notifications`, no `eas.json`, and a minimal `app.json`. Expo Go is fine for UI work only.
- **No CI at all:** `.github/` contains only `copilot-instructions.md`. The `/health` endpoint, which Docker uses as its healthcheck, never checks the database.
- **Docs and env drift** (README, `turbo.json`, `.example.env`, Dockerfiles) will cause setup mistakes. Fixing them is cheap.

What is in good shape: `helmet` is on (`main.ts:26`), CORS is allow-listed without credentials (`main.ts:75-80`), the API image runs as non-root (`apps/api/Dockerfile:93`), `.env` files are git-ignored and untracked, mobile tokens live in SecureStore (`apps/mobile/lib/storage.ts`), documents are served via 300-second presigned URLs (`file-upload.service.ts`, `MEMBER_DOWNLOAD_URL_EXPIRY_SECONDS`), password-recovery tokens are hashed and single-use, and the document retention purge is in place (`retention/retention.service.ts`).

---

## 2) Findings

| ID | Sev | Area | Evidence | Recommendation | Effort | Depends on |
|---|---|---|---|---|---|---|
| IO-01 | P0* | Secrets | `apps/api/src/config/index.ts:46-57` uses `process.env.JWT_SECRET \|\| '<public default>'` (same for session). `''` falls through to the default. `helpers/util.ts:134` `validateConfiguration()` is never called. `docker-compose.coolify.yml:17` passes `${JWT_SECRET}`. | Verify prod and dev values are set (set/empty check only). Remove fallbacks; in `main.ts` call a fail-fast check when `NODE_ENV=production` and any of `JWT_SECRET`, `SESSION_SECRET`, `NEXTAUTH_SECRET` is missing or default. *P0 until prod values are confirmed set. | S | — |
| IO-02 | P1 | Storage, dev | `config/index.ts:6` loads only root `.env`. Root `.env` has no `S3_*` keys (checked). `apps/api/.env` has them and is never read. `apps/api/package.json` `dev` uses `dotenv -e ../../.env` too. | Runbook §3.1.1. One env loader (apps/api first, then root, no override) and/or move keys to the env source Coolify uses. | S | — |
| IO-03 | P1 | Storage, Garage | `file-upload.service.ts:154` `region: 'auto'`. Garage signing region on this estate is `garage` (`urban-garage-storage.md`). | Add `S3_REGION` (default `auto` for R2, `garage` for Garage). | S | — |
| IO-04 | P1 | Deploy config | `docker-compose.coolify.yml:6-35` backend `environment` passes only ~9 vars. Omitted but read by code: `S3_*`, `RESEND_API_KEY`, `EMAIL_FROM`, `GOOGLE_*`, `SMS_API_*`, `AUTO_MIGRATE`, `MAX_FILE_SIZE_MB`, `ALLOWED_DOCUMENT_TYPES`, `AI_*`. `API_BASE_URL` is passed but config reads `APP_URL`. Whether Coolify injects UI-only vars into containers is not established by the repo. | Add every runtime var to compose with `${VAR}`, or confirm Coolify injects them and document that. Verify in Coolify. | S | — |
| IO-05 | P1 | Storage, URLs | `file-upload.service.ts:328` returns `${S3_PUBLIC_URL}/${bucket}/${key}` as `fileUrl`. That only works on a public-read bucket, which contradicts the private model used for documents. No web or mobile code reads `fileUrl`. | Stop returning a public URL. Return document IDs; keep the bucket private; serve via presigned URLs. | S | — |
| IO-06 | P1 | Security, proxy | No `trust proxy` anywhere in `apps/api/src` (grep). Traefik fronts the API, so `req.ip` is the proxy for all clients. `ThrottlerModule` (`app.module.ts`, 100/min) and the recovery limiter (`auth.controller.ts:55` → `auth.service.ts:568`, keyed by IP) become global. | `app.set('trust proxy', 1)` in `main.ts` after checking hop count; test with two source IPs. | S | — |
| IO-07 | P1 | Auth, recovery | `auth.service.ts:572` returns generic response unless `PASSWORD_RECOVERY_DELIVERY_CONFIGURED=true`. `auth.service.ts:607` `void resetUrl` discards the link. No reset page in `apps/web/app` (grep). Limiter is an in-memory `Map` (`auth.service.ts:86`), lost on restart and not shared across replicas. | Wire `mailService.sendPasswordResetEmail` (exists, `mail.service.ts:131`); add web reset page; move limiter to DB or Redis. Keep the generic response. | M | IO-10 |
| IO-08 | P1 | Phone verification | No OTP logic. `otps` table exists only in `apps/api/src/database/migrations/0001_create_otp_table.sql`; no Drizzle definition in `packages/db/tables`. Registration accepts an unverified `phone` (`auth.service.ts:692-705`). | Design and build SMS OTP (§3.3.3). Decide the table in `packages/db` (migration owner lane). | M | IO-13 |
| IO-09 | P1 | SMS abuse | `sms.controller.ts:36-45` (`POST /sms/send`) and `:62-85` (`POST /sms/test`) take arbitrary `to` and `userId` from the body. Only gate is `manage:sms`. No per-church daily cap, no country allow-list. | Derive `userId` from the JWT; remove `/sms/test` in prod; per-church daily cap; `+255` allow-list; spend alert. | M | IO-13 |
| IO-10 | P1 | Email deliverability | `mail.service.ts` uses the Resend SDK. `RESEND_API_KEY`/`EMAIL_FROM` are absent from compose. Default sender `Church <noreply@church.org>` (`config/index.ts:63-64`); `church.org` is not a project domain in the inventory. `resource-inventory.md:152`: `mitoyabarakachurch.org` has no DMARC. Resend DNS records are not recorded in GTO docs. | Use `noreply@mitoyabarakachurch.org` (or a sending subdomain) after Resend verification; set DMARC (§3.2.2). | S–M | Owner DNS action |
| IO-11 | P1 | Delivery status | `communications.service.ts:488` and `:514` set `deliveredAt` when the provider accepts, not when delivered. No webhook route for bounce, complaint, or SMS delivery reports; the only webhook config is ZenoPay (`config/index.ts:125-126`). | Add `POST /webhooks/resend` (signature-verified) and an SMS DLR route; split `accepted` from `delivered`; suppress bounced and complained addresses. | M | IO-10, IO-13 |
| IO-12 | P1 | Consent | No opt-out or unsubscribe field, no `List-Unsubscribe` header. Recipients are resolved only by contact presence (`communications.service.ts:298-386`; skip reasons at `:350`, `:364`). | Add consent/opt-out per member and channel; honour it in recipient resolution; one-click unsubscribe for email. Counsel review under Tanzania's Personal Data Protection Act, 2022 (verify). | M | IO-19 |
| IO-13 | P1 | SMS provider | `sms.service.ts:137-152` POSTs `{from,to,text,reference}` with Basic auth to `SMS_API_URL`. No vendor named in repo or GTO docs. `SMS_API_*` absent from both env files. `turbo.json` lists `SMS_API_KEY`/`SMS_API_SECRET`, which the code never reads (`config/index.ts:115-116` reads `USERNAME`/`PASSWORD`). | Owner chooses provider and sender ID (§3.3.1). Align `turbo.json` to real var names. | S (decision) | Owner |
| IO-14 | P1 | Phone format | `sms/dtos/send-sms.dto.ts:8-9` accepts any string for `to`. `sms.service.ts:137-142` forwards it unchanged. | Normalise to E.164 `+255` and reject anything else before storing or sending. | S | — |
| IO-15 | P1 | Push | No `expo-notifications` or `expo-device` in `apps/mobile/package.json`. No device-token table in `packages/db/tables`. No device route. `PUSH` exists only as an enum (`packages/config/src/types/notifications.ts:25`). | Build per §3.4. | L | Owner accounts (IO-21) |
| IO-16 | P1 | CI | `.github/` holds only `copilot-instructions.md`. Web `lint` is `eslint . --fix` (`apps/web/package.json`), so it rewrites instead of gating. Root has no `test` script. `apps/api` `test:e2e` points to `./test/jest-e2e.json`, which does not exist. | Build per §3.6. Make lint check-only in CI. | M | — |
| IO-17 | P1 | Health | `apps/api/src/health/health.controller.ts` and `helpers/util.ts` `getHealthInfo` return static `ok` with no DB ping. Docker `HEALTHCHECK` (`apps/api/Dockerfile`) and compose healthcheck use it, so a DB outage reports healthy. | Add `/health/ready` that runs `SELECT 1` with a 1-second timeout; point the healthcheck at it. | S | — |
| IO-18 | P1 | API surface | `main.ts:72` `SwaggerModule.setup('docs', ...)` is unconditional. Express-level routes bypass Nest guards (verify with a request to the dev host). | Disable or auth-gate `/docs` in production. | S | — |
| IO-19 | P1 | Migrations | Two trees: `packages/db/migrations` (drizzle `out`, `packages/db/drizzle.config.ts:17`) and `apps/api/src/database/migrations` (0000–0002 + `meta/_journal.json`). `apps/api/package.json` `"migrate": "drizzle-kit push"` skips migration files. `AUTO_MIGRATE` can migrate at boot (`config/index.ts:143`, `helpers/util.ts:118`). | Pick `packages/db/migrations` as the single source. Retire the API tree after reconciliation (owner approval). Drop `drizzle-kit push` from runbooks. Keep `AUTO_MIGRATE` off in prod. | M | Owner approval |
| IO-20 | P1 | Domain | `resource-inventory.md:139`: `mitoyabarakachurch.org` expires **2026-12-26** (auto-renew Enabled). `resource-inventory.md:159`: Cloudflare SSL mode not recorded. | Owner confirms renewal/payment method. Set SSL to Full (strict) after verifying origin certs. | S | Owner |
| IO-21 | P2 | Mobile config | `apps/mobile/app.json` has name, slug, version, orientation, scheme, plugins only. No `ios.bundleIdentifier`, `android.package`, icon, splash, `runtimeVersion`, `updates`, `extra.eas.projectId`. No `eas.json`. | §3.5. | M | Owner (IDs, accounts) |
| IO-22 | P2 | Observability | No Sentry or APM in `apps/api`, `apps/web`, or `apps/mobile` (grep). Logging is Nest `Logger` to stdout only. | Add Sentry (API, web, mobile) with PII scrubbing; keep logs structured. | M | Owner (Sentry org) |
| IO-23 | P2 | PII in logs | `sms.controller.ts:38` and `:66` log full phone numbers. `sms.service.ts:154` logs the full request body (phone and message text) at debug. `database/seed.ts:39-87` logs emails. `auth.controller.ts:295` logs the Google OAuth URL. | Mask phone (`+255***123`) and email; never log message bodies. | S | — |
| IO-24 | P2 | Campaign engine | `communications.service.ts:414-530` (`processCampaign`) awaits each send inline, one recipient at a time. Called from `sendNow` (`:271`) and the cron (`:591`). No retry, no concurrency cap, no outbox. | Outbox table plus scheduled worker (§3.4.3 pattern), batched sends, bounded concurrency, retry with backoff. | M | IO-11 |
| IO-25 | P2 | Secrets in build | `docker-compose.coolify.yml:44-45` passes `NEXTAUTH_SECRET` and `JWT_SECRET` as dashboard build args. `apps/web/Dockerfile` (builder stage) declares them as `ARG`/`ENV`. Build logs and cache can hold them. | Remove from build args; keep runtime-only in compose `environment`. Confirm `env.mjs` does not need them at build. | S | — |
| IO-26 | P2 | Containers | `apps/web/Dockerfile` production stage has no `USER` (runs as root) and copies the whole builder tree (`COPY --from=builder /app /app`). API production stage copies the full workspace, including devDependencies and source (`apps/api/Dockerfile`, `COPY --from=builder --chown=... /app ./`). | Web: add non-root user. API and web: prune to `pnpm deploy --prod` output. | M | — |
| IO-27 | P2 | Upload hygiene | `file-upload.controller.ts:210` and `:286` take `directory` from the body. `file-upload.service.ts:309` indexes `config.s3Directories[directory]` with no allow-list. Extension comes from the client filename (`split('.').pop()`). MIME is the client-declared header only. | Enum-validate `directory`; derive extension from validated MIME; sniff magic bytes for PDF/JPEG/PNG. | S | — |
| IO-28 | P2 | Diagnostics route | `file-upload.controller.ts:82-135` (`POST /api/files/diagnostics`) writes a real object to the live bucket and returns the first 5 characters of the access key. Gated by `manage:files`. | Remove from prod or gate behind an explicit env flag; never return key material. | S | — |
| IO-29 | P2 | TLS in dev | `file-upload.service.ts:171` sets `rejectUnauthorized: false` when `process.env.NODE_ENV === 'development'`. | Replace with an explicit `S3_INSECURE_TLS` flag, default off. | S | — |
| IO-30 | P2 | Redis | `REDIS_URL` is read (`config/index.ts:38-42`) and reported (`helpers/util.ts`). No queue or cache consumer found; Redis is not in compose. Treat as unused until confirmed (`database/database.service.ts` also matches "redis"). | Decide: remove config, or adopt for rate limits (IO-06) and outbox (IO-24). | S | IO-06, IO-24 |
| IO-31 | P2 | Docs and env drift | `turbo.json` `dev`/`start` env lists include `SMS_API_KEY`/`SECRET` (unused); `.example.env` is a Neon-era file (`neondb`, `/src/env.mjs`); README says copy to `.env.local` at root while config reads `.env`; README omits `apps/mobile`, says Node 20+ while Dockerfiles use `node:22`; `.github/copilot-instructions.md` says Next.js 14 (README: 16); `apps/api/.env.example` says `EMAIL_FROM=noreply@church.local` while config defaults to `church.org`. | Fix in one docs pass (§4 lane E). Delete `.example.env`. | S | — |
| IO-32 | P3 | Repo hygiene | `apps/mobile/.expo/` is untracked and not ignored (`git status`). | Add `.expo/` to `.gitignore`. | S | — |
| IO-33 | P2 | Seeds | `packages/db/demo.ts` is guarded by `DEMO_SEED_CONFIRM` (README). `packages/db/seed.ts` and `apps/api/src/database/seed.ts` have no production refusal. Prod is intentionally unseeded (`todo.md:144`, GTO). | Refuse when `NODE_ENV=production` or the DB host is prod; dev-only demo. | S | — |
| IO-34 | P2 | Backups and restore | Church dev DB: daily 03:00, R2 30 days (`resource-inventory.md:340`). Prod: first R2 backup recorded OK (`todo.md:144`); schedule recorded 2026-09-01 (`resource-inventory.md:303`), re-verify on `great-tech-prod-01`. No Church restore rehearsal in GTO docs. No Church media bucket exists. Garage off-host snapshot freshness is unresolved (`todo.md:46`, `:137`). | Restore rehearsal (§3.7.1). Do not put prod media in Garage until the off-host proof in §3.7.2 passes. | M | Owner |
| IO-35 | P2 | Monitoring | External uptime monitor and Grafana alert rules are pending (`todo.md:193`, `:196`). No Church URLs in those rules. | Add monitors (§3.7.3). | S | — |
| IO-36 | P2 | Avatars and announcement images | No member avatar field or upload. `publicChurchProfiles.imageUrl` is free text (`packages/db/tables/publicChurchProfiles.ts:20`). Campaigns are text only. `profileImages` and `temp` prefixes are configured (`config/index.ts:105-110`) but unused. | Decide the scope; if built, follow §3.1.4. | M | Product decision |
| IO-37 | P2 | Dev and prod parity | Both `church-dev` and `church-prod` deploy `main` from the same compose (`resource-inventory.md:104-105`, `:239-241`). Concept branch is not deployed. No staging gate beyond dev. | Keep dev→prod order with an explicit gate (§3.8); no direct prod deploys from feature branches. | S | — |
| IO-38 | P3 | Email template drift | `mail/templates/order-confirmation.tsx` and `mail.service.ts:161-191` are e-commerce leftovers (`/track/` URL). Not used by church flows. | Remove or repurpose. | S | — |

\* IO-01 is P0 until the production values are confirmed set; then it drops to P1 for the fail-fast guard.

What is fine (no action needed): see the last paragraph of §1.

---

## 3) Runbooks and specs

Conventions: "Owner gate" means Fredy approves before the step runs. Dev steps can proceed after the Church dev deploy is verified. Prod steps need explicit approval and a fresh R2 backup (per `backup-recovery.md`).

### 3.1 Storage (Garage for dev and prod)

#### 3.1.1 Runbook: fix dev 500 "Resolved credential object is not valid"

Cause: `accessKeyId` or `secretAccessKey` is undefined in the API process (IO-02, IO-04). The SDK rejects it before the request.

1. Confirm the cause without printing values. Locally: `node -e` check that `process.env.S3_ACCESS_KEY` is undefined after the config loader. On the Coolify dev app: run `printenv` and check only presence of `S3_ACCESS_KEY` and `S3_SECRET_KEY`. Owner gate for remote shell access.
2. Land IO-03 (`S3_REGION`) and IO-02 (loader order) in code. Tests: `pnpm --filter api test -- src/file-upload` (targeted).
3. Set `S3_ENDPOINT`, `S3_REGION=garage`, `S3_BUCKET_NAME=church-dev-media`, `S3_ACCESS_KEY`, `S3_SECRET_KEY` in the Coolify dev app (`church-dev`, `ktnvqfq7ye5wfl9s9mwsy3uw`). Add the same names to `docker-compose.coolify.yml` backend `environment` as `${VAR}`. Dev deploy is allowed once verified.
4. Verify: upload a small PDF through the normal dashboard path (expect 2xx and a `documents` row), fetch its presigned download URL via `GET /api/files/library/:id/download-url` (expect 200), delete it (expect 2xx). Remove any test object.
- Rollback: unset the S3 vars and redeploy; uploads fail with a clean error rather than 500. Bucket objects are untouched.
- Acceptance: no "Resolved credential" in dev logs for an upload; round-trip above passes.

#### 3.1.2 Garage setup, dev and prod

Pattern to copy: Urban Acres storage (`docs/runbooks/urban-garage-storage.md`): private bucket, dedicated key, Cloudflare DNS-only A record to the shared host, Traefik file route to the Garage S3 port, path-style, signing region `garage`, server-side access only.

| Item | Dev | Prod |
|---|---|---|
| Endpoint (proposed) | `https://church-storage.fredygerman.com` (shared endpoint, both envs) | same |
| Bucket | `church-dev-media` | `church-prod-media` |
| Key | `church-dev`, read/write on its own bucket only; no owner permission | `church-prod`, same |
| Path style | `forcePathStyle: true` (already set, `file-upload.service.ts:160`) | same |
| Region | `garage` (new `S3_REGION`) | `garage` |
| Public or signed | Private. Downloads via presigned GET, 300 s (existing) | same |
| CORS | None needed while all access is server-side or via presigned navigation. Add only if the browser ever uploads directly. | same |
| Lifecycle | Temp prefix expiry: verify Garage 2.3.0 lifecycle support; otherwise a daily sweep job | same |
| Backups | Garage snapshot job (existing); off-host proof required | Same; gated by §3.7.2 |

Owner gates: DNS record, Traefik file route on the shared host, and key creation (creation runs on the Garage admin path, keys stored in the macOS Keychain and Coolify env only, never in repo). Prod media gate: do not store production media until §3.7.2 passes (matches `todo.md:46`).

Rollback: remove the Coolify S3 vars and the Traefik route; objects remain in bucket until deleted by a documented procedure.
Acceptance: TLS valid; anonymous `GET` returns 403; signed upload/read/delete succeeds from the API container in each env; key cannot list the other env's bucket.

#### 3.1.3 Retention

- Documents: soft-deleted rows purged after 30 days and removed from storage (`retention/retention.service.ts`, `DOCUMENT_RETENTION_DAYS = 30`, daily 03:00). Keep.
- Temp uploads: expire after 24 h (lifecycle or sweep).
- Failed uploads: already compensated (`file-upload.service.ts` `handleFileUpload` deletes the object if the DB insert fails). Keep.

#### 3.1.4 Avatars and announcement images (if built, IO-36)

- Avatars: `profile-images/<churchId>/<uuid>.webp`. Max 2 MB, server-side resize, MIME sniffed. Served via presigned URL with short TTL (or an API proxy). One current avatar per member; replacing deletes the old object. Deleted with the member, subject to the same 30-day soft-delete rule.
- Announcement images: `announcements/<churchId>/<uuid>.webp`, referenced by campaign ID. Kept while the campaign exists; removed on campaign deletion.
- Both: no public bucket reads. Metadata in Postgres; object backups via the Garage snapshot job.

### 3.2 Email (Resend)

#### 3.2.1 Setup

1. Owner: create a Resend project per environment (separate API keys; dev key for test sending only).
2. Add the sending domain in Resend. Recommended: a subdomain (for example `mail.mitoyabarakachurch.org`) so the apex stays clean. Resend gives SPF and DKIM records. Add them in Cloudflare; DKIM CNAMEs must be DNS-only. Owner gate: DNS change.
3. Set in Coolify (dev and prod) and in compose: `RESEND_API_KEY`, `EMAIL_FROM="Mito ya Baraka Church <noreply@mail.mitoyabarakachurch.org>"`. Set `FRONTEND_URL` correctly (the reset link depends on it).
4. Verification gate: Resend shows "verified" before any real send. Until then, keep `PASSWORD_RECOVERY_DELIVERY_CONFIGURED` unset.

#### 3.2.2 DMARC

1. Add TXT `_dmarc` on the zone (`p=none; rua=mailto:<owner reporting address>; adkim=r; aspf=r`). Owner gate. Current zone has none (`resource-inventory.md:152`).
2. After 2–4 weeks of clean aggregate reports, move to `p=quarantine`, then `p=reject`. Each step is an owner decision.
- Acceptance: `dig TXT _dmarc.<domain>` returns the record; a test message passes SPF, DKIM, and DMARC (check "Show original").

#### 3.2.3 Verification flows

- Password reset (IO-07): build the reset page in `apps/web`; in `auth.service.ts` pass `resetUrl` to `mailService.sendPasswordResetEmail`; keep the generic response; token TTL 15 min (`auth.service.ts:42`), hashed, single-use. Enable the flag only in dev first.
- Email verification at registration: none exists. Design: one-time code or signed link, 24 h expiry, hashed, one active per user. Gate new accounts behind verification only after owner sign-off (existing users unaffected).
- No magic links via SMS (phishing risk).

#### 3.2.4 Bounces, complaints, suppression

1. Add `POST /webhooks/resend`. Verify the signature (Resend uses Svix-style headers; confirm against current Resend docs before coding). Reject unsigned requests.
2. Handle `email.delivered`, `email.bounced`, `email.complained`, `email.delivery_delayed`. Update `messageDeliveries`; mark bounced and complained addresses suppressed for campaigns.
3. Campaign UI: show "accepted" until delivered (IO-11).
4. Test with Resend's test addresses in dev (`delivered@resend.dev`, `bounced@resend.dev`, `complained@resend.dev`; verify current list).

- Rollback: unset `RESEND_API_KEY` (service returns "not configured" and campaigns record failures). Pause campaigns first so failures do not pile up.

### 3.3 SMS and phone verification

#### 3.3.1 Provider and sender ID (owner decisions)

1. Owner chooses an aggregator. Compare: TCRA-compliant sender ID registration support, DLR (delivery report) webhook, sandbox, price per segment for Tanzania, support for Swahili text, and contract terms. Candidates named in the brief (Beem, NextSMS, Africa's Talking) are unverified here; no vendor API was checked.
2. Sender ID: alphanumeric, 11 characters or fewer (GSM convention; confirm with provider). Register through the provider with TCRA's current process before any production use. Verify current TCRA rules with the provider; do not assume.
3. Map the chosen vendor to `sms.service.ts`. If the vendor is not JSON+Basic like today, add an adapter. Keep the `SMS_API_*` names or rename to match, and update `turbo.json`.

#### 3.3.2 Config and phone normalisation

- Env: `SMS_API_URL`, `SMS_API_USERNAME`, `SMS_API_PASSWORD`, `SMS_SENDER_ID`, plus `SMS_DLR_SECRET` if the vendor signs callbacks. Pass all in compose.
- Normalise input: strip spaces and dashes; `0XXXXXXXXX` → `+255XXXXXXXXX`; `255XXXXXXXXX` → `+255…`; reject anything not `+255` followed by 9 digits. Put the normaliser in `packages/config` so web and mobile can share it.
- Store the normalised value only (IO-14).

#### 3.3.3 OTP design (IO-08)

- 6 digits, 5-minute TTL, single use, stored as HMAC-SHA256 with a server secret.
- Max 5 verify attempts per code; resend cooldown 60 s; max 5 sends per phone per day; max 20 sends per IP per hour (depends on IO-06 for correct IP).
- Public endpoints behind Cloudflare Turnstile (already used by Urban's contact form in GTO docs).
- Never log the code or full phone number.
- Country allow-list `+255` unless owner approves others (SMS pumping defence).
- Table: new `otps` in `packages/db` (migration owner lane; prod migration needs approval).

#### 3.3.4 Segments and cost

- GSM-7: 160 characters per single segment; 153 per segment when concatenated. Any non-GSM character (for example curly quotes or emoji) switches to UCS-2: 70 / 67.
- Show segment count and estimated cost in the campaign composer before send. Cap campaign body length (owner decision).
- Track spend per church per month; alert at owner-set thresholds.

#### 3.3.5 Acceptance

- Dev: send to Fredy's own number; DLR updates status; bad sender ID returns a clear failure; OTP rate limits return 429.
- Rollback: unset `SMS_API_URL`; `sendSms` fails cleanly (`fetch` throws inside the try block, recorded as failed).

### 3.4 Push notifications (Expo)

#### 3.4.1 Client (apps/mobile)

1. Add `expo-notifications` and `expo-device` (plugin config in `app.json`). Request permission after first sign-in, not at launch.
2. Get token: `getExpoPushTokenAsync({ projectId })`. `projectId` comes from `extra.eas.projectId` (set by `eas init`, owner account needed).
3. Create Android channels at startup: `announcements` (default), `events`, `pastoral` (high), `giving`. Map to iOS categories.
4. Register the token after login; delete it on logout.

#### 3.4.2 Server (apps/api)

1. Table `device_push_tokens`: `id`, `user_id`, `church_id`, `token` (unique), `platform`, `app_version`, `created_at`, `last_seen_at`, `disabled_at`, `disabled_reason`. Migration owner lane.
2. Routes: `POST /devices/push-tokens` (upsert, derived user from JWT), `DELETE /devices/push-tokens/:token`.
3. Send: an outbox table (`push_outbox`) written in the same transaction as the business event; a scheduled worker (`@nestjs/schedule`, already present) drains it every minute, in batches of ≤100 messages to Expo's push send endpoint, with an access token configured.
4. Receipts: poll Expo receipts; on `DeviceNotRegistered`, set `disabled_at`.
5. Payload: title and short text only; include an inbox item ID for deep link. No PII bodies.

#### 3.4.3 Quiet hours

- Timezone: `Africa/Dar_es_Salaam` (UTC+3, no DST).
- Per-user setting (default 21:00–06:00 local). Non-urgent categories (events, announcements, giving receipts) are deferred to 07:00 local, not dropped.
- Urgent categories (pastoral emergency, admin security alerts) bypass quiet hours. The category list needs owner approval.

#### 3.4.4 Credentials and testing

- Android standalone builds: upload an FCM v1 service-account key to EAS (`eas credentials`). iOS: APNs key via EAS. Both need owner accounts (Firebase project, Apple Developer). Store-account setup is deferred per brief, so push cannot be end-to-end tested on store-track builds yet.
- Expo Go cannot receive remote push on current SDKs (verify for the SDK in use). Test push on a development build or preview APK only.
- Acceptance: token registered and visible in table; test push received on a physical Android preview build; receipt processed; a deleted-app token gets disabled; quiet-hours deferral observed.

### 3.5 EAS builds and release

1. `eas.json` profiles:
   - `development`: `developmentClient: true`, internal distribution, APK; env `EXPO_PUBLIC_API_BASE_URL=https://dev-api.mitoyabarakachurch.org`; channel `development`.
   - `preview`: internal distribution, APK; dev API URL; channel `preview`.
   - `production`: AAB, `autoIncrement: true`; `EXPO_PUBLIC_API_BASE_URL=https://api.mitoyabarakachurch.org`; channel `production`.
2. `app.json`: `ios.bundleIdentifier` and `android.package` (owner chooses, for example `org.mitoyabarakachurch.app`); icon, adaptive icon, splash from the concept assets; `version` semver; `runtimeVersion: { policy: "appVersion" }`; `updates.url` from `eas init`; plugins `expo-notifications`, `expo-updates`, Sentry when added.
3. Signing: EAS-managed keystore; export a backup to the owner's vault (not repo). Google Play App Signing holds the app signing key; the upload key is replaceable. Owner gate for all credential actions.
4. OTA: `eas update --channel preview` for internal testers only; `production` OTA only after owner approval. Never ship JS that needs a native change under the same runtime version. Rollback: republish the previous update group to the channel.
5. Versioning: `version` in `app.json` is the user-facing semver; Android `versionCode` auto-increments on the production profile.
6. Env separation: `EXPO_PUBLIC_*` values are baked at build, so never put secrets there. Only public API base URL and public keys.
7. Crash reporting: Sentry React Native with EAS source map upload; DSN per env; scrub PII. Analytics: none initially; if added, aggregate counts only.
8. Store accounts (Google Play, Apple): deferred per brief; the pipeline stops at internal distribution until then. Owner gates: Expo account, bundle IDs, Play Console, first AAB upload to production.

Rollback: keep the previous internal APK link; republish the previous OTA group; for production store builds, the previous release remains live until a new one is approved.
Acceptance: `eas build --profile preview --platform android` yields an installable APK; it reaches the dev API; login and member flows pass manually; an `eas update --channel preview` JS change reaches the preview build; a rollback test passes.

### 3.6 CI pipeline

Target: GitHub Actions (repo is `fredygerman/church-management-system`, per GTO inventory). Node 22, pnpm 9.12.3, `pnpm install --frozen-lockfile`.

Jobs:
1. `static`: `pnpm type-check` (turbo, covers api, web, mobile); `pnpm --filter api lint` and web lint in check mode (no `--fix`).
2. `unit`: `pnpm --filter api test` (jest, 28 `*.spec.ts` files in apps and packages); `pnpm --filter web test` and `pnpm --filter mobile test` (node test runner; 11 `*.test.ts*` files across apps and packages).
3. `build`: `pnpm build` (api and web); `docker build` for `apps/api/Dockerfile` and `apps/web/Dockerfile` with no push, to catch Dockerfile breakage.
4. `migrations`: run drizzle generate against `packages/db` and fail if it writes a new file (no drift).
5. `e2e` (later): Playwright against the dev host, manual trigger only. Maestro for mobile once the dev build exists.
6. Mobile smoke: `expo export` on PR; no EAS build in CI until owner approves credentials.

Gates: branch protection on `main` requiring `static`, `unit`, `build`. Coolify auto-deploys on push to `main`; make deploys wait for green (either disable auto-deploy and trigger after checks, or check status before webhook). Owner gate: enabling Actions and secrets.

Rollback: disable the workflow file; Coolify deploy unaffected.
Acceptance: green run on the design branch; PR wall time under 10 minutes; a deliberately broken migration fails the `migrations` job.

### 3.7 Backup, restore, monitoring

#### 3.7.1 Church PostgreSQL restore rehearsal

1. Pick the latest R2 dump for `church-db-dev` and for prod.
2. Restore into a disposable PostgreSQL 18 container (match `backup-recovery.md` pattern; never into a live DB).
3. Check: `pg_restore --exit-on-error --no-owner` succeeds; table count matches the expected schema (prod notes 43 tables, `todo.md:144`); row counts on `churches`, `members`, `users` match the source snapshot.
4. Record in `decision-log.md` (GTO) after the run.
- Owner gate: reading R2 objects. Acceptance: restore succeeds with logged counts; container removed.

#### 3.7.2 Media (Garage) off-host proof

1. Repair the Garage snapshot job (`todo.md:137`: image pull failure; latest good off-host snapshot recorded Sept 11).
2. Run one controlled snapshot; download from R2 and extract into a scratch dir; list the Church bucket; compare one object checksum to source.
3. Only then enable prod media (`todo.md:46` gate).

#### 3.7.3 Monitoring additions

- External uptime checks (Pushover on failure): `https://dev-api.mitoyabarakachurch.org/health/ready`, `https://api.mitoyabarakachurch.org/health/ready` (after IO-17), `https://dev-app.mitoyabarakachurch.org/`, `https://app.mitoyabarakachurch.org/`. Expect 200 (dashboard 307 to sign-in is expected).
- Certificate and domain expiry: alert at 30 and 7 days for `mitoyabarakachurch.org` (expires 2026-12-26).
- Backup freshness: alert when the latest R2 dump for each Church DB is older than 26 h (matches existing pattern in `pushover-alerts.md`).
- Grafana: container CPU, memory, restarts for `church-dev` and `church-prod` (existing fleet dashboards).
- Logs: redact per IO-23; decide where Coolify logs go (none recorded in GTO docs; verify).

Rollback: disable individual monitors; no service impact.
Acceptance: a deliberately stopped dev container fires an alert within 5 minutes; a reset test is recorded.

### 3.8 Environments, secrets, deploy gates

- Secrets: live only in Coolify env (dev and prod) and the owner's macOS Keychain. Never in repo or docs. Rotate `JWT_SECRET`, `SESSION_SECRET`, `NEXTAUTH_SECRET` if any value was pasted into a chat, log, or shared doc.
- Config fail-fast (IO-01): in production, refuse to boot with missing or default JWT, session, or NextAuth secrets.
- Migrations: `AUTO_MIGRATE` stays off in prod. Prod sequence: (1) fresh R2 backup verified (§3.7.1); (2) owner approval; (3) run `pnpm db:migrate` from a one-off container; (4) verify counts; (5) record in decision-log. No down-migrations exist; rollback = restore from backup.
- Seeds: `db:seed:demo` runs only in dev. Add a hard refusal in `packages/db/seed.ts`, `demo.ts`, and `apps/api/src/database/seed.ts` when `NODE_ENV=production` or the DB host is prod (IO-33).
- Deploy order: dev deploy → verify (health/ready, one upload, one login) → prod only with approval. Prod is pinned to a reviewed commit.

---

## 4) Parallel work lanes (file ownership)

Lanes do not share files. Only the migration owner (lane F) edits `packages/db`; other lanes queue schema changes to it.

| Lane | Scope | Owns (files) | Depends on |
|---|---|---|---|
| A. Storage and config | IO-01, 02, 03, 04, 05, 25, 27, 28, 29 | `apps/api/src/config/index.ts`, `apps/api/src/file-upload/**`, `apps/api/src/retention/**`, `docker-compose.coolify.yml`, `apps/web/Dockerfile` (build args only) | Garage infra (owner) |
| B. Messaging | IO-06, 07, 08, 09, 10, 11, 12, 13, 14, 23 | `apps/api/src/mail/**`, `apps/api/src/sms/**`, `apps/api/src/auth/auth.service.ts` (recovery only), `apps/api/src/communications/**`, `apps/web/app/auth/**` (reset page) | Owner: SMS vendor, DNS, DMARC; lane F for new tables |
| C. Push and mobile release | IO-15, 21, 32 | `apps/mobile/app.json`, `apps/mobile/eas.json` (new), `apps/mobile/lib/notifications.ts` (new), `apps/mobile/.gitignore` or root `.gitignore`, new `apps/api/src/devices/**` | Owner: Expo, Apple, Firebase accounts; lane F for token table |
| D. CI, health, containers | IO-16, 17, 18, 22, 26, 33 | `.github/workflows/**` (new), `apps/api/Dockerfile`, `apps/web/Dockerfile` (user, prune), `apps/api/src/health/**`, `apps/api/src/main.ts` (swagger, trust proxy, fail-fast), `apps/*/package.json` lint scripts, `packages/db/seed.ts`, `packages/db/demo.ts` | — |
| E. Docs and DX | IO-31, 38 | `README.md`, `.github/copilot-instructions.md`, `.example.env` (delete), `apps/api/.env.example`, `turbo.json`, `docs/roadmap/**`; GTO docs updated by the GTO ops lane, not here | — |
| F. Migrations and schema | IO-08, 11, 12, 15, 19, 30 | `packages/db/**` (schema, tables, migrations), `apps/api/src/database/migrations/**` (reconcile, owner approval) | Owner approval for any prod-touching step |

Serialization: lane F merges first when a lane needs a table; lanes B and C land their code behind a feature flag until lane F's migration is in dev.

---

## 5) Owner decisions needed

1. SMS aggregator and sender ID (IO-13).
2. Sending subdomain and DMARC reporting address (IO-10, §3.2).
3. Bundle ID and package name, and whether Expo, Apple, and Firebase accounts are created now or later (IO-15, IO-21).
4. Garage endpoint name (`church-storage.fredygerman.com` proposed) and key creation (§3.1.2).
5. Renewal of `mitoyabarakachurch.org` before 2026-12-26 (IO-20).
6. Whether to build avatars and announcement images now (IO-36).
7. Whether `/sms/test`, `/docs`, and the diagnostics route stay in production (IO-09, IO-18, IO-28).
