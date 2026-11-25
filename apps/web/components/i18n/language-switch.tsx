"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { LOCALES, type Locale } from "@church/config"
import { setLocaleAction } from "@/actions/locale"
import { useT } from "./locale-provider"

const NAMES: Record<Locale, "language.en" | "language.sw"> = { en: "language.en", sw: "language.sw" }

/** Language picker. Saves the choice in a cookie, then refreshes so server pages re-render. */
export function LanguageSwitch() {
  const { locale, t } = useT()
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  return (
    <label className="flex items-center gap-2 text-sm">
      <span>{t("language.label")}</span>
      <select
        className="rounded-md border bg-background px-2 py-1"
        value={locale}
        disabled={pending}
        onChange={(event) => {
          const next = event.target.value
          startTransition(async () => {
            await setLocaleAction(next)
            router.refresh()
          })
        }}
      >
        {LOCALES.map((code) => (
          <option key={code} value={code}>{t(NAMES[code])}</option>
        ))}
      </select>
    </label>
  )
}
