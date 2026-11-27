import { useCallback, useEffect, useRef, useState } from "react"
import { ScrollView, Text } from "react-native"
import { router } from "expo-router"
import { Card } from "../../components/ui"
import { colors, spacing, type } from "../../theme"
import { api } from "../../lib/api"
import { useT } from "../../lib/locale"
import { createRequestGate } from "../../lib/request-gate"
import { EmptyState, ErrorState, LoadingState, styles } from "../../components/screen-state"
import { formatRelativeDar } from "../../components/home/dar-time"
import { toAnnouncementListItems, type AnnouncementListItem } from "../../components/announcements/model"

export default function AnnouncementsScreen() {
  const { t, locale } = useT()
  const [items, setItems] = useState<AnnouncementListItem[]>([])
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading")
  const gate = useRef(createRequestGate()).current

  const load = useCallback(async () => {
    const isCurrent = gate.start()
    setStatus("loading")
    try {
      const payload = await api.get<unknown>("/announcements")
      if (!isCurrent()) return
      setItems(toAnnouncementListItems(payload))
      setStatus("ready")
    } catch {
      // The server message is not shown: the copy is fixed so no raw server text reaches the member.
      if (!isCurrent()) return
      setStatus("error")
    }
  }, [gate])

  useEffect(() => {
    void load()
    return () => gate.invalidate()
  }, [load, gate])

  const now = new Date()

  if (status === "loading") { return <LoadingState /> }
  if (status === "error") { return <ErrorState message={t("mobile.announcements.loadError")} onRetry={() => void load()} /> }
  if (items.length === 0) { return <EmptyState message={t("mobile.announcements.empty")} /> }

  return <ScrollView contentContainerStyle={[styles.content, { backgroundColor: colors.canvas, padding: spacing.lg, gap: spacing.md }]}>
    {items.map((item) => {
      const when = item.date ? formatRelativeDar(item.date, now, locale, t) : ""
      return <Card
        key={item.id}
        onPress={() => router.push(`/(member)/announcements/${encodeURIComponent(item.id)}`)}
        style={{ gap: spacing.xs }}
      >
        <Text numberOfLines={2} style={{ ...type.body, color: colors.ink, fontWeight: "600" }}>{item.title || t("mobile.announcements.untitled")}</Text>
        {item.summary ? <Text numberOfLines={2} style={{ ...type.supporting, color: colors.muted }}>{item.summary}</Text> : null}
        {when ? <Text style={{ ...type.caption, color: colors.brand, fontWeight: "600", marginTop: spacing.xs }}>{when}</Text> : null}
      </Card>
    })}
  </ScrollView>
}
