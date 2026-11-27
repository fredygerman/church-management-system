import { useEffect, useState } from "react"
import { ActivityIndicator, Image, Linking, StyleSheet, Text, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { Button } from "../ui"
import { useT } from "../../lib/locale"
import { colors, radii, spacing, type } from "../../theme"
import type { AttachmentUrlCache } from "./attachment-urls"
import type { FileBlock } from "./model"

type ImageState = { status: "loading" } | { status: "ready"; url: string } | { status: "error" }

/** An image from the announcement. Shows a placeholder while its signed link loads and a short note if that fails. */
export function ImageBlock({ attachmentId, alt, cache }: { attachmentId: string; alt: string; cache: AttachmentUrlCache }) {
  const { t } = useT()
  const [state, setState] = useState<ImageState>({ status: "loading" })

  useEffect(() => {
    let current = true
    setState({ status: "loading" })
    cache.load(attachmentId).then(
      (url) => { if (current) setState({ status: "ready", url }) },
      () => { if (current) setState({ status: "error" }) },
    )
    return () => { current = false }
  }, [attachmentId, cache])

  if (state.status === "ready") {
    return <Image accessibilityLabel={alt || t("mobile.announcements.image.alt")} resizeMode="contain" source={{ uri: state.url }} style={styles.image} />
  }
  if (state.status === "error") {
    return <View style={styles.placeholder}><Text style={styles.note}>{t("mobile.announcements.image.error")}</Text></View>
  }
  return <View accessibilityLabel={t("mobile.announcements.image.loading")} style={styles.placeholder}>
    <ActivityIndicator color={colors.brand} />
    <Text style={styles.note}>{t("mobile.announcements.image.loading")}</Text>
  </View>
}

/** One file: its name and an Open action that fetches a fresh signed link and hands it to the system. */
export function FileRow({ file, cache }: { file: FileBlock; cache: AttachmentUrlCache }) {
  const { t } = useT()
  const [opening, setOpening] = useState(false)
  const [failed, setFailed] = useState(false)
  const name = file.name || t("mobile.announcements.files.unnamed")

  async function open() {
    setOpening(true)
    setFailed(false)
    try {
      const url = await cache.load(file.attachmentId)
      await Linking.openURL(url)
    } catch {
      setFailed(true)
    } finally {
      setOpening(false)
    }
  }

  return <View style={styles.file}>
    <View style={styles.fileRow}>
      <Ionicons name="document-outline" size={20} color={colors.brand} />
      <Text numberOfLines={2} style={styles.fileName}>{name}</Text>
      <Button title={t("mobile.announcements.files.open")} variant="secondary" loading={opening} disabled={opening} onPress={() => void open()} />
    </View>
    {failed ? <Text accessibilityLiveRegion="polite" style={styles.error}>{t("mobile.announcements.files.openError")}</Text> : null}
  </View>
}

/** The file rows of an announcement, in order. */
export function FileList({ files, cache }: { files: FileBlock[]; cache: AttachmentUrlCache }) {
  return <View style={styles.list}>
    {files.map((file) => <FileRow key={file.attachmentId} file={file} cache={cache} />)}
  </View>
}

const styles = StyleSheet.create({
  image: { width: "100%", height: 220, borderRadius: radii.card, backgroundColor: colors.tint },
  placeholder: { width: "100%", height: 220, borderRadius: radii.card, backgroundColor: colors.tint, alignItems: "center", justifyContent: "center", gap: spacing.sm, padding: spacing.md },
  note: { ...type.supporting, color: colors.muted, textAlign: "center" },
  list: { gap: spacing.sm },
  file: { gap: spacing.xs, padding: spacing.md, borderRadius: radii.card, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  fileRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  fileName: { ...type.body, color: colors.ink, flex: 1 },
  error: { ...type.supporting, color: colors.danger },
})
