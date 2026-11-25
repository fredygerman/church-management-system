# API contracts: client calls verified against the API

Status: verified 2026-11-24 on branch `design/mito-ya-baraka-concepts`. Read-only audit; no client or API code was changed. Mismatches are reported here, not fixed.

## Scope and method

- Clients: web staff dashboard and portal (`apps/web/actions/*`, direct `apiGet`/`apiPost`/`apiRequest` calls in `apps/web/app/**`, `apps/web/components/**`), web auth routes, and mobile (`apps/mobile/lib/**`, `apps/mobile/app/**`).
- API: every `@Controller` under `apps/api/src/**`. The route table was extracted from decorators, then each client call was matched on method and path (placeholders match route params). Permission keys come from the `@RequirePermission` on the handler.
- Field checks were done per row where the client's keys or the response were read against the DTO, `@Query`/`@Body` names or service return shape. Rows marked "not re-checked" were matched on method, path and permission only.
- Status column: `OK` means path, method, permission and every field the row reads match. `OK (fields not checked)` means only path, method and permission were verified for that row. `MISMATCH` means the evidence in the row shows a difference.

## Global facts

| Fact | Evidence |
|---|---|
| No global route prefix. Controllers are served at their decorator path (`/members`, `/dashboard/stats`). The only `api/` prefix is the files controller, so its routes are `/api/files/...`. | `apps/api/src/main.ts` has no `setGlobalPrefix`; `apps/api/src/file-upload/file-upload.controller.ts:56` is `@Controller('api/files')`. Every client `/api/...` call targets the files controller; no client calls a non-files route with an `/api` prefix. |
| Response envelope `{success, message, data, timestamp, path, statusCode}`. `meta` is added only when the controller returns an object with `meta`; otherwise `data` is the raw return value. | `apps/api/src/common/interceptors/response.interceptor.ts:43-75`. |
| Global `ValidationPipe` with `whitelist` and `forbidNonWhitelisted`. It only validates bodies typed as classes; inline `type` bodies are not validated. | `apps/api/src/main.ts:62-66`. Class body DTOs in the client paths: `visitors/dtos/*` only. |
| `ChurchContextGuard` (global) takes `churchId` from params, query, body or the user's church, and writes it into every object body. A class DTO that does not declare `churchId` therefore rejects every body that goes through it. | `apps/api/src/auth/guards/church-context.guard.ts` (body write at line 116); registered in `apps/api/src/app.module.ts`. |
| Response casing: camelCase from Drizzle rows everywhere, except the library endpoints, which map explicitly to snake_case. | `file-upload.service.ts:134-147` (camelCase document metadata), `:349-367` (snake_case library rows). |
| Permission coverage for member-facing calls. Every portal and mobile member call is granted to the `member` role. Note: `member`, `zone_leader` and `department_leader` all hold `read:member`. The handlers scope the rows they return (see Members and Dashboard). | `packages/config/src/permissions.ts:160,174,187-200`. |

## Mismatch list

| ID | Client (file:line) | API (file:line) | What differs |
|---|---|---|---|
| M1 | `apps/web/actions/offering.ts:25` (used by `apps/web/app/[churchId]/dashboard/offerings/categories/[id]/edit/page.tsx:13`) | `apps/api/src/offerings/offerings.controller.ts:37-81` | Client calls `GET /offering-categories/{id}`. The API has no such route (list, create, update, delete only). The edit page will fail. |
| M2 | `apps/web/actions/auth.ts:30` | `apps/api/src/auth/auth.controller.ts:264-265` | Client uses `POST /auth/{provider}/callback`. The API has `GET /auth/google/callback` only, and it takes `code`, `state`, `callbackUrl` as query. The client function has no importers. |
| M3 | `apps/web/actions/member.ts:99-114` | `apps/api/src/members/members.controller.ts:46-63` | Client sends `firstName`, `lastName`, `gender`, `maritalStatus`, `occupation`, `from`, `to`, `sort`. The API reads only `limit` and `offset`, so the filters are silently ignored. Client reads `result.meta.total_pages`; the API never returns `meta` for this route, so the page count is always 1. |
| M4 | `apps/web/actions/visitor.ts:56-59`; caller `apps/web/components/visitor/table/visitor-table.tsx:36` | `apps/api/src/visitors/dtos/convert-visitor-to-member.dto.ts:10-16`; `apps/api/src/main.ts:62-66` | Client body `{churchId, zoneId}`. The DTO declares only `zoneId`, and `forbidNonWhitelisted` rejects `churchId`. Reproduced: `400 property churchId should not exist`. Convert cannot succeed from the UI. |
| M5 | `apps/web/actions/visitor.ts:47-49` | `apps/api/src/visitors/dtos/visitor-followup.dto.ts:20-48` | Client body `{churchId, visitorId, followupDate, notes, status}`. The DTO has no `churchId` or `visitorId`. Reproduced: `400 property churchId should not exist, property visitorId should not exist`. No UI caller found. |
| M6 | `apps/web/app/[churchId]/dashboard/home/page.tsx:89,114-119` | `apps/api/src/dashboard/dashboard.service.ts` (`getStats`), `dashboard.controller.ts:15-22` | Path, method and permission match. The page reads `stats.pendingVisitors` and `stats.recentActivities`; the endpoint returns only `totalMembers` and `activeZones` (DEC-01). Reading `.length` of `undefined` throws during render, so the page now errors instead of showing its unavailable state. |

Checked and matching (no mismatch): all `/api/files/*` paths; library snake_case fields on both clients; `/api/files/user` camelCase fields on web and mobile; `/members` list and `/members/me` casing; `/attendance/service-types` (`name`, `isActive`) and `/attendance/sessions` (`title`, `sessionDate`, `status`) on mobile and web; `POST /visitors` body; `PUT /events/:id/rsvp`; `POST /events/:id/rsvps`; `PUT /events/:id/attendance`; `POST /prayer-requests`; `PATCH /users/me` and the `result.user` read; `POST /auth/refresh`, `POST /auth/login` response fields used by mobile.

## Endpoint tables by area

## Auth

| Method | Path | Permission | API handler | Client call(s) | Fields and response | Status |
|---|---|---|---|---|---|---|
| POST | `/auth/login` | none (no `@RequirePermission`) | `auth/auth.controller.ts:35` | `web/app/auth/signin/page.tsx:52`<br>`mobile/app/(auth)/sign-in.tsx:18` | Body `email`, `password` (inline type, not DTO-validated) `auth.controller.ts:35-38`. Response `{accessToken, refreshToken, user}` (`auth.service.ts:114-116`). Mobile reads all three. | OK |
| POST | `/auth/logout` | read:self | `auth/auth.controller.ts:177` | `web/app/auth/signout/page.tsx:17`<br>`mobile/lib/api.ts:92` | No body. Revokes tokens via tokenVersion (per mobile-api-inventory). | OK |
| POST | `/auth/oauth-login` | none (no `@RequirePermission`) | `auth/auth.controller.ts:112` | `web/app/api/auth/callback/route.ts:19` | Body `email`, `name`, `picture` (`auth.controller.ts:112`, handler body not re-read). | OK (fields not checked) |
| GET | `/auth/profile` | read:self | `auth/auth.controller.ts:87` | `web/app/setup/page.tsx:17` | Setup page reads `churchId` only (`apps/web/app/setup/page.tsx:22`). | OK |
| POST | `/auth/refresh` | none (no `@RequirePermission`) | `auth/auth.controller.ts:46` | `mobile/lib/api.ts:46` | Body `refreshToken` (`auth.controller.ts:76-79`). Response `{accessToken, refreshToken}`. | OK |
| POST | `/auth/register` | none (no `@RequirePermission`) | `auth/auth.controller.ts:28` | `web/app/auth/signin/page.tsx:52` | Body `name`, `email`, `password` (`auth.controller.ts:28-31`). | OK |
| POST | `/auth/setup` | none (no `@RequirePermission`) | `auth/auth.controller.ts:372` | `web/actions/church.ts:27` | Body not re-read (`auth.controller.ts:372-`). | OK (fields not checked) |
| POST | `/auth/switch-church` | none (no `@RequirePermission`) | `auth/auth.controller.ts:212` | `web/actions/church.ts:16` | Body `churchId`. Handler not re-read beyond route. | OK (fields not checked) |
| POST | `/auth/{provider}/callback` | n/a | none | `web/actions/auth.ts:30` | Client uses POST; API has only `GET /auth/google/callback` (`auth.controller.ts:264-265`), which redirects and takes `code`, `state`, `callbackUrl` as query. Function has no importers. | MISMATCH |

## Profile and users

| Method | Path | Permission | API handler | Client call(s) | Fields and response | Status |
|---|---|---|---|---|---|---|
| GET | `/users/me` | read:self | `users/users.controller.ts:40` | `mobile/lib/session.tsx:22`<br>`mobile/app/(member)/profile.tsx:10` | Response is the User row with `name`, `email`, `picture` (`users.service.ts:39-51`; `packages/db/tables/user.ts:30,33`). Mobile `profile.tsx:10` reads these: match. | OK |
| PATCH | `/users/me` | update:self | `users/users.controller.ts:87` | `mobile/app/(member)/profile.tsx:17` | Body `name`, `email`, `picture` (`users.controller.ts:121`). Response `{success, user, message}` (`users.service.ts:64`); mobile `profile.tsx:17` reads `result.user`: match. | OK |

## Members

| Method | Path | Permission | API handler | Client call(s) | Fields and response | Status |
|---|---|---|---|---|---|---|
| GET | `/members` | read:member | `members/members.controller.ts:46` | `web/actions/member.ts:113`<br>`mobile/app/(staff)/people.tsx:7` | Client sends `firstName`, `lastName`, `gender`, `maritalStatus`, `occupation`, `from`, `to`, `sort` plus `limit`/`offset`; API reads only `limit`/`offset` (`members.controller.ts:46-63`), so filters are ignored. Client reads `result.meta.total_pages` (`member.ts:114`); API returns a bare array with no `meta`, so page count is always 1 (`response.interceptor.ts:61-68`). Response rows are camelCase (Drizzle); mobile `people.tsx` reads `firstName`/`lastName`: match. | MISMATCH |
| POST | `/members` | create:member | `members/members.controller.ts:32` | `web/actions/member.ts:65` | Body matches `CreateMemberInput` (`members.service.ts:6-19`): firstName, lastName, dateOfBirth, gender, maritalStatus, phone, occupation, dateOfSalvation, notes. Controller requires dateOfBirth, gender, maritalStatus (`members.controller.ts:36-38`); client sends them. Client's baptism/anointed dates are validated but not sent (`member.ts:32-44`). | OK |
| DELETE | `/members/:id` | delete:member | `members/members.controller.ts:149` | `web/actions/member.ts:188` | Path and method verified; fields not re-checked. | OK (fields not checked) |
| GET | `/members/:id` | read:member | `members/members.controller.ts:112` | `web/actions/zone.ts:134`<br>`web/actions/member.ts:137` | Path and method verified; fields not re-checked. | OK (fields not checked) |
| PUT | `/members/:id` | update:member | `members/members.controller.ts:136` | `web/actions/member.ts:178` | Body is a partial CreateMemberInput (`members.controller.ts:136`); client also sends `churchId`, which is ignored. | OK |
| GET | `/members/:id/zones` | read:member | `members/members.controller.ts:159` | `web/actions/member.ts:147` | Rows carry `zone` relation and `isLeader` (`members.service.ts:179-183`, `packages/db/tables/memberZones.ts:24`). Web maps `zone.id`, `zone.name`, `isLeader` (`member.ts:147-153`): match. | OK |
| GET | `/members/me` | read:self | `members/members.controller.ts:101` | `web/actions/portal.ts:11`<br>`web/app/[churchId]/portal/profile/page.tsx:20`<br>`mobile/app/(member)/index.tsx:17` | Own member row (`members.controller.ts:101`). | OK |
| GET | `/members/search` | read:member | `members/members.controller.ts:66` | `web/actions/member.ts:209` | Query `q` matches (`members.controller.ts:70`). | OK |

Scope (current behaviour, `getLeaderScope` in `members.service.ts`): members see only their own record on `GET /members` and `GET /members/:id`. `GET /members/search` and `GET /members/zone/:zoneId` return 403 to members. Zone and department leaders see only members they lead on `GET /members`, `GET /members/:id`, `/members/search` and `/members/zone/:zoneId`. `PUT /members/:id` and `DELETE /members/:id` apply the same rule and return 403 `This member is outside your scope` for a member outside it. Staff roles without a scope are unchanged.

## Attendance

| Method | Path | Permission | API handler | Client call(s) | Fields and response | Status |
|---|---|---|---|---|---|---|
| POST | `/attendance/checkins/qr/:token` | manage:attendance | `attendance/attendance.controller.ts:107` | `web/actions/attendance.ts:38` | Body `memberId` (`attendance.controller.ts:109-110`); client input shape not re-read. | OK (fields not checked) |
| GET | `/attendance/cohorts` | manage:attendance-analytics | `attendance/attendance.controller.ts:181` | `web/actions/attendance.ts:70` | Query `from`, `to` (`attendance.controller.ts:183`). | OK |
| GET | `/attendance/me/checkins` | view:attendance | `attendance/attendance.controller.ts:31` | `web/actions/portal.ts:29` | Path and method verified; fields not re-checked. | OK (fields not checked) |
| GET | `/attendance/risk-flags` | view:risk-flags | `attendance/attendance.controller.ts:146` | `web/actions/attendance.ts:54` | Path and method verified; fields not re-checked. | OK (fields not checked) |
| POST | `/attendance/risk-profiles` | manage:risk-settings | `attendance/attendance.controller.ts:194` | `web/actions/attendance.ts:78` | Path and method verified; fields not re-checked. | OK (fields not checked) |
| GET | `/attendance/risk-settings` | view:risk-flags | `attendance/attendance.controller.ts:128` | `web/actions/attendance.ts:46` | Path and method verified; fields not re-checked. | OK (fields not checked) |
| PUT | `/attendance/risk-settings` | manage:risk-settings | `attendance/attendance.controller.ts:134` | `web/actions/attendance.ts:50` | Path and method verified; fields not re-checked. | OK (fields not checked) |
| GET | `/attendance/service-types` | view:attendance | `attendance/attendance.controller.ts:51` | `web/actions/attendance.ts:6`<br>`mobile/app/(staff)/services.tsx:8` | Rows camelCase: `name`, `isActive` (`packages/db/tables/attendance.ts:32-33`; `attendance.service.ts:54-59`). Mobile `services.tsx` reads `name`, `isActive`: match. | OK |
| POST | `/attendance/service-types` | manage:services | `attendance/attendance.controller.ts:41` | `web/actions/attendance.ts:10` | Body `name`, `isActive?` (`attendance.controller.ts:42-44`). | OK |
| PATCH | `/attendance/service-types/:id` | manage:services | `attendance/attendance.controller.ts:57` | `web/actions/attendance.ts:14` | Body `name?`, `isActive?` (`attendance.controller.ts:58`). | OK |
| GET | `/attendance/sessions` | view:attendance | `attendance/attendance.controller.ts:72` | `web/actions/attendance.ts:18`<br>`mobile/app/(staff)/services.tsx:8` | Query `from`, `to` optional (`attendance.controller.ts:72-74`). Rows camelCase `title`, `sessionDate`, `status`, plus `serviceType` relation (`attendance.service.ts:99-108`). Mobile `services.tsx` reads these: match. Member role gets `listUpcomingSessionsForMember` (`attendance.controller.ts:78`, `attendance.service.ts:115`): non-draft sessions that are open or dated today or later, with `id`, `title`, `sessionDate`, `status`, `serviceType` (`{id, name}`). | OK |
| POST | `/attendance/sessions` | manage:services | `attendance/attendance.controller.ts:63` | `web/actions/attendance.ts:22` | Body `serviceTypeId`, `title?`, `sessionDate` (`attendance.controller.ts:63-70`). | OK |
| POST | `/attendance/sessions/:id/checkins/manual` | manage:attendance | `attendance/attendance.controller.ts:100` | `web/actions/attendance.ts:34` | Body `memberId` (`attendance.controller.ts:102-103`). Extra `churchId`/`sessionId` from client are ignored. | OK |
| POST | `/attendance/sessions/:id/checkins/manual/batch` | manage:attendance | `attendance/attendance.controller.ts:162` | `web/actions/attendance.ts:62` | Body `memberIds` (`attendance.controller.ts:164`). | OK |
| PUT | `/attendance/sessions/:id/headcount` | manage:attendance | `attendance/attendance.controller.ts:85` | `web/actions/attendance.ts:30` | Path and method verified; fields not re-checked. | OK (fields not checked) |
| PUT | `/attendance/sessions/:id/metadata` | manage:attendance-analytics | `attendance/attendance.controller.ts:152` | `web/actions/attendance.ts:58` | Path and method verified; fields not re-checked. | OK (fields not checked) |
| PATCH | `/attendance/sessions/:id/status` | manage:services | `attendance/attendance.controller.ts:78` | `web/actions/attendance.ts:26` | Body `status` in draft | open |closed (`attendance.controller.ts:78-80`). | OK |
| GET | `/attendance/sessions/open/health` | manage:attendance-analytics | `attendance/attendance.controller.ts:188` | `web/actions/attendance.ts:74` | Path and method verified; fields not re-checked. | OK (fields not checked) |
| GET | `/attendance/trends` | view:attendance | `attendance/attendance.controller.ts:114` | `web/actions/attendance.ts:42` | Query `from`, `to`, `groupBy` (`attendance.controller.ts:118-120`). Client union is a subset: match. | OK |
| GET | `/attendance/trends/compare` | manage:attendance-analytics | `attendance/attendance.controller.ts:169` | `web/actions/attendance.ts:66` | Query `from`, `to`, `groupBy` (`attendance.controller.ts:173-175`): match. | OK |

## Events and RSVP

| Method | Path | Permission | API handler | Client call(s) | Fields and response | Status |
|---|---|---|---|---|---|---|
| GET | `/events` | view:events | `events/events.controller.ts:85` | `web/actions/event.ts:15`<br>`web/app/[churchId]/portal/events/page.tsx:32`<br>`mobile/app/(member)/events.tsx:9` | Query `from`, `to`, `status`, `scope`, `limit`, `offset` (`events.controller.ts:89-94`). Client sends the same keys (`event.ts:15`, `portal/events/page.tsx:32`). | OK |
| POST | `/events` | manage:events | `events/events.controller.ts:61` | `web/actions/event.ts:46` | Path and method verified; fields not re-checked. | OK (fields not checked) |
| DELETE | `/events/:id` | manage:events | `events/events.controller.ts:137` | `web/actions/event.ts:81` | Path and method verified; fields not re-checked. | OK (fields not checked) |
| GET | `/events/:id` | view:events | `events/events.controller.ts:106` | `web/actions/event.ts:28`<br>`mobile/app/(member)/events/[id].tsx:28` | Path and method verified; fields not re-checked. | OK (fields not checked) |
| PUT | `/events/:id` | manage:events | `events/events.controller.ts:121` | `web/actions/event.ts:69` | Path and method verified; fields not re-checked. | OK (fields not checked) |
| PUT | `/events/:id/attendance` | manage:events | `events/events.controller.ts:197` | `web/actions/event.ts:130` | Body `attendedMemberIds?`, `headcount?` (`AttendanceInput`, `events.service.ts:34-37`). Client `event.ts:130-134` matches. | OK |
| PUT | `/events/:id/rsvp` | rsvp:event | `events/events.controller.ts:176` | `web/actions/event.ts:163`<br>`mobile/app/(member)/events/[id].tsx:45` | Body `status` in going | maybe |declined (`events.controller.ts:176-185`; `events.service.ts:7`). Web sends extra `churchId` (ignored); mobile sends `status` only: match. | OK |
| GET | `/events/:id/rsvps` | manage:events | `events/events.controller.ts:148` | `web/actions/event.ts:95` | Path and method verified; fields not re-checked. | OK (fields not checked) |
| POST | `/events/:id/rsvps` | manage:events | `events/events.controller.ts:162` | `web/actions/event.ts:110` | Body `memberId`, `status` (`StaffRsvpInput`, `events.service.ts:29-32`). Client `event.ts:110-113` matches. | OK |
| GET | `/events/me` | rsvp:event | `events/events.controller.ts:46` | `web/actions/event.ts:149`<br>`web/app/[churchId]/portal/events/page.tsx:33`<br>`mobile/app/(member)/events/[id].tsx:28` | Rows are event RSVPs with `event` relation, `eventId`, `status` (`events.service.ts:221-231`; `packages/db/tables/eventRsvps.ts:17,26`). Mobile `events/[id].tsx:23-25` reads `eventId`, `event.id`, `status`: match. | OK |

## Communications

| Method | Path | Permission | API handler | Client call(s) | Fields and response | Status |
|---|---|---|---|---|---|---|
| GET | `/communications/announcements` | view:communications | `communications/communications.controller.ts:105` | `web/actions/portal.ts:39`<br>`web/app/[churchId]/portal/page.tsx:20`<br>`mobile/app/(member)/index.tsx:17` | Path and method verified; fields not re-checked. | OK (fields not checked) |
| GET | `/communications/campaigns` | view:communications | `communications/communications.controller.ts:84` | `web/actions/communications.ts:22` | Query `status`, `channel`, `from`, `to` (`communications.controller.ts:88-91`). Client `communications.ts:22` sends the same keys. | OK |
| POST | `/communications/campaigns` | manage:communications | `communications/communications.controller.ts:49` | `web/actions/communications.ts:39` | Path and method verified; fields not re-checked. | OK (fields not checked) |
| GET | `/communications/campaigns/:id` | view:communications | `communications/communications.controller.ts:96` | `web/actions/communications.ts:26` | Path and method verified; fields not re-checked. | OK (fields not checked) |
| PUT | `/communications/campaigns/:id` | manage:communications | `communications/communications.controller.ts:68` | `web/actions/communications.ts:51` | Path and method verified; fields not re-checked. | OK (fields not checked) |
| POST | `/communications/campaigns/:id/cancel` | manage:communications | `communications/communications.controller.ts:124` | `web/actions/communications.ts:63` | Path and method verified; fields not re-checked. | OK (fields not checked) |
| POST | `/communications/campaigns/:id/schedule` | send:communications | `communications/communications.controller.ts:111` | `web/actions/communications.ts:55` | Path and method verified; fields not re-checked. | OK (fields not checked) |
| POST | `/communications/campaigns/:id/send` | send:communications | `communications/communications.controller.ts:118` | `web/actions/communications.ts:59` | Path and method verified; fields not re-checked. | OK (fields not checked) |
| GET | `/communications/templates` | view:communications | `communications/communications.controller.ts:26` | `web/actions/communications.ts:6` | Query `channel` (`communications.controller.ts:28`); client `communications.ts:6` matches. | OK |
| POST | `/communications/templates` | manage:communications | `communications/communications.controller.ts:12` | `web/actions/communications.ts:10` | Path and method verified; fields not re-checked. | OK (fields not checked) |
| PATCH | `/communications/templates/:id` | manage:communications | `communications/communications.controller.ts:32` | `web/actions/communications.ts:14` | Path and method verified; fields not re-checked. | OK (fields not checked) |
| POST | `/communications/templates/preview` | manage:communications | `communications/communications.controller.ts:42` | `web/actions/communications.ts:18` | Path and method verified; fields not re-checked. | OK (fields not checked) |

## Files and library

| Method | Path | Permission | API handler | Client call(s) | Fields and response | Status |
|---|---|---|---|---|---|---|
| GET | `/api/files/library` | read:self | `file-upload/file-upload.controller.ts:429` | `web/actions/library.ts:41`<br>`mobile/app/(member)/library.tsx:57` | Response array of snake_case rows: `id`, `title`, `description`, `original_file_name`, `content_type`, `size_bytes`, `created_at` (`file-upload.service.ts:349-367`, type `:61-69`). Web `library.ts:5-13` and mobile `library.tsx:7-14` use the same snake_case names: match. Web also accepts `{documents}`; API never returns that wrapper (harmless). | OK |
| GET | `/api/files/library/:id/download-url` | read:self | `file-upload/file-upload.controller.ts:445` | `web/actions/library.ts:85`<br>`mobile/app/(member)/library.tsx:75` | Response `{url, expiresAt}` (`file-upload.service.ts:395-400`). Clients read `url`: match. | OK |
| GET | `/api/files/user` | manage:files | `file-upload/file-upload.controller.ts:400` | `web/app/[churchId]/dashboard/content/staff-documents.ts:36`<br>`mobile/app/(staff)/content.tsx:7` | Response camelCase `DocumentMetadata` (`file-upload.service.ts:134-147`): `originalFileName`, `visibleToMembers`, `title`, `contentType`, `sizeBytes`, `createdAt`. Web `staff-documents.ts:3-12` and mobile `content.tsx` read these: match. Includes non-visible docs (staff only). | OK |
| PATCH | `/api/files/:id` | manage:files | `file-upload/file-upload.controller.ts:464` | not checked | Body `UpdateDocumentDto` (`file-upload/dtos/update-document.dto.ts`): `title?` (string), `description?` (string), `visibleToMembers?` (boolean). `visibleToMembers` is the same flag the upload sets from metadata (`file-upload.service.ts:311-312`), so `true` makes the document visible in `/api/files/library`. At least one field is required; the update is limited to the caller's church. | Not checked (client) |

## Prayer

| Method | Path | Permission | API handler | Client call(s) | Fields and response | Status |
|---|---|---|---|---|---|---|
| POST | `/prayer-requests` | create:prayer-request | `prayer/prayer.controller.ts:31` | `web/actions/prayer.ts:20`<br>`mobile/app/(member)/prayer.tsx:17` | Body `content` (`CreatePrayerRequestBody`, `prayer.controller.ts:16-18`). Web sends extra `churchId`; type is not DTO-validated: match. | OK |
| GET | `/prayer-requests/me` | read:own-prayer-requests | `prayer/prayer.controller.ts:59` | `web/actions/prayer.ts:11`<br>`web/app/[churchId]/portal/prayer/page.tsx:26` | Own rows (`prayer.controller.ts:59`). Fields not re-checked. | OK (fields not checked) |

## Dashboard

| Method | Path | Permission | API handler | Client call(s) | Fields and response | Status |
|---|---|---|---|---|---|---|
| GET | `/dashboard/stats` | read:member | `dashboard/dashboard.controller.ts:15` | `web/actions/dashboard.ts:26`<br>`web/app/[churchId]/dashboard/home/page.tsx:9` | Response `{totalMembers, activeZones}` only (`dashboard.service.ts`). Scoped for leaders: the controller passes `getLeaderScope` (`dashboard.controller.ts:26`), so `totalMembers` counts only members in scope and `activeZones` is the number of zones a zone leader leads (`dashboard.service.ts:26-27`). A member gets a count of their own record. `apps/web/app/[churchId]/dashboard/home/page.tsx:114` reads `stats.recentActivities.length` and `:89` reads `stats.pendingVisitors`; both are omitted under DEC-01, so the page throws on render. | MISMATCH |

## Churches

| Method | Path | Permission | API handler | Client call(s) | Fields and response | Status |
|---|---|---|---|---|---|---|
| GET | `/churches` | read:member | `churches/churches.controller.ts:76` | `web/actions/church.ts:6`<br>`web/app/setup/page.tsx:30` | Setup page reads array length (`apps/web/app/setup/page.tsx:35`). | OK |
| POST | `/churches` | manage:churches | `churches/churches.controller.ts:46` | `web/actions/church.ts:38` | Path and method verified; fields not re-checked. | OK (fields not checked) |
| DELETE | `/churches/:id` | manage:churches | `churches/churches.controller.ts:110` | `web/actions/church.ts:56` | Path and method verified; fields not re-checked. | OK (fields not checked) |
| GET | `/churches/:id` | read:member | `churches/churches.controller.ts:85` | `web/actions/church.ts:11`<br>`mobile/app/(member)/church.tsx:10` | Mobile reads the church object (`church.tsx`); fields not re-checked. | OK (fields not checked) |
| PUT | `/churches/:id` | manage:churches | `churches/churches.controller.ts:98` | `web/actions/church.ts:52` | Path and method verified; fields not re-checked. | OK (fields not checked) |

## Zones

| Method | Path | Permission | API handler | Client call(s) | Fields and response | Status |
|---|---|---|---|---|---|---|
| GET | `/zones` | manage:zones | `zones/zones.controller.ts:43` | `web/actions/zone.ts:9` | Path and method verified; fields not re-checked. | OK (fields not checked) |
| POST | `/zones` | manage:zones | `zones/zones.controller.ts:29` | `web/actions/zone.ts:69` | Path and method verified; fields not re-checked. | OK (fields not checked) |
| DELETE | `/zones/:id` | manage:zones | `zones/zones.controller.ts:100` | `web/actions/zone.ts:119` | Path and method verified; fields not re-checked. | OK (fields not checked) |
| GET | `/zones/:id` | manage:zones | `zones/zones.controller.ts:74` | `web/actions/zone.ts:24` | Path and method verified; fields not re-checked. | OK (fields not checked) |
| PUT | `/zones/:id` | manage:zones | `zones/zones.controller.ts:87` | `web/actions/zone.ts:101` | Path and method verified; fields not re-checked. | OK (fields not checked) |
| GET | `/zones/:id/members` | manage:zones | `zones/zones.controller.ts:110` | `web/actions/zone.ts:42` | Response not re-checked. | OK (fields not checked) |
| POST | `/zones/:id/members` | manage:zones | `zones/zones.controller.ts:119` | `web/actions/zone.ts:74`<br>`web/actions/zone.ts:149` | Body `memberId`, `isLeader` (`zones.controller.ts:119-124`). Client `zone.ts:74`, `zone.ts:149` match. | OK |
| DELETE | `/zones/:id/members/:memberId` | manage:zones | `zones/zones.controller.ts:137` | `web/actions/zone.ts:187` | Path and method verified; fields not re-checked. | OK (fields not checked) |
| GET | `/zones/:id/stats` | manage:zones | `zones/zones.controller.ts:168` | `web/actions/zone.ts:202` | Path and method verified; fields not re-checked. | OK (fields not checked) |

## Departments

| Method | Path | Permission | API handler | Client call(s) | Fields and response | Status |
|---|---|---|---|---|---|---|
| GET | `/departments` | read:department | `departments/departments.controller.ts:48` | `web/actions/department.ts:9` | Path and method verified; fields not re-checked. | OK (fields not checked) |
| POST | `/departments` | manage:departments | `departments/departments.controller.ts:33` | `web/actions/department.ts:67` | Path and method verified; fields not re-checked. | OK (fields not checked) |
| DELETE | `/departments/:id` | manage:departments | `departments/departments.controller.ts:98` | `web/actions/department.ts:104` | Path and method verified; fields not re-checked. | OK (fields not checked) |
| GET | `/departments/:id` | read:department | `departments/departments.controller.ts:72` | `web/actions/department.ts:24` | Path and method verified; fields not re-checked. | OK (fields not checked) |
| PUT | `/departments/:id` | manage:departments | `departments/departments.controller.ts:85` | `web/actions/department.ts:86` | Path and method verified; fields not re-checked. | OK (fields not checked) |
| POST | `/departments/:id/leaders` | manage:departments | `departments/departments.controller.ts:149` | `web/actions/department.ts:169` | Body `memberId` (`departments.controller.ts:149-155`). Client `department.ts:169` matches. | OK |
| DELETE | `/departments/:id/leaders/:memberId` | manage:departments | `departments/departments.controller.ts:166` | `web/actions/department.ts:193` | Path and method verified; fields not re-checked. | OK (fields not checked) |
| GET | `/departments/:id/members` | read:department | `departments/departments.controller.ts:108` | `web/actions/department.ts:42` | Path and method verified; fields not re-checked. | OK (fields not checked) |
| POST | `/departments/:id/members` | manage:departments | `departments/departments.controller.ts:117` | `web/actions/department.ts:124` | Path and method verified; fields not re-checked. | OK (fields not checked) |
| DELETE | `/departments/:id/members/:memberId` | manage:departments | `departments/departments.controller.ts:135` | `web/actions/department.ts:150` | Path and method verified; fields not re-checked. | OK (fields not checked) |
| GET | `/departments/:id/stats` | read:department | `departments/departments.controller.ts:180` | `web/actions/department.ts:210` | Path and method verified; fields not re-checked. | OK (fields not checked) |

## Visitors

| Method | Path | Permission | API handler | Client call(s) | Fields and response | Status |
|---|---|---|---|---|---|---|
| GET | `/visitors` | view:visitors | `visitors/visitors.controller.ts:52` | `web/actions/visitor.ts:8` | Path and method verified; fields not re-checked. | OK (fields not checked) |
| POST | `/visitors` | create:visitor | `visitors/visitors.controller.ts:34` | `web/actions/visitor.ts:36` | Body is `CreateVisitorDto` (class, validated; `create-visitor.dto.ts:34-83`). Client fields `churchId`, `firstName`, `lastName`, `email`, `phone`, `visitDate`, `visitorSource` are all declared: match. | OK |
| DELETE | `/visitors/:id` | update:visitor | `visitors/visitors.controller.ts:110` | `web/actions/visitor.ts:67` | Path and method verified; fields not re-checked. | OK (fields not checked) |
| GET | `/visitors/:id` | view:visitors | `visitors/visitors.controller.ts:84` | `web/actions/visitor.ts:19` | Path and method verified; fields not re-checked. | OK (fields not checked) |
| POST | `/visitors/:id/convert` | update:visitor | `visitors/visitors.controller.ts:120` | `web/actions/visitor.ts:56` | Client sends `churchId` and `zoneId` (`visitor.ts:56-59`). `ConvertVisitorToMemberDto` declares only `zoneId` (`convert-visitor-to-member.dto.ts:10-16`). Global ValidationPipe with `whitelist` and `forbidNonWhitelisted` (`main.ts:62-66`) rejects `churchId` with 400 `property churchId should not exist`. Reproduced by running the pipe on the client-shaped body. Caller: `apps/web/components/visitor/table/visitor-table.tsx:36`. | MISMATCH |
| POST | `/visitors/:id/followup` | create:visitation | `visitors/visitors.controller.ts:137` | `web/actions/visitor.ts:47` | Client sends `churchId`, `visitorId`, `followupDate`, `notes`, `status` (`visitor.ts:47-49`). `CreateVisitorFollowupDto` declares `status`, `notes`, `followupDate`, `completedBy` (`visitor-followup.dto.ts:20-48`); `churchId` and `visitorId` get 400 from the pipe (reproduced). No UI caller found for this action. | MISMATCH |

## Families and family lifecycle

| Method | Path | Permission | API handler | Client call(s) | Fields and response | Status |
|---|---|---|---|---|---|---|
| GET | `/families` | view:families | `families/families.controller.ts:59` | `web/actions/family.ts:8` | Path and method verified; fields not re-checked. | OK (fields not checked) |
| POST | `/families` | manage:families | `families/families.controller.ts:45` | `web/actions/family.ts:21` | Path and method verified; fields not re-checked. | OK (fields not checked) |
| GET | `/families/me` | read:self | `families/families.controller.ts:32` | `web/actions/portal.ts:20` | Path and method verified; fields not re-checked. | OK (fields not checked) |
| GET | `/family-lifecycle/dashboard` | view:lifecycle-dashboard | `family-lifecycle/family-lifecycle.controller.ts:69` | `web/actions/family-lifecycle.ts:42` | Path and method verified; fields not re-checked. | OK (fields not checked) |
| GET | `/family-lifecycle/milestones` | view:lifecycle-dashboard | `family-lifecycle/family-lifecycle.controller.ts:50` | `web/actions/family-lifecycle.ts:30` | Query `from`, `to` (`family-lifecycle.controller.ts:52`). Client matches. | OK |
| POST | `/family-lifecycle/milestones` | manage:lifecycle-rules | `family-lifecycle/family-lifecycle.controller.ts:43` | `web/actions/family-lifecycle.ts:26` | Path and method verified; fields not re-checked. | OK (fields not checked) |
| GET | `/family-lifecycle/relationships` | view:families | `family-lifecycle/family-lifecycle.controller.ts:25` | `web/actions/family-lifecycle.ts:14` | Query `familyId` (`family-lifecycle.controller.ts:27`). Client `family-lifecycle.ts:14` matches. | OK |
| POST | `/family-lifecycle/relationships` | manage:families | `family-lifecycle/family-lifecycle.controller.ts:12` | `web/actions/family-lifecycle.ts:6` | Path and method verified; fields not re-checked. | OK (fields not checked) |
| DELETE | `/family-lifecycle/relationships/:id` | manage:families | `family-lifecycle/family-lifecycle.controller.ts:19` | `web/actions/family-lifecycle.ts:10` | Path and method verified; fields not re-checked. | OK (fields not checked) |
| GET | `/family-lifecycle/rules` | view:lifecycle-dashboard | `family-lifecycle/family-lifecycle.controller.ts:37` | `web/actions/family-lifecycle.ts:22` | Path and method verified; fields not re-checked. | OK (fields not checked) |
| POST | `/family-lifecycle/rules` | manage:lifecycle-rules | `family-lifecycle/family-lifecycle.controller.ts:31` | `web/actions/family-lifecycle.ts:18` | Path and method verified; fields not re-checked. | OK (fields not checked) |
| GET | `/family-lifecycle/suggestions` | view:lifecycle-dashboard | `family-lifecycle/family-lifecycle.controller.ts:56` | `web/actions/family-lifecycle.ts:34` | Path and method verified; fields not re-checked. | OK (fields not checked) |
| POST | `/family-lifecycle/suggestions/:id/resolve` | manage:families | `family-lifecycle/family-lifecycle.controller.ts:62` | `web/actions/family-lifecycle.ts:38` | Path and method verified; fields not re-checked. | OK (fields not checked) |

## Offerings and giving goals

| Method | Path | Permission | API handler | Client call(s) | Fields and response | Status |
|---|---|---|---|---|---|---|
| GET | `/giving-goals` | manage:giving-goals | `offerings/giving-goals.controller.ts:69` | `web/actions/giving-goal.ts:23` | Path and method verified; fields not re-checked. | OK (fields not checked) |
| POST | `/giving-goals` | manage:giving-goals | `offerings/giving-goals.controller.ts:55` | `web/actions/giving-goal.ts:59` | Path and method verified; fields not re-checked. | OK (fields not checked) |
| DELETE | `/giving-goals/:id` | manage:giving-goals | `offerings/giving-goals.controller.ts:123` | `web/actions/giving-goal.ts:85` | Path and method verified; fields not re-checked. | OK (fields not checked) |
| GET | `/giving-goals/:id` | manage:giving-goals | `offerings/giving-goals.controller.ts:96` | `web/actions/giving-goal.ts:50` | Path and method verified; fields not re-checked. | OK (fields not checked) |
| PUT | `/giving-goals/:id` | manage:giving-goals | `offerings/giving-goals.controller.ts:109` | `web/actions/giving-goal.ts:74` | Path and method verified; fields not re-checked. | OK (fields not checked) |
| GET | `/giving-goals/:id/offerings` | manage:offerings | `offerings/giving-goals.controller.ts:140` | `web/actions/giving-goal.ts:96` | Path and method verified; fields not re-checked. | OK (fields not checked) |
| GET | `/giving-goals/public` | view:giving-goals | `offerings/giving-goals.controller.ts:83` | `web/actions/giving-goal.ts:37` | Path and method verified; fields not re-checked. | OK (fields not checked) |
| GET | `/offering-categories` | manage:offerings | `offerings/offerings.controller.ts:51` | `web/actions/offering.ts:12` | Path and method verified; fields not re-checked. | OK (fields not checked) |
| POST | `/offering-categories` | manage:offerings | `offerings/offerings.controller.ts:37` | `web/actions/offering.ts:38` | Path and method verified; fields not re-checked. | OK (fields not checked) |
| DELETE | `/offering-categories/:id` | manage:offerings | `offerings/offerings.controller.ts:81` | `web/actions/offering.ts:64` | Path and method verified; fields not re-checked. | OK (fields not checked) |
| PUT | `/offering-categories/:id` | manage:offerings | `offerings/offerings.controller.ts:64` | `web/actions/offering.ts:53` | Path and method verified; fields not re-checked. | OK (fields not checked) |
| GET | `/offering-categories/{id}` | n/a | none | `web/actions/offering.ts:25` | No route. `offerings.controller.ts` declares GET list (`:51`) only for `/offering-categories`; no `:id` GET. Used by the category edit page (`apps/web/app/[churchId]/dashboard/offerings/categories/[id]/edit/page.tsx:13`), which will get a not-found response. | MISMATCH |
| GET | `/offerings` | manage:offerings | `offerings/offerings.controller.ts:165` | `web/actions/offering.ts:88` | Query `categoryId`, `memberId`, `sessionId`, `from`, `to`, `goalId`, `limit`, `offset` (`offerings.controller.ts:169-176`). | OK |
| POST | `/offerings` | manage:offerings | `offerings/offerings.controller.ts:142` | `web/actions/offering.ts:121` | Path and method verified; fields not re-checked. | OK (fields not checked) |
| DELETE | `/offerings/:id` | manage:offerings | `offerings/offerings.controller.ts:234` | `web/actions/offering.ts:157` | Path and method verified; fields not re-checked. | OK (fields not checked) |
| GET | `/offerings/:id` | manage:offerings | `offerings/offerings.controller.ts:198` | `web/actions/offering.ts:101` | Path and method verified; fields not re-checked. | OK (fields not checked) |
| PUT | `/offerings/:id` | manage:offerings | `offerings/offerings.controller.ts:211` | `web/actions/offering.ts:146` | Path and method verified; fields not re-checked. | OK (fields not checked) |
| GET | `/offerings/me` | read:own-giving-history | `offerings/offerings.controller.ts:105` | `web/actions/offering.ts:194` | Path and method verified; fields not re-checked. | OK (fields not checked) |
| GET | `/offerings/reports/summary` | view:giving-reports | `offerings/offerings.controller.ts:119` | `web/actions/offering.ts:177` | Query `groupBy`, `period?`, `from?`, `to?` (`offerings.controller.ts:123-126`). Client `offering.ts:177` matches. | OK |

## Data quality

| Method | Path | Permission | API handler | Client call(s) | Fields and response | Status |
|---|---|---|---|---|---|---|
| GET | `/data-quality/duplicates` | view:data-quality | `data-quality/data-quality.controller.ts:48` | `web/actions/data-quality.ts:26` | Path and method verified; fields not re-checked. | OK (fields not checked) |
| POST | `/data-quality/duplicates/:id/resolve` | manage:data-quality | `data-quality/data-quality.controller.ts:54` | `web/actions/data-quality.ts:30` | Path and method verified; fields not re-checked. | OK (fields not checked) |
| POST | `/data-quality/duplicates/refresh` | manage:data-quality | `data-quality/data-quality.controller.ts:42` | `web/actions/data-quality.ts:22` | Path and method verified; fields not re-checked. | OK (fields not checked) |
| GET | `/data-quality/imports` | view:data-quality | `data-quality/data-quality.controller.ts:30` | `web/actions/data-quality.ts:14` | Path and method verified; fields not re-checked. | OK (fields not checked) |
| GET | `/data-quality/imports/:id` | view:data-quality | `data-quality/data-quality.controller.ts:36` | `web/actions/data-quality.ts:18` | Path and method verified; fields not re-checked. | OK (fields not checked) |
| POST | `/data-quality/imports/:id/commit` | manage:data-quality | `data-quality/data-quality.controller.ts:21` | `web/actions/data-quality.ts:10` | Path and method verified; fields not re-checked. | OK (fields not checked) |
| POST | `/data-quality/imports/preview` | manage:data-quality | `data-quality/data-quality.controller.ts:12` | `web/actions/data-quality.ts:6` | Path and method verified; fields not re-checked. | OK (fields not checked) |


## Not verified

- Fields for rows marked "not re-checked" (most write bodies and response shapes beyond those listed above). Path, method and permission were verified for every row.
- Web `apps/web/lib/api/apiBase.ts` (default `http://localhost:8871/api/v1`) has no importers, so it is not a live client path. `apps/web/actions/auth.ts` and `apps/web/app/auth/signin/page.tsx` use `API_BASE_URL` / `NEXT_PUBLIC_API_BASE_URL` without a `/api/v1` suffix; the deployed values were not checked.
- Runtime behavior was not exercised against a running server, except the two ValidationPipe runs for M4 and M5 (DTO classes plus the global pipe options, run in isolation).

## Report metric definitions (DEC-04)

Each figure shown in the web Reports must come from the query behind one of these endpoints. A metric without a verified source is not shown. Definitions match the code, and the web pages repeat them (`apps/web/lib/report-catalog.ts`).

| Report | Endpoint | Definition |
|---|---|---|
| Attendance trends | `GET /attendance/trends` (`view:attendance`) | Check-ins per zone, gender or age band for a date range. Total check-ins are check-in records for sessions dated in the range. Unique members and sessions are distinct within each group. Avg per session is total check-ins divided by sessions. Zone groups members by their zone, `unassigned` when none; a member in several zones is counted in each zone (removed zone links are ignored). The API also accepts `branch`, which groups by zone; the web does not offer it. |
| Giving summary | `GET /offerings/reports/summary` (`view:giving-reports`) | Sum of non-deleted offerings by category, or by week, month or year of offering date. Always split by currency. |
