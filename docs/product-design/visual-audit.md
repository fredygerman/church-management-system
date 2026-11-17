# Visual concept audit

The four boards in `images/` are AI-generated explorations, not production assets or source-of-truth UI. Their visual language suggests a friendly blue-and-violet church app, but generated details are inconsistent and fictional.

| Board | Useful direction | Inconsistencies to resolve |
| --- | --- | --- |
| `member.png` | Five member tabs, HQ context, branch selector, profile switch to staff, service/event cards | Names, portraits, logo, branch locations and addresses are fictional. Some board captions suggest branch selection as ordinary browsing; keep public branch browsing distinct from active membership switching. |
| `library-ai.png` | Shared library, search, book detail/sample, downloads, reader, AI conversation with service card | Kilimanjaro imagery and Arusha event/location imply unsupported geography; prices, titles, ratings, author, dates and content are invented. Purchase UI is illustrative only; store setup is deferred. |
| `staff.png` | Five staff tabs, people, attendance, content, More with space switching | Membership counts, attendance trends, names, service schedules, publication records and branches are fabricated. Permission and reports examples do not establish policy. |
| `desktop.png` | Desktop member/library/staff composition | Branding, hero photo, branch, event details and all operational data are illustrative. Desktop navigation should match the agreed member/staff information architecture. |

## Decisions for implementation

Use the exact brand name **Mito Ya Baraka Church** in product copy; omit “Tanzania” unless approved as part of the official lockup. HQ is the first launch context. Other branch names, locations, contacts, leaders, service times, people, statistics, event dates, book content, prices, and imagery require verified church-provided data and permission. Never seed a real deployment with board values.

Member navigation is Home / Church / Events / Library / Profile. Staff navigation is Dashboard / People / Services / Content / More. Do not expose the board's alternate “Permissions” top-level tab or use “Church Operations” as a substitute for Dashboard. AI sits in the top bar beside notifications and opens its own page. Staff switching lives on member Home/Profile for authorized users; return to member space lives in staff More.

Branch selection changes active operational context only for a membership the user can access. Publicly browsing another branch profile is a separate view and must not silently change context or membership. Shared library, account, and purchases remain available across branch contexts subject to item access rules. Show branch context on branch-specific answers and staff operations.

Retain limited offline downloads for eligible content only. Explain unavailable or expired content clearly. Do not imply full offline operation. Store accounts, store agreements, and publishing are deferred; concept pricing and purchase buttons are not approval to implement commerce.
