import * as SecureStore from "expo-secure-store"
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { DEFAULT_LOCALE, parseLocale, translatorFor, type Locale, type Translate } from "@church/config/i18n"
import { setApiLocale } from "./api"

const LOCALE_KEY = "church.locale"

type LocaleContextValue = { locale: Locale; t: Translate; setLocale: (next: Locale) => Promise<void> }

const LocaleContext = createContext<LocaleContextValue | null>(null)

/** Holds the chosen language for this device. English until the user picks Swahili. */
export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE)

  useEffect(() => {
    setApiLocale(locale)
  }, [locale])

  useEffect(() => {
    SecureStore.getItemAsync(LOCALE_KEY)
      .then((stored) => setLocaleState(parseLocale(stored)))
      .catch(() => undefined)
  }, [])

  const value = useMemo<LocaleContextValue>(() => ({
    locale,
    t: translatorFor(locale),
    setLocale: async (next) => {
      setLocaleState(next)
      await SecureStore.setItemAsync(LOCALE_KEY, next).catch(() => undefined)
    },
  }), [locale])

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useT() {
  const context = useContext(LocaleContext)
  if (!context) throw new Error("useT must be used inside LocaleProvider")
  return context
}
