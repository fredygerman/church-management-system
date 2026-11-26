# Backend API audit (apps/api, packages/db)

- Branch: `design/mito-ya-baraka-concepts` (read at HEAD; no source changed, nothing committed).
- Scope: `apps/api/src` (all modules), `packages/db/tables`, `packages/db/migrations`, `apps/api/src/database/migrations`, `packages/config/src/permissions.ts`, `packages/db/seeds`.
- Method: static read of code and docs. Live check limited to public dev endpoints: `GET /health` 200 (`status: ok`), `GET /health/simple` 200, `GET /docs` 200 (Swagger public on dev). No DB, server, or Garage access. Tests not run.
- Line numbers are from the current branch and may drift.

## 1. Summary

- **Tenant isolation is mostly sound at the membership layer.** `ChurchContextGuard` is global and re-checks `userChurchMemberships` for every `churchId` (`apps/api/src/auth/guards/church-context.guard.ts:72-100`). Members are row-scoped on `/members` (`members.service.ts:101-107`). The main gap is the SMS/notification log: the `notifications` table has **no `churchId`**, and `GET /sms/notification/:reference` returns any row to any `manage:sms` user (BE-01, P0).
- **Identity has a takeover path.** Users can change their own email with no verification (`users.service.ts:77-99`). OAuth login then links a Google identity to any passwordless account matching that email (`auth.service.ts:504-535`). That is BE-02 (P0).
- **There is no email or phone verification anywhere.** `users` has no verified fields, the only OTP table is in an orphan SQL file, and the password-recovery flow creates tokens but never delivers them (`auth.service.ts:572-607`, `void resetUrl`).
- **RBAC leaks privacy data to members.** MEMBER holds `view:visitors` and gets an unscoped church-wide list (BE-05). `GET /events` passes `publishedOnly=false`, so members see drafts (BE-14).
- **Input validation is patchy.** 31 `@Body()` parameters use inline TypeScript types, which `ValidationPipe` (whitelist + forbidNonWhitelisted) does not validate (BE-10). `PUT /churches/:id` therefore mass-assigns into `networkId` (BE-06).
- **Communications is a single-shot SMS blaster.** Recipients are filtered only by phone presence. There is no consent, no opt-out, no verified-only filter, no idempotency, no retries, no webhooks, and email campaigns always fail because members have no email (BE-11 to BE-19).
- **Dev library 500** (`POST /library/resources/:id/access`, "Resolved credential object is not valid") is consistent with the S3 client receiving empty credentials or a region mismatch. `forcePathStyle` is set, but `region: 'auto'` is an R2 convention and is unverified against Garage (BE-15). The error text reaches the client because the error interceptor forwards raw `Error.message` (BE-07).
- **Push infrastructure does not exist** (no device table, no Expo sender). Announcements have no detail endpoint, and the list leaks internal campaign names.
- **Immediate low-risk fixes** (each one line or a small guard): BE-01 restrict or delete the reference route; BE-02 make `PATCH /users/me` email read-only; BE-14 pass `publishedOnly` for members; BE-05 drop `view:visitors` from MEMBER; BE-07 return generic messages for non-HTTP errors; BE-06 use a DTO class.

## 2. Findings

Severity: P0 = exploit or cross-tenant exposure now; P1 = material security/privacy/legal or blocks a planned feature; P2 = correctness, contract, or ops debt; P3 = polish. Effort: S ≤ 1 day, M ≤ 1 week, L > 1 week.

| ID | Sev | Area | Evidence | Recommendation | Effort | Depends on |
|---|---|---|---|---|---|---|
| BE-01 | P0 | Tenancy | `apps/api/src/sms/sms.controller.ts:91-100` `GET notification/:reference` → `sms.service.ts:234-242` queries by `reference` only. `packages/db/tables/notifications.ts:4-28` has no `churchId`. Reference = `SMS-${Date.now()}-${Math.random()…}` (`sms.service.ts:61-65`), i.e. guessable within a time window. Returns message body and recipient phone. | Remove the route or restrict to SUPER_ADMIN. Add `church_id` to `notifications` (backfill from campaigns/users), filter by it, and switch references to `crypto.randomUUID()`. | M | Lane 4 migration; Lane 2 send path |
| BE-02 | P0 | Auth / account linking | `apps/api/src/users/users.service.ts:77-99` sets `email` from body with no verification, no password re-auth, no lowercasing (dup check is case-sensitive). `auth.service.ts:504-535`: OAuth login finds user by provider email; if `passwordHash` is null it inserts a provider link and logs the caller in. `users.controller.ts:119-121` accepts `email` untyped. | Make `email` read-only on `PATCH /users/me`; add the verification flow (4.3) before any email change; normalise emails; only auto-link when the local email is `email_verified_at` and set by the provider. | S (freeze) / M (flow) | 4.3 for the full fix |
| BE-03 | P1 | Auth / verification | `packages/db/tables/user.ts:25-36` has no `email_verified_at` or `phone_verified_at`; `phone` is unique but unverified. Only `verif` hits in `apps/api/src` are the Google verifier and comments. `apps/api/src/database/migrations/0001_create_otp_table.sql` creates `otps` but is not in the journal and has no schema. | Implement 4.3. Backfill OAuth users as email-verified from Google's `email_verified` claim. | L | Lane 1 |
| BE-04 | P1 | Auth / recovery | `auth.service.ts:572-607`: token stored (sha256, 15 min TTL), reset URL built, then `void resetUrl` (line 607); response is generic. Rate limiter is an in-memory `Map` (`auth.service.ts:86`, `665-675`), so it resets per instance and grows without bound. | Wire an email/SMS delivery adapter (depends on BE-03 verified channel), delete the dead flag branch, move limiter to Redis or DB. | M | BE-03, BE-09 |
| BE-05 | P1 | RBAC | `packages/config/src/permissions.ts:189-200` MEMBER includes `view:visitors`. `visitors.controller.ts:52-70` and `visitors.service.ts:34-48` list every visitor in the church, with no role scope; `GET :id` (line 84) too. Leaders get no scope either (ZONE_LEADER at line 161). | Remove `view:visitors` from MEMBER. Add row scope for ZONE/DEPT leaders (same pattern as `members.service.ts:101-107`). Confirm product intent first. | S | Product decision |
| BE-06 | P1 | Input / tenancy | `churches.controller.ts:29-36` `UpdateChurchInput` is a `type`, so no validation. `churches.controller.ts:98-106` passes it to `churches.service.ts:100-107` `set({...data})`. A super_admin can set `networkId`, `id`, or `deletedAt`. | Create a class DTO with `@IsOptional` whitelisted fields; the service must pick fields explicitly. | S | none |
| BE-07 | P1 | Security / errors | `apps/api/src/common/interceptors/error.interceptor.ts:43-48`: non-HttpException errors send `error.message` to the client (line 44), plus `name`. Dev credential error reached the client this way. | Return `'Internal server error'` for non-HTTP errors; log detail server-side only; include a request id. | S | none |
| BE-08 | P1 | Auth / config | `apps/api/src/config/index.ts:46-48` falls back to a committed string secret for JWT (and `:55-57` for session). Nothing fails fast in prod. `auth.service.ts:165-167` hard-codes access TTL `3600` and ignores `JWT_ACCESS_TOKEN_EXPIRES_IN` (`config:49`, default 15m). Access and refresh tokens share one secret (separated only by `type`). | Throw at boot when `NODE_ENV=production` and `JWT_SECRET` is unset or equals the default. Use the config TTL. Plan separate refresh secret. Escalate to P0 if prod lacks the env var (unverified). | S | verify prod env |
| BE-09 | P1 | Auth / brute force | `app.module.ts:44` global `ThrottlerModule` is 100 req/min per IP with the default in-memory store. `auth.controller.ts:44-48` login and `:37-41` register have no tighter limit, and there is no per-account lockout. `@Throttle` appears only 4 times (password recovery and AI). | Add per-route limits on login/register/refresh (e.g. 10/min/IP and 5/min/email), progressive lockout, and a Redis store (`REDIS_URL` is optional today). | M | none |
| BE-10 | P1 | Input validation / OpenAPI | 94 `@Body()` params; about 31 use inline object types (grep, approximate), e.g. `communications.controller.ts:12-17`, `auth.controller.ts:45-47`, `attendance.controller.ts:67`, `users.controller.ts:121`, `prayer.controller.ts:16-20`. Only 16 files import `class-validator`. Swagger shows no request schema for those routes. | Convert to DTO classes module by module, starting with auth, communications, users, attendance, prayer. Add a lint rule (no object-literal `@Body` types). | M | none |
| BE-11 | P1 | Comms / security | `mail/mail.controller.ts:39-41` `POST /mail/send` takes arbitrary `to` and raw `html` (`mail/dtos/send-email.dto.ts`, no sanitiser). `sms.controller.ts:29-37` `POST /sms/send` and `:59-66` `POST /sms/test` send to any number on global credentials. Both need only `manage:mail` / `manage:sms` (BRANCH_ADMIN has `manage:sms`, `permissions.ts:157`). No church attribution or audit row. | Restrict to SUPER_ADMIN, add audit rows with church and actor, drop raw HTML (templates only), and remove or rate-limit `/sms/test`. | S | Product decision on who may send |
| BE-12 | P1 | Comms / reliability | `communications.service.ts:414-428` checks `status` in JS and then sets `sending` without a conditional update, so double-click or two replicas can double-send. `:576-603` `@Cron(EVERY_MINUTE)` runs on every replica with no lock. A crash after `sending` leaves the campaign stuck (cron only picks `scheduled`). No per-recipient idempotency: `campaign_recipients` is unique per address (`communications.ts:112`) but deliveries are not. | Claim with `UPDATE ... WHERE status IN (...) RETURNING` or `FOR UPDATE SKIP LOCKED`. Use a unique key `(campaign_id, recipient_id, channel)` on deliveries. Add a sweeper for stuck `sending`. Use a single-leader lock for crons. | M | Lane 2 |
| BE-13 | P1 | Comms / legal (PDPA 2022) | `communications.service.ts:468-476` sends `category: 'MARKETING'` SMS to every member with a phone. `resolveRecipients` (`:298-385`) checks only phone presence. No consent or opt-out column exists in `members.ts` or `communications.ts`. No unsubscribe path. | Add consent (purpose, source, timestamp) and opt-out tables; filter sends by consent; add a STOP path; log lawful basis; record in privacy notice. Get owner/legal sign-off on the basis before enabling marketing sends. | L | Legal input; BE-03 |
| BE-14 | P1 | Contract / RBAC | `events.controller.ts:85-99` passes `false` for `publishedOnly` (line 99). `events.service.ts:93,103` default-off the filter. MEMBER has `view:events` (`permissions.ts:196`). Members see drafts and cancelled events. | Compute `publishedOnly = !isEventManager(role)` in the controller and keep the service default `true`. Hide cancelled from members unless they RSVP'd. | S | none |
| BE-15 | P1 | Storage / config | Dev `POST /library/resources/:id/access` → 500. Path: `library.controller.ts:54-63` → `file-upload.service.ts:581-606` → `getSignedUrl`. Client: `file-upload.service.ts:153-161` `region: 'auto'`, `forcePathStyle: true`, credentials from `S3_ACCESS_KEY`/`S3_SECRET_KEY` (`config/index.ts:83-89`, `:101-102`). Empty or unset credentials produce "Resolved credential object is not valid". Garage needs a real region (its default is `garage`, verify) and matching signing region. No boot check. | Add `S3_REGION`, `S3_FORCE_PATH_STYLE`, and AWS-standard names (`S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`) with fallbacks. Validate at boot and in `/health` readiness. See 4.7. Not reproduced: needs dev env check. | S | Dev env inspection (owner) |
| BE-16 | P1 | Storage / security | `file-upload.service.ts:307-310` extension is taken from the client filename (`split('.').pop()`) and MIME from the client (`validateFileType`, `:273-285`). No magic-byte check, no AV. Public-upload only sets a metadata flag (`file-upload.controller.ts:282-284`); the object lands in the same bucket and the returned `fileUrl` is `publicUrl/bucket/key` (`file-upload.service.ts:328`). `directory` is an unvalidated string (`:161`, `:309`). | Derive extension from detected type; allowlist MIME and extension; sniff magic bytes; reject SVG/HTML; keep objects private and serve via signed URLs; validate `directory` enum. AV (ClamAV) is a later phase for documents. | M | Lane 3 |
| BE-17 | P2 | Comms / channels | `communications.service.ts:341-355` every email recipient is skipped ("members table does not contain email"); `:430-431` logs `email_not_supported`; `:515-520` then marks the campaign failed. `campaigns.channel` is a single enum, so one campaign cannot target SMS and email. | Add `email` to members (or a contacts table) with verification (BE-03). Allow `channels text[]` per announcement. | M | BE-03 |
| BE-18 | P2 | Contract / announcements | `communications.controller.ts:105-108` list only; no `GET announcements/:id`. `communications.service.ts:211-223` returns `name` (internal campaign label) plus `subject`, `body`, and `sentAt` for every completed campaign, ignoring audience filters. Mobile reads `subject ?? name ?? title` and `body ?? content` (`apps/mobile/app/(member)/index.tsx:146-150`), so internal names appear as titles when `subject` is null. | Announcements v2 (4.2). Keep old fields as aliases for one release. | M | 4.2 |
| BE-19 | P2 | Comms / SMS | No GSM-7/UCS-2 segment logic and no body length cap (`campaigns.body` is `text`). `sms.service.ts:79` truncates only the preview at 200 chars. `communications.service.ts:485-488` sets `deliveredAt` at send time, not from a provider receipt. No delivery webhook route exists. `sms.service.ts:85-133` writes the full body and `to` into `notifications`. | Compute segments and cap (e.g. 3); use short links; add `POST /webhooks/sms/:provider` with HMAC verification; set `delivered` only from receipts. | M | Provider docs |
| BE-20 | P2 | Feature gap | No device or token table, no `expo-server-sdk`, no push sender. `inbox_notifications` (`packages/db/tables/inboxNotifications.ts`) exists without fan-out to a device. | 4.6. | M | none |
| BE-21 | P2 | Ops / migrations | Two trees: `packages/db/migrations` (0000-0016, authoritative; `apps/api/drizzle.config.ts` `out`) and `apps/api/src/database/migrations` (journal has only `0000`; `0001_create_otp_table.sql` and a second `0002_*` are orphan). `AUTO_MIGRATE` runs at boot (`config/index.ts:143`, `helpers/util.ts:118`). | Delete or archive the apps/api tree after confirming nothing depends on it. Keep AUTO_MIGRATE off in prod. Migrations via drizzle-kit only. | S | Owner check |
| BE-22 | P2 | Ops / exposure | `main.ts:72` mounts Swagger with no gate (dev `/docs` = 200). `health/health.controller.ts:10-40` returns uptime, memory, node version, and feature flags publicly; it does not ping the DB. `main.ts:26` helmet is set. | Gate `/docs` outside dev (or behind basic auth). Split public `/health/live` (no detail) from internal readiness with DB probe. | S | none |
| BE-23 | P2 | Data model / attendance | `packages/db/tables/attendance.ts:51-58` `sessionDate`, `openedAt`, `closedAt` are `date`, so no time of day. `attendance.controller.ts:67-69` body is `{ serviceTypeId, title?, sessionDate: string }`. | Add `starts_at timestamptz` (keep `session_date` as local date) and `service_time` in service types. | S | none |
| BE-24 | P2 | Privacy / retention | `retention.service.ts:27-45` purges refresh tokens, AI conversations, and soft-deleted documents only. Not covered: `notifications` (SMS bodies and phones, `notifications.ts:9-16`), expired `password_recovery_tokens`, `campaign_recipients` PII (`communications.ts:92-107`), `campaign_events`. | Add purge jobs with a documented period per table; mask recipient phone in logs. | M | BE-13 policy |
| BE-25 | P2 | Security / logs | `sms.controller.ts:38` and `:66` log full phone numbers; `sms.service.ts:133` logs `to`. `auth.controller.ts` debug-logs the full Google auth URL (contains state). | Log a masked number (last 3 digits) and a request id. | S | none |
| BE-26 | P2 | Auth / OAuth | `auth.controller.ts:312,388-389` echoes `callbackUrl` from the query into the post-login redirect without an allowlist. `auth.controller.ts` (~278, ~343) builds `redirect_uri` from `process.env.API_BASE_URL` with a localhost fallback, while `config.appUrl` (`config/index.ts:15-16`) is unused there. | Allowlist `callbackUrl` against `FRONTEND_URL` origins or drop it. Use one config source for API base URL. | S | none |
| BE-27 | P2 | Tenancy / hardening | `auth/guards/church-context.guard.ts:55-71` skips the membership check when `request.path.includes('/profile')` or `'/users/me'`, or matches safe endpoints by substring. Any future route with those substrings skips the check. | Match exact route patterns (or use an explicit `@SkipChurchContext()` decorator). | S | none |
| BE-28 | P2 | Feature gap / avatar | MEMBER lacks `manage:files` (`permissions.ts:189-200`), so the upload controller rejects members (`file-upload.controller.ts:147`). `users.service.ts:100` stores `picture` as arbitrary text (`user.ts:33`, `varchar(255)`). | 4.1 (member avatar via `update:self`, stored key). | M | BE-16 |
| BE-29 | P2 | Feature gap / prayer | `prayer.controller.ts:16-20` body is an inline type (no length limit; `prayerRequests.ts:27` is unbounded `text`). Only self-service endpoints exist (`:31`, `:59`). No leader list, status (answered), or privacy/anonymous flag. | DTO with 2000-char limit; leader list with `view:prayer-requests` and zone scope; `status` and `visibility` columns. | M | BE-10 |
| BE-30 | P2 | Feature gap / giving | `payment/payment.service.ts` has no module, controller, or webhook route. `config/index.ts:121-134` has ZenoPay keys and `webhookSecret` but nothing uses them. | Decide: remove dead code or wire a signed webhook with idempotent receipt table. | M | Owner decision |
| BE-31 | P2 | Ops / CI and tests | No CI workflow (`.github` contains only `copilot-instructions.md`). API has 28 `*.spec.ts` files and no `test/` e2e folder. Jest is configured (`apps/api/package.json`), no coverage gate. | Add CI: typecheck, lint, jest, and a DB-backed e2e for auth, tenancy, and RBAC. | M | Lane 5 |
| BE-32 | P2 | Input / errors | 62 `@Param('id') id: string` with no `ParseUUIDPipe` (0 uses). A non-UUID hits Postgres and surfaces as 500 (and with BE-07, leaks the DB error). | Global `ParseUUIDPipe` or a custom UUID DTO on id params. | S | BE-07 |
| BE-33 | P2 | Data model / member app | No devotionals or sermon media model. Library covers files (`documents`), but there is no range-request or HLS streaming, no series/topic model, no watch progress beyond `resourceProgress`. | Model `sermons` (video/audio asset, speaker, date, series) and add signed URLs with range support or a streaming host. | L | Product scope |
| BE-34 | P3 | Auth / policy | `auth.service.ts:106-107` requires ≥12 chars but no maximum (bcrypt truncates at 72 bytes); email format is not validated (`:105-107` checks only non-empty). | Max 128 chars; validate email format; consider NFKC normalisation. | S | none |
| BE-35 | P3 | Auth / sessions | `auth.controller.ts:200-235` logout calls `revokeTokens` (`auth.service.ts:310-320`), bumping `tokenVersion` for all devices. | Per-device sessions (family id per device) if multi-device logout is wanted. | M | Product |
| BE-36 | P3 | Storage / security | `file-upload.service.ts:165-176` disables TLS verification when `NODE_ENV=development`. Dev only, but `NODE_ENV` drift could leak to staging. | Gate by an explicit `S3_INSECURE_TLS` flag. | S | none |
| BE-37 | P3 | Data / seeds | Placeholder description `"Default church for Test Church HQ"` (`packages/db/seeds/seedChurches.ts:25`, `seedWorkspaces.ts:25`). `auth.service.ts:707` stores any free-text `description` unvalidated. | Replace seed text; cap and sanitise description. | S | none |
| BE-38 | P3 | Data / schema hygiene | `apps/api/src/database/schema.ts` and `schema/index.ts` are shims beside `packages/db`. `users` has both `unique` on `email` and an `idx_users_email` index (`user.ts:31,46`). `users.created_at/updated_at` are `date` (`user.ts:41-42`). | Remove shims once imports point at `@church/db`; drop redundant index; move audit columns to `timestamptz`. | S | BE-21 |
| BE-39 | P3 | Notifications contract | `notifications.service.ts:147-160` `toResponse` exposes `templateKey` and `templateData` (internal keys). | Return rendered `title`/`body` and a `kind`; keep keys server-side. | S | Mobile alias |
| BE-40 | P2 | Performance | `visitors.service.ts:98-108` `getVisitorsByStatus` loads all visitors (`limit` defaults to 200 at `:35`) and runs one query per visitor. | Single query with latest-followup join, paginated. | S | none |

## 3. Controls that are working

- Refresh rotation with family reuse detection and 10 s grace (`auth.service.ts:339-391`); tokens carry `tv` checked on every request (`jwt.strategy.ts:63`).
- bcrypt cost 12 for passwords (`auth.service.ts:116`, `:646`); recovery tokens stored as sha256 and single-use (`:617-658`).
- Google ID token checks `aud`, `iss`, `exp`, and `email_verified` (`google-identity-verifier.ts:58-70`); OAuth state cookie (`auth.controller.ts`, `__google_oauth_state`).
- Drizzle query builder everywhere; no `sql.raw` or string-built SQL found in `apps/api/src`.
- `.env` files are gitignored (`.gitignore:40`, `git check-ignore` confirmed); committed `*.env.example` files contain placeholders only (scanned, no secret-like values).
- `helmet()` (`main.ts:26`), explicit CORS origins (`main.ts:75-80`, `config/index.ts:137-140`), global throttler (`app.module.ts:44`).
- Member record scope (`members.service.ts:101-107`) and AI tool permission re-check (`ai-tools.ts:121`).
- Document retention deletes the S3 object before the row (`retention.service.ts:50-75`); upload rollback deletes orphaned objects (`file-upload.service.ts:408-435`).
- Platform-admin is server-side allowlist (`auth/platform-admin.ts`), not a JWT claim.

## 4. Proposed specs

Conventions: all JSON uses the existing response envelope `{ "success": true, "data": … }`. Errors use `{ "success": false, "statusCode", "message", "code" }` where `code` is new and machine-readable. Migrations are generated with drizzle-kit into `packages/db/migrations`; the SQL below is a sketch. Prod migrations need explicit owner approval; dev first.

### 4.1 Member avatar upload

- **Endpoints**
  - `PUT /users/me/avatar` (multipart, field `file`). Auth: JWT. Permission: `update:self` (MEMBER has it; no new permission). Global ChurchContext not required (user-level route).
  - `DELETE /users/me/avatar` → 204. Permission: `update:self`.
  - `GET /users/me` gains `avatarUrl` (signed GET, 15 min, nullable) and keeps `picture` (OAuth) as a fallback.
- **Request rules**: MIME `image/jpeg`, `image/png`, `image/webp` (detected by magic bytes, not client MIME); max 2 MB; max 6000 px per side; decode with `sharp` with `limitInputPixels`; re-encode to 512×512 JPEG and strip EXIF.
- **Response** `200`:
  ```json
  { "success": true, "data": { "avatarUrl": "https://…signed…", "avatarUpdatedAt": "2026-11-26T10:00:00Z" } }
  ```
- **Storage**: key `avatars/{userId}/{uuid}.jpg`, bucket private. Store the key, never a URL. Delete the previous object after the row update commits.
- **Errors**: `400 AVATAR_MISSING_FILE`; `413 AVATAR_TOO_LARGE`; `415 AVATAR_TYPE_UNSUPPORTED`; `422 AVATAR_DECODE_FAILED`; `429` (10 uploads/hour/user).
- **Migration sketch**:
  ```sql
  ALTER TABLE users ADD COLUMN avatar_key varchar(512);
  ALTER TABLE users ADD COLUMN avatar_updated_at timestamptz;
  ```
- **Acceptance**: MEMBER can upload; SVG, HTML, and oversize files are rejected; EXIF is absent in stored object; a user cannot fetch another user's avatar key through any endpoint; old object is removed.
- **Test plan**: unit (magic bytes, sharp re-encode, size limits); e2e with storage mock (MEMBER token → 200, other user → 403 on fetch); dev smoke with one JPEG and one renamed `.svg`.
- **Risks**: decompression bombs (pixel cap); Garage signed URL expiry for mobile caching; avatars are personal data (retention on delete).
- **Rollout**: additive migration on dev, verify, then prod after approval. Mobile ships upload UI after `avatarUrl` exists.

### 4.2 Announcements v2

- **Tables** (new; old `campaigns` remain for SMS campaigns):
  ```sql
  CREATE TYPE announcement_status AS ENUM ('draft','pending_approval','approved','scheduled','sending','sent','failed','cancelled','expired');
  CREATE TABLE announcements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id uuid NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    title varchar(120) NOT NULL,
    body_format varchar(16) NOT NULL CHECK (body_format IN ('plain','markdown')),
    body text NOT NULL CHECK (char_length(body) <= 20000),
    channels text[] NOT NULL DEFAULT '{in_app}',
    audience jsonb NOT NULL DEFAULT '{"allMembers":true}',
    sms_body varchar(459),
    status announcement_status NOT NULL DEFAULT 'draft',
    created_by uuid REFERENCES users(id), approved_by uuid REFERENCES users(id), approved_at timestamptz,
    publish_at timestamptz, published_at timestamptz, expires_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
  );
  CREATE TABLE announcement_attachments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    announcement_id uuid NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
    storage_key varchar(512) NOT NULL, file_name varchar(255) NOT NULL,
    mime_type varchar(100) NOT NULL, size_bytes integer NOT NULL, sha256 char(64) NOT NULL
  );
  CREATE TABLE announcement_deliveries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    announcement_id uuid NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
    member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    channel varchar(16) NOT NULL CHECK (channel IN ('in_app','sms','email')),
    status varchar(16) NOT NULL DEFAULT 'pending',
    attempts smallint NOT NULL DEFAULT 0, next_attempt_at timestamptz,
    provider_message_id varchar(255), last_error text,
    idempotency_key char(64) NOT NULL UNIQUE,
    UNIQUE (announcement_id, member_id, channel)
  );
  ```
- **Endpoints**
  | Method and path | Permission | Notes |
  |---|---|---|
  | `POST /announcements` | `manage:communications` | creates draft; 201 |
  | `PATCH /announcements/:id` | `manage:communications` | draft only; else 409 `ANNOUNCEMENT_NOT_EDITABLE` |
  | `POST /announcements/:id/submit` | `manage:communications` | → `pending_approval` |
  | `POST /announcements/:id/approve` | `approve:announcements` (new; ADMIN, SUPER_ADMIN) | 403 `SELF_APPROVAL_FORBIDDEN` if approver = creator |
  | `POST /announcements/:id/publish` | `send:communications`; header `Idempotency-Key` | requires `approved`; 202; `publishAt` must be ≥ now+60 s |
  | `POST /announcements/:id/cancel` | `manage:communications` | before `sending` |
  | `GET /announcements` | `view:announcements` (new, all roles) | members: `sent`/`sending`, audience match, not expired; staff: all with `status` filter |
  | `GET /announcements/:id` | `view:announcements` | same visibility; otherwise 404 |
- **Request** (`POST /announcements`):
  ```json
  { "title": "Harambee this Friday", "bodyFormat": "markdown", "body": "Join us at **6 pm**…",
    "channels": ["in_app", "sms"],
    "audience": { "allMembers": false, "zoneIds": ["…uuid…"], "genders": [], "maritalStatuses": [] },
    "attachmentIds": ["…uuid…"], "publishAt": "2026-12-01T06:00:00Z", "expiresAt": "2026-12-08T00:00:00Z",
    "smsBody": "Harambee Fri 6pm. Details: {{shortLink}}" }
  ```
- **Response** (`GET /announcements/:id`, member view):
  ```json
  { "success": true, "data": { "id": "…", "title": "…", "bodyFormat": "markdown", "body": "…",
    "publishedAt": "…", "expiresAt": null,
    "attachments": [ { "id": "…", "fileName": "order.pdf", "mimeType": "application/pdf", "sizeBytes": 183201, "url": "signed, 5 min" } ] } }
  ```
  Compatibility: list keeps `subject`, `name`, `body`, `sentAt` as aliases for one release.
- **Rules**
  - Body: plain or Markdown source only. No raw HTML stored. Render on client with a safe renderer; if HTML is ever allowed, sanitise server-side on write (allowlist) and again on read.
  - Verified-only delivery: SMS only when `phone_verified_at IS NOT NULL` and SMS consent is present and not opted out; email likewise with `email_verified_at`. `in_app` goes to the audience regardless.
  - SMS: GSM-7 160 chars single / 153 per segment; UCS-2 70 / 67; cap at 3 segments; long content uses `{{shortLink}}` to `/a/{shortId}`.
  - Scheduling: a cron claims due rows with `FOR UPDATE SKIP LOCKED`. Retries: 5 attempts, exponential backoff, then `failed` with `last_error`.
  - Idempotency: `Idempotency-Key` header on publish; `idempotency_key` unique per delivery.
  - Webhooks: `POST /webhooks/sms/:provider` with HMAC verification updates `status` and `delivered_at`.
- **Errors**: `400 ANNOUNCEMENT_BODY_INVALID`, `400 SMS_TOO_LONG`, `409 ANNOUNCEMENT_NOT_EDITABLE`, `403 SELF_APPROVAL_FORBIDDEN`, `409 ALREADY_PUBLISHED`, `422 AUDIENCE_EMPTY`.
- **Acceptance**: a member never sees drafts, other zones' targeted posts, or unverified-channel SMS; publish twice with the same key sends once; a crash mid-send resumes without duplicates; the old `/communications/campaigns` flow still works.
- **Test plan**: unit (segment calculator, sanitiser, audience matcher); integration (publish/approve/cancel state machine); e2e (member visibility matrix); mobile contract test against the alias fields.
- **Risks**: campaign and announcement double model during transition; provider receipt semantics vary; legal basis for marketing (BE-13).
- **Rollout**: schema additive on dev; keep old endpoints; flip mobile to `GET /announcements/:id` after one release.

### 4.3 Email and phone verification

- **Tables and columns**:
  ```sql
  ALTER TABLE users ADD COLUMN email_verified_at timestamptz;
  ALTER TABLE users ADD COLUMN phone_e164 varchar(20);
  ALTER TABLE users ADD COLUMN phone_verified_at timestamptz;
  CREATE TABLE contact_verifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    channel varchar(8) NOT NULL CHECK (channel IN ('email','phone')),
    destination varchar(255) NOT NULL,
    code_hmac char(64) NOT NULL,
    purpose varchar(16) NOT NULL CHECK (purpose IN ('signup','change','recovery')),
    attempts smallint NOT NULL DEFAULT 0,
    expires_at timestamptz NOT NULL, consumed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
  );
  CREATE INDEX ON contact_verifications (user_id, channel, created_at DESC);
  ```
- **Endpoints** (JWT; `update:self`):
  - `POST /auth/verification/email` `{ "email": "…" }` → 202 `{ "data": { "expiresInSeconds": 600, "resendAfterSeconds": 60 } }`
  - `POST /auth/verification/email/confirm` `{ "code": "123456" }` → 200 `{ "data": { "emailVerified": true, "verifiedAt": "…" } }`
  - `POST /auth/verification/phone` `{ "phone": "+255…" }` (normalised to E.164) → 202
  - `POST /auth/verification/phone/confirm` `{ "code": "123456" }` → 200
  - `GET /auth/verification/status` → `{ "email": { "verified": true, "masked": "f***@credable.io" }, "phone": { "verified": false, "masked": null } }`
  - `PATCH /users/me` email change: requires `currentPassword` for password accounts; clears `email_verified_at`; a verification is then required.
- **Rules**: 6-digit code, stored as HMAC-SHA256 with a server secret (not plain sha256); TTL 10 min; 5 attempts then invalidate; resend cooldown 60 s; max 5 sends/day per user and per destination; constant-time compare; no code in logs. OAuth users: `email_verified_at = created_at` when Google `email_verified` is true (backfill).
- **Errors**: `400 INVALID_CODE` (with `attemptsRemaining`); `410 CODE_EXPIRED`; `429 TOO_MANY_ATTEMPTS`; `409 PHONE_IN_USE`; `422 INVALID_PHONE`.
- **Acceptance**: unverified users cannot be targeted by announcements on that channel; email change cannot complete without a code sent to the new address; OAuth auto-link (BE-02) requires `email_verified_at`.
- **Test plan**: unit (HMAC, attempt counting, cooldown); e2e (happy path, lockout, expiry, race on confirm); security test that BE-02 linking is blocked for unverified emails.
- **Risks**: SMS costs and pumping (rate limit by destination); delivery depends on BE-04 adapter; Tanzanian number formats (+255).
- **Rollout**: additive migration on dev; ship endpoints behind `VERIFICATION_ENABLED`; enable prod after approval.

### 4.4 Church join and invite

- **Tables**:
  ```sql
  CREATE TABLE church_invitations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id uuid NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    token_sha256 char(64) NOT NULL UNIQUE,
    email varchar(255), role varchar(32) NOT NULL, zone_id uuid,
    max_uses smallint NOT NULL DEFAULT 1, used_count smallint NOT NULL DEFAULT 0,
    requires_approval boolean NOT NULL DEFAULT false,
    expires_at timestamptz NOT NULL, revoked_at timestamptz,
    created_by uuid REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now()
  );
  ALTER TYPE membership_status ADD VALUE 'pending_approval';
  ```
- **Endpoints**:
  - `POST /churches/:id/invitations` (`manage:users`; BRANCH_ADMIN limited to own branch; `role` must be ≤ caller's role) body `{ "email"?: "…", "role": "member", "zoneId"?: "…", "expiresInDays": 14, "maxUses": 1, "requiresApproval": false }` → 201 `{ "data": { "id", "joinUrl", "expiresAt" } }`; `token` shown once only.
  - `GET /invitations/:token` (public) → `{ "churchName", "role", "expiresAt", "emailRequired": true }`; no member data.
  - `POST /invitations/:token/accept` (JWT). Email invites require `email_verified_at` and match. Creates membership `active` or `pending_approval`. → 201 `{ "data": { "churchId", "membershipId", "status" } }`.
  - `POST /churches/join` `{ "joinCode": "…" }` → creates `pending_approval`.
  - `PATCH /memberships/:id` `{ "status": "active" | "suspended" }` (`manage:users`, scoped).
  - `DELETE /invitations/:id` → revoke (204).
- **Rules**: 32-byte random token, stored as sha256; single-use by default; accept is transactional and idempotent by `(invitation, user)`. `pending_approval` is not `active`, so `ChurchContextGuard` (`church-context.guard.ts:92-102`) blocks it; the UI must show "waiting for approval".
- **Errors**: `404 INVITATION_NOT_FOUND`; `410 INVITATION_EXPIRED_OR_USED`; `403 EMAIL_MISMATCH`; `403 EMAIL_NOT_VERIFIED`; `409 ALREADY_MEMBER`.
- **Acceptance**: a non-admin cannot create invitations; a token cannot be used twice; an invite for a@x cannot be accepted by b@x; `pending_approval` members have no church data access.
- **Test plan**: unit (token hashing, role ceiling); e2e (create → preview → accept → guard passes; reuse fails; expired fails); RBAC matrix test (see 4.8).
- **Risks**: invite links forwarded by WhatsApp; mitigated by expiry and single use; join codes must be rotatable.
- **Rollout**: dev first; enum add is non-transactional in Postgres, so deploy in its own migration.

### 4.5 Event visibility filtering

- **Change** (no schema change):
  - `events.controller.ts:85-99`: compute `const publishedOnly = !isEventManager(request.user.role)` and pass it (replacing `false`). `isEventManager` = `manage:events` in `PERMISSION_MAP`.
  - `events.service.ts:93,117`: keep the default `publishedOnly = true`.
  - For members, cancelled events are hidden unless the member has an RSVP row.
  - `status` query param is ignored for non-managers (200, not 403, to keep mobile stable).
- **Response**: unchanged envelope.
- **Acceptance**: a MEMBER token gets only `published` events (no `draft`); `GET /events/:id` returns 404 for drafts; staff still see drafts.
- **Test plan**: e2e with MEMBER, LEADER, ADMIN tokens against seeded drafts; unit on the controller argument.
- **Risks**: members who RSVP'd to a later-cancelled event lose the entry; show a cancelled note only via `GET /events/me`.
- **Rollout**: code only; dev first, then prod.

### 4.6 Push notifications (Expo)

- **Table**:
  ```sql
  CREATE TABLE push_devices (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expo_token varchar(255) NOT NULL UNIQUE,
    platform varchar(8) NOT NULL CHECK (platform IN ('ios','android')),
    app_version varchar(32), last_seen_at timestamptz NOT NULL DEFAULT now(),
    disabled_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
  );
  CREATE TABLE notification_preferences (
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category varchar(32) NOT NULL, push_enabled boolean NOT NULL DEFAULT true,
    PRIMARY KEY (user_id, category)
  );
  ```
- **Endpoints** (`update:self`):
  - `PUT /users/me/push-devices` `{ "expoToken": "ExponentPushToken[…]", "platform": "ios" }` → 200 (upsert by token).
  - `DELETE /users/me/push-devices/:id` → 204 (logout).
  - `GET /users/me/notification-preferences` / `PATCH` → per-category toggles.
- **Sending**: `expo-server-sdk` in batches of 100; enqueue on `inbox_notifications` insert (`notifications.service.ts`) and on announcement publish. Payload contains no PII: `{ title, body: short, data: { type, id } }`. On `DeviceNotRegistered`, set `disabled_at`. Poll receipts after 15 min.
- **Config**: `EXPO_ACCESS_TOKEN` optional; if unset, sending is a no-op with a log line.
- **Acceptance**: a token from a second device receives the push; logout removes the token; disabled token stops; no push body contains a phone or amount.
- **Test plan**: unit (batching, error mapping); e2e with Expo sender mocked; manual device test on dev build.
- **Risks**: token churn; Expo rate limits; privacy of previews on lock screens (keep bodies generic for giving).
- **Rollout**: tables on dev; sender off until token set; prod after approval.

### 4.7 Storage configuration (Garage)

- **Env contract** (names only; never commit values):

  | Variable | Required | Notes |
  |---|---|---|
  | `S3_ENDPOINT` | yes | Garage S3 API URL |
  | `S3_REGION` | yes | must match Garage's configured region (default `garage`; verify) |
  | `S3_ACCESS_KEY_ID` | yes | fallback to `S3_ACCESS_KEY` for one release |
  | `S3_SECRET_ACCESS_KEY` | yes | fallback to `S3_SECRET_KEY` |
  | `S3_BUCKET_NAME` | yes | private bucket |
  | `S3_FORCE_PATH_STYLE` | yes | `true` for Garage |
  | `S3_PUBLIC_URL` | no | drop once no public objects remain |

- **Buckets and keys** (Garage CLI, run by owner on the shared infra; sketch only):
  - `garage bucket create church-private`
  - `garage key create church-api`
  - `garage bucket allow --read --write --key church-api church-private` (no `--owner`)
  - Do not create a public bucket. Uploads and downloads go through the API or signed URLs.
  - Lifecycle: abort incomplete multipart uploads after 1 day (if supported by Garage version; verify).
- **Code**: `config/index.ts` reads the new names with fallbacks; `file-upload.service.ts:153-161` uses `region: config.s3.region`, `forcePathStyle: config.s3.forcePathStyle`; boot throws if any required var is empty; `/health` readiness adds a `headBucket` probe with timeout 2 s.
- **Errors**: presign with missing creds becomes `503 STORAGE_NOT_CONFIGURED` (no raw SDK text).
- **Acceptance**: `POST /library/resources/:id/access` returns a signed URL on dev; boot fails with a clear log when a var is empty; logs contain no key values.
- **Test plan**: unit (config parsing); integration against a local MinIO/Garage container; dev smoke: upload → access → download.
- **Risks**: region mismatch silently breaks signing; existing objects keyed under `uploads/`, `documents/` must remain readable.
- **Rollback**: revert env to old names (fallback kept); no schema change.
- **Rollout**: dev first, owner runs bucket/key creation; prod after approval.

### 4.8 RBAC matrix

Current (`packages/config/src/permissions.ts`) with proposed changes marked **(new)** or **(remove)**. Roles: SA = SUPER_ADMIN, A = ADMIN, BA = BRANCH_ADMIN, ZL = ZONE_LEADER, DL = DEPARTMENT_LEADER, M = MEMBER.

| Permission | SA | A | BA | ZL | DL | M | Notes |
|---|---|---|---|---|---|---|---|
| `read:self`, `update:self` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | avatar, verification, push devices use `update:self` |
| `read:member` | ✓ | ✓ | ✓ | ✓ (scoped) | ✓ (scoped) | ✓ (self only) | `members.service.ts:101-107` |
| `view:visitors` | ✓ | ✓ | ✓ | scoped **(change)** | scoped **(change)** | **(remove)** | BE-05 |
| `view:events` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ (published only) | BE-14 |
| `manage:events` | ✓ | ✓ | ✓ | – | – | – | unchanged |
| `view:communications` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | staff; members use `view:announcements` |
| `view:announcements` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ (visible only) | **(new)** |
| `manage:communications` | ✓ | ✓ | ✓ | – | – | – | drafts |
| `approve:announcements` | ✓ | ✓ | – | – | – | – | **(new)**; not creator |
| `send:communications` | ✓ | ✓ | ✓ | – | – | – | publish; BA optional **(decide)** |
| `manage:sms` | ✓ | ✓ | **(remove)** | – | – | – | BE-11 |
| `manage:mail` | ✓ | ✓ | – | – | – | – | templates only |
| `manage:files` | ✓ | ✓ | ✓ | – | – | – | library; avatars not gated by this |
| `manage:users` | ✓ | – | – | – | – | – | invites: **(new)** `manage:invitations` for A, BA (own branch) |
| `manage:churches` | ✓ | – | – | – | – | – | profile edits by A: **(new)** `update:church-profile` |
| `manage:offerings`, `view:giving-reports` | ✓ | ✓ | ✓ | – | – | – | unchanged |
| `read:own-giving-history` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | unchanged |
| `create:prayer-request`, `read:own-prayer-requests` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | BE-29 adds leader list **(new)** `view:prayer-requests` |

Enforcement rules: every route declares `@RequirePermission`; every list/detail under a church also filters by `churchId` and, for leaders, by scope. Add an RBAC test table generated from this matrix.

## 5. Parallel work lanes

Each lane owns the listed files. Lanes 1–4 can run in parallel; Lane 5 touches shared bootstrap files, so coordinate. Migrations are serialised: one migration author per DB change (Lane 1 owns the `users` columns; Lane 2 owns communications; Lane 4 owns `notifications.church_id`).

| Lane | Owns (files) | Items | Order |
|---|---|---|---|
| 0 Hot fixes (1 PR each) | `sms.controller.ts`, `users.controller.ts`, `events.controller.ts`, `permissions.ts`, `error.interceptor.ts`, `config/index.ts` | BE-01 (remove route), BE-02 (freeze email), BE-14, BE-05, BE-07, BE-08 | first, small |
| 1 Identity | `auth/**`, `users/users.service.ts`, `users/users.controller.ts`, `packages/db/tables/user.ts`, `oauthProviderIdentities.ts` | BE-02, BE-03, BE-04, BE-09, BE-26, BE-34, BE-35, avatar (4.1), verification (4.3), invitations (4.4) | after 0 |
| 2 Communications | `communications/**`, `sms/**`, `mail/**`, `packages/db/tables/communications.ts`, `notifications.ts` | BE-11, BE-12, BE-13, BE-17, BE-18, BE-19, BE-24 (SMS log retention), announcements v2 (4.2), push fan-out (4.6) | after 0; needs BE-13 legal |
| 3 Storage | `file-upload/**`, `library/**`, `config/index.ts` (storage block), `helpers/util.ts` | BE-15, BE-16, BE-36, Garage (4.7), avatar storage (4.1) | parallel with 1 |
| 4 Tenancy & RBAC | `packages/config/src/permissions.ts`, `auth/guards/**`, `churches/**`, `visitors/**`, `events/**`, `members/**`, `dashboard/**` | BE-01 (`notifications.church_id` migration), BE-05, BE-06, BE-27, BE-40, RBAC matrix tests | after 0 |
| 5 Platform & ops | `main.ts`, `common/interceptors/**`, `health/**`, `apps/api/Dockerfile`, `.github/workflows/**` (new), `apps/api/src/database/migrations/**`, `packages/db/migrations/**` (read-only unless owner approves), `helpers/util.ts` | BE-10 (DTO conversion, coordinate per module), BE-21, BE-22, BE-25, BE-31, BE-32, BE-38 | parallel; CI early |
| 6 Mobile/web contracts (consumers, not backend) | `apps/mobile/**`, `apps/web/**` | announcements aliases, events, avatar UI, verification UI, push token registration | after each backend contract ships |

Suggested sequence: Lane 0 hot fixes → Lane 5 CI (so every lane has a gate) → Lanes 1, 3, 4 in parallel → Lane 2 once BE-13 legal basis is settled → Lane 6.

## 6. Open questions and unverified items

1. **Dev 500 root cause** (`POST /library/resources/:id/access`): not reproduced; I had no dev environment access. Hypothesis: `S3_ACCESS_KEY`/`S3_SECRET_KEY` empty or named differently in the dev container, and/or region `auto` not matching Garage. Owner to check env names and `S3_REGION` on dev.
2. **Prod env**: is `JWT_SECRET` set in prod? If not, BE-08 is P0. Is `AUTO_MIGRATE` on?
3. **Replicas**: how many API instances run in prod? BE-12 is P1 with one instance and worse with more.
4. **Visitors visibility**: is `view:visitors` for MEMBER intended (e.g., welcome team)? If yes, scope it.
5. **Who may send SMS/mail**: product decision for BE-11.
6. **SMS provider**: does the provider offer delivery receipts, sender-ID rules, and segment behaviour? Needed for BE-19 and 4.2.
7. **Marketing consent basis** under Tanzania PDPA 2022: legal review before enabling BE-13 sends.
8. **Garage**: confirm configured region name and whether `auto` is accepted.
9. **Public bucket**: is `S3_PUBLIC_URL` pointing at a public bucket today? If so, BE-16 is higher.

## 7. Notes on scope

- Mobile reads were checked only where they touch API contracts (`apps/mobile/app/(member)/index.tsx:76,146-150`).
- Test count: 28 API spec files; not executed.
- Recommended next step: owner answers items 1-3 in section 6, then Lane 0 PRs start.
