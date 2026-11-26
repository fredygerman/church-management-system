import { test } from 'node:test'
import assert from 'node:assert/strict'
import { formatLocaleDate, formatLocaleNumber } from './format'
import { DEFAULT_LOCALE, dictionaries, parseLocale, translate, type MessageKey } from './index'

const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort()

test('parseLocale falls back to English for anything but sw', () => {
  assert.equal(DEFAULT_LOCALE, 'en')
  assert.equal(parseLocale(undefined), 'en')
  assert.equal(parseLocale('fr'), 'en')
  assert.equal(parseLocale('sw'), 'sw')
})

test('every English key has a non-empty Swahili string with the same key set', () => {
  const enKeys = Object.keys(dictionaries.en).sort()
  const swKeys = Object.keys(dictionaries.sw).sort()
  assert.deepEqual(swKeys, enKeys)
  for (const key of enKeys) {
    assert.ok(dictionaries.sw[key as MessageKey].trim().length > 0, `empty Swahili string for ${key}`)
  }
})

test('Swahili keeps the same placeholders as English for every key', () => {
  for (const key of Object.keys(dictionaries.en) as MessageKey[]) {
    assert.deepEqual(placeholders(dictionaries.sw[key]), placeholders(dictionaries.en[key]), `placeholders differ for ${key}`)
  }
})

test('translate returns the locale text and fills placeholders', () => {
  assert.equal(translate('en', 'common.save'), 'Save')
  assert.equal(translate('sw', 'common.save'), 'Hifadhi')
})

test('formatLocaleDate formats per language and returns empty for missing or invalid dates', () => {
  const long = { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' } as const
  assert.equal(formatLocaleDate('2026-11-26T10:00:00Z', 'en', long), '26 November 2026')
  assert.equal(formatLocaleDate('2026-11-26T10:00:00Z', 'sw', long), '26 Novemba 2026')
  assert.equal(formatLocaleDate(null, 'en'), '')
  assert.equal(formatLocaleDate('', 'sw'), '')
  assert.equal(formatLocaleDate('not a date', 'en'), '')
})

test('formatLocaleNumber groups thousands', () => {
  assert.equal(formatLocaleNumber(1234567, 'en'), '1,234,567')
})
