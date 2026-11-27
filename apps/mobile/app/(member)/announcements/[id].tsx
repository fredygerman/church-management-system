import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ScrollView, Text, View } from "react-native"
import { useLocalSearchParams } from "expo-router"
import { Card } from "../../../components/ui"
import { colors, radii, spacing, type } from "../../../theme"
import { ApiError, api } from "../../../lib/api"
import { useT } from "../../../lib/locale"
import { createRequestGate } from "../../../lib/request-gate"
import { ErrorState, LoadingState, styles } from "../../../components/screen-state"
import { formatRelativeDar } from "../../../components/home/dar-time"
import { toAnnouncementDetail, type AnnouncementDetail } from "../../../components/announcements/model"
import { createAnnouncementAttachmentCache } from "../../../components/rich-text/attachment-urls"
import { FileList } from "../../../components/rich-text/attachment-blocks"
import { RichTextBody } from "../../../components/rich-text/rich-text"
import { collectFiles, toDocBlocks, withoutFiles } from "../../../components/rich-text/model"

export default function AnnouncementDetailScreen() {
  const { t, locale } = useT()
  const { id } = useLocalSearchParams<{ id: string }>()
  const announcementId = Array.isArray(id) ? id[0] : id
  const [detail, setDetail] = useState<AnnouncementDetail | null>(null)
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading")
  const [errorMessage, setErrorMessage] = useState("")
  const gate = useRef(createRequestGate()).current
  // One cache per screen: signed attachment links live as long as the screen does.
  const attachments = useMemo(() => createAnnouncementAttachmentCache(), [])

  const load = useCallback(async () => {
    const isCurrent = gate.start()
    if (!announcementId) {
      setErrorMessage(t("mobile.announcements.detail.loadError"))
      setStatus("error")
      return
    }
    setStatus("loading")
    try {
      const payload = await api.get<unknown>(`/announcements/${encodeURIComponent(announcementId)}`)
      if (!isCurrent()) return
      const next = toAnnouncementDetail(payload)
      if (!next) {
        setErrorMessage(t("mobile.announcements.detail.loadError"))
        setStatus("error")
        return
      }
      setDetail(next)
      setStatus("ready")
    } catch (caught) {
      if (!isCurrent()) return
      // 404 means the member cannot see it. Other failures get the generic copy; raw server text is never shown.
      const notFound = caught instanceof ApiError && caught.status === 404
      setErrorMessage(t(notFound ? "mobile.announcements.detail.notFound" : "mobile.announcements.detail.loadError"))
      setStatus("error")
    }
  }, [announcementId, gate, t])

  useEffect(() => {
    void load()
    return () => gate.invalidate()
  }, [load, gate])

  const blocks = useMemo(() => toDocBlocks(detail?.body), [detail?.body])
  const files = useMemo(() => collectFiles(blocks), [blocks])
  const hasBody = useMemo(() => withoutFiles(blocks).length > 0, [blocks])

  if (status === "loading") { return <LoadingState /> }
  if (status === "error" || !detail) { return <ErrorState message={errorMessage} onRetry={() => void load()} /> }

  const when = detail.date ? formatRelativeDar(detail.date, new Date(), locale, t) : ""

  return <ScrollView contentContainerStyle={[styles.content, { backgroundColor: colors.canvas, padding: spacing.lg, gap: spacing.md }]}>
    <View style={hero.panel}>
      <Text accessibilityRole="header" style={hero.title}>{detail.title || t("mobile.announcements.untitled")}</Text>
      {when ? <Text style={hero.date}>{when}</Text> : null}
      {detail.summary ? <Text style={hero.summary}>{detail.summary}</Text> : null}
    </View>

    {hasBody ? <Card>
      <RichTextBody cache={attachments} doc={detail.body} skipFiles />
    </Card> : null}

    {files.length > 0 ? <Card style={{ gap: spacing.md }}>
      <Text style={sectionTitle}>{t("mobile.announcements.files.heading")}</Text>
      <FileList cache={attachments} files={files} />
    </Card> : null}
  </ScrollView>
}

const sectionTitle = { ...type.h3, color: colors.ink }

const hero = {
  panel: { backgroundColor: colors.brand, borderRadius: radii.panel, padding: spacing.lg, gap: spacing.sm },
  title: { ...type.h1, color: colors.surface },
  date: { ...type.caption, color: colors.surface, fontWeight: "600" as const },
  summary: { ...type.body, color: colors.surface },
}
