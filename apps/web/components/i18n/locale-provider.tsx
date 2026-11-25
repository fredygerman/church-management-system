"use client"

import { createContext, useContext, type ReactNode } from "react"
import { translatorFor, type Locale, type Translate } from "@church/config"

type LocaleContextValue = { locale: Locale; t: Translate }

const LocaleContext = createContext<LocaleContextValue | null>(null)

/** Supplies the server-resolved locale to client components. */
export function LocaleProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  return <LocaleContext.Provider value={{ locale, t: translatorFor(locale) }}>{children}</LocaleContext.Provider>
}

export function useT() {
  const context = useContext(LocaleContext)
  if (!context) throw new Error("useT must be used inside LocaleProvider")
  return context
}
