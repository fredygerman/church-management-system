// Existing identical values awaiting the approved Swahili scripture translation (D-23).
// Keep this list short-lived: remove each verse key when its approved translation lands.
export const SW_REVIEW_PENDING_IDENTICAL_KEYS = [
  'mobile.member.home.verseText.0',
  'mobile.member.home.verseRef.0',
  'mobile.member.home.verseText.1',
  'mobile.member.home.verseRef.1',
  'mobile.member.home.verseText.2',
  'mobile.member.home.verseRef.2',
  'mobile.member.home.verseText.3',
  'mobile.member.home.verseRef.3',
  'mobile.member.home.verseText.4',
  'mobile.member.home.verseRef.4',
  'mobile.member.home.verseText.5',
  'mobile.member.home.verseRef.5',
  'mobile.member.home.verseText.6',
  'mobile.member.home.verseRef.6',
] as const

// Stable product names, the acronym AI, and numeric-only values may remain identical.
// Language names are shown in their own language in both locales ("English", "Kiswahili").
// "Video" is the same loanword in Swahili.
const STABLE_IDENTICAL_KEYS = ['language.en', 'language.sw', 'wiring.library.type.video'] as const

export const IDENTICAL_ALLOWLIST = new Set<string>([
  ...SW_REVIEW_PENDING_IDENTICAL_KEYS,
  ...STABLE_IDENTICAL_KEYS,
])
