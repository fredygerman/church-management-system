# Lane 05: announcements-api-and-schema

- **Waves:** 1 (schema, tenancy fix, sending engine, SMS adapter), 2 (API, verified-only delivery, SMS short notice, webhooks, attachments), 3 (RM-150).
- **Backlog IDs:** RM-038, 039, 040, 063 (W1); RM-070, 071, 072, 073, 074 (W2); RM-150.
- **Decisions:** D-03 (rich text `doc_v1`), D-05 (approval setting), D-16 (audience), D-19 (consent), D-04, D-08, D-09, D-07 (storage keys), V-03 (replicas).
- **Depends on:** lane 01 merged (`sms.controller.ts` locked); lane 03 permission names (`view:announcements`, `publish:announcements`, `approve:announcements`); lane 04 verification and consent (RM-029, RM-036) for RM-071; lane 02 `putPrivateObject` and `getSignedGetUrl` (RM-041) for RM-074.
- **Blocks:** lane 06 (web authoring), lane 08 (mobile reader), lane 09 (push fan-out, inbox).
- **Model:** Luna medium, **split T1..T6**; if Luna stalls twice on a task, Haiku, then Sonnet only as policy allows. This is the largest backend lane: never give it as one brief.

## Goal

Announcements v2 end to end on the server: rich body, images, channels (in-app, email, SMS), audience filter, publish permission with optional approval, scheduled and idempotent sending, verified-only delivery, SMS short notice with link, delivery log, and a tenant-safe notifications log.

## Data model facts (verified)

Contact verification lives on `users` (lane 04); a member is linked to a user through `user_church_memberships.member_id`; `members` has `phone` only and no email. Delivery is therefore keyed by **user**, and members without a linked user cannot receive any channel (BE-17, WD-06). Existing `campaigns` (SMS or email, single channel) stay for the legacy flow; the old `GET /communications/announcements` stays as an alias for one release (`communications.service.ts:211-224`).

## Owned files (exclusive)

```
apps/api/src/announcements/**   (new)        apps/api/src/webhooks/**   (new)
apps/api/src/communications/**                apps/api/src/notifications/**
apps/api/src/sms/**  except sms.controller.ts
apps/api/src/mail/** except mail.controller.ts and mail/dtos/send-email.dto.ts
packages/db/tables/communications.ts, notifications.ts, inboxNotifications.ts
packages/db/tables/announcements.ts (new)     packages/db/scripts/notifications/** (new)
```

Not owned: `app.module.ts` (integrator applies the module import), permissions (lane 03), `consent` and `verification` modules (lane 04: call `ConsentService.canSend`, `revokeByPhone`).

## Tasks (in order)

### Wave 1

**T1 schema (RM-039, RM-038), table TypeScript only.** Sketch below. Also `notifications.church_id uuid` (nullable then NOT NULL after backfill) with script `packages/db/scripts/notifications/backfill-church-id.ts` (campaigns, users' memberships); new SMS references use `crypto.randomUUID()` (BE-01); retention jobs for `notifications` bodies and expired `password_recovery_tokens` (BE-24, in `notifications/` and a new job file; document the period per table, default 90 days).

**T2 engine (RM-040).** `AnnouncementDeliveryService`: claim with `UPDATE announcements SET status='sending' WHERE id=$1 AND status IN ('approved','scheduled') RETURNING *` (no JS status check, `communications.service.ts:414-428` is the bug); deliveries unique on `(announcement_id, user_id, channel)` and on `idempotency_key`; workers claim pending rows with `FOR UPDATE SKIP LOCKED`; 5 attempts with exponential backoff (`next_attempt_at`); sweeper returns stuck `sending` (older than 15 min) to processing; cron every minute with a leader lock (advisory lock `pg_try_advisory_lock`) so replicas do not double-run (BE-12, V-03). Same claim fix for the legacy campaign cron (`communications.service.ts:576-603`).

**T3 SMS adapter (RM-063).** Normalise to `+255` before storing or sending (`normalizeTzPhone` from lane 04); mask numbers in logs and stop logging bodies (`sms.service.ts:133,154`, IO-23); env names `SMS_API_URL`, `SMS_API_USERNAME`, `SMS_API_PASSWORD`, `SMS_SENDER_ID`, `SMS_DLR_SECRET`; provider interface plus fake provider for tests (D-08).

### Wave 2

**T4 announcements API (RM-070).** State machine and endpoints below; body validator for `doc_v1`; audience matcher; member list and detail visibility; `Idempotency-Key` on publish; read receipts.

**T5 verified-only and consent (RM-071).** Recipient resolution: audience members → active memberships → users. Channel eligibility: `in_app` for every audience user with an account; `email` only if `emailVerifiedAt` set and `ConsentService.canSend(user,'email','announcements')`; `sms` only if `phoneVerifiedAt` set and consent and not opted out. Skipped counts and reasons (`no_account`, `unverified`, `opted_out`) stored per announcement for the readiness view.

**T6 SMS short notice and webhooks (RM-072, RM-073).** Segment calculator (GSM-7 160/153, UCS-2 70/67, cap 3 segments) in `sms/segments.ts`; SMS text = `smsBody` or title truncated plus `{{shortLink}}` (`GET /a/:shortId` 302 to the portal announcement page, PROPOSED); `POST /webhooks/resend` (signature verified, confirm the current Resend header scheme before coding) and `POST /webhooks/sms/:provider` (HMAC with `SMS_DLR_SECRET`); statuses `accepted` vs `delivered` only from receipts (`communications.service.ts:488,514` set delivered on accept today); bounce and complaint call `ConsentService.revoke`; inbound STOP calls `revokeByPhone`.

**T7 attachments (RM-074).** `POST /announcements/:id/attachments` (multipart `file`): jpeg, png, webp, max 5 MB, decode with `sharp` (`limitInputPixels`), max 1600 px, re-encode JPEG, strip EXIF; key `announcements/{churchId}/{announcementId}/{uuid}.jpg` (D-07) via lane 02 helper; delete endpoint; signed GET URLs only. Email renders text plus first image (7-day signed URL) and a "Read in the app" link.

### Wave 3
**RM-150** delete e-commerce leftovers (`mail/templates/order-confirmation.tsx`, `mail.service.ts:161-191`).

## Contracts (PROPOSED unless noted)

Envelope `{ success, data }`; errors `{ statusCode, message, code }`.

| Method and path | Permission | Notes |
|---|---|---|
| `GET /announcements?limit=20&cursor=` | `view:announcements` | member view: `sent`/`sending`, in audience, not expired; returns `items[]` and `nextCursor` |
| `GET /announcements/:id` | `view:announcements` | same visibility else 404; includes `body` (`doc_v1`), signed image URLs (15 min), `read` |
| `POST /announcements/:id/read` | `view:announcements` | idempotent read receipt |
| `GET /announcements/manage?status=&limit=&cursor=` | `publish:announcements` or `manage:communications` | staff list incl. drafts |
| `GET /announcements/manage/:id` | same | full record |
| `POST /announcements` | `publish:announcements` | creates draft; 201 |
| `PATCH /announcements/:id` | `publish:announcements` | draft only; else 409 `ANNOUNCEMENT_NOT_EDITABLE` |
| `POST /announcements/:id/submit` | `publish:announcements` | only when approval is on |
| `POST /announcements/:id/approve` | `approve:announcements` | 403 `SELF_APPROVAL_FORBIDDEN` if approver is author |
| `POST /announcements/:id/publish` | `publish:announcements`, header `Idempotency-Key` | 202; `publishAt` null = now, else at least now+60 s; requires `approved` when approval is on |
| `POST /announcements/:id/cancel` | `publish:announcements` | before `sending` |
| `GET /announcements/:id/readiness` | `publish:announcements` | `{ audienceTotal, inApp, email: { eligible, skipped: { no_account, unverified, opted_out } }, sms: { eligible, skipped, encoding, segments, characters } }`; manage detail also returns `stats` per channel `{ accepted, delivered, failed, skipped }` (needed by lane 06) |
| `GET /announcements/settings`, `PUT /announcements/settings` | `approve:announcements` | `{ "requireApproval": false }` |
| `POST/DELETE /announcements/:id/attachments[/:attId]` | `publish:announcements` | images |
| `GET /communications/announcements` (existing) | existing | alias, keeps `subject`, `name`, `body`, `sentAt` one release |

`POST /announcements` request:

```json
{ "title": "Harambee this Friday", "bodyFormat": "doc_v1",
  "body": { "type": "doc", "content": [
    { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Karibuni wote" }] },
    { "type": "paragraph", "content": [{ "type": "text", "text": "Join us at ", "marks": [] }, { "type": "text", "text": "6 pm", "marks": [{ "type": "bold" }] }] },
    { "type": "image", "attrs": { "attachmentId": "uuid", "alt": "Hall setup" } } ] },
  "channels": ["in_app", "sms", "email"],
  "audience": { "allMembers": false, "zoneIds": ["uuid"], "genders": [], "maritalStatuses": [] },
  "smsBody": "Harambee Ijumaa 6pm. Soma zaidi: {{shortLink}}",
  "publishAt": "2026-12-01T06:00:00Z", "expiresAt": "2026-12-08T00:00:00Z" }
```

`doc_v1` allow-list: nodes `doc, paragraph, heading (level 2-3), bulletList, orderedList, listItem, blockquote, image (attachmentId, alt), text`; marks `bold, italic, link (https only)`; reject anything else with 400 `ANNOUNCEMENT_BODY_INVALID`; max 20 000 characters of text, 10 images, depth 6. Legacy `bodyFormat: "plain"` accepted for old rows.

Errors: `400 ANNOUNCEMENT_BODY_INVALID`, `400 SMS_TOO_LONG`, `409 ANNOUNCEMENT_NOT_EDITABLE`, `403 SELF_APPROVAL_FORBIDDEN`, `409 ALREADY_PUBLISHED`, `422 AUDIENCE_EMPTY`.

DB sketch (table TS only, batch M2):

```sql
announcements(id uuid pk, church_id uuid fk, title varchar(120), body_format varchar(16) check in ('plain','doc_v1'),
  body jsonb not null, channels text[] default '{in_app}', audience jsonb default '{"allMembers":true}', sms_body varchar(459),
  status enum('draft','pending_approval','approved','scheduled','sending','sent','failed','cancelled','expired') default 'draft',
  short_id varchar(12) unique, publish_idempotency_key varchar(64), created_by uuid, approved_by uuid, approved_at timestamptz,
  publish_at timestamptz, published_at timestamptz, expires_at timestamptz, skipped jsonb, created_at, updated_at)
announcement_attachments(id, announcement_id fk cascade, storage_key varchar(512), file_name, mime_type, size_bytes int, width int, height int, sha256 char(64))
announcement_deliveries(id, announcement_id fk cascade, user_id fk, channel varchar(16) check in ('in_app','sms','email'),
  status varchar(16) default 'pending', attempts smallint default 0, next_attempt_at, provider_message_id, last_error,
  idempotency_key char(64) unique, unique(announcement_id, user_id, channel))
announcement_reads(announcement_id fk, user_id fk, read_at timestamptz, pk(announcement_id, user_id))
announcement_settings(church_id pk fk, require_approval boolean default false)
notifications.church_id uuid  -- plus backfill script
```

This deviates from the `backend-api.md` section 4.2 sketch on purpose: deliveries and reads key on `user_id`, and `body` is `jsonb`.

## Acceptance (testable)

- Member never sees drafts, other zones' targeted posts, cancelled or expired items; detail of those returns 404.
- Publishing twice with the same `Idempotency-Key` sends once; a crash after `sending` resumes without duplicate deliveries (unique key test).
- Two replicas (simulated by two concurrent claims) process each delivery once.
- SMS reaches only users with `phoneVerifiedAt`, consent granted, not opted out; email likewise with `emailVerifiedAt`; `in_app` reaches every audience user with an account; skipped counts and reasons match.
- SMS text over 3 segments is rejected with `SMS_TOO_LONG` unless `smsBody` is shortened; a `{{shortLink}}` resolves.
- Body with `<script>`, unknown node types, `javascript:` links or 11 images is rejected.
- Legacy `/communications/campaigns` flow and `GET /communications/announcements` alias still pass their existing specs.
- `GET /sms/notification/:reference` is gone; notifications rows carry `church_id`.

## Test plan (targeted)

`pnpm --filter api test -- src/announcements src/communications src/sms src/mail src/notifications src/webhooks`; fake SMS and mail adapters; state-machine and visibility matrix specs; segment calculator unit tests; concurrency test with two claims. One final `pnpm --filter api type-check`. DEV smoke only after M2 is applied with the owner's OK; one real SMS and one real email to the owner's own contacts only after D-08 and D-09. PROD external channels stay disabled until D-19.

## Risks

- Large lane: split into briefs; do not run T4 before M2 is applied on DEV and lanes 03 and 04 are merged.
- Provider semantics (DLR, Resend signature scheme) must be checked against current vendor docs before coding.
- Emails with signed image URLs expire; accept and document, or inline small images.
- Double model (campaigns and announcements) for one release; do not delete campaign code in this lane.
- Members without accounts are excluded from every channel; surface the count in readiness so staff understand it.

## Agent brief (T1 schema; later tasks reuse the header)

```
ROLE: build agent, lane 05 announcements-api-and-schema, task T1 (schema, Wave 1). Leaf worker: start no subagents.
REPO: /Users/upstairs/Personal/builds/church/church-management-system  BRANCH: design/mito-ya-baraka-concepts (stay on it)
READ FIRST: docs/roadmap/README.md (ground rules), docs/roadmap/specs/lane-05-announcements-api-and-schema.md (data model facts, DB sketch), docs/roadmap/audits/backend-api.md BE-01, BE-12, BE-24, section 4.2.
OWN (may edit): packages/db/tables/{announcements.ts (new), communications.ts, notifications.ts, inboxNotifications.ts}; packages/db/scripts/notifications/** (new); apps/api/src/{notifications/**, sms/** except sms.controller.ts, mail/** except mail.controller.ts}.
DO NOT TOUCH: packages/db/tables/user.ts (lane 04), packages/db/migrations, relations.ts unless the table file requires a relation (then report it), package.json, lockfile, web, mobile.
RULES: no commits/push; no pnpm add; never run db:generate/push/migrate or any script against a database.
GOAL: table TypeScript for announcements v2 plus notifications.church_id, ready for the integrator's migration batch M2; new SMS references use crypto.randomUUID.
STEPS:
1. Verify packages/db/tables/communications.ts (campaigns ~L19-112), notifications.ts (no church_id, ~L4-28), sms.service.ts:61-65 (reference format), :234-242 (lookup).
2. Create packages/db/tables/announcements.ts with: announcements, announcementAttachments, announcementDeliveries, announcementReads, announcementSettings exactly as the DB sketch (jsonb body, status enum, unique (announcement_id,user_id,channel), idempotency_key unique). Export from the tables index following the existing pattern.
3. Add churchId to notifications.ts (nullable now). Write packages/db/scripts/notifications/backfill-church-id.ts (idempotent, dry-run flag, prints counts; do NOT run).
4. sms.service.ts: reference = crypto.randomUUID(); persist church id when provided; mask phone in logs; never log message bodies (sms.service.ts:133,154).
5. Retention: add purge job skeleton for notifications bodies and expired password_recovery_tokens with a configurable period (default 90 days), unit-tested with fakes.
VERIFY: pnpm --filter @church/db build ; pnpm --filter api test -- src/sms src/notifications ; ONE pnpm --filter api type-check.
REPORT (max 15 lines): files changed; RM IDs done/partial; tests run/skipped; relations needed for the integrator; requests (integrator: generate M2 after lane 04's M1; lane 04: nothing); open risks.
```

Briefs for T2 (engine), T3 (SMS adapter), T4 (API), T5 (verified-only), T6 (SMS/webhooks), T7 (attachments) reuse this header with their steps from "Tasks" and the contracts above.
