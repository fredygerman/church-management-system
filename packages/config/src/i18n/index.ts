// Shared copy for web and mobile. English and Swahili dictionaries are kept in step by the type-checker:
// every key in `en` must exist in `sw`. Placeholders use {name} and are filled by translate().
import { commonMessages } from './messages/common'
import { memberMessages } from './messages/member'
import { staffMessages } from './messages/staff'
import { mobileMemberMessages } from './messages/mobile-member'
import { mobileStaffMessages } from './messages/mobile-staff'
import { componentMessages } from './messages/components'
import { mobileSharedMessages } from './messages/mobile-shared'

export const LOCALES = ['en', 'sw'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'en'
export const LOCALE_COOKIE = 'locale'

export function parseLocale(value: string | null | undefined): Locale {
  return value === 'sw' ? 'sw' : DEFAULT_LOCALE
}

// Explicit spreads (not Object.assign) so the type-checker reports any key missing from sw.
const en = { ...commonMessages.en, ...memberMessages.en, ...staffMessages.en, ...mobileMemberMessages.en, ...mobileStaffMessages.en, ...componentMessages.en, ...mobileSharedMessages.en }
export type MessageKey = keyof typeof en

const sw: Record<MessageKey, string> = { ...commonMessages.sw, ...memberMessages.sw, ...staffMessages.sw, ...mobileMemberMessages.sw, ...mobileStaffMessages.sw, ...componentMessages.sw, ...mobileSharedMessages.sw }

// Exposed for the parity test only; components use translate().
export const dictionaries = { en, sw } as const

export type Vars = Record<string, string | number>
export type Translate = (key: MessageKey, vars?: Vars) => string

export function translate(locale: Locale, key: MessageKey, vars?: Vars): string {
  const text = (locale === 'sw' ? sw : en)[key]
  if (!vars) return text
  return text.replace(/\{(\w+)\}/g, (match: string, name: string) => (name in vars ? String(vars[name]) : match))
}

export function translatorFor(locale: Locale): Translate {
  return (key, vars) => translate(locale, key, vars)
}
