# Proposed visual language

Status: concept for review. This is a proposed system for Mito Ya Baraka Church, with HQ as the first launch context. It does not describe implemented UI. Confirm logo, approved photography, translations, and brand colors with the church before release.

## Direction

Use a warm, welcoming editorial style grounded in the church's real identity: clear navy typography, restrained blue actions, generous white space, and occasional violet accents for spiritual reflection and AI. Use authentic, consented church photography only. Avoid stock-like composites, invented church marks, decorative gradients behind dense text, and imagery that implies an unverified branch.

## Tokens

| Token | Proposed value | Use |
| --- | --- | --- |
| `color.ink` | `#172554` | Primary text and headings |
| `color.brand` | `#1D4ED8` | Primary actions, active navigation, links |
| `color.brand-strong` | `#1E3A8A` | High emphasis, dark header surfaces |
| `color.accent` | `#7C3AED` | AI, reflection, selected secondary emphasis |
| `color.canvas` | `#F8FAFC` | Page background |
| `color.surface` | `#FFFFFF` | Cards and navigation |
| `color.tint` | `#EEF2FF` | Soft selected surfaces |
| `color.muted` | `#64748B` | Secondary text |
| `color.border` | `#E2E8F0` | Dividers and outlines |
| `color.success` | `#15803D` | Success and available state |
| `color.warning` | `#A16207` | Caution and pending state |
| `color.danger` | `#B91C1C` | Errors and destructive actions |

Use semantic color names in components; never encode meaning by color alone. Maintain WCAG AA contrast for text and controls. Gradients are optional decorative media treatments, never the only way to distinguish state.

## Type, spacing, shape

Use the platform system sans family for interface text and a readable system serif only for long-form scripture or book reading. Proposed mobile scale: display 30/36 px, h1 26/32, h2 22/28, h3 18/24, body 16/24, supporting 14/20, caption 12/16. Desktop may raise display to 36/44 and h1 to 30/38. Respect text scaling; do not truncate essential labels.

Use a 4 px base spacing scale: 4, 8, 12, 16, 24, 32, 40, 48, 64. Common page gutters: 16 px phone, 24 px tablet, 32 px desktop. Cards use 16 px internal padding and 16 px gaps. Use 8 px radius for compact controls, 12 px for cards, 16 px for prominent panels, and pill shape only for tags or segmented controls. Shadows should be subtle and reserved for overlays.

## Reusable components

- App bar: church wordmark/name, visible context when relevant, AI entry beside notifications. AI opens a dedicated conversation screen; it does not float over content.
- Member and staff navigation: member tabs Home, Church, Events, Library, Profile; staff tabs Dashboard, People, Services, Content, More. Keep labels visible on phone navigation.
- Context selector: explicitly labels active branch and offers only memberships the user can access. Publicly viewing a branch is a separate action and does not switch active membership.
- Cards: consistent title, supporting copy, optional media, and one clear action. Do not make the whole card clickable when it contains independent controls.
- State patterns: loading skeleton, empty explanation with next action, inline retryable error, offline banner, permission explanation, confirmation dialog, and success feedback.
- Media row and reader: cover/artwork, title, author/speaker, access state, download action, playback/reading progress, and accessible controls.
- Staff tables become labelled cards on narrow screens; preserve search, filters, sort, and row actions.

## Layout and behavior

On phones, use a single-column content flow, sticky app bar where it helps, and a bottom bar with safe-area padding. Long forms and reading views may hide bottom navigation when focused. On desktop, use a 240 px staff sidebar and a centered member content column capped around 1200 px; use a two-column detail layout only when content benefits. Keep dialogs and menus within viewport and keyboard reachable.

The signed-in account is shared between member and authorized staff spaces. Offer member-to-staff switching on member Home and Profile only for authorized accounts; offer staff-to-member switching in staff More. Branch operations use the selected branch and enforce permissions on the server. Library, purchases, and account are shared unless a specific item is branch-restricted. Offline support is limited to explicitly downloaded eligible content. Store accounts, agreements, and publishing setup are deferred.

## Accessibility and localization

Target WCAG 2.2 AA. Provide visible keyboard focus, semantic headings and landmarks, accessible names for icon buttons, minimum 44 by 44 px touch targets, reduced-motion support, captions/transcripts where media allows, and screen-reader announcements for async changes. Preserve logical reading and focus order in dialogs and navigation.

Support English and Swahili without hard-coded text widths. Use locale-aware dates, times, numbers, and currency only where a real price has been approved. Allow text expansion, line wrapping, and dynamic type. Verify translated names and church terminology with a fluent reviewer. Do not ship generated Swahili labels from concept boards as approved copy.
