// Shared copy for web and mobile. English and Swahili dictionaries are kept in step by the type-checker:
// every key in `en` must exist in `sw`. Placeholders use {name} and are filled by translate().
import { commonMessages } from './messages/common'
import { memberMessages } from './messages/member'
import { staffMessages } from './messages/staff'
import { mobileMemberMessages } from './messages/mobile-member'
import { mobileStaffMessages } from './messages/mobile-staff'
import { staffAttendanceMessages } from './messages/staff-attendance'
import { staffPeopleMessages } from './messages/staff-people'
import { staffGroupsMessages } from './messages/staff-groups'
import { staffEventsGivingMessages } from './messages/staff-events-giving'
import { staffSweepAMessages } from './messages/staff-sweep-a'
import { staffSweepBMessages } from './messages/staff-sweep-b'
import { componentMessages } from './messages/components'
import { mobileSharedMessages } from './messages/mobile-shared'
import { finalSweepMessages } from './messages/final-sweep'
import { wiringMobileMessages } from './messages/wiring-mobile'
import { wiringWebMessages } from './messages/wiring-web'
import { authOnboardingMessages } from './messages/auth-onboarding'
import { announcementsWebMessages } from './messages/announcements-web'
import { mobileShellMessages } from './messages/mobile-shell'
import { announcementsMobileMessages } from './messages/announcements-mobile'
import { memberContentMessages } from './messages/member-content'
import { profileMessages } from './messages/profile'
import { prayerInboxMessages } from './messages/prayer-inbox'
import { joinMessages } from './messages/join'
import { staffMobileMessages } from './messages/staff-mobile'
import { versesMessages } from './messages/verses'
import { invitationsMessages } from './messages/invitations-web'

export const LOCALES = ['en', 'sw'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'en'
export const LOCALE_COOKIE = 'locale'

export function parseLocale(value: string | null | undefined): Locale {
  return value === 'sw' ? 'sw' : DEFAULT_LOCALE
}

// Explicit spreads (not Object.assign) so the type-checker reports any key missing from sw.
const en = { ...commonMessages.en, ...memberMessages.en, ...staffMessages.en, ...mobileMemberMessages.en, ...mobileStaffMessages.en, ...componentMessages.en, ...mobileSharedMessages.en, ...staffAttendanceMessages.en, ...staffPeopleMessages.en, ...staffGroupsMessages.en, ...staffEventsGivingMessages.en, ...staffSweepAMessages.en, ...staffSweepBMessages.en, ...finalSweepMessages.en, ...wiringWebMessages.en, ...wiringMobileMessages.en, ...authOnboardingMessages.en, ...announcementsWebMessages.en, ...mobileShellMessages.en, ...announcementsMobileMessages.en, ...memberContentMessages.en, ...profileMessages.en, ...prayerInboxMessages.en, ...joinMessages.en, ...staffMobileMessages.en, ...versesMessages.en, ...invitationsMessages.en }
export type MessageKey = keyof typeof en

const sw: Record<MessageKey, string> = { ...commonMessages.sw, ...memberMessages.sw, ...staffMessages.sw, ...mobileMemberMessages.sw, ...mobileStaffMessages.sw, ...componentMessages.sw, ...mobileSharedMessages.sw, ...staffAttendanceMessages.sw, ...staffPeopleMessages.sw, ...staffGroupsMessages.sw, ...staffEventsGivingMessages.sw, ...staffSweepAMessages.sw, ...staffSweepBMessages.sw, ...finalSweepMessages.sw, ...wiringWebMessages.sw, ...wiringMobileMessages.sw, ...authOnboardingMessages.sw, ...announcementsWebMessages.sw, ...mobileShellMessages.sw, ...announcementsMobileMessages.sw, ...memberContentMessages.sw, ...profileMessages.sw, ...prayerInboxMessages.sw, ...joinMessages.sw, ...staffMobileMessages.sw, ...versesMessages.sw, ...invitationsMessages.sw }

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
export * from './format'
