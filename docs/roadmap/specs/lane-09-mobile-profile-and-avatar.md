# Lane 09: mobile-profile-and-avatar (with prayer, inbox and push)

Owns the member's personal surfaces: Profile (photo upload, email change entry, notification and consent toggles), Prayer, Inbox, and the push pipeline.

- **Waves:** 2 (RM-081, 082, 089, 090, 091, 092, 093), 3 (RM-124 inbox part, RM-149 hook).
- **Backlog IDs:** RM-081, 082, 089, 090, 091, 092, 093; RM-124 (inbox), RM-149.
- **Decisions:** D-06 (avatar private, signed URL), D-07 (key layout), D-17 (prayer visibility), D-29 (email change), D-10 and D-25 (push accounts and categories).
- **Depends on:** lane 04 RM-029 (avatar columns in `user.ts`, migration M1 applied) and RM-033 (email change flow); lane 02 RM-041 (`putPrivateObject`, `getSignedGetUrl`) and RM-008; lane 01 merged (users hotfix); lane 03 permissions (`view:prayer-requests` stays unused until D-17); lane 07 RM-010 (paths) and a multipart helper `api.postForm` (request to lane 07, task 2 of its spec); lane 13 `Avatar` and `Segmented` primitives (RM-048); lane 05 RM-070 for push fan-out hook.
- **Blocks:** lane 11 avatar in lists (RM-149).
- **Model:** Luna medium; split A (avatar API), B (avatar mobile + profile), C (prayer API + mobile), D (inbox), E (push API), F (push client).

## Goal

A member sets and removes a profile photo from camera or gallery (no URL field); prayer requests have an explicit visibility and a "My requests" list; inbox items have real titles and open their target; push notifications register and arrive without personal data in the payload.

## Owned files (exclusive)

```
apps/api/src/users/**                         (after lane 01's Wave 0 merge)
apps/api/src/avatars/**   (new)               apps/api/src/devices/**   (new: push)
apps/api/src/prayer/**
packages/db/tables/prayerRequests.ts, pushDevices.ts (new), notificationPreferences.ts (new), pushOutbox.ts (new)
apps/mobile/app/(member)/(tabs)/profile.tsx, apps/mobile/app/(member)/prayer.tsx, apps/mobile/app/(member)/inbox.tsx
apps/mobile/components/{profile/**, prayer/**, notifications/**}
apps/mobile/lib/{avatar.ts, push.ts, profile-api.ts}   (new)
apps/mobile/tests/{avatar,profile,prayer,notifications,push}-*.test.ts   (new)
packages/config/src/i18n/messages/profile.ts, prayer-inbox.ts   (new, pre-registered by lane 12)
```

Not owned: `users` columns (lane 04), `lib/api.ts` and `lib/session.tsx` (lane 07: sign-out must call `unregisterPush()`, request), `apps/api/src/notifications/**` (lane 05), `components/ui/**` (lane 13), `app.json` (lane 02).

## Tasks (in order)

1. **RM-081 avatar API.** Module `avatars` (PROPOSED endpoints below). Steps: magic-byte check (jpeg, png, webp; reject SVG and others regardless of client MIME), size at most 2 MB, `sharp` with `limitInputPixels` (6000 px per side), apply EXIF rotation then strip all metadata, re-encode 512x512 cover JPEG; store `avatars/{userId}/{uuid}.jpg` with lane 02's helper; update `users.avatar_key` and `avatar_updated_at`; delete the previous object after the row commits; `DELETE` removes both; `GET /users/me` adds `avatarUrl` (signed GET, 15 minutes, null when none) and keeps `picture` as fallback; rate limit 10 uploads per hour per user; the route skips church context via lane 03's `@SkipChurchContext()` (user-level). Google login must not overwrite a member-set photo: request to lane 04 for `auth.service.ts:494-497,522-527` (set `picture` only when `avatarKey` is null, MM-06).
2. **RM-082 avatar mobile.** `expo-image-picker` (camera and gallery, `allowsEditing`, square aspect, quality 0.8) then `expo-image-manipulator` resize to 1024 px JPEG, at most 2 MB; upload with `api.postForm('/users/me/avatar')`; remove the free-text "Picture URL" field (`profile.tsx:102`); Avatar (lane 13) with initials fallback and image-error fallback; permission denied shows an explanation with "Open settings"; cancel changes nothing; failure keeps the previous photo and keeps the form; Remove photo action; email row read-only with "Change email" entering lane 04's verified flow (code to the new address). Show the language switch and staff switch here since More is removed (D-20).
3. **RM-089 prayer API.** DTO class (`content` 1-1000 trimmed, `visibility` `pastors` default or `zone_leader`), column `visibility varchar(16) default 'pastors'` (table TS only, integrator batch M3), keep `GET /prayer-requests/me` (`prayer.controller.ts:59-65`) returning `status` and `visibility`; never log content; no staff endpoint (D-17).
4. **RM-090 prayer mobile.** "My requests" list with translated status, 1000-character counter, required visibility choice defaulting to the most private, privacy line that states who can see it, double-submit guard, text kept on failure, translated errors (`prayer.tsx:21-31`).
5. **RM-091 inbox.** `components/notifications/describe.ts` registry for every template key in use: `events.created`, `library.document_published`, `announcement.published`, `membership.requested`, `membership.approved`; titles from catalogue with `{title}` placeholders in `en` and `sw`; unknown key falls back to a neutral title; `target` shaped `{ type: 'event'|'announcement'|'library'|'membership', id }` routes to the screen (lane 07 route table) or says the item is no longer available; mark read on open, mark all; the pressable's accessibility label includes unread state (MM-29). Replaces `describeNotification` in `components/events/model.ts:94-103` (lane 08 removes the old one).
6. **RM-092 push API (PROPOSED).** Tables below; `PushService.enqueue({ userIds, category, title, body, data })` exported for lane 05 (called when `in_app` deliveries are created); worker every minute drains `push_outbox` in batches of 100 with `expo-server-sdk`, receipts after 15 minutes, `DeviceNotRegistered` sets `disabled_at`; quiet hours 21:00-06:00 `Africa/Dar_es_Salaam` defer non-urgent categories to 07:00 (D-25); payload `{ title, body: short, data: { type, id } }`, no personal data; `PUSH_ENABLED` flag, off by default; leader lock like lane 05.
7. **RM-093 push client.** `lib/push.ts`: ask permission after first successful sign-in with a short explanation screen (not at launch); `getExpoPushTokenAsync({ projectId })`; register with `PUT /users/me/push-devices`; Android channels `announcements`, `events`, `pastoral`, `giving`; unregister on sign-out; tap opens the target; Profile toggles per category and the consent toggles from lane 04 (`GET/PUT /consent`). Expo Go cannot receive remote push on current SDKs (verify): test on a development build or preview APK (D-10).
8. **Wave 3.** RM-124 inbox accessibility, RM-149 expose `avatarUrl` to staff lists (lane 11).

## Contracts (PROPOSED)

| Method and path | Permission | Request | Response | Errors |
|---|---|---|---|---|
| `POST /users/me/avatar` | `update:self` | multipart field `file` (jpeg, png, webp, at most 2 MB) | `200 { "data": { "avatarUrl": "https://...signed", "avatarUpdatedAt": "ISO" } }` | 400 `AVATAR_MISSING_FILE`, 413 `AVATAR_TOO_LARGE`, 415 `AVATAR_TYPE_UNSUPPORTED`, 422 `AVATAR_DECODE_FAILED`, 429, 503 `STORAGE_NOT_CONFIGURED` |
| `DELETE /users/me/avatar` | `update:self` | | 204 | |
| `GET /users/me` (existing) | | | adds `avatarUrl` (nullable) | |
| `POST /prayer-requests` (existing) | `create:prayer-request` | `{ "content": "...", "visibility": "pastors" }` | 201 | 400 `PRAYER_EMPTY`, `PRAYER_TOO_LONG` |
| `PUT /users/me/push-devices` | `update:self` | `{ "expoToken": "ExponentPushToken[...]", "platform": "android", "appVersion": "1.0.0" }` | 200 `{ "data": { "id": "uuid" } }` | 422 `INVALID_PUSH_TOKEN` |
| `DELETE /users/me/push-devices/:id` | `update:self` | | 204 | |
| `GET/PATCH /users/me/notification-preferences` | `update:self` | `{ "category": "events", "pushEnabled": false }` | list | |

DB sketch (table TS only): `prayer_requests.visibility varchar(16) default 'pastors'`; `push_devices(id, user_id fk, expo_token unique, platform, app_version, last_seen_at, disabled_at, created_at)`; `notification_preferences(user_id, category, push_enabled default true, pk(user_id, category))`; `push_outbox(id, user_id, category, title, body, data jsonb, send_after, status, attempts, ticket_id, last_error, created_at)`.

## Acceptance (testable)

- MEMBER uploads a JPEG and gets a signed URL that loads; a renamed `.svg`, HTML, and a 3 MB file are rejected with the codes above; the stored object has no EXIF; the old object is deleted; another user's key is never returned by any endpoint.
- After relaunch the photo shows; with no photo or a load error initials show; no URL text field exists.
- Prayer: empty and over 1000 characters rejected client and server with translated text; own list shows the new request as Open after refresh; another user's request never appears.
- Inbox: every template key in use has `en` and `sw` titles; tapping an item with a target opens it; the bell badge (lane 07) equals `unreadCount` after mark-read.
- Push: token registers once per device, second device also registers; sign-out removes it; a `DeviceNotRegistered` receipt disables the token; no payload contains a phone, amount or request text; quiet hours defer a non-urgent push.

## Test plan (targeted)

`pnpm --filter api test -- src/avatars src/users src/prayer src/devices` (magic bytes, `sharp` re-encode, limits, own-user only, batching, error mapping with Expo sender mocked); `pnpm --filter mobile test` for `avatar|profile|prayer|notifications|push` tests; one final `pnpm --filter api type-check` and `pnpm --filter mobile typecheck`. Device: avatar camera and gallery on Android and iOS (permission denial both platforms); push only on a development build. Skip web.

## Risks

- Needs M1 (user columns) and M3/M4 (tables) applied on DEV before API tests against a real DB.
- `sharp` native binary on the Coolify image: confirm the Docker build includes it (lane 02 CI docker build).
- Decompression bombs: pixel cap and size cap before decode.
- Signed avatar URLs expire; the client refetches `/users/me` on image error.
- Prayer privacy copy must match D-17; keep it neutral until answered.
- Push on iOS needs Apple credentials (D-10); Android needs FCM via EAS.

## Agent brief (A: avatar API)

```
ROLE: build agent, lane 09 mobile-profile-and-avatar, brief A (RM-081 avatar API). Leaf worker: start no subagents.
REPO: /Users/upstairs/Personal/builds/church/church-management-system  BRANCH: design/mito-ya-baraka-concepts (stay on it)
READ FIRST: docs/roadmap/README.md (ground rules), docs/roadmap/specs/lane-09-mobile-profile-and-avatar.md (task 1 + contracts), docs/roadmap/audits/backend-api.md section 4.1.
PRECONDITIONS: users table has avatar_key/avatar_updated_at (lane 04 merged, packages/db/tables/user.ts); lane 02 exposes putPrivateObject/getSignedGetUrl in apps/api/src/file-upload; lane 01 merged. If any is missing, STOP and report.
OWN (may edit): apps/api/src/avatars/** (new), apps/api/src/users/**.
DO NOT TOUCH: auth/**, file-upload/**, packages/db/**, app.module.ts (report the module import line instead), package.json (sharp is added by the integrator), mobile, web.
RULES: no commits/push; no pnpm add; no db commands; no secrets; never log file bytes or keys.
GOAL: POST/DELETE /users/me/avatar and avatarUrl on GET /users/me, private storage, safe image handling.
STEPS:
1. Verify users.service.ts update path and users.controller.ts routes; how @SkipChurchContext (lane 03) or the existing '/users/me' skip works in church-context.guard.ts.
2. avatars module: controller (multipart via the existing FileInterceptor pattern in file-upload.controller.ts, read only), service: magic bytes (jpeg/png/webp), 2 MB cap, sharp limitInputPixels, EXIF rotate then strip, 512x512 cover JPEG q80, key avatars/{userId}/{uuid}.jpg via the lane 02 helper, update row, delete previous object after commit, rate limit 10/hour/user.
3. DELETE endpoint (204) removes object and columns.
4. users.service: GET /users/me returns avatarUrl (signed, 15 min) and keeps picture fallback; never expose avatar_key.
5. Errors: AVATAR_MISSING_FILE 400, AVATAR_TOO_LARGE 413, AVATAR_TYPE_UNSUPPORTED 415, AVATAR_DECODE_FAILED 422; storage missing => STORAGE_NOT_CONFIGURED 503 (from lane 02).
6. Specs: type rejection (svg renamed png), size cap, oversize pixels, own-user only, previous object deleted, EXIF absent (use a fixture with EXIF generated in the test).
VERIFY: pnpm --filter api test -- src/avatars src/users ; ONE pnpm --filter api type-check.
REPORT (max 15 lines): files changed; RM-081 status; tests run/skipped; module import line for app.module.ts; requests (lane 04: Google picture precedence at auth.service.ts:494-497,522-527; lane 07: api.postForm; integrator: sharp dependency); open risks.
```

Briefs B-F reuse this header with the task lists above (mobile briefs list `apps/mobile` owned files and the device-check rules from the README).
