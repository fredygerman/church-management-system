# Human verification backlog

No implementation has been authorized or verified. Move code-complete work here with a named owner and exact build/revision before performing checks.

**Timing (DEC-10, DEC-13, DEC-14):** every check below starts only after all code work on all waves is finished. Until then, Claude does the work and does not stop to ask. Swahili copy is written and reviewed by Claude; the native-speaker review of `packages/config/src/i18n/messages/` is one of these human checks.

| Check | Observable acceptance | State |
|---|---|---|
| HQ identity and content | Confirm approved church name/logo, branch details, schedule, imagery, translations, and all displayed metrics against church-provided sources | Not started |
| Member experience | On phone and desktop, verify Home/Church/Events/Library/Profile navigation, profile edit, authorized staff switch, and branch selection versus public browsing | Not started |
| Staff dashboard | Confirm missing data is clearly empty/unavailable and no fabricated zero or unauthorized metric appears | Not started |
| Library and offline | Verify access labels, eligible explicit downloads, storage/removal, offline/error/expiry behavior; no implied full offline mode | Not started |
| AI | Verify entry placement, dedicated conversation, visible context, sources/uncertainty, and permission boundaries after policy approval | Not started |
| Accessibility/localization | Keyboard/focus, screen reader, 44px targets, dynamic type, reduced motion, WCAG AA contrast, English/Swahili copy reviewed by fluent person | Not started |
| Commerce | Remains deferred until a separate accepted decision and current platform-policy review | Deferred |
| Swahili copy (native review) | A fluent Swahili speaker reads every `sw` string in `packages/config/src/i18n/messages/*.ts` in context on web and mobile, checks terminology against the glossary, and records any change | Not started, after all code work |
| Mobile device run | Expo build on a phone: sign-in, Home, Events RSVP, Library download, Profile edit, language switch, staff tabs by role | Not started, after all code work |
| Staff document visibility | Staff toggles Visible to members on the Content page; a member sees or loses the document in the Library | Not started, after all code work |
