import { BadRequestException } from '@nestjs/common'
import { inclusiveDayCount, isValidDateString } from './verse-calendar'
import type { VerseLocale } from './verse-resolution'

export const REFERENCE_LENGTH = { min: 2, max: 120 }
export const TEXT_LENGTH = { min: 5, max: 1000 }
export const MAX_OVERRIDE_RANGE_DAYS = 92

// C0 and C1 control characters, including tab and newline.
const CONTROL_CHARACTERS = /[\u0000-\u001F\u007F-\u009F]/g
// Any opening, closing or declaration tag, such as <b>, </p>, <!-- or <!DOCTYPE>.
const HTML_TAG = /<\/?[A-Za-z!][^>]*>/

export interface VerseEntryInput {
  reference: string
  textEn: string
  textSw: string | null
}

export interface VerseEntryPatch {
  reference?: string
  textEn?: string
  textSw?: string | null
  active?: boolean
}

export function validationError(message: string, code = 'VALIDATION_ERROR'): BadRequestException {
  return new BadRequestException({ message, code })
}

/** Strips control characters, trims, rejects HTML tags, then checks length in code points. */
export function cleanText(value: unknown, field: string, limits: { min: number; max: number }): string {
  if (typeof value !== 'string') {
    throw validationError(`${field} must be text`)
  }
  const cleaned = value.replace(CONTROL_CHARACTERS, '').trim()
  if (HTML_TAG.test(cleaned)) {
    throw validationError(`${field} must not contain HTML`)
  }
  const length = Array.from(cleaned).length
  if (length < limits.min || length > limits.max) {
    throw validationError(`${field} must be between ${limits.min} and ${limits.max} characters`)
  }
  return cleaned
}

/** Optional Swahili text: undefined, null or blank becomes null; otherwise validated like English. */
function optionalText(value: unknown, field: string): string | null {
  if (value === undefined || value === null) return null
  if (typeof value === 'string' && value.replace(CONTROL_CHARACTERS, '').trim() === '') return null
  return cleanText(value, field, TEXT_LENGTH)
}

export function parseEntryCreate(body: unknown): VerseEntryInput {
  const input = requireObject(body)
  return {
    reference: cleanText(input.reference, 'reference', REFERENCE_LENGTH),
    textEn: cleanText(input.textEn, 'textEn', TEXT_LENGTH),
    textSw: optionalText(input.textSw, 'textSw'),
  }
}

/** Partial update. Only fields that are present are validated; textSw null clears the Swahili text. */
export function parseEntryPatch(body: unknown): VerseEntryPatch {
  const input = requireObject(body)
  const patch: VerseEntryPatch = {}

  if (input.reference !== undefined) {
    patch.reference = cleanText(input.reference, 'reference', REFERENCE_LENGTH)
  }
  if (input.textEn !== undefined) {
    patch.textEn = cleanText(input.textEn, 'textEn', TEXT_LENGTH)
  }
  if (input.textSw !== undefined) {
    patch.textSw = optionalText(input.textSw, 'textSw')
  }
  if (input.active !== undefined) {
    if (typeof input.active !== 'boolean') {
      throw validationError('active must be true or false')
    }
    patch.active = input.active
  }

  if (Object.keys(patch).length === 0) {
    throw validationError('No changes supplied')
  }
  return patch
}

export function parseDateParam(value: unknown): string {
  if (!isValidDateString(value)) {
    throw validationError('Date must be a real calendar date in YYYY-MM-DD form', 'INVALID_DATE')
  }
  return value
}

export function parseOverrideRange(from: unknown, to: unknown): { from: string; to: string } {
  const start = parseDateParam(from)
  const end = parseDateParam(to)
  if (start > end) {
    throw validationError('from must not be after to', 'INVALID_RANGE')
  }
  if (inclusiveDayCount(start, end) > MAX_OVERRIDE_RANGE_DAYS) {
    throw validationError(`Range must be at most ${MAX_OVERRIDE_RANGE_DAYS} days`, 'INVALID_RANGE')
  }
  return { from: start, to: end }
}

/** Anything other than 'sw' falls back to English, matching parseLocale in @church/config. */
export function parseVerseLocale(value: unknown): VerseLocale {
  return value === 'sw' ? 'sw' : 'en'
}

function requireObject(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw validationError('Request body must be an object')
  }
  return body as Record<string, unknown>
}
