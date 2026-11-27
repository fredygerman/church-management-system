import { useEffect, useRef, useState } from "react"
import { api } from "../../lib/api"
import { createRequestGate } from "../../lib/request-gate"
import { useSession } from "../../lib/session"
import { useT } from "../../lib/locale"
import { VerseCard } from "../home/verse-card"
import type { TodayVerse } from "./verse-api"

/**
 * Member home card. The API picks the day's verse; the app shows it.
 * Renders nothing while loading, on error, or when the API has no text for the current language (D-23: Swahili stays hidden until approved).
 */
export function VerseOfTheDay() {
  const { locale, t } = useT()
  const { contextKey } = useSession()
  const gate = useRef(createRequestGate()).current
  const [verse, setVerse] = useState<TodayVerse | null>(null)

  useEffect(() => {
    const isCurrent = gate.start()
    // A verse loaded for the previous language or church must not show while this one loads.
    setVerse(null)
    api.get<TodayVerse>(`/verses/today?locale=${locale}`).then(
      (data) => { if (isCurrent()) setVerse(data) },
      () => { if (isCurrent()) setVerse(null) },
    )
    return () => gate.invalidate()
  }, [locale, contextKey, gate])

  if (!verse || !verse.text) return null
  return <VerseCard heading={t("verses.heading")} text={verse.text} reference={verse.reference} />
}
