import { darToday, dayOfYear, inclusiveDayCount, isValidDateString, toDarDate } from './verse-calendar'

describe('verse calendar (Africa/Dar_es_Salaam)', () => {
  it('uses UTC+3 for the day boundary: 23:30 UTC on the 31st is the 1st in Dar', () => {
    expect(toDarDate(new Date('2026-12-31T23:30:00Z'))).toBe('2027-01-01')
  })

  it('switches to the next day exactly at 21:00 UTC', () => {
    expect(toDarDate(new Date('2026-12-31T20:59:59Z'))).toBe('2026-12-31')
    expect(toDarDate(new Date('2026-12-31T21:00:00Z'))).toBe('2027-01-01')
  })

  it('darToday reads the injected clock in Dar time', () => {
    expect(darToday(new Date('2026-11-27T22:15:00Z'))).toBe('2026-11-28')
  })

  it('computes a 1-based day of year, including leap years', () => {
    expect(dayOfYear('2026-01-01')).toBe(1)
    expect(dayOfYear('2026-11-27')).toBe(331)
    expect(dayOfYear('2028-12-31')).toBe(366)
  })

  it('accepts only real calendar dates in strict YYYY-MM-DD form', () => {
    expect(isValidDateString('2028-02-29')).toBe(true)
    expect(isValidDateString('2026-02-29')).toBe(false)
    expect(isValidDateString('2026-2-1')).toBe(false)
    expect(isValidDateString('2026-11-27T00:00:00Z')).toBe(false)
    expect(isValidDateString(20261127)).toBe(false)
  })

  it('counts inclusive days across a range', () => {
    expect(inclusiveDayCount('2026-01-01', '2026-03-02')).toBe(61)
    expect(inclusiveDayCount('2026-11-27', '2026-11-27')).toBe(1)
  })
})
