# Owner decisions and verifications

`Needed by` = the wave that stalls without an answer. Where a recommendation is marked **default**, agents proceed on it unless the owner objects before launch. Existing accepted decisions (`DEC-01..16`, `docs/shipwave/platform/decisions.md`) are not re-opened unless stated. Audit decision IDs: `MM D1-D7`, `MS` DEC-06 reopen, `BE` section 6, `IO` section 5, `DX D1-D10`.

Summary of what blocks Wave 0 and Wave 1:

| Blocks | Decisions and verifications |
|---|---|
| Wave 0 | D-01 (visitor grants; default yes), V-01 (prod secrets set?), V-02 (Garage key/env on DEV), D-30 (diagnostic routes), D-11 (domain renewal, date-critical 2026-12-26) |
| Wave 1 | D-15 (usher), D-04 (verification), D-07 (Garage layout), D-03 (rich text), D-05 (approval), D-16 (audience), D-18 (who sends), D-19 (consent basis), D-08/D-09 (SMS and email delivery, before end-to-end tests), D-13 (Swahili reviewer), D-14 (second tenant), D-31 (test accounts) |
| Wave 2 | D-02 (join model), D-21 (registration), D-20 (Events tab), D-06 (avatar visibility), D-17 (prayer), D-22 (service times), D-10 (push/bundle IDs), D-25 (push categories), D-29 (email change) |

## Decisions

### D-01 Remove `view:visitors` (and `create:visitor`) from MEMBER now
- **Context:** `packages/config/src/permissions.ts:189-192` gives MEMBER `view:visitors` and `create:visitor`. Coordinator verified on DEV: `GET /visitors` with a plain member token returned 200 with 9 visitors incl. name, phone, email. Audits: MS-01, WD-01 (P0), BE-05 (P1). `pendingVisitors` on the dashboard is also sent to MEMBER (`dashboard.service.ts:27`).
- **Options:** (a) remove both from MEMBER now; (b) remove `view:visitors` only and keep `create:visitor` for a welcome team; (c) keep and add row scope.
- **Recommendation:** (a), default. Welcome-team work belongs to staff roles (usher, D-15). Leaders keep `view:visitors` with zone scope (RM-022).
- **Unblocks:** RM-001 (Wave 0), RM-022, RM-099. Release note: members lose a screen that never existed in the mobile app.

### D-02 Joining another church
- **Context:** no join or invite route exists (MM-07, WD-11, BE 4.4). `membership_status` enum has `active, invited, suspended` (`packages/db/tables/userChurchMemberships.ts:19-23`).
- **Options:** (a) open self-join; (b) invite code or link plus admin approval; (c) invite only, no approval; (d) staff adds member manually only.
- **Recommendation:** (b). A code (rotatable, expiring, usage-capped) lets a member request access; a branch admin approves (`pending_approval`, no data access until approved). Email-bound invites skip approval if email is verified and matches. Browsing a public branch never changes membership (`DESIGN.md`).
- **Unblocks:** RM-084, RM-085, RM-086, RM-087 (lane 10 and mobile onboarding).

### D-03 Rich text format for announcements
- **Context:** owner wants full detail, rich text with images, long content, rendered natively (no WebView, DEC-15, DX-10). Existing client strips HTML (`(member)/index.tsx plainText`). BE 4.2 proposed `plain|markdown` only.
- **Options:** (a) restricted document JSON (Tiptap/ProseMirror schema); (b) sanitised Markdown subset; (c) stored HTML sanitised on write.
- **Recommendation:** (a) `body_format = 'doc_v1'`: nodes paragraph, heading (2 levels), bold, italic, link (`https` only), bullet and ordered list, blockquote, image (`attachmentId`, `alt`). Reasons: no HTML is ever stored, so XSS is excluded by construction; staff get a real WYSIWYG editor on web (Tiptap) instead of typing syntax; images reference private attachments by ID (signed at read time); one tree renders natively on React Native (about 200 lines), to email HTML (server, allow-list) and to a short SMS text. Markdown (b) is the fallback if Tiptap is rejected: simpler renderer, lossy WYSIWYG round trip. Reject (c): sanitiser bugs become stored XSS, and RN cannot render HTML without a WebView. Keep `plain` for legacy rows.
- **Unblocks:** RM-039 (schema), RM-070, RM-075, RM-078.

### D-04 Verification method for email and phone
- **Context:** no verified fields exist (BE-03). Verified-only delivery is a hard rule for email and SMS. Password recovery tokens are generated and discarded (`auth.service.ts:607`).
- **Options:** (a) 6-digit OTP for both channels; (b) magic link for email, OTP for phone; (c) provider-hosted verification (for example Firebase).
- **Recommendation:** (a). Same code UX everywhere, works on low-end Android without deep links or app-switching; HMAC-SHA256 codes, 10-minute TTL, 5 attempts, 60-second resend, daily caps, `+255` allow-list. No magic links by SMS. Login is not blocked by unverified contacts; only delivery and email changes depend on verification. Google users: email verified from the `email_verified` claim. **Consequence to confirm:** verified contacts live on `users`, and `members` has no user link except `user_church_memberships.member_id`, so a member without an app account receives no email or SMS (many Tanzanian members use basic phones). Mitigation PROPOSED: staff-assisted phone verification (staff triggers an OTP, the member reads it out; RM-151).
- **Unblocks:** RM-029..RM-033, RM-063, RM-071, RM-151.

### D-05 Announcement approval step
- **Context:** owner wants staff "holding a specific permission" to create and push announcements. BE 4.2 adds `approve:announcements` with self-approval blocked; WD S1 adds an optional toggle.
- **Options:** (a) no approval, publisher publishes directly; (b) approval required always; (c) per-church setting, default off.
- **Recommendation:** (c). Permission `publish:announcements` creates, edits, schedules and publishes. When the church setting `announcements.requireApproval` is on, publish needs a second person with `approve:announcements` (not the author). Default off for HQ so one pastor or secretary can push.
- **Unblocks:** RM-020 (permission names), RM-039, RM-070, RM-075.

### D-06 Avatar storage and visibility
- **Context:** members upload their own photo; no URL field (MM-05). Avatars are personal data (BE 4.1, IO 3.1.4).
- **Options:** (a) private bucket, signed URLs via API; (b) public-read prefix; (c) API proxy streaming.
- **Recommendation:** (a). Key `avatars/{userId}/{uuid}.jpg`, signed GET 15 minutes (the API returns `avatarUrl`); visible to the owner, and to staff and members of a church the user belongs to only where the UI needs it (staff lists, check-in); never public, never indexed. User-level, not church-level path, because accounts span churches. Delete on photo removal and on account deletion (30-day soft-delete rule).
- **Unblocks:** RM-081, RM-082.

### D-07 Garage bucket layout and endpoint
- **Context:** IO 3.1.2 and BE 4.7 differ on names; both agree on private buckets, path style, signing region `garage`, key per environment. Coordinator fact: Garage on the shared host, owner runs bucket and key creation.
- **Recommendation:** one private bucket per environment: `church-dev-media`, `church-prod-media`; one key per environment, read/write on its own bucket only, no owner flag. Prefixes: `documents/` (existing library, keep readable), `avatars/{userId}/`, `announcements/{churchId}/{announcementId}/`, `temp/` (24 h expiry sweep). Endpoint proposed `https://church-storage.fredygerman.com` (owner to confirm). Env contract: `S3_ENDPOINT`, `S3_REGION=garage`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BUCKET_NAME`, `S3_FORCE_PATH_STYLE=true` (old names kept as fallback one release). Do not store prod media before the Garage off-host snapshot proof (IO-34, `todo.md` gate in Great Tech Ops).
- **Unblocks:** RM-007, RM-008, RM-041, RM-074, RM-081.

### D-08 SMS vendor and sender ID
- **Context:** `sms.service.ts:137-152` POSTs to an unnamed gateway with Basic auth (IO-13). No delivery receipts, no OTP. Candidates named in the brief (Beem, NextSMS, Africa's Talking) were not verified.
- **Options:** pick an aggregator with TCRA sender-ID support, DLR webhook, sandbox, per-segment TZ price.
- **Recommendation:** owner picks after a short comparison (price, DLR, sender ID turnaround); implement a vendor adapter behind `SmsService` with env `SMS_API_URL`, `SMS_API_USERNAME`, `SMS_API_PASSWORD`, `SMS_SENDER_ID`, `SMS_DLR_SECRET`. Sender ID 11 characters or fewer, for example `MITOYABARAKA` is 12, so use `MITOBARAKA` (confirm with provider and TCRA rules).
- **Unblocks:** RM-032 (phone OTP end to end), RM-063, RM-072, RM-073. Code can proceed with a fake provider.

### D-09 Sending domain, DKIM/SPF and DMARC
- **Context:** `mitoyabarakachurch.org` has no DMARC (`resource-inventory.md:152`, Great Tech Ops); default sender is `noreply@church.org` (`config/index.ts:63-64`).
- **Recommendation:** Resend on subdomain `mail.mitoyabarakachurch.org`; sender `Mito ya Baraka Church <noreply@mail.mitoyabarakachurch.org>`; DMARC `p=none` with a reporting mailbox, review after 2-4 weeks, then `quarantine`. DKIM CNAMEs DNS-only in Cloudflare. Owner performs DNS changes.
- **Unblocks:** RM-031, RM-034, RM-066, real email delivery on DEV.

### D-10 Bundle IDs and store/EAS accounts
- **Context:** `apps/mobile/app.json` has no `ios.bundleIdentifier`, `android.package`, icon, `runtimeVersion` (IO-21). Push on standalone builds needs FCM v1 and APNs keys (IO 3.4.4). Store accounts are deferred.
- **Recommendation:** `org.mitoyabarakachurch.app` for both (confirm the church owns the domain it reverses); create the Expo account and EAS project now (free), Firebase project for FCM now, Apple Developer only when iOS distribution starts. Pipeline stops at internal APK until store accounts exist.
- **Unblocks:** RM-129, RM-092/093 on standalone builds. Push can be developed against a development build before the answer.

### D-11 Domain renewal before 2026-12-26
- **Context:** `mitoyabarakachurch.org` expires 2026-12-26, auto-renew enabled (`resource-inventory.md:139`, IO-20). Cloudflare SSL mode not recorded.
- **Recommendation:** owner confirms payment method and renewal now; set Cloudflare SSL to Full (strict) after origin certs verified; add 30 and 7 day expiry alerts.
- **Unblocks:** nothing technical; an expired domain takes API, web and email down. Tracked as RM-017.

### D-12 Brand assets from the church
- **Context:** no logo, icon, splash or photography (DX-02, DX-09); concept boards contain invented data (DX-03).
- **Recommendation:** request the kit in `design-system-ux.md` section 4.4: logo SVGs (colour, ink, white, icon-only), app icon, colour confirmation (`#1D4ED8`, `#172554`, `#7C3AED`), typeface, consented photography, verified branch data, approved scripture, privacy text. Until supplied, cap fidelity targets at 6/10 and keep the cross glyph.
- **Unblocks:** RM-118, RM-119, RM-129 (icon, splash).

### D-13 Swahili native review
- **Context:** DEC-13 says Claude writes Swahili and a native reviews after code. 17 identical en/sw keys exist (DX-01); AM/PM English (MM-25); glossary rows need review (DX 4.8).
- **Recommendation:** name one fluent reviewer per area (worship, admin, technical). Review in batches of 50 keys with screenshots; label `sw-review-pending` until approved; freeze copy before each release. Glossary file `docs/i18n/glossary.sw.md` is the single source (RM-127). Open terms: "Tithe" (Fungu la Kumi vs Zaka), "Huduma" (D-27), 24-hour vs "saa" clock.
- **Unblocks:** RM-127; release acceptance (Q-02). Not blocking code.

### D-14 Kimara (or another branch) as second tenant
- **Context:** switching and joining need two churches (MM-07, J2). Concept boards list Kimara/Mbezi/Tegeta but those are illustrative (DX-03).
- **Options:** (a) create a clearly labelled TEST church on DEV only; (b) create real Kimara now; (c) defer.
- **Recommendation:** (a) now (`Mito ya Baraka (TEST Kimara)`, DEV only, never seeded to prod); real Kimara as a tenant only when the church supplies verified data.
- **Unblocks:** RM-028, RM-083, RM-084..086 tests.

### D-15 Usher and announcement-publisher roles
- **Context:** check-in needs `manage:attendance`, held only by SUPER_ADMIN, ADMIN, BRANCH_ADMIN (MS-16). DEC-06 forbids a role redesign. `roleEnum` is a Postgres enum (`packages/db/tables/user.ts:13`), so a new role needs a migration (batch M1).
- **Options:** (a) new enum roles `usher` and `publisher`; (b) per-membership permission bundles; (c) status quo.
- **Recommendation:** (a), reopening DEC-06 for these two roles (the owner asked for an announcement publisher too: `publisher` holds `view:announcements`, `publish:announcements`, `manage:communications`, `view:communications` plus member self-service, and nothing on members, giving or settings). Usher: `manage:attendance`, headcount, member search (name and phone only), `view:visitors` + `create:visitor` (scoped to church), no settings, delete, giving, communications. We are already generating M1; an enum value is explicit, testable and easy to explain to the church. MS-16 preferred (b) to avoid the enum change; take (b) if the owner wants zero schema change.
- **Unblocks:** RM-021, RM-027, RM-097, RM-099, RM-134. Per-user permission grants (b) can follow later without removing the roles.

### D-16 Announcement audience and visibility rules
- **Context:** current list returns every completed campaign, ignoring `audienceFilters` (MM-09, WD-05, BE-18). Campaign names leak as titles when `subject` is null.
- **Recommendation:** audience = all members of the church (default) or filters by zone, gender, marital status (BE 4.2). In-app visibility is independent of channels: an SMS-only announcement is still readable in-app if the member is in the audience and it is published, unless `channels` excludes `in_app`. Drafts, cancelled and expired items are never shown to members. Members outside the audience get 404 on detail.
- **Unblocks:** RM-039, RM-070, RM-077.

### D-17 Prayer visibility and staff reading
- **Context:** `prayer_requests` has no visibility column (MM-12); DEC-02 forbids new sensitive uses without a policy; staff follow-up blocked (MS-19).
- **Recommendation:** member chooses `private to pastors` (default) or `shared with my zone leader`; anonymous option later. Reading by pastors and leaders only, with read logging; staff UI (RM-138) stays blocked until the owner writes the policy. Until answered, the privacy copy states "only you and the church office".
- **Unblocks:** RM-089, RM-090, RM-138.

### D-18 Who may send SMS and email directly
- **Context:** `POST /sms/send`, `/sms/test`, `/mail/send` accept arbitrary recipients and raw HTML under `manage:sms` or `manage:mail`; BRANCH_ADMIN holds `manage:sms` (BE-11, IO-09).
- **Recommendation:** direct endpoints SUPER_ADMIN only; remove `/sms/test` outside dev; church staff send only through announcements (audited, verified-only, capped). Remove `manage:sms` from BRANCH_ADMIN.
- **Unblocks:** RM-014, RM-020.

### D-19 Consent and lawful basis (Tanzania PDPA 2022)
- **Context:** marketing SMS goes to every member with a phone; no consent or opt-out (BE-13, IO-12). Legal position unverified.
- **Recommendation:** treat announcements as service communications but still record consent (purpose, source, time) and honour opt-out (STOP for SMS, one-click unsubscribe for email); in-app is always on. Get counsel or the church's data-protection contact to confirm basis and privacy notice text before enabling SMS or email sends on PROD. Keep email and SMS sending disabled on PROD until then.
- **Unblocks:** RM-036, RM-071; PROD enablement of external channels.

### D-20 Events as a bottom tab; fate of More
- **Context:** `DESIGN.md` and the checklist require Home / Church / Events / Library / Profile; code has More in the bar and Events hidden (MM-03, DX-04, D1).
- **Recommendation:** yes. Events becomes the fourth tab; More is removed as a tab and its rows move into Profile (settings, language, staff switch) and Home tiles.
- **Unblocks:** RM-088.

### D-21 Self-registration policy
- **Context:** API has register, recovery and OAuth; mobile sign-in has none (DX-05, D2).
- **Recommendation:** anyone may create an account (email or phone plus verification); an account sees no church data until it joins a church by code and is approved (D-02). Google sign-in only after RM-033 lands. Language choice on the first screen.
- **Unblocks:** RM-087.

### D-22 Structured service times
- **Context:** `serviceSessions` has `date` columns only; times scraped from names (MM-15, BE-23).
- **Recommendation:** add `starts_at timestamptz` and `service_time` on service types; church admins maintain them on web (RM-111). Fixed UTC+3.
- **Unblocks:** RM-094, RM-095.

### D-23 Scripture and approved Swahili Bible text
- **Context:** all 7 verses and references are English in both locales (DX-01, MM-26).
- **Recommendation:** church names the approved translation (for example Swahili Union Version) and confirms quotation permission. Interim: hide the verse card in Swahili or label it English until supplied.
- **Unblocks:** RM-051.

### D-25 Push categories and quiet hours
- **Recommendation:** categories `announcements`, `events`, `pastoral`, `giving`; quiet hours 21:00-06:00 Africa/Dar_es_Salaam, non-urgent deferred to 07:00; urgent (`pastoral` emergencies, security) bypass. Payloads contain no personal data.
- **Unblocks:** RM-092, RM-093.

### D-26 Giving scope
- **Recommendation:** no commerce or online payment (DEC-07). Phase 1: read-only own history and goals (`GET /offerings/me`, `/giving-goals/public`), church merchant instructions as text. Decide aggregator only after a finance pilot. Remove or keep dead `payment` code (BE-30): recommend remove.
- **Unblocks:** RM-140, RM-142.

### D-27 Terminology
- **Recommendation:** use "Huduma" for ministries and "Ibada" for services everywhere; "Tawi" for branch; confirm "Makao Makuu" vs "Tawi Kuu" and whether "Tanzania" is part of the brand (DX D7, D8). Feeds the glossary.

### D-29 Profile email change
- **Recommendation:** email read-only in the app until RM-033; then change needs current password (password accounts) and a code sent to the new address; `email_verified_at` is cleared until confirmed.
- **Unblocks:** RM-033, RM-082.

### D-30 Diagnostic and developer routes on PROD
- **Recommendation:** gate Swagger `/docs` outside dev, remove `/sms/test` and `POST /api/files/diagnostics` from PROD builds (env flag), never return key material (IO-18, IO-28, BE-22).
- **Unblocks:** RM-015.

### D-31 Test accounts on DEV
- **Recommendation:** owner approves a dev-only seed script creating `staff.admin`, `staff.branch`, `staff.zone`, `staff.ministry`, `staff.usher`, `member.control` (MS section 5); passwords from env, stored only in the owner's password manager; script refuses prod hosts. Dev DB write needs the owner's OK for the session.
- **Unblocks:** RM-027, RM-097..101 device testing.

### D-32 Member directory and ministries
- **Recommendation:** defer. `read:member` is own profile only (`permissions.ts:190`). A directory needs a privacy policy first (MM-19, DEC-02).

### D-33 Deploy gating
- **Context:** Coolify auto-deploys `main` for both dev and prod from one compose (IO-37).
- **Recommendation:** disable auto-deploy of prod; deploy dev after CI green; prod pinned to a reviewed commit with explicit owner approval (AGENTS rule: never push to `main` without Fredy's approval).
- **Unblocks:** RM-045 acceptance.

### D-34 QR self check-in
- **Context:** member-side QR code does not exist; QR token endpoint still needs a member ID (MS-07).
- **Recommendation:** defer member self check-in; staff-scanned signed member code is Wave 3 (RM-133). Do not ship the typed QR-token field.

## Owner-only verifications (not decisions)

| ID | Check | Why | Blocks |
|---|---|---|---|
| V-01 | Are `JWT_SECRET`, `SESSION_SECRET`, `NEXTAUTH_SECRET` set (not empty, not the repo default) on DEV and PROD? Set/empty check only. Is `AUTO_MIGRATE` off on PROD? | IO-01, BE-08: if PROD runs on the committed default secret, RM-005 is an incident, rotate | RM-005 severity |
| V-02 | On DEV Coolify: presence of `S3_ACCESS_KEY`/`S3_SECRET_KEY` in the container env; Garage region name; bucket and key exist | Dev library 500 root cause (coordinator fact c, IO-02/03) | RM-008 |
| V-03 | How many API and web replicas on PROD? | BE-12 (double send), WD-27 (refresh state), rate limits | RM-040, RM-145 |
| V-04 | Is `S3_PUBLIC_URL` a public bucket today? | BE-16 severity | RM-041 |
| V-05 | Audit existing users whose email differs from their OAuth identity email (read-only query, owner approves DB access) | RM-003 pre-hijack check | RM-003 follow-up |
| V-06 | Garage off-host snapshot freshness proof | Gate for storing PROD media | RM-132 |
