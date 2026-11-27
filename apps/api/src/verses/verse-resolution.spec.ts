import { BUILTIN_VERSES } from './builtin-verses'
import { resolveVerseForDate, toDailyVerse, type VerseCandidate } from './verse-resolution'

// 2026-11-27 is day 331 of the year. 331 mod 3 = 1, 331 mod 7 = 2.
const DATE = '2026-11-27'

const A: VerseCandidate = { reference: 'Ref A', textEn: 'Verse A text', textSw: 'Aya A' }
const B: VerseCandidate = { reference: 'Ref B', textEn: 'Verse B text', textSw: null }
const C: VerseCandidate = { reference: 'Ref C', textEn: 'Verse C text', textSw: 'Aya C' }

describe('resolveVerseForDate', () => {
  it('uses a staff override first, even when the church has its own rotation', () => {
    const override: VerseCandidate = { reference: 'Override ref', textEn: 'Pinned text', textSw: null }

    const resolved = resolveVerseForDate({ date: DATE, override, activeEntries: [A, B, C] })

    expect(resolved).toEqual({ ...override, source: 'override' })
  })

  it('rotates the church list by day of year mod count', () => {
    const resolved = resolveVerseForDate({ date: DATE, activeEntries: [A, B, C] })

    expect(resolved).toEqual({ ...B, source: 'rotation' })
  })

  it('falls back to the built-in list when the church has no active verses', () => {
    const resolved = resolveVerseForDate({ date: DATE, activeEntries: [] })

    expect(resolved.source).toBe('default')
    expect(resolved.reference).toBe('Philippians 4:13')
    expect(resolved.textEn).toBe(BUILTIN_VERSES[2].textEn)
  })

  it('uses day 1 for 1 January', () => {
    const resolved = resolveVerseForDate({ date: '2027-01-01', activeEntries: [A, B, C] })

    expect(resolved).toEqual({ ...B, source: 'rotation' })
  })
})

describe('built-in verses', () => {
  it('lists exactly the seven public verses with no Swahili text', () => {
    expect(BUILTIN_VERSES.map((verse) => verse.reference)).toEqual([
      'Psalm 118:24',
      'Psalm 46:1',
      'Philippians 4:13',
      'Proverbs 3:5-6',
      'Psalm 23:1',
      'Matthew 11:28',
      'Psalm 136:1',
    ])
    expect(BUILTIN_VERSES.every((verse) => verse.textSw === null)).toBe(true)
  })
})

describe('toDailyVerse', () => {
  it('returns English text for en', () => {
    const daily = toDailyVerse(DATE, { ...A, source: 'rotation' }, 'en')

    expect(daily).toEqual({ date: DATE, reference: 'Ref A', text: 'Verse A text', locale: 'en', source: 'rotation' })
  })

  it('returns the Swahili text for sw when it exists', () => {
    const daily = toDailyVerse(DATE, { ...A, source: 'rotation' }, 'sw')

    expect(daily.text).toBe('Aya A')
    expect(daily.locale).toBe('sw')
  })

  it('returns null text for sw when there is no Swahili text, never the English text', () => {
    const daily = toDailyVerse(DATE, { ...B, source: 'rotation' }, 'sw')

    expect(daily.text).toBeNull()
    expect(daily.reference).toBe('Ref B')
  })

  it('returns null text for sw on built-in verses', () => {
    const daily = toDailyVerse(DATE, { ...BUILTIN_VERSES[0], source: 'default' }, 'sw')

    expect(daily.text).toBeNull()
    expect(daily.source).toBe('default')
  })
})
