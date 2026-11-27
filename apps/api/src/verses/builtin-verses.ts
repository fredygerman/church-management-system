import type { VerseCandidate } from './verse-resolution'

/**
 * Fallback rotation used when a church has no active verses of its own.
 * English text is the public copy already shown in the app. Swahili is not
 * available yet, so every entry has textSw null (clients hide the card in sw).
 * Order matters: the day-of-year index selects from this list.
 */
export const BUILTIN_VERSES: readonly VerseCandidate[] = [
  {
    reference: 'Psalm 118:24',
    textEn: 'This is the day the LORD has made; let us rejoice and be glad in it.',
    textSw: null,
  },
  {
    reference: 'Psalm 46:1',
    textEn: 'God is our refuge and strength, an ever-present help in trouble.',
    textSw: null,
  },
  {
    reference: 'Philippians 4:13',
    textEn: 'I can do all this through him who gives me strength.',
    textSw: null,
  },
  {
    reference: 'Proverbs 3:5-6',
    textEn:
      'Trust in the LORD with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.',
    textSw: null,
  },
  {
    reference: 'Psalm 23:1',
    textEn: 'The LORD is my shepherd, I lack nothing.',
    textSw: null,
  },
  {
    reference: 'Matthew 11:28',
    textEn: 'Come to me, all you who are weary and burdened, and I will give you rest.',
    textSw: null,
  },
  {
    reference: 'Psalm 136:1',
    textEn: 'Give thanks to the LORD, for he is good. His love endures forever.',
    textSw: null,
  },
]
