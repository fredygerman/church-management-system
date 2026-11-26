# Lane 04: verification-and-consent

- **Waves:** 1 (schema, API, recovery, consent), 2 (mobile onboarding), 3 (RM-144, RM-146).
- **Backlog IDs:** RM-029, 030, 031, 032, 033, 034, 035, 036, 037 (W1); RM-087 (W2); RM-144, RM-146 (W3).
- **Decisions:** D-04 (OTP both channels, default), D-19 (consent basis), D-21 (registration), D-29 (email change), D-08 and D-09 (delivery vendors; fakes until chosen), D-15 (adds `usher`, `publisher` to `roleEnum`).
- **Depends on:** lane 01 merged (`auth.controller.ts`, `users` hotfixes); lane 02 `trust proxy` (RM-015) for rate limits; lane 05 owns the SMS and mail services this lane calls (public methods `sendSms`, `sendPasswordResetEmail` already exist at `sms.service.ts:137-152`, `mail.service.ts:131`).
- **Blocks:** lane 05 (verified-only delivery), 09 (avatar columns), 10 (verified email on invites), 03 (role enum values).
- **Model:** Luna medium; split brief A (schema + phone util), B (email/phone OTP API), C (recovery + consent), D (mobile onboarding, Wave 2).

## Goal

Make contact channels verifiable, so email and SMS go only to verified addresses; close the email-link takeover path properly; deliver password recovery; record consent and opt-out; give mobile a real sign-up journey.

## Data model facts (verified)

`users` has `email` (unique, required) and `phone` (unique, free text) with no verification columns (`packages/db/tables/user.ts:30-31`). `members.phone` exists but no email, and `members` has no user link; the link is `user_church_memberships.member_id` (`userChurchMemberships.ts:40`). Therefore verified contacts live on `users`, and a member without a linked user account has **no verified channel** (receives no email or SMS) until staff-assisted verification (RM-151, PROPOSED, Wave 3).

## Owned files (exclusive)

```
apps/api/src/auth/**  except guards/** and decorators/**   (auth.controller.ts after Wave 0 merge)
apps/api/src/verification/**   (new), apps/api/src/consent/**   (new)
packages/db/tables/user.ts, oauthProviderIdentities.ts, passwordRecoveryTokens.ts, refreshTokens.ts
packages/db/tables/contactVerifications.ts (new), contactConsents.ts (new)
packages/db/scripts/auth/**   (new: one-off backfill scripts, never auto-run)
packages/config/src/utils/phone.ts, phone.test.ts   (new)
packages/config/src/i18n/messages/auth-onboarding.ts   (new, pre-registered by lane 12)
apps/web/app/auth/forgot/**, apps/web/app/auth/reset/**, apps/web/app/auth/verify/**   (new)
apps/mobile/app/(auth)/**, apps/mobile/components/auth/**   (new), apps/mobile/tests/auth-*.test.ts   (new)
```

Not owned: `apps/web/app/auth/signin/**` and `callback/**` (lane 01), `users/**` (lane 01 then lane 09), `sms/**`, `mail/**` services (lane 05).

## Tasks (in order)

### Wave 1

1. **RM-029 schema (table TypeScript only).** `users`: `emailVerifiedAt timestamptz`, `phoneE164 varchar(20)` (unique, nullable; keep legacy `phone`), `phoneVerifiedAt`, `avatarKey varchar(512)`, `avatarUpdatedAt timestamptz`, `failedLoginCount smallint default 0`, `lockedUntil timestamptz`; add `'usher'` and `'publisher'` to `roleEnum` (`user.ts:13`). New `contactVerifications` and `contactConsents` (sketch below). Run `pnpm --filter @church/db build` only. Integrator generates migration M1.
2. **RM-030** `packages/config/src/utils/phone.ts`: `normalizeTzPhone(input): string | null` (`0712345678`, `255712345678`, `+255 712 345 678` to `+255712345678`; accept 9 digits after `+255` starting with 6 or 7; else null) and `maskPhone`. Tests with ten cases incl. spaces, dashes, wrong lengths.
3. **RM-031 email verification.** Module `verification/`: code = 6 digits from CSPRNG, stored as HMAC-SHA256 with `VERIFICATION_HMAC_SECRET` (fail fast in production like lane 02), TTL 10 min, 5 attempts, resend cooldown 60 s, 5 sends per day per user and per destination, constant-time compare, never log codes. Send through `MailService`; behind `VERIFICATION_ENABLED` (default on in dev, off in prod until D-09). Fake mail adapter for tests.
4. **RM-032 phone verification.** Same rules; destination normalised with `normalizeTzPhone`, `+255` only (SMS pumping defence); per-IP cap 20 sends/hour (needs `trust proxy`, RM-015). Sends through `SmsService` (lane 05 aligns the vendor, RM-063); fake adapter until D-08.
5. **RM-033 verified email change and linking.** `POST /auth/verification/email` with `purpose: 'change'` requires `currentPassword` for password accounts, sends the code to the **new** address, and on confirm updates `users.email` (lower-cased) and sets `emailVerifiedAt`. OAuth login (`auth.service.ts:504-535`): auto-link to an existing passwordless user only when that user's `emailVerifiedAt` is set; Google `email_verified` true sets `emailVerifiedAt` on new users. Script `packages/db/scripts/auth/backfill-email-verified.ts` (idempotent, prints counts, owner approves running; V-05 check first). Normalise emails to lower case on register, login and OAuth.
6. **RM-034 recovery.** `auth.service.ts:572-607`: pass `resetUrl` to `mailService.sendPasswordResetEmail`; delete the dead `PASSWORD_RECOVERY_DELIVERY_CONFIGURED` branch; keep the generic response for unknown emails. Web `app/auth/forgot` and `app/auth/reset` (neutral confirmation, reset page strips the token from the URL after reading, no auto sign-in, delivery-disabled state says "contact your church office"). Replace the in-memory limiter (`auth.service.ts:86,665-675`) with DB-backed counts.
7. **RM-035 auth limits.** Per-route `@Throttle` on login, register, refresh (10/min/IP); per-account lockout via `failedLoginCount` and `lockedUntil` (5 failures then 15 min, progressive); use `config.jwt.accessTokenExpiresIn` instead of the hard-coded `3600` at `auth.service.ts:165-167` (BE-08, request from lane 02). Return the same message for locked, unknown and wrong-password (no enumeration).
8. **RM-036 consent.** `ConsentService` (`canSend(userId, channel, purpose)`, `grant`, `revoke`) over `contactConsents`; endpoints below; unsubscribe link token for email (signed, one-click `GET /unsubscribe/:token`, PROPOSED); `revokeByPhone(phoneE164)` for the SMS STOP webhook (lane 05 calls it). Consent is recorded at verification time with an explicit, revocable choice (wording per D-19). Lane 09 shows the toggle in Profile.
9. **RM-037** Validate email format and password length 12-128 on register and login DTOs (`auth.service.ts:105-107`); login form must not reuse `minLength={12}` (request to lane 01 web).

### Wave 2

10. **RM-087 mobile onboarding.** Split `(auth)/sign-in.tsx` into `welcome`, `sign-in`, `register`, `verify` (6-digit code, paste works, resend countdown), `recover`; language choice on the first screen; password visibility toggle; visible labels and per-field errors (not placeholders); map API `code` to catalogue keys (no raw server text, lane 12); keep the typed email on error; after register route to `verify`, then to "join a church" if no membership (lane 10 route `/join`). Test on a 360 dp Android with the keyboard open. Email change UI is lane 09 (profile), calling these endpoints.

### Wave 3

11. **RM-151** (PROPOSED) staff-assisted phone verification for members without an app account: staff endpoint sends the OTP to the member's phone and confirms the code the member reads out (permission `create:visitor` or `manage:attendance`, rate limited, audited); lane 11 adds the screen. **RM-144** per-device sessions; **RM-146** schema hygiene (`timestamptz` audit columns, redundant `idx_users_email`).

## Contracts

All JSON in the existing envelope; errors add `code`. JWT required; permission `update:self`; no church context.

| Method and path (PROPOSED) | Request | Response | Errors |
|---|---|---|---|
| `POST /auth/verification/email` | `{ "email": "a@b.org", "purpose": "signup\|change", "currentPassword"?: "..." }` | 202 `{ "data": { "expiresInSeconds": 600, "resendAfterSeconds": 60 } }` | 409 `EMAIL_IN_USE`, 429 `TOO_MANY_REQUESTS`, 403 `PASSWORD_REQUIRED` |
| `POST /auth/verification/email/confirm` | `{ "code": "123456" }` | 200 `{ "data": { "emailVerified": true, "verifiedAt": "ISO" } }` | 400 `INVALID_CODE` (+`attemptsRemaining`), 410 `CODE_EXPIRED`, 429 `TOO_MANY_ATTEMPTS` |
| `POST /auth/verification/phone` | `{ "phone": "0712345678" }` (normalised) | 202 same shape | 422 `INVALID_PHONE`, 409 `PHONE_IN_USE`, 429 |
| `POST /auth/verification/phone/confirm` | `{ "code": "123456" }` | 200 `{ "data": { "phoneVerified": true } }` | as email |
| `GET /auth/verification/status` | | `{ "data": { "email": { "verified": true, "masked": "f***@credable.io" }, "phone": { "verified": false, "masked": null } } }` | |
| `GET /consent` / `PUT /consent` | `{ "channel": "sms\|email", "purpose": "announcements", "granted": true }` | current consents | |
| `GET /unsubscribe/:token` (public) | | 200 HTML-free JSON `{ "revoked": true }` | 410 `LINK_EXPIRED` |

DB sketch (table TS only):

```sql
-- contact_verifications
id uuid pk, user_id uuid fk users on delete cascade, channel varchar(8) check in ('email','phone'),
destination varchar(255) not null, code_hmac char(64) not null, purpose varchar(16) check in ('signup','change','recovery'),
attempts smallint default 0, expires_at timestamptz not null, consumed_at timestamptz, created_at timestamptz default now()
index (user_id, channel, created_at desc)
-- contact_consents
id uuid pk, user_id uuid fk, channel varchar(8), purpose varchar(32), status varchar(8) check in ('granted','revoked'),
source varchar(32) not null, created_at timestamptz default now()   -- append-only; latest row wins
```

## Acceptance (testable)

- A code is accepted once; 6th wrong attempt invalidates it; resend inside 60 s returns 429; codes are HMAC, never logged.
- Email change: without a code sent to the new address the stored email never changes; `emailVerifiedAt` is cleared until confirmed.
- OAuth login for a passwordless account whose `emailVerifiedAt` is null returns 401 `OAuth account is not linked`.
- Recovery: known and unknown emails return the same body and timing class; the reset link works once and expires after 15 minutes.
- Phone verify rejects non-`+255` numbers; 5 sends per day per phone enforced.
- Locked account returns the generic failure and cannot log in for 15 minutes.
- Mobile: a new user registers, verifies, and reaches the join screen; every string has `en` and `sw`; no raw server text.

## Test plan (targeted)

`pnpm --filter api test -- src/auth src/verification src/consent`; `pnpm --filter @church/config test` (phone only); `pnpm --filter mobile test` (auth tests, wave 2); web: `pnpm --filter web type-check` only. One final `pnpm --filter api type-check`. Skip other suites. DEV smoke with the fake adapters; a real SMS to the owner's number only after D-08.

## Risks

- Members without user accounts get no email or SMS (see data model facts); state this in the owner brief before enabling sends; RM-151 offers staff-assisted verification.
- Lockout can be abused to lock a victim out (per-account); mitigate with per-IP counting plus progressive delay, and a support path.
- SMS pumping and cost: country allow-list and caps; spend alert is an ops item (RM-132).
- Enum value migration for `roleEnum` is a separate `ALTER TYPE` in M1; review the generated SQL.
- Legal basis (D-19) may change the consent wording; keep copy in the catalogue.

## Agent brief (A: schema, phone util, then OTP API)

```
ROLE: build agent, lane 04 verification-and-consent, brief A. Leaf worker: start no subagents.
REPO: /Users/upstairs/Personal/builds/church/church-management-system  BRANCH: design/mito-ya-baraka-concepts (stay on it)
READ FIRST: docs/roadmap/README.md (ground rules), docs/roadmap/specs/lane-04-verification-and-consent.md (tasks 1-5, contracts), docs/roadmap/audits/backend-api.md section 4.3.
PRECONDITION: lane 01 merged (users email read-only, auth.controller callbackUrl). Check git log; if not, STOP and report.
OWN (may edit): apps/api/src/{auth/** except guards/decorators, verification/**, consent/**}; packages/db/{tables/user.ts, oauthProviderIdentities.ts, passwordRecoveryTokens.ts, refreshTokens.ts, contactVerifications.ts, contactConsents.ts, scripts/auth/**}; packages/config/src/utils/phone.ts + phone.test.ts.
DO NOT TOUCH: users/**, sms/**, mail/**, communications/**, packages/db/migrations, package.json, lockfile, web, mobile.
RULES: no commits/push; no pnpm add; never run db:generate/push/migrate; no secrets in output.
GOAL: verification columns and tables (TS only), phone normaliser, email and phone OTP endpoints with fake adapters, verified email change, OAuth link guard.
STEPS:
1. Verify: user.ts columns (~L25-45) and roleEnum (L13); auth.service.ts:504-535 (OAuth link), :572-607 (recovery), :165-167 (TTL), :86 (limiter); sms.service.ts:137 and mail.service.ts:131 public methods.
2. Schema: add columns and tables per spec (incl. 'usher','publisher' in roleEnum, failedLoginCount, lockedUntil). Build @church/db only: pnpm --filter @church/db build.
3. packages/config/src/utils/phone.ts normalizeTzPhone/maskPhone + tests (10+ cases).
4. verification module: email + phone endpoints per contract; HMAC code, TTL, attempts, cooldown, daily caps; adapters behind interfaces; fakes for tests; VERIFICATION_ENABLED flag.
5. Email change (purpose 'change', currentPassword for password accounts) and OAuth link only when emailVerifiedAt set; set emailVerifiedAt for new Google users; backfill script (do not run).
VERIFY: pnpm --filter api test -- src/auth src/verification ; pnpm --filter @church/config test (phone); ONE pnpm --filter api type-check.
REPORT (max 15 lines): files changed; RM IDs done/partial; tests run/skipped; requests (lane 02: TTL config; lane 05: SmsService vendor; lane 03: enum values ready; integrator: M1 generate); open risks.
```

Briefs B (recovery, limits, consent, tasks 6-9) and D (mobile onboarding, task 10) reuse this header with their task lists and owned files.
