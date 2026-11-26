# Master backlog

Deduplicated from six audits. Severity P0 (exposure or release blocker now) to P3. Effort S (< 1 day), M (1-3 days), L (> 3 days). Area: mobile-member, mobile-staff, web, api, db, infra, design, i18n. `Lane` = spec in `specs/`. `Dep` = RM IDs that must be merged first. Source IDs: MM, MS, WD, BE, IO, DX (audits); `R-*` and `DEC-*` are existing programme IDs (`docs/shipwave/platform/`). `Dec` = owner decision (`decisions.md`). Items marked `owner` have no build lane (owner or ops action).

Parallel marks: rows in the same wave with different lanes can run at the same time unless `Dep` says otherwise; see `waves.md` for merge order.

## Wave 0: security and blockers

| ID | Title | Sev | Eff | Area | Lane | Dep | Sources | Dec |
|---|---|---|---|---|---|---|---|---|
| RM-001 | Remove `view:visitors` and `create:visitor` from MEMBER; 403 tests; no `pendingVisitors` for members | P0 | S | api | 01 | | MS-01, WD-01, BE-05 | D-01 |
| RM-002 | Lock `GET /sms/notification/:reference` to SUPER_ADMIN (no church filter, guessable reference) | P0 | S | api | 01 | | BE-01 | |
| RM-003 | Make email read-only on `PATCH /users/me`; lowercase on write; interim stop of passwordless OAuth auto-link abuse | P0 | S | api | 01 | | BE-02, MM-34 | D-29, V-05 |
| RM-004 | Members get published events only (list, detail 404 on drafts) | P1 | S | api | 01 | | MM-02, BE-14, WD-02 | |
| RM-005 | Fail fast on missing or default `JWT_SECRET`/`SESSION_SECRET`/`NEXTAUTH_SECRET` in production; use configured TTL | P0 | S | api | 02 | | IO-01, BE-08 | V-01 |
| RM-006 | One env loader for API (`apps/api/.env` first, then root, no override) | P1 | S | api | 02 | | IO-02 | V-02 |
| RM-007 | `S3_REGION`, `S3_FORCE_PATH_STYLE`, AWS-style key names with fallbacks; boot validation; `503 STORAGE_NOT_CONFIGURED` instead of raw SDK text | P1 | S | api | 02 | RM-006 | IO-03, BE-15, MM-38 | D-07 |
| RM-008 | DEV storage fix: Garage bucket and key, Coolify env, compose pass-through, upload/download round trip (owner runs infra steps) | P1 | S | infra | 02 | RM-006, RM-007 | IO-02, IO-03, IO-04, MM-38 | D-07, V-02 |
| RM-009 | Error interceptor: generic message for non-HTTP errors, request id, stable `code` field | P1 | S | api | 01 | | BE-07, MM-23, MS-11 | |
| RM-010 | Fix hidden-route navigation: member Stack around `(tabs)`; move 6 hidden screens out of Tabs; static route test | P0 | M | mobile-member | 07 | | MM-01 | |
| RM-011 | Keep web tokens out of browser JS (`session()`, 3 client components, sign-in and OAuth completion server-side) | P1 | M | web | 01 | | WD-04, R-SEC-01 | |
| RM-012 | Safe redirect: `isSafeInternalPath` on web callback; allow-list `callbackUrl` in API | P2 | S | web | 01 | | WD-25, BE-26 | |
| RM-013 | `UpdateChurchInput` class DTO and explicit field pick (mass assignment into `networkId`) | P1 | S | api | 01 | | BE-06 | |
| RM-014 | Direct send lockdown: `/sms/send`, `/sms/test`, `/mail/send` SUPER_ADMIN only; no raw HTML; mask phones in logs | P1 | S | api | 01 | | BE-11, BE-25, IO-09, IO-23 | D-18 |
| RM-015 | `trust proxy`; gate `/docs`; remove or flag `files/diagnostics`; `S3_INSECURE_TLS` flag | P1 | S | api | 02 | | IO-06, IO-18, IO-28, IO-29, BE-22, BE-36 | D-30 |
| RM-016 | Compose passes all runtime vars; drop secrets from web build args | P1 | S | infra | 02 | | IO-04, IO-25 | |
| RM-017 | Confirm renewal of `mitoyabarakachurch.org` before 2026-12-26 (owner) | P1 | S | infra | owner | | IO-20 | D-11 |
| RM-018 | Ignore `apps/mobile/.expo/` in `.gitignore` | P3 | S | infra | 02 | | IO-32, MM-41 | |
| RM-019 | Staff space: verify and fix the hidden `attendance` route (`href: null` inside staff Tabs, same bounce mechanism as MM-01; found in this synthesis, not in the audits) | P1 | M | mobile-staff | 11 | | MM-01 (mechanism), MS-06 | |

## Wave 1: foundations

| ID | Title | Sev | Eff | Area | Lane | Dep | Sources | Dec |
|---|---|---|---|---|---|---|---|---|
| RM-020 | Permission matrix: add `view:announcements`, `publish:announcements`, `approve:announcements`, `manage:invitations`, `view:prayer-requests`; BRANCH_ADMIN loses `manage:sms`; generated RBAC test per role | P1 | M | api | 03 | RM-001 | BE 4.8, WD-28, MS-02 | D-05, D-18 |
| RM-021 | `usher` and `publisher` roles with grants (enum values added in lane 04's schema batch) | P1 | M | api | 03 | RM-020, RM-029 | MS-16, F-12, BE 4.8 | D-15 |
| RM-022 | Leader row scope for visitors, families, attendance sessions | P1 | M | api | 03 | RM-020 | MS-02, BE-05 | |
| RM-023 | Staff projection for member list and search; `limit/offset`, min 2 characters; no `notes` or date of birth in lists | P1 | M | api | 03 | | MS-03, MS-04 | |
| RM-024 | Attendance error codes (`CHECKIN_DUPLICATE`); unique violation returns 409 | P2 | S | api | 03 | RM-009 | MS-11 | |
| RM-025 | Random 32-byte session QR token; hide `qrToken` from non-managers | P3 | S | api | 03 | | MS-30 | |
| RM-026 | Church-context guard: exact route match or `@SkipChurchContext()` | P2 | S | api | 03 | | BE-27, MS-29, WD-33 | |
| RM-027 | Dev test accounts per role + seed guards (refuse production) | P2 | M | db | 03 | RM-021 | MS-35, IO-33 | D-31 |
| RM-028 | DEV second tenant (labelled TEST) with memberships for switching | P2 | S | db | 03 | RM-027 | MM-07, DX J2 | D-14 |
| RM-029 | Schema: `users` verified fields, avatar columns, `contact_verifications`, consent and opt-out tables, `usher` in `roleEnum` | P1 | M | db | 04 | | BE-03, BE-13, IO-08 | D-04, D-15, D-19 |
| RM-030 | Shared `+255` phone normaliser in `packages/config` | P1 | S | api | 04 | | IO-14 | |
| RM-031 | Email verification API (OTP via Resend), status endpoint | P1 | M | api | 04 | RM-029 | BE 4.3, IO 3.2.3 | D-04, D-09 |
| RM-032 | Phone verification API (SMS OTP, rate limits, `+255` allow-list) | P1 | M | api | 04 | RM-029, RM-030, RM-063 | IO-08, BE 4.3 | D-04, D-08 |
| RM-033 | Verified email change; OAuth link requires verified email; Google backfill | P1 | M | api | 04 | RM-003, RM-031 | BE-02, MM-34 | D-29 |
| RM-034 | Password recovery delivery plus web forgot and reset pages | P1 | M | api, web | 04 | RM-031 | BE-04, IO-07, WD-12, R-AUTH-01 | D-09 |
| RM-035 | Per-route auth rate limits, per-account lockout, shared store | P1 | M | api | 04 | RM-015 | BE-09, IO-06, IO-30 | |
| RM-036 | Consent and opt-out model, STOP path, privacy notice record | P1 | L | api | 04 | RM-029 | BE-13, IO-12 | D-19 |
| RM-037 | Register and login DTO validation (email format, password max) | P3 | S | api | 04 | | BE-34 | |
| RM-038 | `notifications.church_id` plus backfill, UUID references, retention for notification bodies and recovery tokens | P1 | M | db, api | 05 | RM-002 | BE-01, BE-24 | |
| RM-039 | Announcements v2 schema (announcements, attachments, deliveries) | P1 | M | db | 05 | RM-020 | BE 4.2, WD-05 | D-03, D-05, D-16 |
| RM-040 | Idempotent sending: conditional claim, `SKIP LOCKED`, unique delivery key, stuck-send sweeper, cron lock | P1 | M | api | 05 | RM-039 | BE-12, IO-24 | V-03 |
| RM-041 | Upload hardening: magic bytes, MIME and extension allow-list, `directory` enum, no public `fileUrl` | P1 | M | api | 02 | RM-007 | BE-16, IO-05, IO-27 | D-07, V-04 |
| RM-042 | `/health/ready` with DB and storage probe; container healthcheck points to it | P1 | S | api | 02 | RM-007 | IO-17 | |
| RM-043 | Lint rule forbidding inline `@Body` types; `ParseUUIDPipe` per route in each lane's modules (no global pipe: it would break `status/:status` routes) | P2 | S | api | 02 | | BE-32, BE-10 | |
| RM-044 | Retire orphan `apps/api/src/database/migrations` tree; one migration source | P2 | S | api | 02 | | BE-21, IO-19 | owner approval |
| RM-045 | CI: GitHub Actions (typecheck, lint check-only, unit, build, migration drift); gate deploys | P1 | M | infra | 02 | | IO-16, BE-31, IO 3.6 | D-33 |
| RM-046 | Docs and env drift pass (README, `turbo.json`, `.example.env`) | P3 | S | infra | 02 | | IO-31 | |
| RM-047 | `packages/ui-tokens` with generator and contrast test | P1 | M | design | 13 | | DX-16, DX-20 | |
| RM-048 | Mobile primitives: Sheet, Avatar, Skeleton, EmptyState, Toast, Segmented | P1 | M | design | 13 | RM-047 | DX-17, DX-18 | |
| RM-049 | Contrast and 44 px target fixes in `ui/*` | P1 | S | design | 13 | RM-047 | DX-20, MM-27, MM-30 | |
| RM-050 | i18n gates (identical en/sw, no hard-coded JSX strings), per-feature namespace pre-registration, error-code to key catalogue | P1 | M | i18n | 12 | RM-009 | DX-19, DX-25, MM-23, MM-24 | |
| RM-051 | Swahili scripture interim fix (hide or label verse card) and parity check | P1 | S | i18n | 12 | | DX-01, MM-26 | D-23 |
| RM-052 | Mobile transport: 15 s timeout, one GET retry, query cache keyed by `contextKey`, last-good content, offline banner | P1 | M | mobile-member | 07 | RM-010 | MM-20, MM-21, MS-09, R-MOB-01 | |
| RM-053 | Home: no refetch on language change, per-section errors | P2 | S | mobile-member | 07 | RM-010 | MM-22, MM-35 | |
| RM-054 | Map API error codes to catalogue keys on mobile; no raw server text | P1 | M | mobile-member, mobile-staff | 07 | RM-009, RM-050 | MM-23, MS-25 | |
| RM-055 | Keychain accessibility `WHEN_UNLOCKED_THIS_DEVICE_ONLY` after background-refresh check | P2 | S | mobile-member | 07 | | MM-32 | |
| RM-056 | Mobile route static test and screen smoke tests | P2 | M | mobile-member | 07 | RM-010 | MM-42, MS-34, R-QA-01 | |
| RM-057 | Staff AI: reset conversation on church switch, role-aware route allow-list | P1 | S | mobile-staff | 11 | RM-010 | MS-21, MS-24, R-MOB-02 | |
| RM-058 | Web communications: redirect-in-`try` bug, announcement and campaign pages | P1 | S | web | 06 | | WD-03 | |
| RM-059 | Web attendance check-in redirect bug and action tests | P1 | S | web | 14 | | WD-03 | |
| RM-061 | Web: `loading.tsx`, `unavailable` states instead of empty, dashboard role gate and layout error split | P2 | M | web | 14 | | WD-16, WD-24, WD-31 | |
| RM-062 | Web: delete `lib/api/apiBase.ts`, single validated base URL, per-route metadata, check-only lint script | P2 | S | web | 14 | | WD-26, WD-33 | |
| RM-063 | SMS provider adapter, E.164 on send, env names aligned (`SMS_*`), fake provider for tests | P1 | M | api | 05 | RM-014 | IO-13, IO-14, BE-19 | D-08 |
| RM-064 | Refresh stale statuses in remediation register and mobile API inventory (docs only, coordinator) | P3 | S | infra | owner | | MM-42, WD-30 | |
| RM-065 | Visitors list N+1 to one paginated query | P2 | S | api | 03 | RM-022 | BE-40 | |
| RM-066 | Resend domain, SPF, DKIM, DMARC `p=none` (owner DNS) | P1 | S | infra | owner | | IO-10 | D-09 |
| RM-067 | Choose SMS aggregator and register sender ID (owner) | P1 | S | infra | owner | | IO-13 | D-08 |

## Wave 2: member features

| ID | Title | Sev | Eff | Area | Lane | Dep | Sources | Dec |
|---|---|---|---|---|---|---|---|---|
| RM-070 | Announcements v2 API: draft, edit, submit, approve, publish (`Idempotency-Key`), cancel; member list and detail; `GET /communications/announcements` alias | P1 | L | api | 05 | RM-039, RM-040, RM-020 | BE-18, MM-08..10, WD-05 | D-05, D-16 |
| RM-071 | Verified-only delivery and consent filter in recipient resolution; `in_app` channel; email via members' user link | P1 | M | api | 05 | RM-070, RM-029, RM-036 | BE-13, BE-17, IO-12, WD-06 | D-04, D-19 |
| RM-072 | SMS short notice (GSM-7/UCS-2 segments, 3-segment cap) with short link | P2 | M | api | 05 | RM-070 | BE-19, IO 3.3.4 | D-08 |
| RM-073 | Resend and SMS delivery webhooks, accepted vs delivered, suppression list | P2 | M | api | 05 | RM-070 | IO-11, BE-19 | D-08, D-09 |
| RM-074 | Announcement image attachments (private, signed read) | P1 | M | api | 05 | RM-041, RM-070 | BE 4.2, IO 3.1.4 | D-07 |
| RM-075 | Web announcement authoring: Tiptap editor, images, per-channel preview, audience picker, readiness counts, confirm dialog, permission gate | P1 | L | web | 06 | RM-070, RM-074 | WD-08, WD S1 | D-03, D-05 |
| RM-076 | Web scheduling with explicit offset (Africa/Dar_es_Salaam), timezone label | P1 | S | web | 06 | RM-070 | WD-07 | |
| RM-077 | Web member portal feed uses audience-filtered announcements | P1 | S | web | 14 | RM-070 | WD-05 | D-16 |
| RM-078 | Mobile announcements: list, detail, rich renderer, images, read state | P1 | L | mobile-member | 08 | RM-070, RM-010 | MM-08, DX-10, DX J3 | D-03 |
| RM-079 | Renderer hardening tests (script tags, `javascript:` links, oversized images) | P1 | S | mobile-member | 08 | RM-078 | DX J3 | |
| RM-080 | Home announcement card pressable; latest three with See all | P1 | S | mobile-member | 07 | RM-078 | MM-08, MM-10 | |
| RM-081 | Avatar API: `POST/DELETE /users/me/avatar`, re-encode, private key, signed `avatarUrl`, Google picture precedence | P1 | M | api | 09 | RM-029, RM-041 | MM-05, MM-06, BE-28, BE 4.1 | D-06, D-07 |
| RM-082 | Avatar mobile UI: image picker, square crop, resize, remove URL field, Avatar component | P1 | M | mobile-member | 09 | RM-081, RM-048, RM-010 | MM-05, DX-11, DX J7 | D-06 |
| RM-083 | Church switcher: tappable church pill on Home, sheet of memberships, branch selector, confirmation, no stale rows | P1 | M | mobile-member | 07 | RM-048, RM-010, RM-028 | MM-07, DX-07, DX-33, R-UX-01, R-MOB-02 | D-14 |
| RM-084 | Invitations and join API: invite codes and links, accept, `pending_approval`, approve, revoke | P1 | L | api, db | 10 | RM-020, RM-029 | BE 4.4 | D-02 |
| RM-085 | Web admin: users list, role and status change, invitation create and revoke, approvals queue | P1 | L | web | 10 | RM-084 | WD-11, WD S7 | D-02 |
| RM-086 | Mobile join: enter code or open link, pending-approval state, join row in switcher | P1 | M | mobile-member | 10 | RM-084, RM-083 | MM-07, DX J2 | D-02, D-21 |
| RM-087 | Mobile onboarding: welcome, register, verify, recover, language choice, password toggle, brand header | P1 | L | mobile-member | 04 | RM-031, RM-034, RM-010 | DX-05, MM-31, DX J1 | D-21, D-29 |
| RM-088 | Events as visible tab; bounded ordered published list on `FlatList`; RSVP read with detail | P1 | M | mobile-member | 07, 08 | RM-004, RM-010 | MM-03, MM-04, MM-36, DX-04 | D-20 |
| RM-089 | Prayer API: DTO limit 1000, `visibility` column, own-list endpoint contract | P1 | M | api, db | 09 | RM-020 | MM-12, MM-13, BE-29 | D-17 |
| RM-090 | Prayer mobile: My requests list with status, counter, visibility choice | P1 | M | mobile-member | 09 | RM-089, RM-010 | MM-11, MM-12, DX-12, DX J5 | D-17 |
| RM-091 | Inbox: template registry EN/SW for every key, target routing, header bell with unread count | P1 | M | mobile-member | 09 | RM-010 | MM-14, DX-29, WD-15, R-NOT-01 | |
| RM-092 | Push API: `push_devices`, preferences, Expo sender worker with receipts and quiet hours | P2 | L | api, db | 09 | RM-070 | IO-15, BE-20, IO 3.4 | D-10, D-25 |
| RM-093 | Push client: permission after sign-in, token registration, deep links | P2 | M | mobile-member | 09 | RM-092, RM-091 | IO-15, DX J8 | D-10 |
| RM-094 | Church screen: Call and Directions rows, structured service times, remove placeholder string match | P2 | M | mobile-member | 08 | RM-095 | MM-15..17, DX-08, DX-37 | D-22 |
| RM-095 | Service time schema (`starts_at`, service type time) and API | P2 | M | db, api | 03 | RM-020 | MM-15, BE-23 | D-22 |
| RM-096 | Library tab on the catalogue (one source), server search, `https`-only open, unavailable vs temporarily unavailable | P1 | M | mobile-member | 08 | RM-008 | MM-37, MM-38, MM-33, R-LIB-01 | |
| RM-097 | Staff search-first check-in on batch endpoint plus headcount sheet | P1 | M | mobile-staff | 11 | RM-023, RM-024, RM-052 | MS-06, MS-08, MS-15, F-01 | D-15 |
| RM-098 | Staff member directory and contact card (paged, call and text) | P1 | M | mobile-staff | 11 | RM-023 | MS-05, MS-13, F-04 | |
| RM-099 | Staff visitor capture and follow-up; duplicates endpoint | P1 | M | mobile-staff, api | 11, 03 | RM-001, RM-101 | MS-10, MS-12, F-03 | D-15 |
| RM-100 | Staff offline check-in queue | P2 | M | mobile-staff | 11 | RM-097, RM-052 | MS-09, F-10 | |
| RM-101 | Visitor duplicate lookup and E.164 on write (`GET /visitors/duplicates` PROPOSED) | P2 | M | api | 03 | RM-030, RM-022 | MS-10 | |

## Wave 3: staff, web features and polish

| ID | Title | Sev | Eff | Area | Lane | Dep | Sources | Dec |
|---|---|---|---|---|---|---|---|---|
| RM-110 | Web library publishing workflow and upload validation | P1 | L | web | 14 | RM-041 | WD-09, WD-13, R-LIB-01 | |
| RM-111 | Web church profile and public publishing; service-time editor | P1 | M | web, api | 14 | RM-095 | WD-10, R-PUB-01 | D-22 |
| RM-112 | Web data-quality import flow (preview errors, mapping, file upload) | P1 | M | web | 14 | | WD-14 | |
| RM-113 | Web families detail, edit, delete; member zone and family assignment | P2 | M | web | 14 | | WD-18, WD-19 | |
| RM-114 | Web exports of the full filtered set (server action paging existing lists, formula escape); TZS money format | P2 | S | web | 14 | RM-023 | WD-17, WD-21 | |
| RM-115 | Web design pass: semantic-token codemod (54 files), labelled inputs, `jsx-a11y`, narrow table cards | P2 | L | web | 14 | RM-047 | WD-22, WD-23, WD-33 | |
| RM-116 | Web "Switch to staff / member" control and staff-only gating | P2 | S | web | 14 | RM-061 | WD-30, R-UX-01 | |
| RM-117 | Web route-matrix tests, server-action tests, Playwright smoke | P2 | M | web | 14 | RM-059 | WD-29, R-QA-01 | |
| RM-118 | Wire brand kit (logo, icon, splash, photography slots) | P1 | M | design | 13 | | DX-02, DX-09, MM-40 | D-12 |
| RM-119 | Brand header (logo, AI pill, bell) and photo-capable hero | P1 | M | design | 13 | RM-118, RM-091 | DX-06, DX-38 | D-12 |
| RM-120 | Dark mode tokens | P2 | M | design | 13 | RM-047 | DX-15 | |
| RM-121 | Motion, haptics, reduced-motion spec and primitives | P3 | M | design | 13 | RM-048 | DX-14 | |
| RM-122 | One icon set (Lucide) on web and mobile | P3 | S | design | 13 | | DX-27 | |
| RM-123 | Dynamic type and 200% font scale layout fixes; tab bar grows | P2 | M | mobile-member | 07 | RM-049 | MM-28, DX-36 | |
| RM-124 | Accessible labels for inbox and library rows; header roles | P2 | S | mobile-member | 09, 08 | | MM-29, MM-30 | |
| RM-125 | Dev-only component gallery, Maestro flows, Playwright visual baselines | P3 | M | design | 13 | RM-048 | DX-35, DX 4.10 | |
| RM-126 | Plural helper (`Intl.PluralRules`) and regroup message files by feature | P2 | M | i18n | 12 | RM-050 | DX-24, DX-25 | |
| RM-127 | Swahili glossary file, review workflow, Swahili day-period words and clock | P2 | S | i18n | 12 | | DX 4.8, DX-26, MM-25 | D-13, D-27 |
| RM-128 | Move inline `copy()` calls into catalogue; delete unused keys; grep test | P2 | S | i18n | 12 | RM-050 | MM-24, DX-19 | |
| RM-129 | EAS profiles, `app.json` bundle IDs, icons, `runtimeVersion`, OTA channels | P2 | M | infra | 02 | RM-118 | IO-21, IO 3.5 | D-10 |
| RM-130 | Sentry on API, web, mobile with PII scrubbing | P2 | M | infra | 02 | RM-045 | IO-22 | D-10 |
| RM-131 | Container hardening: web non-root, pruned images | P2 | M | infra | 02 | | IO-26 | |
| RM-132 | Restore rehearsal, uptime monitors, expiry alerts, Garage off-host proof (ops) | P2 | M | infra | owner | RM-042 | IO-34, IO-35 | V-06 |
| RM-133 | Staff QR scanner with signed member code | P2 | L | mobile-staff, api | 11, 03 | RM-097 | MS-07, F-02 | D-34 |
| RM-134 | Staff event roll call for ministry leaders | P2 | M | mobile-staff | 11 | RM-022 | MS-14, F-06 | D-15 |
| RM-135 | Staff giving summary (read-only) | P3 | M | mobile-staff | 11 | | MS-17, F-07 | D-26 |
| RM-136 | Staff dashboard quick actions by permission | P2 | S | mobile-staff | 11 | RM-097, RM-099 | MS-33, DX-21 | |
| RM-137 | Staff AI tools v2 with sources and routes (AI deferred, DEC-14) | P2 | M | mobile-staff, api | 11 | | MS-22, MS-23, F-11 | DEC-14 |
| RM-138 | Staff prayer follow-up (blocked on policy) | P2 | L | mobile-staff, api | 11 | RM-089 | MS-19, MS-20, F-05 | D-17 |
| RM-139 | Staff mobile announcement drafting (optional; web is primary) | P3 | M | mobile-staff | 11 | RM-070 | MS-18, F-08 | D-05 |
| RM-140 | Member giving history and goals (read-only) | P2 | M | mobile-member | 08 | RM-010 | MM-18, DX-32 | D-26 |
| RM-141 | Member family and ministries screens (deferred) | P3 | M | mobile-member | 08 | | MM-19 | D-32 |
| RM-142 | Remove or wire dead payment module and ZenoPay config | P3 | S | api | 02 | | BE-30 | D-26 |
| RM-143 | Sermon and media model with range or streaming URLs (deferred) | P3 | L | api | 02 | | BE-33 | |
| RM-144 | Per-device sessions and logout | P3 | M | api | 04 | | BE-35 | |
| RM-145 | Web refresh-token rotation state out of process memory | P2 | M | web | 01 | RM-011 | WD-27 | V-03 |
| RM-146 | Schema hygiene: timestamptz audit columns, redundant index, schema shims | P3 | S | db | 04 | | BE-38 | |
| RM-147 | Seed placeholder text and church description cleanup; server flag for placeholder About | P3 | S | db | 03 | | BE-37, MM-16, DX-37 | |
| RM-148 | Mobile dead-code cleanup (`quick-action`, `hero-banner`, `publicChurchesApi`) | P3 | S | design | 13 | | MM-41 | |
| RM-149 | Staff avatars in people and check-in lists | P3 | S | mobile-staff | 11 | RM-081 | DX-22 | |
| RM-150 | Delete e-commerce mail template leftovers | P3 | S | api | 05 | | IO-38 | |
| RM-151 | Staff-assisted phone verification for members without an app account (PROPOSED; verified-only delivery otherwise excludes them) | P2 | M | api, mobile-staff | 04, 11 | RM-032, RM-097 | BE-17, WD-06 | D-04 |

## Counts

| Wave | Items |
|---|---|
| 0 | 19 |
| 1 | 47 |
| 2 | 32 |
| 3 | 42 |
| Total | 140 |

## Audit disagreements and how they were resolved

| Topic | Audits | Resolution and evidence |
|---|---|---|
| Visitor exposure severity | MS-01, WD-01 P0; BE-05 P1 | **P0.** `packages/config/src/permissions.ts:189-192` MEMBER holds `view:visitors` and `create:visitor`; `visitors.controller.ts:52-53,84-85` list and get are church-wide; coordinator confirmed on DEV (200, 9 visitors with name, phone, email). Audits mention `view:visitors` only; `create:visitor` is also granted. |
| Draft events severity | WD-02 P0; MM-02, BE-14 P1 | **P1, fixed in Wave 0.** `events.controller.ts:99` passes `false` for `publishedOnly`; exposure is title, description and location of unpublished events (no personal data). Fix is one argument plus a test. |
| SMS reference route | BE-01 P0 | **P0 with precondition.** Class guard is `@RequirePermission('manage:sms')` (`sms.controller.ts:23`), so it is reachable only by SUPER_ADMIN, ADMIN and BRANCH_ADMIN, but the lookup has no church filter (`sms.service.ts:234-242`): an admin of church A can read church B's SMS body and phone, and the reference is time plus `Math.random()` (BE-01). Members cannot reach it. |
| Email-change takeover | BE-02 P0 | **P0 with narrower precondition.** `auth.service.ts:511-514` refuses to link a password account (`OAuth account is not linked`); auto-link works only for passwordless OAuth-created accounts (`:504-535`). Attack is pre-hijack: an attacker with their own passwordless account sets `PATCH /users/me` email to the victim's address (`users.service.ts:77-99`, no verification); the victim's later Google login then lands in the attacker's account. Also lets any user squat an address and defeats verified-only delivery. Interim fix = read-only email (RM-003); full fix needs verification (RM-033). Check existing rows first (V-05). |
| Default secrets | IO-01 P0*, BE-08 P1 | **P0 until V-01 confirms values set**, then P1 for the guard. `config/index.ts:46-57` falls back to a public string; `validateConfiguration()` is never called (IO-01). |
| Token exposure | WD-04 P1 | **P1 in Wave 0, effort M not S.** `auth.ts:152-153` puts tokens in `session()`, and three client components also pass tokens into NextAuth `update` (`components/layout/church-switcher.tsx:65`, `components/church/setup-church.tsx:82`, `components/church-management/church-card.tsx:58`); the audit did not list them. |
| Brand and scripture | DX-01, DX-02 P0 | **P1.** Release-blocking content and assets, not an exposure. Interim hide or label for verses (RM-051). |
| Library 500 root cause | BE-15 (empty creds or region), IO-02/03 (loader plus region) | Coordinator fact (c): API loads only the root `.env` (`config/index.ts:6`) while keys sit in `apps/api/.env`; region `auto` vs Garage `garage` (`file-upload.service.ts:154`). BE-15's env-name fallbacks are kept (RM-007). |
| Avatar endpoint verb and size | BE `PUT`, MM and brief `POST`; MM 1024 px client, BE 512 px server | **`POST /users/me/avatar`** (PROPOSED), client resize 1024 JPEG (2 MB cap), server re-encode 512 JPEG, key `avatars/{userId}/...` (account-level, IO's church-level path rejected). |
| Announcement routes and permissions | BE `/announcements` and `send:communications`; WD `/communications/announcements` and `publish:announcements`; MM uses existing list | **`/announcements`** (PROPOSED) with `GET /communications/announcements` kept as alias one release; permission names `publish:announcements`, `approve:announcements`, `view:announcements` (owner asked for a specific permission). |
| Usher | MS-16 prefers permission bundle; owner wants a role | Recommend enum role `usher` (D-15); `roleEnum` is at `packages/db/tables/user.ts:13`, so the value rides migration batch M1. |
| Prayer length | MM 1000, BE 2000 | **1000** client and server. |
| Staff attendance route | MS audit says check-in works (static read only) | `app/(staff)/_layout.tsx` hides `attendance` with `href: null` inside `Tabs`, the pattern behind MM-01. Treated as likely broken until a device check (RM-019). |
| Stale statuses | MM-42, WD-30 | R-MOB-01/03/04 partly done in code, R-WEB-01/02 done; inventory out of date. Tracked as RM-064. |
