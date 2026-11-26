# Mobile API inventory

Current correction baseline: `81de7d2` (2026-11-26). Paths are API paths (no global prefix); route presence does not certify live behavior. This correction supersedes original M1 absence/status claims retained below.

- `POST /auth/refresh` now uses `rotateRefreshToken`: stored token families, atomic consumption, reuse detection and a grace race response exist (`auth.service.ts:327–379`). Access-token strategy rejects refresh tokens. Logout revokes all sessions. Mobile resilience defects are R-MOB-01; do not report rotation as missing.
- `GET /auth/memberships` exists; `POST /auth/switch-church` verifies active membership. The active global guard is `apps/api/src/auth/guards/church-context.guard.ts`. Its super-admin exception and publicly reachable provisioning/OAuth trust are the concrete R-SEC-01/02 findings; ordinary member isolation is not generally disproved.
- Dashboard API and native dashboard calls exist. `totalMembers`, `activeZones`, and permission-gated `pendingVisitors` are implemented; `recentActivities` stays excluded by DEC-15.
- Durable document CRUD, branch-scoped member library and signed URLs exist. Both clients have local library search; absence of a search endpoint alone is not a broken current search flow. Network-shared catalogue/resource/media/progress expansion belongs to R-LIB-01/R-CNT-01.
- Native uses SecureStore. Native browser reading is accepted; no missing-WebView prerequisite. AI chat/feedback/retention exist; provider activation/live tests remain deferred.
- Current [API contracts](api-contracts.md), [AI API](ai-api.md), [remediation plan](../remediation-plan.md) and owning remediation specs supersede older inventory status. Verify line anchors before implementation.

## Historical M1 inventory

The original inventory below is retained for provenance. Its old line anchors and “not implemented/missing” assertions describe that checkpoint only, not current scope or runtime status.

## 1. Native session contract

| Route | Guard / request | Response and notes |
|---|---|---|
| `POST /auth/register` | `@Public`; JSON `{name?, email?, password?}`; password must be 12+ chars | `{accessToken, refreshToken, user}` from `authResponse` (`apps/api/src/auth/auth.controller.ts:27-32`, `apps/api/src/auth/auth.service.ts:79-108`). |
| `POST /auth/login` | `@Public`; JSON `{email?, password?}` | Same token/user shape; invalid credentials return 401 (`apps/api/src/auth/auth.controller.ts:34-39`, `apps/api/src/auth/auth.service.ts:98-108`). |
| `POST /auth/refresh` | `@Public`; JSON body field `refreshToken`; controller manually verifies it (no `JwtRefreshGuard`) | Returns `{accessToken, refreshToken}`. `JwtRefreshStrategy` also extracts `refreshToken` from the body (`apps/api/src/auth/auth.controller.ts:41-80`, `apps/api/src/auth/strategies/jwt-refresh.strategy.ts:20-32`). Global responses are wrapped as `{success,message,data,...}` (`apps/api/src/common/interceptors/response.interceptor.ts:64-73`). |
| `POST /auth/logout` | `JwtAuthGuard` plus `read:self`; bearer access token | `{success:true,message:'Logged out successfully'}`; increments `users.tokenVersion`, revoking all existing access and refresh tokens (`apps/api/src/auth/auth.controller.ts:173-205`, `apps/api/src/auth/auth.service.ts:249-257`). |

Tokens carry `tv`; both JWT strategies reject a token whose `tv` differs from the user version (`apps/api/src/auth/strategies/jwt.strategy.ts:41-59`, `apps/api/src/auth/strategies/jwt-refresh.strategy.ts:40-64`). Refresh-token rotation is **not implemented**: refresh returns a newly signed pair, but does not invalidate the presented token. A stolen refresh token remains valid until logout/revocation or its 7-day expiry (`apps/api/src/auth/auth.service.ts:133-144`, `apps/api/src/auth/auth.service.ts:260-281`).

## 2. Church and membership context

| Concern | Verified behavior |
|---|---|
| Context input | The active guard used by controllers is `apps/api/src/auth/guards/church-context.guard.ts` (the requested `apps/api/src/church-context/church-context.guard.ts` path does not exist). It selects `params.churchId`, `/churches/:id`, query `churchId`, then body `churchId`, then authenticated `user.churchId` (`apps/api/src/auth/guards/church-context.guard.ts:29-49`). |
| Enforcement | It loads the requested membership, rejects suspended/invited/non-member users, and writes `request.churchId` plus active membership fields (`apps/api/src/auth/guards/church-context.guard.ts:78-117`). |
| Multiple memberships | A member can select an authorized active church by calling `POST /auth/switch-church` with `{churchId}`; the endpoint verifies membership and returns a new token pair (`apps/api/src/auth/auth.controller.ts:208-224`, `apps/api/src/auth/auth.service.ts:223-246`). There is no dedicated membership-list controller route found; the client needs a known/obtained church ID. |

## 3. Member portal routes

| Area | Method and path | Permission / source |
|---|---|---|
| Home | `GET /members/me` | `read:self` (`apps/api/src/members/members.controller.ts:99-106`; called by `apps/web/actions/portal.ts:9-15`). |
| Home | `GET /families/me` | `read:self` (`apps/api/src/families/families.controller.ts:30-35`; `apps/web/actions/portal.ts:18-24`). |
| Home | `GET /attendance/me/checkins` | `view:attendance` (`apps/api/src/attendance/attendance.controller.ts:29-35`; `apps/web/actions/portal.ts:27-35`). |
| Home | `GET /communications/announcements` | `view:communications` (`apps/api/src/communications/communications.controller.ts:103-108`; `apps/web/actions/portal.ts:37-45`). |
| Church | `GET /churches/:id` | `read:member` (`apps/api/src/churches/churches.controller.ts:76-86`; `apps/web/actions/church.ts:10-13`). |
| Events | `GET /events`, `GET /events/:id` | `view:events` (`apps/api/src/events/events.controller.ts:81-113`; `apps/web/actions/event.ts:10-33`). |
| RSVP | `GET /events/me`, `PUT /events/:id/rsvp` | `rsvp:event` (`apps/api/src/events/events.controller.ts:41-54,171-190`; `apps/web/actions/event.ts:147-172`). |
| Prayer | `GET /prayer-requests/me` | `read:own-prayer-requests` (`apps/api/src/prayer/prayer.controller.ts:56-65`; `apps/web/actions/prayer.ts:9-17`). |
| Prayer | `POST /prayer-requests` | `create:prayer-request` (`apps/api/src/prayer/prayer.controller.ts:28-53`; `apps/web/actions/prayer.ts:19-21`). |
| Profile | `GET /users/me`, `PATCH /users/me` | `read:self`, `update:self` (`apps/api/src/users/users.controller.ts:28-42,87-99`). |
| Family | `GET /families` and `POST /families` | `view:families`, `manage:families`; web actions use them (`apps/api/src/families/families.controller.ts:57-67,43-52`; `apps/web/actions/family.ts:5-22`). These are staff-level permissions, not member self-service. |

## 4. Staff routes: Dashboard, People, Services, Content

| Area | Method and path | Permission / source |
|---|---|---|
| Dashboard | `GET /dashboard/stats` — implemented (DEC-01) | `read:member` (`apps/api/src/dashboard/dashboard.controller.ts:15`). Returns `{totalMembers, activeZones}` only. The web home page also reads `pendingVisitors` and `recentActivities`, which are not returned (`apps/web/app/[churchId]/dashboard/home/page.tsx:89,114`; see `api-contracts.md` M6). Mobile does not call it yet. |
| People | `GET /members`, `GET /members/search`, `GET /members/:id`, `PUT /members/:id`, `DELETE /members/:id` | `read:member`, `update:member`, `delete:member` (`apps/api/src/members/members.controller.ts:44-75,109-153`; `apps/web/actions/member.ts:77-135,158-186,188-207`). |
| People | `GET /members/:id/zones` | `read:member` (`apps/api/src/members/members.controller.ts:157-163`; `apps/web/actions/member.ts:137-155`). |
| Services | `GET/POST /attendance/service-types`, `PATCH /attendance/service-types/:id` | `view:attendance`, `manage:services` (`apps/api/src/attendance/attendance.controller.ts:41-61`; `apps/web/actions/attendance.ts:5-15`). |
| Services | `GET/POST /attendance/sessions`, `PATCH /attendance/sessions/:id/status` | `view:attendance`, `manage:services` (`apps/api/src/attendance/attendance.controller.ts:63-83`; `apps/web/actions/attendance.ts:17-27`). |
| Content | `GET /communications/announcements` | `view:communications` (`apps/api/src/communications/communications.controller.ts:103-108`). |
| Content | `GET/POST /communications/templates`, `PATCH /communications/templates/:id`, `POST /communications/templates/preview` | `view:communications`, `manage:communications` (`apps/api/src/communications/communications.controller.ts:12-46`; `apps/web/actions/communications.ts:5-19`). |
| Content | `GET/POST /communications/campaigns`, `GET/PUT /communications/campaigns/:id`, schedule/send/cancel | `view:communications`, `manage:communications`, `send:communications` (`apps/api/src/communications/communications.controller.ts:49-125`; `apps/web/actions/communications.ts:21-64`). |

## 5. Documents and library

| Capability | Status |
|---|---|
| Authenticated upload | `POST /api/files/upload`, `manage:files`, multipart `file` plus metadata; implemented through S3 upload (`apps/api/src/file-upload/file-upload.controller.ts:56,135-209`; `apps/api/src/file-upload/file-upload.service.ts:112-165`). |
| Document metadata list/update/delete | Routes exist and persist: `GET /api/files/user` (`file-upload.controller.ts:400`, `getUserDocuments` queries `documents`, church-scoped and soft-delete filtered, `file-upload.service.ts:330-346`), `PATCH /api/files/:id` (`:464`, Drizzle update, `file-upload.service.ts:403-439`), `DELETE /api/files/:id` (`:500`, sets `deletedAt`, `file-upload.service.ts:442-455`). All `manage:files`. |
| Library catalog and download | Implemented: `GET /api/files/library` (`file-upload.controller.ts:429`, `read:self`, visible-to-members documents only, `file-upload.service.ts:349-367`) and `GET /api/files/library/:id/download-url` (`:445`, signed URL, `file-upload.service.ts:369-400`). **MISSING**: library search, detail, read and progress endpoints. |

## 6. Risks for mobile

| Risk | Evidence / implication |
|---|---|
| Token storage | Native must keep access and especially refresh tokens in OS secure storage; do not use plaintext files, logs, or ordinary preferences. Logout revokes all tokens, but a stolen refresh token remains usable until then/expiry. |
| CORS and typed client | `enableCors` uses configured web origins and allowed headers (`apps/api/src/main.ts:74-80`; defaults are localhost web URLs at `apps/api/src/config/index.ts:136-140`). Native requests normally omit `Origin`; this code has no explicit missing-Origin rejection, so CORS should not reject them. Swagger/OpenAPI is generated and served at `/docs` (`apps/api/src/main.ts:48-58,72-87`), suitable for typed-client generation after contract gaps are resolved. |

Missing endpoint count: **4 named capabilities** (library search, detail, read and progress). Dashboard stats is implemented; its `pendingVisitors` and `recentActivities` fields are not served (DEC-01, `api-contracts.md` M6).
