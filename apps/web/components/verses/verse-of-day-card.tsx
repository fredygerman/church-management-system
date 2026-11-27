import { translatorFor, type Locale, type MessageKey } from "@church/config"

// Shape returned by GET /verses/today?locale=en|sw.
// text is null when no approved text exists for the locale (Swahili, decision D-23).
export interface VerseOfDay {
  date: string
  reference: string
  text: string | null
  locale: Locale
  source: "override" | "rotation" | "default"
}

export type VerseCardState =
  | { kind: "hidden" }
  | { kind: "none" }
  | { kind: "verse"; verse: VerseOfDay }

const SOURCE_KEYS: Record<VerseOfDay["source"], MessageKey> = {
  override: "verses.source.override",
  rotation: "verses.source.rotation",
  default: "verses.source.default",
}

// Decides what the card shows. Pure, so it can be tested without rendering.
// - No data (not loaded or request failed): hidden.
// - Text present: show the verse.
// - Text null in Swahili: hidden, because there is no approved Swahili text yet.
// - Text null in English: a quiet "no verse for today" line.
export function verseCardState(verse: VerseOfDay | null | undefined, locale: Locale): VerseCardState {
  if (!verse) return { kind: "hidden" }
  if (typeof verse.text === "string" && verse.text.trim() !== "") {
    return { kind: "verse", verse }
  }
  if (locale === "sw") return { kind: "hidden" }
  return { kind: "none" }
}

export function VerseOfDayCard({ verse, locale }: { verse: VerseOfDay | null; locale: Locale }) {
  const state = verseCardState(verse, locale)
  if (state.kind === "hidden") return null

  const t = translatorFor(locale)

  if (state.kind === "none") {
    return (
      <section className="border-border bg-card rounded-lg border p-5">
        <h2 className="text-foreground text-base font-semibold">{t("verses.heading")}</h2>
        <p className="text-muted-foreground mt-2 text-sm">{t("verses.none")}</p>
      </section>
    )
  }

  const { verse: today } = state
  return (
    <section className="border-border bg-card rounded-lg border p-5">
      <h2 className="text-foreground text-base font-semibold">{t("verses.heading")}</h2>
      <p className="text-foreground mt-3 whitespace-pre-wrap text-base italic">
        {`“${today.text}”`}
      </p>
      <p className="text-foreground mt-2 text-sm font-medium">{today.reference}</p>
      <p className="text-muted-foreground mt-1 text-xs">{t(SOURCE_KEYS[today.source])}</p>
    </section>
  )
}
