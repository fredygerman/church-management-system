# Human verification backlog

Existing implementation waves were authorized and completed in parts; none of the human checks below is certified by this audit. Owner: Fredy under DEC-10. Record exact candidate SHA, environment, device/browser, date, observable result and evidence for every check. Current source audit baseline is `81de7d2`; the eventual verified candidate may differ.

The new [remediation register](remediation-plan.md) must be implemented/accepted and automated gates reviewed before the final human stage. A source audit, export/build or a checked documentation box is not a device run. AI activation/live-provider checks remain deferred; browser-based mobile reading is accepted, and managed-download/full-offline expectations are not a prerequisite.

**Timing (DEC-10, DEC-13, DEC-14):** every check below starts only after all code work on all waves is finished. Until then, Claude does the work and does not stop to ask. Swahili copy is written and reviewed by Claude; the native-speaker review of `packages/config/src/i18n/messages/` is one of these human checks.

| Check | Observable acceptance | State |
|---|---|---|
| HQ identity and content | Confirm approved church name/logo, branch details, schedule, imagery, translations, and all displayed metrics against church-provided sources | Not started |
| Member experience | On phone and desktop, verify Home/Church/Events/Library/Profile navigation, profile edit, authorized staff switch, and branch selection versus public browsing | Not started |
| Staff dashboard | Confirm missing data is clearly empty/unavailable and no fabricated zero or unauthorized metric appears | Not started |
| Library and browser reader | Verify branch-scoped current access and any accepted shared-catalog changes, visibility toggle, signed-link expiry/retry and browser opening. Managed downloads/storage/removal and full offline remain deferred unless separately accepted | Not started |
| AI | Verify entry placement, dedicated conversation, visible context, sources/uncertainty, and permission boundaries only after separate activation/testing scope is accepted | Deferred activation; not performed |
| Accessibility/localization | Keyboard/focus, screen reader, 44px targets, dynamic type, reduced motion, WCAG AA contrast, English/Swahili copy reviewed by fluent person | Not started |
| Commerce | Remains deferred until a separate accepted decision and current platform-policy review | Deferred |
| Swahili copy (native review) | A fluent Swahili speaker reads every `sw` string in `packages/config/src/i18n/messages/*.ts` in context on web and mobile, checks terminology against the glossary, and records any change | Not started, after all code work |
| Mobile device run | Expo build on a phone: sign-in, Home, Events RSVP, Library download, Profile edit, language switch, staff tabs by role | Not started, after all code work |
| Staff document visibility | Staff toggles Visible to members on the Content page; a member sees or loses the document in the Library | Not started, after all code work |

## Remediation acceptance extensions

- R-UX-01/R-MOB-03: same account can switch member/staff presentations without changing authorization; branch switch recomputes permitted staff access.
- R-MOB-01/02/04: temporary API failure is retryable, successful retry clears error, mounted screens cannot retain previous-branch data. Run with isolated fixtures, never disrupt live infrastructure to simulate faults.
- R-DES-01/R-WEB-02: compare all four boards as direction at agreed mobile/desktop widths, including keyboard, focus, text scaling, header AI entry and safe navigation. Verify official church identity separately from fictional board content.
- R-SEC-01/02: review automated negative controller/tenant evidence and an approved operator/member walkthrough; do not perform an unauthorized live security demonstration.
- R-QA-02: verify the actual accepted deployment revision and required schema in the selected environment, then record authorized role-based journeys. Production migration requires explicit approval.
