import { BadRequestException } from '@nestjs/common'
import { MAX_OVERRIDE_RANGE_DAYS, parseEntryCreate, parseEntryPatch, parseOverrideRange, parseVerseLocale } from './verse-validation'

function errorOf(fn: () => unknown): BadRequestException {
  try {
    fn()
  } catch (error) {
    return error as BadRequestException
  }
  throw new Error('Expected validation to throw')
}

const VALID = { reference: 'Psalm 23:1', textEn: 'The LORD is my shepherd, I lack nothing.' }

describe('verse entry validation', () => {
  it('accepts a valid entry and strips control characters', () => {
    expect(parseEntryCreate({ ...VALID, reference: 'Psalm\u0000 23:1' })).toEqual({
      reference: 'Psalm 23:1',
      textEn: VALID.textEn,
      textSw: null,
    })
  })

  it('enforces the reference length between 2 and 120 characters', () => {
    expect(errorOf(() => parseEntryCreate({ ...VALID, reference: 'A' })).getStatus()).toBe(400)
    expect(() => parseEntryCreate({ ...VALID, reference: 'Ab' })).not.toThrow()
    expect(() => parseEntryCreate({ ...VALID, reference: 'A'.repeat(120) })).not.toThrow()
    expect(() => parseEntryCreate({ ...VALID, reference: 'A'.repeat(121) })).toThrow(BadRequestException)
  })

  it('enforces the English text length between 5 and 1000 characters', () => {
    expect(() => parseEntryCreate({ ...VALID, textEn: 'Good' })).toThrow(BadRequestException)
    expect(() => parseEntryCreate({ ...VALID, textEn: 'A'.repeat(1001) })).toThrow(BadRequestException)
    expect(() => parseEntryCreate({ ...VALID, textEn: 'A'.repeat(1000) })).not.toThrow()
  })

  it('rejects HTML tags in any text field', () => {
    const error = errorOf(() => parseEntryCreate({ ...VALID, textEn: 'Be <b>glad</b> in it' }))
    expect(error.getStatus()).toBe(400)
    expect(error.getResponse()).toMatchObject({ code: 'VALIDATION_ERROR' })
    expect(() => parseEntryCreate({ ...VALID, textSw: '<script>x</script>' })).toThrow(BadRequestException)
  })

  it('treats blank optional Swahili text as null and validates non-blank text', () => {
    expect(parseEntryCreate({ ...VALID, textSw: '' }).textSw).toBeNull()
    expect(parseEntryCreate({ ...VALID, textSw: null }).textSw).toBeNull()
    expect(parseEntryCreate({ ...VALID, textSw: 'Bwana ndiye mchungaji wangu' }).textSw).toBe('Bwana ndiye mchungaji wangu')
    expect(() => parseEntryCreate({ ...VALID, textSw: 'Na' })).toThrow(BadRequestException)
  })

  it('requires reference and textEn to be text', () => {
    expect(() => parseEntryCreate({ textEn: VALID.textEn })).toThrow(BadRequestException)
    expect(() => parseEntryCreate({ ...VALID, reference: 42 })).toThrow(BadRequestException)
  })

  it('patches only supplied fields and rejects an empty patch', () => {
    expect(parseEntryPatch({ active: false })).toEqual({ active: false })
    expect(parseEntryPatch({ textSw: null })).toEqual({ textSw: null })
    expect(() => parseEntryPatch({})).toThrow(BadRequestException)
    expect(() => parseEntryPatch({ active: 'no' })).toThrow(BadRequestException)
    expect(() => parseEntryPatch({ textEn: null })).toThrow(BadRequestException)
  })
})

describe('override range validation', () => {
  it('accepts a range of exactly 92 inclusive days', () => {
    expect(parseOverrideRange('2026-01-01', '2026-04-02')).toEqual({ from: '2026-01-01', to: '2026-04-02' })
    expect(MAX_OVERRIDE_RANGE_DAYS).toBe(92)
  })

  it('rejects a range of 93 days with INVALID_RANGE', () => {
    const error = errorOf(() => parseOverrideRange('2026-01-01', '2026-04-03'))
    expect(error.getResponse()).toMatchObject({ code: 'INVALID_RANGE' })
  })

  it('rejects from after to and malformed dates with INVALID_DATE', () => {
    expect(errorOf(() => parseOverrideRange('2026-03-02', '2026-03-01')).getResponse()).toMatchObject({ code: 'INVALID_RANGE' })
    expect(errorOf(() => parseOverrideRange('2026-02-30', '2026-03-01')).getResponse()).toMatchObject({ code: 'INVALID_DATE' })
    expect(errorOf(() => parseOverrideRange(undefined, '2026-03-01')).getResponse()).toMatchObject({ code: 'INVALID_DATE' })
  })
})

describe('verse locale', () => {
  it('returns sw only for sw and English for anything else', () => {
    expect(parseVerseLocale('sw')).toBe('sw')
    expect(parseVerseLocale('en')).toBe('en')
    expect(parseVerseLocale('fr')).toBe('en')
    expect(parseVerseLocale(undefined)).toBe('en')
  })
})
