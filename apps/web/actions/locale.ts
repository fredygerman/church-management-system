"use server"

import { cookies } from "next/headers"
import { LOCALE_COOKIE, parseLocale } from "@church/config"

/** Stores the chosen language for this browser for one year. */
export async function setLocaleAction(value: string) {
  const store = await cookies()
  store.set(LOCALE_COOKIE, parseLocale(value), {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  })
}
