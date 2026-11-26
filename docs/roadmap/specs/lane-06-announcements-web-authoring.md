# Lane 06: announcements-web-authoring

- **Waves:** 1 (RM-058 redirect fix, small), 2 (editor and workflow).
- **Backlog IDs:** RM-058 (W1); RM-075, RM-076 (W2).
- **Decisions:** D-03 (`doc_v1` document JSON, Tiptap), D-05 (approval setting), D-16 (audience), D-19 (PROD channels stay off until legal sign-off).
- **Depends on:** lane 05 contract merged (RM-070, RM-074) for the editor; lane 03 permission names; Tiptap packages in the Wave 1 dependency batch; lane 12 namespace stub `messages/announcements-web.ts`.
- **Blocks:** nothing critical; web portal feed (lane 14, RM-077) consumes the same API.
- **Model:** Luna medium; RM-075 is L: split into brief B1 (list, editor, save draft), B2 (images, preview), B3 (audience, channels, scheduling, approval, result page).

## Goal

Staff holding `publish:announcements` write, preview, schedule and publish long announcements with images from the dashboard, choose channels and audience, and see exactly who will and will not receive each channel.

## Owned files (exclusive)

```
apps/web/app/[churchId]/dashboard/communications/**
apps/web/actions/communications.ts, apps/web/actions/announcements.ts   (new)
apps/web/components/communications/**   (new)
apps/web/lib/announcements/**   (new: doc_v1 types, validator, Tiptap config, renderer)
packages/config/src/i18n/messages/announcements-web.ts   (new, pre-registered by lane 12)
apps/web/tests/announcements-*.test.ts, apps/web/tests/communications-*.test.ts   (new)
```

Not owned: `apps/web/actions/portal.ts` and portal pages (lane 14), `apps/web/components/ui/**` (lane 13, consume only), the API (lane 05).

## Tasks (in order)

### Wave 1

1. **RM-058** Server actions call `redirect()` inside `try`, so the success redirect is caught and replaced by an error redirect (`communications/campaigns/new/page.tsx:52-55`; `campaigns/[campaignId]/page.tsx:42-48,58-64,74-80`): on success staff see an error and a retry can create a duplicate. Move `redirect()` after the `try/catch` (or rethrow `NEXT_REDIRECT`). Replace silent `.catch(() => [])` on templates and campaign lists with an `unavailable` state and retry (WD-24). Add action tests with a mocked `redirect` that throws `NEXT_REDIRECT`. (Attendance check-in has the same bug: lane 14, RM-059.)

### Wave 2

2. **RM-075 list and editor.** Pages `communications/announcements/{page,new,[id]}` behind `publish:announcements` (nav entry hidden otherwise; layout redirects to the forbidden state). List with status filter (draft, pending approval, approved, scheduled, sent, failed). Editor: Tiptap restricted to the `doc_v1` allow-list (paragraph, heading 2-3, bold, italic, https links, lists, blockquote, image); toolbar with visible labels in English and Swahili; title (120 chars) and long body (20 000 chars) with counters; save draft explicitly and autosave every 30 s; failed save keeps the text.
3. **Images.** Insert image: ensure a draft exists (create on first insert), upload through `POST /announcements/:id/attachments`, insert an `image` node with `attachmentId` and required `alt` text; client check type and size (jpeg, png, webp, 5 MB) before upload.
4. **Preview.** Tabs In-app, Email, SMS using a web `DocRenderer` that mirrors the mobile renderer (same allow-list); SMS tab shows the text, encoding and segment count from `GET /announcements/:id/readiness`.
5. **Audience and channels.** Audience: all members or chips by zone, gender, marital status (pickers fed by the zones API and fixed enums). Channels: in-app (always available), email, SMS with per-channel readiness (eligible, skipped: no account, unverified, opted out) and a warning when the SMS or email count is lower than the audience.
6. **RM-076 scheduling.** Send now or schedule; date and time pickers convert to an ISO string with an explicit `+03:00` offset (East Africa Time) and display the timezone label; never send a bare `datetime-local` string (`campaigns/new/page.tsx:94`, WD-07). Publish asks for confirmation with per-channel recipient counts and sends `Idempotency-Key` (uuid generated when the dialog opens).
7. **Approval and result.** When the church setting `requireApproval` is on: Submit for approval, pending list for holders of `approve:announcements`, Approve (disabled for the author with an explanation). Result page shows per-channel accepted, delivered, failed and skipped counts from the manage detail `stats`.

## Contracts consumed (from lane 05; all PROPOSED)

`POST /announcements`, `PATCH /announcements/:id`, `POST /announcements/:id/{submit,approve,publish,cancel}`, `GET /announcements/manage[/:id]`, `GET /announcements/:id/readiness`, `GET|PUT /announcements/settings`, `POST|DELETE /announcements/:id/attachments`. Required additions to confirm with lane 05: `readiness` returns `{ audienceTotal, inApp, email: { eligible, skipped: { no_account, unverified, opted_out } }, sms: { eligible, skipped, encoding, segments, characters } }`; manage detail returns `stats` per channel `{ accepted, delivered, failed, skipped }`.

Web types (`lib/announcements/types.ts`):

```ts
type DocNode = { type: string; attrs?: Record<string, unknown>; content?: DocNode[]; text?: string; marks?: { type: 'bold' | 'italic' | 'link'; attrs?: { href: string } }[] }
type AnnouncementDraft = { title: string; bodyFormat: 'doc_v1'; body: DocNode; channels: ('in_app'|'sms'|'email')[]; audience: { allMembers: boolean; zoneIds: string[]; genders: string[]; maritalStatuses: string[] }; smsBody?: string; publishAt?: string; expiresAt?: string }
```

The validator in `lib/announcements/validate.ts` must reject anything outside the allow-list on the client too; the server remains the authority.

## Acceptance (testable)

- After a successful create, send or cancel there is no `err` query parameter and no duplicate record (unit test of the action wrappers).
- A user without `publish:announcements` cannot open the pages (denied state, no data fetched).
- Tiptap output containing a disallowed node or `javascript:` link is rejected by the validator before the request is sent.
- Image inserted with no alt text cannot be saved; oversized or non-image files are refused with a translated message.
- A scheduled time of 2026-12-01 09:00 EAT is sent as `2026-12-01T09:00:00+03:00` and reads back as 09:00 EAT.
- Publish dialog shows per-channel recipient counts; unverified or opted-out users are not counted as eligible.
- With approval on, the author's Approve button is disabled and the API 403 `SELF_APPROVAL_FORBIDDEN` is shown translated.
- All visible strings exist in `en` and `sw`; keyboard-only completion of draft, preview, schedule works; inputs have visible labels.

## Test plan (targeted)

`pnpm --filter web test` for `tests/announcements-*.test.ts` and `tests/communications-*.test.ts` only (validator, serializer, schedule conversion, action redirect). One final `pnpm --filter web type-check`. After i18n edits run `pnpm --filter @church/config build`. DEV manual: one draft with an image, preview, publish to in-app only (owner OK for the session).

## Risks

- Tiptap output shape can drift from the server schema: keep one allow-list file in `lib/announcements/` and test it against the sample in lane 05's contract.
- Large Tiptap bundle on dashboard pages: load the editor dynamically on the editor route only.
- Mixing `server action` redirects and client state (the WD-03 class of bug): follow the pattern from RM-058 everywhere in this lane.
- Staff may expect SMS to reach everyone; the readiness panel must state why counts differ.

## Agent brief (B1: RM-058 now; later briefs reuse the header)

```
ROLE: build agent, lane 06 announcements-web-authoring, brief for RM-058 (Wave 1). Leaf worker: start no subagents.
REPO: /Users/upstairs/Personal/builds/church/church-management-system  BRANCH: design/mito-ya-baraka-concepts (stay on it)
READ FIRST: docs/roadmap/README.md (ground rules), docs/roadmap/specs/lane-06-announcements-web-authoring.md task 1, docs/roadmap/audits/web-dashboard.md WD-03, WD-24.
OWN (may edit): apps/web/app/[churchId]/dashboard/communications/**, apps/web/actions/communications.ts, apps/web/components/communications/**, apps/web/tests/communications-*.test.ts (new).
DO NOT TOUCH: any other web file (attendance check-in is lane 14), apps/api, packages, package.json, lockfile.
RULES: no commits/push; no pnpm add; no deploys.
GOAL: a successful server action must not turn into an error redirect, and failed list loads must not look like empty lists.
STEPS:
1. Verify the pattern in communications/campaigns/new/page.tsx:52-55 and campaigns/[campaignId]/page.tsx:42-48,58-64,74-80 (redirect() inside try/catch).
2. Fix each action: perform the API call inside try/catch, store the result, call redirect() after the block (or rethrow errors whose digest starts with NEXT_REDIRECT). Keep the error path redirect with the same query shape.
3. Replace .catch(() => []) on templates/campaign list loaders with an unavailable result and render a retry message (pattern already in apps/web/actions/member.ts:94-97, read only).
4. Add tests in apps/web/tests/communications-actions.test.ts using a mocked redirect that throws an error with digest NEXT_REDIRECT: success path must not reach the error redirect; failure path does.
5. grep the communications directory for any other redirect() inside try and fix those too; list files changed.
VERIFY: pnpm --filter web test (only tests/communications-*.test.ts); ONE pnpm --filter web type-check.
REPORT (max 15 lines): files changed; RM IDs done/partial; tests run/skipped; requests to lane 14 (attendance/check-in has the same bug, RM-059); open risks.
```

Briefs B2 (editor, tasks 2-3), B3 (preview, tasks 4-5), B4 (schedule, approval, result, tasks 6-7) reuse this header with the matching tasks and the contracts above.
