# Lane 08: announcements-mobile-reader (and member content screens)

Also owns the other read-mostly member screens: Events, Church, Library (they share the renderer, list and state patterns).

- **Waves:** 2 (RM-078, 079, 088 screens, 094, 096), 3 (RM-140, RM-141, RM-124 library part).
- **Backlog IDs:** RM-078, RM-079, RM-088 (screen part), RM-094, RM-096; RM-124 (library), RM-128 (events strings, with lane 12), RM-140, RM-141.
- **Decisions:** D-03 (`doc_v1`), D-16 (audience), D-20 (Events tab), D-22 (service times), D-26 (giving read-only), D-32.
- **Depends on:** lane 07 RM-010 merged (new paths) and RM-088 tab move; lane 05 RM-070 (announcement API) and RM-074 (images); lane 01 RM-004 (published-only events, ordering); lane 02 RM-008 (library open works on DEV) and RM-007 (`STORAGE_NOT_CONFIGURED`); lane 03 RM-095 (service times) for RM-094; lane 12 namespaces.
- **Blocks:** nothing downstream except device acceptance.
- **Model:** Luna medium; split brief A (announcements list, detail, renderer), B (events and library), C (church screen).

## Goal

Members read full announcements (long text, formatting, images, in their language) from Home or a list, and use Events, Church and Library screens that are bounded, fast on low-end phones, honest when offline, and free of raw server text.

## Owned files (exclusive)

```
apps/mobile/app/(member)/announcements/**       (new: index.tsx, [id].tsx)
apps/mobile/app/(member)/(tabs)/church.tsx, (tabs)/library.tsx, (tabs)/events.tsx   (after lane 07 moves)
apps/mobile/app/(member)/events/[id].tsx, library-catalog.tsx, library-detail.tsx
apps/mobile/components/{announcements/**, content/** (new: rich-text renderer), events/**, church/** (new), library-media.tsx}
apps/mobile/lib/{announcements-api.ts (new), library-api.ts, events-api.ts (new)}
apps/mobile/tests/{announcements,rich-text,events,library,church}-*.test.ts   (new)
packages/config/src/i18n/messages/announcements-mobile.ts, member-content.ts   (new, pre-registered by lane 12)
```

Not owned: `components/home/**` (lane 07 makes the card pressable and routes here), `lib/api.ts`, `lib/query-cache.ts`, `lib/error-messages.ts` (lane 07, consume), `components/ui/**` (lane 13).

## Tasks (in order)

1. **RM-078 list.** `app/(member)/announcements/index.tsx`: `FlatList`, `GET /announcements?limit=20&cursor=`, pull to refresh, load more, unread dot (item `read:false`), empty and error states with retry, last-good content from the shared cache when offline. Rows: title, date (locale formatter from `@church/config`), two-line excerpt, image badge. Row is one pressable with an accessibility label including unread state.
2. **RM-078 detail and renderer.** `announcements/[id].tsx` loads `GET /announcements/:id` and renders `body` (`doc_v1`) with `components/content/rich-text.tsx`, a native recursive renderer: paragraph, heading (2-3), bullet and ordered lists, blockquote, bold, italic, link, image. No WebView, no HTML parsing. Blocks render in a `FlatList` so long content stays smooth on 2 GB phones. Images: `expo-image` (not installed today: add it to the Wave 1 dependency batch; fall back to RN `Image` if absent) with fixed aspect placeholder, `alt` as accessibility label, lazy load, failure shows a neutral box; signed URLs expire in 15 minutes so refetch the detail on error. Links: `https:` only (reject `javascript:`, `intent:`, others); external links ask for confirmation, then open in the device browser (MM-33). Legacy rows: `bodyFormat: "plain"` or a string `body` render as paragraphs; strip entity-encoded markup (replaces `plainText` in `index.tsx:30-33`). On mount `POST /announcements/:id/read` (fire and forget). Title wraps (no line limit); back goes to the list or Home.
3. **RM-079 hardening tests.** Unknown node types and marks are skipped, never crash; depth over 6 truncated; link with `javascript:` or `data:` renders as plain text; image without URL is hidden; script-like text is just text; 200% font scale snapshot of structure (no clipped headings).
4. **RM-088 Events screens.** After lane 07 moves `events.tsx` into `(tabs)/`: request `from=today&status=published&limit=50` (server orders by `startsAt`, RM-004); render with `FlatList` (`events.tsx:85` is a `ScrollView`); services use a bounded date window; RSVP state read once per screen from the shared cache (MM-36, avoid per-detail full download); RSVP failure keeps the chosen status with Retry; move the 13 inline `copy()` calls (`events.tsx:72,81,88`, `events/[id].tsx:75,84`, `model.ts:86,97,100`, `format.ts:90-95`) into `member-content.ts` keys (RM-128); Swahili day-period words and no English AM/PM (MM-25) via lane 12's formatter helper.
5. **RM-096 Library.** Library tab uses the catalogue (`GET /library/resources?query&cursor`, existing) instead of `/api/files/library` (MM-37): server-side search (title, author, description), cursor paging, one list component; open uses `POST /library/resources/:id/access` then the device browser for `https:` URLs only; errors: `503 STORAGE_NOT_CONFIGURED` shows "temporarily unavailable, try later", 404 shows "not available to you", expired URL offers Retry (MM-38).
6. **RM-094 Church screen.** Call (`tel:` only for a valid number) and Directions (platform maps URL built from `location`) rows from `GET /churches/:id` (`phone`, `location`); service times from structured fields (RM-095, D-22), never parsed from names; remove the string-equality hiding of the placeholder About (`church.tsx:17,102`): use the server flag or null (DX-37); keep the R-MOB-04 retry reset (`church.tsx:64-66`).

### Wave 3
7. **RM-140** read-only giving history and goals (`GET /offerings/me`, `GET /giving-goals/public`), no payment UI (D-26). **RM-124** accessibility labels on library rows including type and availability (`library-media.tsx:47`). **RM-141** family and ministries stay deferred (D-32).

## Contracts consumed (PROPOSED unless noted; owned by lane 05, 01, 03)

```ts
type AnnouncementListItem = { id: string; title: string; excerpt: string; publishedAt: string; hasImages: boolean; read: boolean }
type AnnouncementDetail = AnnouncementListItem & { bodyFormat: 'doc_v1' | 'plain'; body: DocNode | string; expiresAt: string | null }
// image nodes in body: { type: 'image', attrs: { attachmentId: string, alt: string, url: string /* signed, 15 min */, width?: number, height?: number } }
// GET /announcements?limit&cursor -> { data: { items: AnnouncementListItem[], nextCursor: string | null } }
// POST /announcements/:id/read -> 204
```

Existing: `GET /events`, `GET /events/me`, `PUT /events/:id/rsvp`, `GET /library/resources`, `POST /library/resources/:id/access`, `GET /churches/:id`, `GET /notifications`.

## Acceptance (testable)

- Tapping a Home announcement opens the full body; a 15 000-character body with 3 images scrolls without dropped frames on a low-end Android (about 2 GB RAM) and shows images after load.
- Renderer tests from task 3 pass; no WebView import anywhere in the lane (grep test).
- A member outside the audience or a draft id gets a "not available" state, not an error dump (API returns 404).
- Events list shows only published, ascending, at most 50; draft never visible; RSVP persists after reload; Swahili shows Swahili day names and no AM/PM.
- Library search matches title, author, description; non-`https` URL refused; storage-not-configured shows the "temporarily unavailable" copy.
- Church: Call opens the dialer only for a valid number; Directions opens maps; no placeholder text.
- In airplane mode the announcements list shows last-good content with the offline banner; all strings in `en` and `sw`; touch targets at least 44 px.

## Test plan (targeted)

`pnpm --filter mobile test` for `announcements-*`, `rich-text-*`, `events-*`, `library-*`, `church-*` tests only. One final `pnpm --filter mobile typecheck`. After i18n edits run `pnpm --filter @church/config build`. Device pass with `mobile.test@mitoyabarakachurch.org` on DEV (panel agent-device; Swahili locale; 360 dp). Test content: coordinator publishes two announcements with the staff.publisher account (one long with images) after RM-070 is on DEV. Skip API and web suites.

## Risks

- Contract drift with lane 05: freeze `doc_v1` allow-list in one shared fixture file used by both lanes' tests (copy the sample from lane 05's contract).
- Signed image URLs expire: refetch on image error, do not cache URLs beyond 10 minutes.
- Large images on 2G or 3G: request thumbnails if the API offers `width`, else cap displayed size.
- Library open on DEV depends on RM-008 (storage credentials).
- Events list shrinks after RM-004 (drafts disappear): note in release notes.

## Agent brief (A: announcements list, detail, renderer)

```
ROLE: build agent, lane 08 announcements-mobile-reader, brief A (RM-078, RM-079). Leaf worker: start no subagents.
REPO: /Users/upstairs/Personal/builds/church/church-management-system  BRANCH: design/mito-ya-baraka-concepts (stay on it)
READ FIRST: docs/roadmap/README.md (ground rules), docs/roadmap/specs/lane-08-announcements-mobile-reader.md (tasks 1-3, contracts), docs/roadmap/audits/mobile-member.md MM-08..10, F5; design-system-ux.md J3.
PRECONDITIONS: lane 07 RM-010 merged (app/(member)/(tabs)/ exists); lane 05 contract merged (GET /announcements, GET /announcements/:id). If not, STOP and report.
OWN (may edit): apps/mobile/app/(member)/announcements/**, apps/mobile/components/{announcements/**, content/**}, apps/mobile/lib/announcements-api.ts, apps/mobile/tests/{announcements,rich-text}-*.test.ts, packages/config/src/i18n/messages/announcements-mobile.ts.
DO NOT TOUCH: components/home/** (lane 07), lib/api.ts, lib/query-cache.ts, components/ui/**, theme/**, app/(staff)/**, package.json, lockfile, API, web.
RULES: no commits/push; no pnpm add (use only expo-image/react-native already installed; if a package is missing, report it); no WebView; Swahili first: every string needs en and sw in announcements-mobile.ts; after editing it run pnpm --filter @church/config build.
GOAL: members open an announcement and read full formatted content with images, and browse a paged list.
STEPS:
1. Read components/home/home-cards.tsx (AnnouncementCard), app/(member)/(tabs)/index.tsx:30-33 (plainText), lib/api.ts (api helper and error kinds), lib/query-cache.ts if present.
2. lib/announcements-api.ts: typed list/detail/read calls using the shared api helper; types from the spec.
3. components/content/rich-text.tsx: native renderer for doc_v1 (paragraph, heading 2-3, bullet/ordered list, blockquote, bold, italic, link, image); allow-list only; unknown nodes skipped; depth cap 6; https-only links with confirmation; images via expo-image with placeholder and alt; blocks in a FlatList; plain fallback for legacy string bodies.
4. app/(member)/announcements/index.tsx (FlatList, paging 20, unread dot, pull to refresh, empty/error/retry, offline last-good) and [id].tsx (detail, mark read, set header title with <Stack.Screen options>).
5. Tests: renderer (unknown nodes, javascript: link, missing image url, depth), list model/paging helpers.
VERIFY: pnpm --filter mobile test (announcements-*, rich-text-* only); ONE pnpm --filter mobile typecheck. Device check via panel agent-device on DEV with the test member if announcements exist (never force-stop Expo Go; Metro --clear if stale).
REPORT (max 15 lines): files changed; RM IDs done/partial; tests run/skipped; device paths checked; requests to lane 07 (card route), lane 05 (contract gaps), lane 12 (keys); open risks.
```

Briefs B (events and library, tasks 4-5) and C (church, task 6) reuse this header with their tasks and owned files.
