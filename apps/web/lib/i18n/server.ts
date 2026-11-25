import { cookies } from "next/headers"
import { LOCALE_COOKIE, parseLocale, translatorFor, type Locale } from "@church/config"

/** The viewer's language, from the locale cookie (English when unset). */
export async function getLocale(): Promise<Locale> {
  const store = await cookies()
  return parseLocale(store.get(LOCALE_COOKIE)?.value)
}

/** Translator for server components: `const t = await getTranslator()`. */
export async function getTranslator() {
  return translatorFor(await getLocale())
}
